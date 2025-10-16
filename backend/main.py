from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import os
import logging
import json
import re
from pathlib import Path
from dotenv import load_dotenv
from utils import (
    format_structured_data, 
    parse_ncp_response, 
    validate_assessment_data, 
    format_assessment_for_ncp,
    safe_format_list,
    validate_ncp_structure
)
import google.generativeai as genai
from anthropic import Anthropic
import uvicorn
from diagnosis_matcher import create_vector_diagnosis_matcher
from ncp_request_tracker import start_ncp_request, track_api_call, track_error, complete_ncp_request 

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
BACKEND_DIR = Path(__file__).resolve().parent
ENV_PATH = BACKEND_DIR / '.env'
load_dotenv(dotenv_path=ENV_PATH)
logger.info(f"Loading environment variables from: {ENV_PATH}")

# Initialize FastAPI app
app = FastAPI(title="NCP Generator API")

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "https://your-production-domain.com",  # Add your production domain here
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Claude API
claude_api_key = os.getenv("CLAUDE_API_KEY")
if not claude_api_key:
    logger.error("Claude API key not found in environment variables")
    raise RuntimeError("Claude API key not configured")

# Initialize Claude client with timeout settings
claude_client = Anthropic(
    api_key=claude_api_key,
    timeout=300.0  # 5 minutes timeout
)

# Claude model configuration
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"
CLAUDE_MAX_TOKENS = 10000
CLAUDE_TEMPERATURE = 0.3

# Configure Gemini API (for embeddings only)
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    logger.error("Gemini API key not found in environment variables")
    raise RuntimeError("Gemini API key not configured")

genai.configure(
    api_key=gemini_api_key,
    client_options={"api_endpoint": "generativelanguage.googleapis.com"}
)

@app.post("/api/generate-ncp")
async def generate_ncp(assessment_data: Dict) -> Dict:
    """
    Generate a Nursing Care Plan (NCP) based on assessment data.
    """
    try:
        # Log the incoming request structure
        logger.info(f"Received assessment data for NCP generation: {assessment_data}")

        # Validate incoming data - handle validation errors specifically
        try:
            validate_assessment_data(assessment_data)
        except ValueError as validation_error:
            # Log the specific validation error
            logger.error(f"Assessment data validation failed: {str(validation_error)}")
            
            # Return the specific validation error message to frontend
            raise HTTPException(
                status_code=400,
                detail={
                    "message": str(validation_error),
                    "error_type": "validation_error",
                    "suggestion": "Please review your assessment data and ensure it contains sufficient clinical information."
                }
            )

        # Format assessment data based on the structure
        try:
            formatted_assessment = format_structured_data(assessment_data)
            logger.info(f"Successfully formatted assessment data: {formatted_assessment}")
        except Exception as format_error:
            logger.error(f"Error formatting data: {str(format_error)}")
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"Error formatting assessment data: {str(format_error)}",
                    "error_type": "formatting_error",
                    "suggestion": "Please check the structure of your assessment data."
                }
            )
    
        prompt = f"""
            You are a nursing educator with expert knowledge of NANDA-I, NIC, and NOC standards. 
            Base your care plan on established nursing textbooks, specifically:
            - Ackley, B. J., et al. (2022). Nursing Diagnosis Handbook, 12th Edition (with 2021–2023 NANDA-I updates)
            - Doenges, M. E., et al. (2021). Nurse's Pocket Guide, 15th Edition

            IMPORTANT: 
            - Do NOT provide page numbers, direct quotations, or fabricated citations. 
            - Instead, reference standards generally (e.g., "According to NANDA-I classification" or "Based on Ackley, 2022"). 
            - Always ensure that Outcomes (NOC) and Interventions (NIC) are directly and logically linked to the selected Nursing Diagnosis (NANDA-I). 
            - Do NOT invent outcomes or interventions outside NOC/NIC terminology.

            ---

            **PATIENT ASSESSMENT DATA**
            {formatted_assessment}

            ---

            **Assessment:**
            - Provide a concise, structured summary of key findings.
            - Clearly separate subjective and objective data.

            **Diagnosis:**
            - State the NANDA-I nursing diagnosis in the format: [Diagnosis] related to [Etiology] as evidenced by [Defining Characteristics].
            - Ensure the diagnosis label matches official NANDA-I terminology.
            - The diagnosis must directly reflect the given patient assessment data.

            **Outcomes:**
            - All outcomes must be derived from the selected NANDA-I diagnosis. 
            - Distinguish between **Short-Term Outcomes (STO)** and **Long-Term Outcomes (LTO)**.  
                - Short-Term: Achievable within hours to 1–2 days.  
                - Long-Term: Achievable over several days or before discharge.  
            - Requirements:  
                1. Use standardized **NOC labels**.  
                2. Phrase as **SMART goals** (specific, measurable, achievable, relevant, time-bound).  
                3. Include at least **2–3 NOC indicators with rating scales if applicable** (e.g., reports pain ≤ 3/10, oxygen saturation ≥ 95%).  
                4. Explicitly state how each outcome addresses the diagnosis.  

            **Interventions:**
            - Provide at least 3–5 evidence-based interventions drawn from NIC taxonomy.  
            - Organize into Independent, Dependent, and Collaborative actions.  
            - Explicitly connect each intervention to both the Diagnosis and Outcomes (show why it addresses the problem and helps achieve the stated outcomes).  
            - For Dependent Interventions:  
                * Use generic names (e.g., “Administer prescribed bronchodilator”).  
                * Do NOT fabricate dosages or specific prescriptions.  

            **Rationale:**
            - Provide a rationale for each intervention.  
            - Justify why the intervention supports the selected diagnosis and contributes to achieving the specific NOC outcomes.  

            **Implementation:**
            - Describe implementation in **past tense**, as if performed.  
            - Include observable patient responses or placeholder results (e.g., “Pain reduced to 3/10 after repositioning”).  

            **Evaluation:**
            - Write in **past tense**.  
            - Directly mirror the Outcomes and state whether they were met, partially met, or not met.  
            - Tie each evaluation statement back to the diagnosis resolution or persistence.  

            ---

            ### Example Format (abbreviated):

            **Assessment:**
            * Subjective Data:
            - Example subjective data point.
            * Objective Data:
            - Example objective data point.

            **Diagnosis:**
            Activity Intolerance related to imbalance between oxygen supply and demand as evidenced by reports of fatigue and dyspnea on exertion.

            **Outcomes:**
            * Short-Term (24–48 hours):
            - Patient will demonstrate improved Activity Tolerance (NOC) as evidenced by:
            - Endurance level rated ≥ 3/5
            - Verbalizes energy-conservation techniques
            * Long-Term (before discharge):
            - Patient will achieve Energy Conservation (NOC) as evidenced by:
            - Able to perform ADLs with minimal fatigue
            - Oxygen saturation maintained ≥ 95% during activity

            **Interventions:**
            * Independent:
            - Educate patient on pacing and energy conservation techniques.
            * Dependent:
            - Administer prescribed bronchodilator therapy.
            * Collaborative:
            - Refer to physical therapy for graded exercise program.

            **Rationale:**
            * Independent:
            - Education promotes self-management, reducing fatigue and supporting endurance goals.
            * Dependent:
            - Medication improves oxygenation, enabling improved tolerance of activity.
            * Collaborative:
            - Graded exercise enhances stamina, aligning with NOC goals.

            **Implementation:**
            * Independent:
            - Educated patient; patient verbalized understanding of 2 energy conservation techniques.
            * Dependent:
            - Administered bronchodilator; patient reported decreased dyspnea.
            * Collaborative:
            - Coordinated with PT; patient tolerated 10 minutes of ambulation with rest breaks.

            **Evaluation:**
            * Short-Term:
            - Within 48 hours, patient demonstrated improved endurance, rated 3/5, partially met.  
            * Long-Term:
            - Before discharge, patient tolerated ADLs without dyspnea, oxygen saturation ≥ 95%, goal met.

        """
        
        logger.info("Calling Claude API for NCP generation...")
        
        try:
            response = claude_client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=CLAUDE_MAX_TOKENS,
                temperature=CLAUDE_TEMPERATURE,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Track token usage
            track_api_call(
                response, 
                step="generate_ncp",
                operation="NCP Generation",
                assessment_type=assessment_data.get('type', 'unknown'),
                has_diagnosis=bool(assessment_data.get('diagnosis'))
            )
            
        except Exception as api_error:
            logger.error(f"API error: {str(api_error)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "AI service is currently unavailable",
                    "error_type": "api_error",
                    "suggestion": "Please try again in a few moments. If the problem persists, contact support."
                }
            )

        # Check for errors in the response
        if not response or not response.content:
            raise ValueError(f"AI model returned empty response")

        # Parse and validate the response
        try:
            ncp_text = response.content[0].text
            sections = parse_ncp_response(ncp_text)

            if not all(sections.values()):
                raise ValueError("Generated NCP is missing required sections")

            logger.info("Successfully generated NCP")
            return sections
        except Exception as parse_error:
            logger.error(f"Error parsing NCP response: {str(parse_error)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Failed to parse AI response into proper format",
                    "error_type": "parsing_error",
                    "suggestion": "The AI response was malformed. Please try generating the NCP again."
                }
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper detail format)
        raise
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected error generating NCP: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "An unexpected error occurred during NCP generation",
                "error_type": "unknown_error", 
                "suggestion": "Please try again. If the problem persists, contact support."
            }
        )

@app.post("/api/generate-explanation")
async def generate_explanation(request_data: Dict) -> Dict:
    """
    Generate explanations for each component of an NCP using AI.
    """
    try:
        ncp = request_data.get('ncp')
        if not ncp:
            raise ValueError("NCP data is required")

        logger.info(f"Generating explanation for NCP: {ncp.get('title', 'Unknown')}")

        all_sections = ['diagnosis', 'outcomes', 'interventions', 'rationale', 'implementation', 'evaluation']
        
        # Filter out sections that don't have content (empty or None)
        available_sections = []
        for section in all_sections:
            section_value = ncp.get(section)
            if isinstance(section_value, str):
                section_content = section_value.strip()
            elif section_value is not None:
                section_content = str(section_value).strip()
            else:
                section_content = ''
            if section_content and section_content.lower() not in ['', 'not provided', 'n/a', 'none']:
                available_sections.append(section)

        logger.info(f"Generating explanations for sections: {available_sections}")

        # Extract additional context for explanation generation
        assessment_context = ""
        diagnosis_reasoning = ""
        
        # Include assessment data context if available
        if ncp.get('assessment'):
            assessment_context = f"""
            **ORIGINAL PATIENT ASSESSMENT DATA THAT GUIDED THIS NCP:**
            {ncp.get('assessment')}
            """
        
        # Include diagnosis reasoning if available  
        if ncp.get('reasoning'):
            diagnosis_reasoning = f"""
            **DIAGNOSIS SELECTION REASONING:**
            {ncp.get('reasoning')}
            """

        # Create the enhanced explanation prompt that mirrors the actual NCP generation process
        explanation_prompt = f"""
            You are a nursing educator with expertise in NANDA-I, NIC, and NOC standards.
            Your primary goal is to teach nursing students the EXACT systematic process used to 
            create this NCP, walking them through the same clinical reasoning frameworks and 
            decision-making steps that professional nurses use in practice.

            **THE NCP GENERATION PROCESS YOU WILL EXPLAIN:**
            This NCP was created using a systematic 4-step process that mirrors professional nursing practice:

            **STEP 1: Assessment Data Analysis & Keyword Extraction**
            - Raw patient data was analyzed to extract clinical keywords aligned with NANDA-I terminology
            - Subjective and objective findings were normalized into standard clinical terms
            - Keywords were selected to match NANDA-I diagnostic criteria (defining characteristics, related factors, risk factors)

            **STEP 2: Diagnosis Selection Using Clinical Prioritization**
            Multiple candidate diagnoses were evaluated using strict prioritization frameworks:
            1. **ABC – Life-Threatening Conditions (Airway, Breathing, Circulation)**
               - Life-threatening conditions take absolute priority
               - Only selected if assessment shows clear evidence of compromise
            2. **Maslow's Hierarchy of Needs**
               - Physiological → Safety → Psychosocial
               - Physiological needs: pain, nutrition, elimination, mobility, oxygenation
               - Safety needs: infection prevention, fall risk, injury prevention
               - Psychosocial needs: anxiety, coping, knowledge deficits
            3. **Actual Problems Over Risk Problems**
               - Current active problems prioritized over potential risks
               - Exception: ABC-related risks may override lower-level actual problems
            4. **Acute Over Chronic**
               - New, severe, or unstable conditions prioritized over stable chronic conditions

            **STEP 3: NOC Outcomes & NIC Interventions Selection**
            - Outcomes based on evidence-based NOC classifications
            - Interventions selected from NIC classifications and adapted to patient specifics
            - All choices directly target the selected priority diagnosis
            - SMART criteria applied to all outcome statements

            **STEP 4: Implementation & Evaluation in Clinical Context**
            - Implementation described in past tense with realistic patient responses
            - Evaluation tied directly back to outcome achievement
            - Timeframes set based on nursing student clinical realities

            **EDUCATIONAL FOUNDATION:**
            Base all explanations on the same evidence-based standards used in the generation:
            - NANDA-I taxonomy (2021–2023)
            - NIC and NOC 7th editions
            - Ackley et al. (2022), Nursing Diagnosis Handbook, 12th Edition
            - Doenges et al. (2021), Nurse's Pocket Guide, 15th Edition
            - Moorhead et al. (2022) - NOC outcomes
            - Butcher et al. (2022) - NIC interventions

            **CRITICAL TEACHING OBJECTIVES:**
            For each NCP section, help students understand:
            1. **The Systematic Decision-Making Process**: Walk through the exact steps used
            2. **Prioritization Framework Application**: Show how frameworks determined choices
            3. **Evidence-Based Rationale**: Connect decisions to nursing standards and research
            4. **Alternative Analysis**: Explain what other options existed and why they weren't chosen
            5. **Patient Customization**: Show how textbook knowledge was adapted to this specific case
            6. **Professional Integration**: Demonstrate how this mirrors real-world nursing practice

            **EXPLANATION FRAMEWORK:**
            Teach students to think like the AI system that generated this NCP by explaining the 
            systematic process, not just the content. Show them the clinical reasoning pathway 
            that led to each decision.

            **CONTENT REQUIREMENTS FOR EACH NCP SECTION:**

            For each section present in the NCP, provide explanations that help students understand:

            **Clinical Reasoning Component:**
            - Summary (2-3 sentences): Explain the systematic decision-making process used for this section, 
              specifically referencing how prioritization frameworks, NANDA-I criteria, or NIC/NOC 
              standards guided the selection. Connect to the actual generation process used.
            - Detailed (4-8 sentences): Provide step-by-step breakdown of the clinical reasoning process: 
              How assessment data was analyzed, what prioritization framework was applied and why, 
              how this choice ranked against alternatives using systematic criteria, what specific 
              NANDA-I/NIC/NOC criteria were met, and how the final decision integrated patient-specific 
              factors with evidence-based standards.

            **Evidence-Based Support Component:**
            - Summary (2-3 sentences): Connect the choices directly to evidence-based sources used in 
              generation (NANDA-I taxonomy, NIC/NOC classifications, Ackley 2022, Doenges 2021) 
              and explain how these standards guided the systematic selection process.
            - Detailed (4-8 sentences): Explain the theoretical foundation: Which specific NANDA-I, NIC, 
              or NOC classifications were referenced, how current nursing standards informed the decision, 
              what evidence-based principles were applied, how this reflects current professional practice 
              standards, and why these choices align with contemporary nursing education expectations.

            **Student Guidance Component:**
            - Summary (2-3 sentences): Highlight the key systematic thinking skills students should develop 
              to replicate this decision-making process in their own clinical practice.
            - Detailed (4-8 sentences): Provide practical learning guidance: How students can apply the 
              same prioritization frameworks in similar cases, what critical thinking questions to ask 
              during each step, how to access and use NANDA-I/NIC/NOC resources effectively, common 
              mistakes to avoid when applying these frameworks, practice exercises to master this 
              systematic approach, and how to adapt this process for different patient populations.

            **IMPORTANT PRINCIPLES:**
            - Focus on teaching the SYSTEMATIC PROCESS that generated this NCP, not just content knowledge
            - Explain the actual decision-making algorithms and frameworks used in generation
            - Show students how to replicate the same clinical reasoning process
            - Connect each section to the overall systematic methodology
            - Emphasize the evidence-based selection criteria that were applied
            - Help students understand the PROCESS behind each choice, not just the final result
            - Demonstrate how this mirrors the systematic approach used in professional nursing practice
            - Reference the specific generation steps (assessment analysis → diagnosis prioritization → NOC/NIC selection → implementation/evaluation)

            **CRITICAL OUTPUT FORMAT REQUIREMENTS:**
            You MUST return your response as a valid JSON object with the exact structure below.
            Do NOT include any text before or after the JSON.
            Return ONLY the JSON object.

            **REQUIRED JSON STRUCTURE:**
            {{
                "diagnosis": {{
                    "clinical_reasoning": {{
                        "summary": "2-3 sentences explaining the systematic thinking process used",
                        "detailed": "4-8 sentences walking through step-by-step clinical reasoning"
                    }},
                    "evidence_based_support": {{
                        "summary": "2-3 sentences connecting choices to evidence-based sources",
                        "detailed": "4-8 sentences explaining theoretical foundation and standards"
                    }},
                    "student_guidance": {{
                        "summary": "2-3 sentences highlighting key systematic thinking skills",
                        "detailed": "4-8 sentences providing practical learning guidance"
                    }}
                }},
                "outcomes": {{
                    "clinical_reasoning": {{
                        "summary": "2-3 sentences explaining outcome selection process",
                        "detailed": "4-8 sentences walking through NOC outcome selection reasoning"
                    }},
                    "evidence_based_support": {{
                        "summary": "2-3 sentences connecting to NOC standards",
                        "detailed": "4-8 sentences explaining NOC classification alignment"
                    }},
                    "student_guidance": {{
                        "summary": "2-3 sentences highlighting outcome development skills",
                        "detailed": "4-8 sentences providing SMART goal development guidance"
                    }}
                }},
                "interventions": {{
                    "clinical_reasoning": {{
                        "summary": "2-3 sentences explaining intervention selection process",
                        "detailed": "4-8 sentences walking through NIC intervention selection reasoning"
                    }},
                    "evidence_based_support": {{
                        "summary": "2-3 sentences connecting to NIC standards",
                        "detailed": "4-8 sentences explaining NIC classification alignment"
                    }},
                    "student_guidance": {{
                        "summary": "2-3 sentences highlighting intervention planning skills",
                        "detailed": "4-8 sentences providing evidence-based intervention guidance"
                    }}
                }},
                "rationale": {{
                    "clinical_reasoning": {{
                        "summary": "2-3 sentences explaining rationale development process",
                        "detailed": "4-8 sentences walking through evidence-based rationale creation"
                    }},
                    "evidence_based_support": {{
                        "summary": "2-3 sentences connecting to nursing literature",
                        "detailed": "4-8 sentences explaining research and evidence base"
                    }},
                    "student_guidance": {{
                        "summary": "2-3 sentences highlighting critical thinking for rationales",
                        "detailed": "4-8 sentences providing rationale development guidance"
                    }}
                }},
                "implementation": {{
                    "clinical_reasoning": {{
                        "summary": "2-3 sentences explaining implementation approach",
                        "detailed": "4-8 sentences walking through systematic implementation process"
                    }},
                    "evidence_based_support": {{
                        "summary": "2-3 sentences connecting to practice standards",
                        "detailed": "4-8 sentences explaining professional practice alignment"
                    }},
                    "student_guidance": {{
                        "summary": "2-3 sentences highlighting implementation skills",
                        "detailed": "4-8 sentences providing practical implementation guidance"
                    }}
                }},
                "evaluation": {{
                    "clinical_reasoning": {{
                        "summary": "2-3 sentences explaining evaluation methodology",
                        "detailed": "4-8 sentences walking through systematic evaluation process"
                    }},
                    "evidence_based_support": {{
                        "summary": "2-3 sentences connecting to outcome measurement standards",
                        "detailed": "4-8 sentences explaining evidence-based evaluation methods"
                    }},
                    "student_guidance": {{
                        "summary": "2-3 sentences highlighting evaluation skills",
                        "detailed": "4-8 sentences providing outcome evaluation guidance"
                    }}
                }}
            }}

            **JSON FORMATTING RULES:**
            - Use only the sections that exist in the provided NCP
            - Each section must have all three components: clinical_reasoning, evidence_based_support, student_guidance
            - Each component must have both summary and detailed explanations
            
            **ASSESSMENT CONTEXT:**
            {assessment_context}
            
            **DIAGNOSIS REASONING:**
            {diagnosis_reasoning}

            Here is the NCP data to explain (generated using the systematic process described above):
        """

        for section in available_sections:
            section_title = section.replace('_', ' ').title()
            section_content = ncp.get(section, 'Not provided')
            explanation_prompt += f"""
                **{section_title.upper()}:**
                {section_content}
            """

        explanation_prompt += """
            Now provide explanations for each section in the exact format specified above, 
            teaching students the systematic clinical reasoning process and evidence-based 
            frameworks that were actually used to generate this NCP. Focus on the METHODOLOGY 
            and DECISION-MAKING ALGORITHMS rather than just content knowledge. Help students 
            understand how to replicate this systematic approach in their own clinical practice.
        """

        # Generate explanation using Gemini 2.5 Pro
        logger.info("Calling Gemini API for enhanced explanation generation")
        
        # Configure Gemini model
        generation_config = {
            "temperature": 0.3,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 10000,
        }

        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            generation_config=generation_config
        )

        response = model.generate_content(explanation_prompt)
                
        if not response or not response.text:
            raise Exception("No response from AI model")

        # Parse the AI response as JSON
        ai_explanation = response.text.strip()
        logger.info(f"Received AI explanation length: {len(ai_explanation)} characters")
        
        # Clean the response - remove markdown code blocks if present
        cleaned_response = ai_explanation
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]  # Remove ```json
        elif cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]   # Remove ```
        
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]  # Remove closing ```
        
        cleaned_response = cleaned_response.strip()
        logger.info(f"Cleaned response preview: {cleaned_response[:200]}...")
        
        # Parse the JSON response directly
        try:
            explanations = json.loads(cleaned_response)
            logger.info(f"Successfully parsed JSON explanations for sections: {list(explanations.keys())}")
            
            # Validate that we have the expected structure
            for section in available_sections:
                if section not in explanations:
                    logger.warning(f"Missing section {section} in AI response, adding fallback")
                    explanations[section] = {
                        'clinical_reasoning': {
                            'summary': f'Clinical reasoning for this {section.replace("_", " ")} component involves systematic analysis of patient data.',
                            'detailed': f'The {section.replace("_", " ")} component requires comprehensive clinical thinking and evidence-based decision making.'
                        },
                        'evidence_based_support': {
                            'summary': f'Evidence-based nursing practice supports comprehensive {section.replace("_", " ")} documentation.',
                            'detailed': f'Current nursing literature emphasizes the importance of thorough {section.replace("_", " ")} documentation for quality outcomes.'
                        },
                        'student_guidance': {
                            'summary': f'Students should understand the purpose and components of effective {section.replace("_", " ")}.',
                            'detailed': f'Learning objectives include theoretical foundation and practical application in {section.replace("_", " ")}.'
                        }
                    }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Cleaned response text: {cleaned_response}")
            # Fallback to empty structure if JSON parsing fails
            explanations = {
                section: {
                    'clinical_reasoning': {
                        'summary': f'Clinical reasoning for this {section.replace("_", " ")} component involves systematic analysis of patient data.',
                        'detailed': f'The {section.replace("_", " ")} component requires comprehensive clinical thinking and evidence-based decision making.'
                    },
                    'evidence_based_support': {
                        'summary': f'Evidence-based nursing practice supports comprehensive {section.replace("_", " ")} documentation.',
                        'detailed': f'Current nursing literature emphasizes the importance of thorough {section.replace("_", " ")} documentation for quality outcomes.'
                    },
                    'student_guidance': {
                        'summary': f'Students should understand the purpose and components of effective {section.replace("_", " ")}.',
                        'detailed': f'Learning objectives include theoretical foundation and practical application in {section.replace("_", " ")}.'
                    }
                }
                for section in available_sections
            }
        
        logger.info(f"Successfully parsed explanations for sections: {list(explanations.keys())}")
        logger.info(f"Explanations: {explanations}")
        return explanations

    except Exception as e:
        logger.error(f"Error generating explanation: {str(e)}", exc_info=True)
        raise Exception(f"Failed to generate explanation: {str(e)}")

@app.post("/api/parse-manual-assessment")
async def parse_manual_assessment(request_data: Dict) -> Dict:
    """
    Generate detailed, database-aligned keywords from manual assessment data.
    """
    # Start NCP request tracking
    request_id = start_ncp_request(request_data, "manual_assessment")
    
    try:
        subjective_data = request_data.get('subjective', [])
        objective_data = request_data.get('objective', [])
        
        subjective_text = '\n'.join(f"- {item}" for item in subjective_data)
        objective_text = '\n'.join(f"- {item}" for item in objective_data)
        
        prompt = f"""
        You are a clinical expert specializing in NANDA-I nursing diagnosis matching with deep knowledge of nursing diagnosis terminology, defining characteristics, related factors, risk factors, associated conditions, and at risk populations.

        Your task is to analyze assessment data and extract detailed clinical keywords that will match entries in a NANDA-I nursing diagnosis database. The database contains diagnoses with these key fields:
        - Diagnosis names
        - Defining characteristics (signs/symptoms)
        - Related factors (etiologies/causes)
        - Risk factors (predisposing conditions)
        - Associated conditions (medical comorbidities/pathophysiology)
        - At risk populations (demographics/clinical states)

        ASSESSMENT DATA TO ANALYZE:
        SUBJECTIVE: {subjective_text}
        OBJECTIVE: {objective_text}

        INSTRUCTIONS:
        1. Extract ONLY keywords directly supported by the assessment data (no assumptions).
        2. Normalize raw findings into standard clinical terminology aligned with NANDA-I 
        (e.g., "shortness of breath" → dyspnea, "RR 28" → tachypnea, "SpO₂ 89%" → hypoxemia).
        3. Include both actual problems (current symptoms/conditions) and potential risks (predisposing factors).
        4. Capture physiological, psychological, and safety-related findings.
        5. Prefer precise medical/nursing terms. Include both lay and NANDA terms if needed for matching.

        QUALITY CHECKS:
        - Do NOT add findings not present in the data.
        - Use only terms that could realistically match NANDA-I diagnosis fields.
        - Avoid generic terms (e.g., "unwell"). Be specific (e.g., "tachypnea").
        - Ensure output is flat, no categories or labels.

        OUTPUT FORMAT:
        Return ONLY a single string of clinical keywords separated by spaces. 
        No bullets, no punctuation, no explanations. 
        Each keyword should be lowercase unless it is a proper medical acronym.
        """

        response = claude_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=CLAUDE_MAX_TOKENS,
            temperature=CLAUDE_TEMPERATURE,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Track this API call
        track_api_call(
            response,
            step="parse_assessment",
            operation="Manual Assessment Parsing",
            has_subjective=bool(subjective_data),
            has_objective=bool(objective_data),
            subjective_count=len(subjective_data),
            objective_count=len(objective_data)
        )
        
        keywords = response.content[0].text.strip()
        
        result = {
            "original_assessment": {
                "subjective": subjective_data,
                "objective": objective_data
            },
            "embedding_keywords": keywords,
            "request_id": request_id
        }
        
        logger.info(f"Generated detailed keywords: {keywords}")
        return result
        
    except Exception as e:
        # Track the error
        track_error("parse_assessment", str(e), error_type="parsing_error")
        
        # Complete request with failed status
        complete_ncp_request({}, "failed")
        
        logger.error(f"Error parsing manual assessment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": f"Failed to parse manual assessment: {str(e)}",
                "error_type": "parsing_error",
                "suggestion": "Please check your assessment data format and try again."
            }
        )

@app.post("/api/suggest-diagnoses")
async def suggest_diagnoses(assessment_data: Dict) -> Dict:
    """Use original assessment + keywords for diagnosis matching."""
    try:
        # Extract the keywords and original data
        embedding_keywords = assessment_data.get('embedding_keywords')
        original_assessment = assessment_data.get('original_assessment')
        
        if not embedding_keywords:
            track_error("suggest_diagnoses", "Missing embedding keywords")
            complete_ncp_request({}, "failed")
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Embedding keywords are required",
                    "error_type": "missing_data",
                    "suggestion": "Please ensure assessment data is properly parsed first."
                }
            )
        
        if not original_assessment:
            track_error("suggest_diagnoses", "Missing original assessment")
            complete_ncp_request({}, "failed")
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Original assessment data is required",
                    "error_type": "missing_data", 
                    "suggestion": "Please provide the original assessment data."
                }
            )
        
        logger.info(f"Using keywords for diagnosis matching: {embedding_keywords}")
        logger.info(f"Original assessment: {original_assessment}")
        
        # Find diagnosis using keywords (this step doesn't use AI, so no token tracking)
        matcher = await create_vector_diagnosis_matcher()
        candidates = await matcher.find_candidate_diagnoses(embedding_keywords)
        
        # AI diagnosis selection - this will be tracked inside the matcher
        selected_diagnosis = await matcher.select_best_diagnosis(original_assessment, candidates)
        
        # Generate NCP using ORIGINAL assessment data
        ncp_data = await generate_structured_ncp(original_assessment, selected_diagnosis)
        
        # Complete the NCP request with success
        final_result = {**selected_diagnosis, "ncp": ncp_data}
        complete_ncp_request(final_result, "completed")
        
        return final_result
        
    except HTTPException:
        complete_ncp_request({}, "failed")
        raise
    except Exception as e:
        track_error("suggest_diagnoses", str(e))
        complete_ncp_request({}, "failed")
        logger.error(f"Error suggesting diagnoses: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": f"Failed to suggest diagnoses: {str(e)}",
                "error_type": "diagnosis_error",
                "suggestion": "Please try again with different assessment data."
            }
        )

async def generate_structured_ncp(assessment_data: Dict, selected_diagnosis: Dict, max_retries: int = 3) -> Dict:
    """
    Generate a structured NCP in JSON format with validation and retry logic.
    """
    
    # Use the new formatter from utils
    formatted_assessment = format_assessment_for_ncp(assessment_data)
    logger.info("Formatted assessment data for ncp creation: " + str(formatted_assessment))
    logger.info("Chosen diagnosis: " + str(selected_diagnosis))

    # Create the structured prompt with improved rationale format
    ncp_prompt = f"""
        You are a nursing educator expert in NANDA-I, NIC, and NOC standards. Generate a complete Nursing Care Plan based on the provided assessment data and selected nursing diagnosis.

        **PATIENT ASSESSMENT DATA:**
        {formatted_assessment}

        **SELECTED NURSING DIAGNOSIS INFORMATION:**
        Diagnosis: {selected_diagnosis.get('diagnosis', 'Not provided')}
        Definition: {selected_diagnosis.get('definition', 'Not provided')}
        Defining Characteristics: {safe_format_list(selected_diagnosis.get('defining_characteristics', []))}
        Related Factors: {safe_format_list(selected_diagnosis.get('related_factors', []))}
        Risk Factors: {safe_format_list(selected_diagnosis.get('risk_factors', []))}
        Suggested NOC Outcomes: {safe_format_list(selected_diagnosis.get('suggested_outcomes', []))}
        Suggested NIC Interventions: {safe_format_list(selected_diagnosis.get('suggested_interventions', []))}

        **PRIORITIZATION RULES:**
        - All outcomes, interventions, and rationales must directly address the selected nursing diagnosis as the primary clinical priority.
        - Always apply standard nursing prioritization frameworks:
            1. **ABC – Life-Threatening Conditions (Airway, Breathing, Circulation)**
            2. **Maslow's Hierarchy of Needs**
            3. **Actual Problems Over Risk Problems**
            4. **Acute Over Chronic**
        - Ensure that interventions and outcomes logically flow from the chief complaint and diagnosis, not from unrelated concerns.

        **REQUIREMENTS:**
        1. Use the selected diagnosis as the primary nursing diagnosis
        2. Base all outcomes and interventions on NOC and NIC standards
        3. Use the suggested outcomes/interventions as starting points, but adapt them to the specific patient
        4. If suggested outcomes/interventions are not provided, generate appropriate NOC/NIC based options
        5. Always customize interventions and outcomes to the specific assessment findings provided. Avoid generic textbook-only wording.
        6. Ensure logical connections between all components
        7. Flexible intervention categories: Use only applicable categories (independent/dependent/collaborative)
        8. SMART outcomes: Follow SMART criteria for all outcome statements
        9. Return ONLY valid JSON with no additional text


        **RATIONALE GUIDELINES:**
        When providing rationales, include general academic references (e.g., NANDA-I 2021–2023, NANDA-I 2024–2026, Ackley 2022 Nursing Diagnosis Handbook 13th Ed, Doenges, M. E., et al. (2021). Nurse's Pocket Guide, 15th Edition, NIC/NOC textbooks, official NIC/NOC classifications, CDC/WHO guidelines, etc.). Do not cite page numbers or overly specific details — keep citations broad but verifiable.

        **OUTPUT FORMAT (JSON ONLY):**
        {{
            "assessment": {{
                "subjective": ["List of subjective findings from assessment data"],
                "objective": ["List of objective findings from assessment data"]
            }},
            "diagnosis": {{
                "statement": "State in PES format: [Problem] related to [Etiology] as evidenced by [Defining Characteristics]"
            }},
            "outcomes": {{
                "short_term": {{
                    "timeframes": {{
                        "short-term timeframe": [
                            "The patient will demonstrate proper inhaler technique independently",
                            "The patient will verbalize understanding of energy conservation techniques"
                        ],
                        "short-term timeframe": [
                            "The patient will maintain oxygen saturation ≥ 95% during activity"
                        ]
                    }}
                }},
                "long_term": {{
                    "timeframes": {{
                        "long-term timeframe": [
                            "The patient will ambulate 100 feet without dyspnea",
                            "The patient will perform ADLs independently"
                        ],
                        "long-term timeframe": [
                            "The patient will demonstrate medication self-administration"
                        ]
                    }}
                }}
            }},
            "interventions": {{
                "independent": [
                    {{
                        "id": "ind_1",
                        "intervention": "NIC intervention adapted to patient specifics"
                    }}
                ],
                "dependent": [
                    {{
                        "id": "dep_1",
                        "intervention": "Dependent intervention adapted to patient"
                    }}
                ],
                "collaborative": [
                    {{
                        "id": "col_1",
                        "intervention": "Collaborative intervention adapted to patient"
                    }}
                ]
            }},
            "rationale": {{
                "interventions": {{
                    "ind_1": {{
                        "rationale": "Cleaning the wound with antiseptic reduces microbial load and prevents infection development",
                        "evidence": "(Ackley et al., 2022; NANDA-I, 2021–2023)"
                    }},
                    "dep_1": {{
                        "rationale": "Verifying immunization history ensures protection against tetanus",
                        "evidence": "(CDC, 2024)"
                    }},
                    "col_1": {{
                        "rationale": "Providing accurate health teaching decreases anxiety by reducing uncertainty",
                        "evidence": "(Moorhead et al., 2022)"
                    }}
                }}
            }},
            "implementation": {{
                "independent": [
                    {{
                        "id": "ind_1",
                        "action_taken": "Educated patient on inhaler technique using demonstration method; patient successfully returned demonstration with 100% accuracy"
                    }}
                ],
                "dependent": [
                    {{
                        "id": "dep_1", 
                        "action_taken": "Administered prescribed bronchodilator as ordered; patient reported decreased dyspnea within 15 minutes"
                    }}
                ],
                "collaborative": [
                    {{
                        "id": "col_1",
                        "action_taken": "Coordinated with respiratory therapist for pulmonary rehabilitation evaluation; appointment scheduled for next day"
                    }}
                ]
            }},
            "evaluation": {{
                "short_term": {{
                    "Met": {{
                        "after 24 hours of nursing interventions, the patient": [
                            "Demonstrated correct inhaler technique independently with 100% accuracy",
                            "Verbalized 3 energy conservation techniques accurately"
                        ]
                    }},
                    "Partially Met": {{
                        "after 48 hours of nursing interventions, the patient": [
                            "Maintained SpO2 ≥ 95% at rest but dropped to 92% during ambulation"
                        ]
                    }}
                }},
                "long_term": {{
                    "Met": {{
                        "after 5 days of nursing interventions, the patient": [
                            "Ambulated 100 feet without dyspnea or oxygen desaturation",
                            "Performed all ADLs independently without fatigue"
                        ]
                    }}
                }}
            }}
        }}

        **ENHANCED GUIDELINES:**

        **Evidence References - Approved Sources and Format:**
        Use these citation formats for evidence:
        - "(NANDA-I, 2021–2023)" - for nursing diagnoses and defining characteristics
        - "(Ackley et al., 2022)" - for nursing diagnosis handbook references
        - "(Moorhead et al., 2022)" - for NOC outcomes
        - "(Butcher et al., 2022)" - for NIC interventions
        - "(Doenges et al., 2021)" - for nursing care plan references
        - "(CDC, 2024)" - for public health guidelines
        - "(WHO, 2024)" - for international health standards
        - "(American Nurses Association, 2021)" - for nursing practice standards
        - "(Joint Commission, 2024)" - for patient safety standards
        - Or other sources that are verifiable and widely recognized in nursing practice
        
        **Rationale Format Examples:**
        - rationale: "Monitoring vital signs every 4 hours detects early signs of respiratory compromise"
        - evidence: "(Ackley et al., 2022; NANDA-I, 2021–2023)"
        
        - rationale: "Teaching proper medication administration ensures patient safety and compliance"
        - evidence: "(Moorhead et al., 2022)"
        
        - rationale: "nic intervention: teaching: individual (5606)"
        - evidence: "(Butcher et al., 2022)"

        **AVOID:**
        - Specific page numbers or direct quotations
        - Fabricated study names or authors
        - Specific journal citations with volumes/issues
        - Made-up statistics or data
        - Overly specific details in citations

        **Outcomes Grouping Rules:**
        - Group outcomes by identical timeframes
        - Use clinically appropriate and realistic timeframes for nursing students (within 2 hours, within 8 hours, within 24 hours, within 5 days, before end of shift, etc.)
        - Ensure each timeframe group has related, achievable outcomes
        
        **Evaluation Grouping Rules:**
        - Group by status (Met / Partially Met)
        - Within each status, group by timeframe
        - List specific evidence under each timeframe-status combination
        - Use past tense and measurable evidence
    """
    
    # Retry logic
    for attempt in range(max_retries):
        try:
            logger.info(f"Generating structured NCP - Attempt {attempt + 1}")
            
            response = claude_client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=CLAUDE_MAX_TOKENS,
                temperature=CLAUDE_TEMPERATURE,
                messages=[
                    {
                        "role": "user",
                        "content": ncp_prompt
                    }
                ]
            )
            
            # Track this API call
            track_api_call(
                response,
                step="generate_ncp",
                operation="Structured NCP Generation",
                attempt=attempt + 1,
                max_retries=max_retries,
                diagnosis=selected_diagnosis.get('diagnosis', 'unknown'),
                assessment_type=assessment_data.get('type', 'unknown')
            )
            
            if not response or not response.content:
                raise Exception("No response from AI model")
            
            # Parse JSON response
            raw_response = response.content[0].text.strip()
            logger.info(f"Raw response from AI: {raw_response}")
            
            # Clean and extract JSON            
            cleaned_response = raw_response.encode('utf-8').decode('utf-8-sig')
            
            # Try to extract JSON from code blocks
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', cleaned_response, re.DOTALL)
            if json_match:
                cleaned_response = json_match.group(1)
            
            # Find JSON boundaries
            start_brace = cleaned_response.find('{')
            end_brace = cleaned_response.rfind('}')
            
            if start_brace != -1 and end_brace != -1:
                json_part = cleaned_response[start_brace:end_brace+1]
                ncp_data = json.loads(json_part)
                
                # Validate structure using utility function
                if validate_ncp_structure(ncp_data):
                    logger.info(f"Successfully generated and validated NCP on attempt {attempt + 1}")
                    return ncp_data
                else:
                    logger.warning(f"Attempt {attempt + 1}: Generated NCP failed validation")
                    if attempt == max_retries - 1:
                        raise Exception("Generated NCP failed structure validation after all retries")
            else:
                logger.warning(f"Attempt {attempt + 1}: Could not extract valid JSON")
                if attempt == max_retries - 1:
                    raise Exception("Could not extract valid JSON after all retries")
                    
        except json.JSONDecodeError as e:
            logger.warning(f"Attempt {attempt + 1}: JSON parsing failed - {str(e)}")
            if attempt == max_retries - 1:
                track_error("generate_ncp", f"JSON parsing failed: {str(e)}")
                raise Exception(f"JSON parsing failed after all retries: {str(e)}")
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1}: Generation failed - {str(e)}")
            if attempt == max_retries - 1:
                track_error("generate_ncp", f"NCP generation failed: {str(e)}")
                raise Exception(f"NCP generation failed after all retries: {str(e)}")
    
    raise Exception("Failed to generate valid NCP after all retries")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)