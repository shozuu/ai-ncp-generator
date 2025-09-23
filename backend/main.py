from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from utils import format_structured_data, parse_ncp_response, validate_assessment_data, parse_explanation_text
import google.generativeai as genai
import uvicorn
from diagnosis_matcher import create_vector_diagnosis_matcher

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

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("Gemini API key not found in environment variables")
    raise RuntimeError("Gemini API key not configured")

genai.configure(
    api_key=api_key,
    client_options={"api_endpoint": "generativelanguage.googleapis.com"}
)

# Model configuration
generation_config = {
    "temperature": 0.7,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 4096,
}
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=generation_config
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

            PATIENT ASSESSMENT DATA

            {formatted_assessment}

            ---

            Generate a complete Nursing Care Plan using the exact structure below:

            1. Use **only** the specified section headings and format below.  
            2. Include all sections: **Assessment**, **Diagnosis**, **Outcomes**, **Interventions**, **Rationale**, **Implementation**, and **Evaluation**.  
            3. Use bullet points (*) for lists and sub-bullets (-) for nested items.  
            4. Ensure that Outcomes and Interventions clearly reference the Nursing Diagnosis.  
            5. Maintain a professional, concise, and clinical tone throughout.  

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
        
        logger.info("Calling API for NCP generation...")
        
        try:
            response = model.generate_content(prompt)
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
        if hasattr(response, '_error') and response._error:
            raise ValueError(f"AI model error: {response._error}")

        # Parse and validate the response
        try:
            ncp_text = response.text
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

        all_sections = ['assessment', 'diagnosis', 'outcomes', 'interventions', 'rationale', 'implementation', 'evaluation']
        
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

        # Create the enhanced explanation prompt for plain text response
        explanation_prompt = f"""
            You are a nursing educator with expertise in NANDA-I, NIC, and NOC standards.
            Your primary goal is to teach nursing students how to think critically and apply 
            evidence-based reasoning when creating Nursing Care Plans (NCPs).

            Ground all explanations in widely accepted nursing frameworks and references:
            - NANDA-I taxonomy (2021–2023 updates)
            - NIC and NOC 7th editions
            - Ackley et al. (2022), Nursing Diagnosis Handbook
            - Doenges et al. (2021), Nurse’s Pocket Guide

            Important rules for evidence use:
            - Attribute concepts in a general way (e.g., “According to Ackley (2022)...” or 
            “NANDA-I defines impaired gas exchange as...”).
            - Do NOT invent page numbers, direct quotations, or hollow citations.
            - If unsure of exact source details, explain the principle clearly and attribute 
            it broadly to NANDA-I, NIC, NOC, or standard nursing references.
            - Explanations must remain factual, professional, and educational.

            I will provide you with an NCP. For each section, generate explanations at three levels 
            (Clinical Reasoning, Evidence-Based Support, and Student Guidance), each with a 
            Summary and a Detailed version.

            For each NCP section, use this EXACT format:

            **SECTION_NAME:**

            Clinical Reasoning Summary:
            [2–3 sentences: concise explanation of why this decision was made]

            Clinical Reasoning Detailed:
            [4–8 sentences: step-by-step reasoning process, including assessment priorities, 
            differential considerations, and why certain options were chosen or excluded]

            Evidence-Based Support Summary:
            [2–3 sentences: key evidence points with clinical guidelines or standards]

            Evidence-Based Support Detailed:
            [4–8 sentences: explain the rationale and connect it to NANDA-I, NIC, NOC, 
            and standard nursing references such as Ackley (2022) or Doenges (2021). 
            Do not fabricate citations; attribute concepts broadly.]

            Student Guidance Summary:
            [2–3 sentences: main learning takeaways for students]

            Student Guidance Detailed:
            [4–8 sentences: practical learning pathway including reflection questions, 
            case application examples, common mistakes to avoid, and skill-building exercises]

            IMPORTANT RULES:
            - Use the exact headers above
            - Each explanation must be clear, professional, and educational
            - Avoid special characters like quotes/apostrophes that may cause parsing issues
            - If multiple valid options exist, explain why the chosen option is appropriate 
            and what alternatives could be considered

            Here is the NCP data:
        """

        for section in available_sections:
            section_title = section.replace('_', ' ').title()
            section_content = ncp.get(section, 'Not provided')
            explanation_prompt += f"""
                **{section_title.upper()}:**
                {section_content}
            """

        explanation_prompt += """
            Now provide explanations for each section in the exact format specified above.
        """

        # Generate explanation using Gemini
        logger.info("Calling Gemini API for enhanced explanation generation")
        response = model.generate_content(explanation_prompt)
        
        if not response or not response.text:
            raise Exception("No response from AI model")

        # Parse the AI response
        ai_explanation = response.text.strip()
        logger.info(f"Received AI explanation length: {len(ai_explanation)} characters")
        
        # Parse the plain text response into our JSON structure
        explanations = parse_explanation_text(ai_explanation, available_sections)
        
        logger.info(f"Successfully parsed explanations for sections: {list(explanations.keys())}")
        logger.info(f"Explanations: {explanations}")
        return explanations

    except Exception as e:
        logger.error(f"Error generating explanation: {str(e)}", exc_info=True)
        raise Exception(f"Failed to generate explanation: {str(e)}")

@app.post("/api/parse-manual-assessment")
async def parse_manual_assessment(request_data: Dict) -> Dict:
    """
    Parse manual mode assessment data into structured format using AI.
    """
    try:
        subjective_data = request_data.get('subjective', [])
        objective_data = request_data.get('objective', [])
        
        if not subjective_data or not objective_data:
            raise ValueError("Both subjective and objective data are required")
        
        logger.info("Parsing manual assessment data into structured format")
        
        # Create formatted text for the AI
        subjective_text = '\n'.join(f"- {item}" for item in subjective_data)
        objective_text = '\n'.join(f"- {item}" for item in objective_data)
        
        # parsing prompt with cultural/religious and additional vitals handling
        parsing_prompt = f"""
            You are a clinical nursing assessment parser with expertise in standardizing patient data for NANDA-I diagnosis matching. Your task is to extract and structure nursing assessment data in a format that will be embedded and matched against a comprehensive nursing diagnosis database.

            **CRITICAL IMPORTANCE:** The structured data you create will be converted to embeddings and queried against a database containing NANDA-I nursing diagnoses. Consistency, accuracy, and use of standard clinical terminology is essential for proper diagnosis matching.

            **SUBJECTIVE DATA:**
            {subjective_text}

            **OBJECTIVE DATA:**
            {objective_text}

            **STANDARDIZATION GUIDELINES:**
            
            **Demographics:**
            - Age: Extract exact numeric age if stated
            - Sex: Use only "male" or "female" (lowercase)
            - Occupation: Extract if mentioned, otherwise leave empty
            - Religion: Extract if mentioned (e.g., "Catholic", "Muslim", "Jewish", "Buddhist", "None", etc.)
            - Cultural_background: Extract ethnicity, cultural identity, or cultural practices if mentioned
            - Language: Extract primary language if mentioned (especially if non-English)

            **Chief Complaint:**
            - Identify the most clinically significant issue or risk based on BOTH subjective and objective data.
            - Always apply nursing prioritization frameworks:
                * ABC (Airway, Breathing, Circulation) → highest priority
                * Maslow’s hierarchy of needs → physiological and safety before psychosocial
                * Actual problems → actual problems take precedence over "risk for," which take precedence over psychosocial concerns
            - If multiple complaints exist, select the one with the highest immediate clinical risk.
            - Phrase the chief complaint in concise, clinical language that reflects the priority problem, not secondary concerns.
            - Patient-expressed worries or psychosocial issues should be documented in nurse_notes, not as the chief complaint.

            **History - Use Standard Clinical Terminology:**
            - Onset/Duration: Be specific about timing (e.g., "3 days ago", "sudden onset", "gradual over 2 weeks")
            - Severity: Use standard descriptors ("mild", "moderate", "severe" or numeric scales if mentioned)
            - Associated Symptoms: Match to these EXACT terms when applicable:
              * "Shortness of breath"
              * "Chest pain" 
              * "Fatigue"
              * "Dizziness"
              * "Nausea/vomiting"
            - Other symptoms not in the list go in "other_symptoms"

            **Medical History - Use EXACT Standard Terms:**
            - "Hypertension"
            - "Diabetes mellitus" 
            - "COPD"
            - "Asthma"
            - "Heart disease"
            - "Kidney disease"
            - "Immunocompromised condition"
            - Non-matching conditions go in "medical_history_other"

            **Vital Signs - Standard Format:**
            - HR: Integer only (e.g., 88)
            - BP: "systolic/diastolic" format only (e.g., "120/80")
            - RR: Integer only (e.g., 18)
            - SpO2: Integer only (e.g., 95)
            - Temp: Decimal number (e.g., 37.2)
            - **Additional Vitals**: For any other vital signs mentioned (CVP, MAP, PAWP, etc.), include in "additional_vitals" with descriptive labels

            **Physical Exam - Use EXACT Standard Terms:**
            - "Respiratory: Crackles"
            - "Respiratory: Wheezing"
            - "Respiratory: Diminished breath sounds"
            - "Cardiac: Irregular rhythm"
            - "Cardiac: Edema"
            - "Cardiac: Cyanosis"
            - "Mobility: Limited ROM"
            - "Mobility: Bedridden"
            - "Mobility: Weak gait"
            - "Skin: Intact"
            - "Skin: Pressure ulcer"
            - "Skin: Pallor"
            - Non-matching findings go in "physical_exam_other"

            **Risk Factors - Use EXACT Standard Terms:**
            - "Surgery (recent)"
            - "Indwelling catheter"
            - "Prolonged immobility"
            - "Smoking"
            - "Malnutrition"
            - "Advanced age"
            - Non-matching factors go in "risk_factors_other"

            **Cultural/Religious Considerations:**
            - Extract any cultural practices that may affect care (dietary restrictions, prayer times, family involvement preferences)
            - Note religious considerations that may impact treatment decisions
            - Include language barriers or communication preferences
            - Document cultural beliefs about health, illness, or treatment

            **Nurse Notes:**
            - Include any additional observations, patient statements, or clinical notes that don't fit other categories
            - Maintain clinical language and objectivity
            - Include cultural observations that may be relevant to care planning

            **EXTRACTION RULES:**
            1. **Exact Term Matching**: When information matches predefined categories, use the EXACT terminology provided
            2. **Standard Clinical Language**: Use conventional medical/nursing terminology
            3. **Cultural Sensitivity**: Extract cultural/religious information objectively and respectfully
            4. **No Assumptions**: Extract only what is explicitly stated or clearly implied
            5. **Consistent Formatting**: Follow the specified formats strictly
            6. **Comprehensive Capture**: Don't miss important clinical or cultural details
            7. **Objective Language**: Use professional, clinical language throughout

            **EMBEDDING OPTIMIZATION:**
            - The final structured data will be formatted as: "Age: X | Sex: X | Religion: X | Cultural Background: X | Chief Complaint: X | History of Present Illness: X | Past Medical History: X | Vitals: X | Additional Vitals: X | Exam: X | Risk Factors: X | Cultural Considerations: X | Notes: X"
            - Ensure each section contributes meaningful clinical information for diagnosis matching
            - Use terminology that nursing diagnoses databases would recognize
            - Maintain consistency with how similar cases would be described
            - Cultural information should be included when relevant to care planning or diagnosis

            **OUTPUT FORMAT:**
            Return ONLY a valid JSON object with this exact structure:

            {{
                "demographics": {{
                    "age": null,
                    "sex": "",
                    "occupation": "",
                    "religion": "",
                    "cultural_background": "",
                    "language": ""
                }},
                "chief_complaint": "",
                "history": {{
                    "onset_duration": "",
                    "severity": "",
                    "associated_symptoms": [],
                    "other_symptoms": ""
                }},
                "medical_history": [],
                "medical_history_other": "",
                "vital_signs": {{
                    "HR": null,
                    "BP": "",
                    "RR": null,
                    "SpO2": null,
                    "Temp": null,
                    "additional_vitals": {{}}
                }},
                "physical_exam": [],
                "physical_exam_other": "",
                "risk_factors": [],
                "risk_factors_other": "",
                "cultural_considerations": {{
                    "dietary_restrictions": "",
                    "religious_practices": "",
                    "communication_preferences": "",
                    "family_involvement": "",
                    "health_beliefs": "",
                    "other_considerations": ""
                }},
                "nurse_notes": ""
            }}

            **ADDITIONAL VITALS EXAMPLES:**
            - "additional_vitals": {{"CVP": "8 mmHg", "MAP": "85 mmHg", "PAWP": "12 mmHg", "ICP": "15 mmHg", "Pain_Scale": "6/10"}}
            - Include any specialized measurements like glucose levels, pain scales, or hemodynamic parameters

            **CULTURAL CONSIDERATIONS EXAMPLES:**
            - dietary_restrictions: "Halal diet", "Kosher diet", "Vegetarian", "No pork products"
            - religious_practices: "Prayer 5 times daily", "Sabbath observance Friday evening to Saturday", "Daily meditation"
            - communication_preferences: "Male healthcare providers preferred", "Family translator needed", "Speaks limited English"
            - family_involvement: "Daughter is primary decision maker", "Extended family involvement in care decisions"
            - health_beliefs: "Believes illness is spiritual test", "Prefers traditional remedies alongside medical treatment"

            **QUALITY CHECKLIST:**
            Before finalizing your response, verify:
            ✓ All predefined terms are used EXACTLY as specified
            ✓ Vital signs follow exact format requirements
            ✓ Additional vitals are properly captured in the additional_vitals object
            ✓ Cultural/religious information is extracted respectfully and objectively
            ✓ Clinical terminology is standard and consistent
            ✓ No important clinical or cultural information is omitted
            ✓ All sections contribute meaningful data for diagnosis matching
            ✓ Language is professional and objective
            ✓ JSON structure is complete and valid

            **EXAMPLES OF GOOD EXTRACTION:**
            - Demographics: age: 45, sex: "female", religion: "Catholic", cultural_background: "Hispanic/Latino", language: "Spanish (primary)"
            - Vital Signs: HR: 92, BP: "140/90", RR: 24, SpO2: 94, additional_vitals: {{"Pain": "7/10", "Glucose": "180 mg/dL"}}
            - Cultural Considerations: dietary_restrictions: "No pork products", religious_practices: "Daily rosary prayer", communication_preferences: "Prefers Spanish-speaking staff"

            Process the assessment data now, ensuring maximum consistency, cultural sensitivity, and clinical accuracy for optimal diagnosis database matching.
        """
        
        logger.info("Calling API for manual data parsing...")
        response = model.generate_content(parsing_prompt)
        
        if not response or not response.text:
            raise Exception("No response from AI model")
        
        # Enhanced JSON parsing
        import json
        import re
        
        raw_response = response.text
        logger.info(f"Raw AI response: '{raw_response}'")
        
        try:
            # Clean the response text
            cleaned_response = raw_response.strip()
            
            # Remove any potential BOM or invisible characters
            cleaned_response = cleaned_response.encode('utf-8').decode('utf-8-sig')
            
            # Try to extract JSON if it's wrapped in code blocks or has extra text
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', cleaned_response, re.DOTALL)
            if json_match:
                cleaned_response = json_match.group(1)
                logger.info("Extracted JSON from code blocks")
            
            # Find the first { and last } to extract just the JSON part
            start_brace = cleaned_response.find('{')
            end_brace = cleaned_response.rfind('}')
            
            if start_brace != -1 and end_brace != -1 and start_brace < end_brace:
                json_part = cleaned_response[start_brace:end_brace+1]
                logger.info(f"Extracted JSON part")
                
                # Try parsing the extracted JSON
                parsed_data = json.loads(json_part)
                logger.info(f"Successfully parsed manual assessment data")
                return parsed_data
            else:
                logger.error("Could not find valid JSON structure in response")
                raise json.JSONDecodeError("No valid JSON structure found", cleaned_response, 0)
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            logger.error(f"Failed to parse response: '{raw_response}'")
            
            # Return default structure with error indication
            logger.warning("Returning default empty structure due to parsing failure")
            raise Exception("Failed to parse AI response into structured format. The AI may have returned malformed data.")
    
    except Exception as e:
        logger.error(f"Error parsing manual assessment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to parse manual assessment", 
                "error": str(e),
                "suggestion": "Please ensure your manual input contains clear, detailed clinical information including symptoms, vital signs, and examination findings."
            }
        )

@app.post("/api/suggest-diagnoses")
async def suggest_diagnoses(assessment_data: Dict) -> Dict:
    """
    Suggest nursing diagnoses and generate complete NCP based on assessment data.
    """
    try:
        logger.info("Starting comprehensive NCP generation process")
        
        # Validate assessment data
        try:
            validate_assessment_data(assessment_data)
        except ValueError as validation_error:
            logger.error(f"Assessment data validation failed: {str(validation_error)}")
            raise HTTPException(
                status_code=400,
                detail={
                    "message": str(validation_error),
                    "error_type": "validation_error",
                    "suggestion": "Please review your assessment data and ensure it contains sufficient clinical information."
                }
            )
        
        # Step 1: Find and select best diagnosis
        matcher = await create_vector_diagnosis_matcher()
        candidates = await matcher.find_candidate_diagnoses(
            assessment_data, 
            top_n=10, 
            similarity_threshold=0.3
        )
        
        if not candidates:
            logger.warning("No candidate diagnoses found above similarity threshold")
            return {
                "diagnosis": None,
                "definition": None,
                "defining_characteristics": [],
                "related_factors": [],
                "risk_factors": [],
                "suggested_outcomes": [],
                "suggested_interventions": [],
                "reasoning": "No matching diagnoses found for the provided assessment data.",
                "ncp": None
            }
        
        selected_diagnosis = await matcher.select_best_diagnosis(assessment_data, candidates)
        logger.info(f"Successfully selected diagnosis: {selected_diagnosis.get('diagnosis')}")
        
        # Step 2: Generate complete NCP based on selected diagnosis
        try:
            ncp_data = await generate_structured_ncp(assessment_data, selected_diagnosis)
            logger.info("Successfully generated structured NCP")
            
            # Combine diagnosis info with NCP
            result = {
                **selected_diagnosis,
                "ncp": ncp_data
            }
            
            return result
            
        except Exception as ncp_error:
            logger.error(f"Failed to generate NCP: {str(ncp_error)}")
            # Return diagnosis without NCP if generation fails
            return {
                **selected_diagnosis,
                "ncp": None,
                "ncp_error": str(ncp_error)
            }
        
    except Exception as e:
        logger.error(f"Error in comprehensive NCP generation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to generate diagnosis and NCP",
                "error_type": "comprehensive_generation_error",
                "suggestion": "Please try again. If the problem persists, contact support."
            }
        )

async def generate_structured_ncp(assessment_data: Dict, selected_diagnosis: Dict, max_retries: int = 3) -> Dict:
    """
    Generate a structured NCP in JSON format with validation and retry logic.
    """
    
    def validate_ncp_structure(ncp_data: Dict) -> bool:
        """Validate that the NCP has the required structure and content."""
        required_sections = ["assessment", "diagnosis", "outcomes", "interventions", "rationale", "implementation", "evaluation"]
        
        # Check all sections exist
        if not all(section in ncp_data for section in required_sections):
            return False
        
        # Check each section has meaningful content
        for section, content in ncp_data.items():
            if section in required_sections:
                if not content or (isinstance(content, str) and len(content.strip()) < 10):
                    return False
                if isinstance(content, dict) and not any(v for v in content.values() if v):
                    return False
        
        # Validate outcomes structure (allow flexibility for short_term or long_term only)
        outcomes = ncp_data.get("outcomes", {})
        if not isinstance(outcomes, dict):
            return False
        
        # At least one type of outcome should exist
        has_short_term = outcomes.get("short_term") and len(outcomes["short_term"]) > 0
        has_long_term = outcomes.get("long_term") and len(outcomes["long_term"]) > 0
        
        if not (has_short_term or has_long_term):
            return False
        
        # Validate interventions structure
        interventions = ncp_data.get("interventions", {})
        if not isinstance(interventions, dict):
            return False
        
        # At least one intervention category should have content
        has_independent = interventions.get("independent") and len(interventions["independent"]) > 0
        has_dependent = interventions.get("dependent") and len(interventions["dependent"]) > 0
        has_collaborative = interventions.get("collaborative") and len(interventions["collaborative"]) > 0
        
        if not (has_independent or has_dependent or has_collaborative):
            return False
        
        # Validate rationale structure (should have intervention-specific rationales)
        rationale = ncp_data.get("rationale", {})
        if not isinstance(rationale, dict) or not rationale.get("interventions"):
            return False
        
        return True
    
    # Helper function to safely join arrays or provide fallback
    def safe_format_list(items, fallback="Not specified in database"):
        if not items or (isinstance(items, list) and len(items) == 0):
            return fallback
        if isinstance(items, list):
            return ', '.join(str(item) for item in items if item)
        return str(items) if items else fallback
    
    formatted_assessment = format_structured_data(assessment_data)
    
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
        * ABC (Airway, Breathing, Circulation) → highest priority
        * Maslow’s hierarchy of needs → physiological and safety needs before psychosocial
        * Actual problems take priority over "risk for" → which take priority over psychosocial concerns
        - Ensure that interventions and outcomes logically flow from the chief complaint and diagnosis, not from unrelated concerns.

        **REQUIREMENTS:**
        1. Use the selected diagnosis as the primary nursing diagnosis
        2. Base all outcomes and interventions on NOC and NIC standards
        3. Use the suggested outcomes/interventions as starting points, but adapt them to the specific patient
        4. If suggested outcomes/interventions are not provided, generate appropriate NOC/NIC based options
        5. Ensure logical connections between all components
        6. Flexible intervention categories: Use only applicable categories (independent/dependent/collaborative)
        7. SMART outcomes: Follow SMART criteria for all outcome statements
        8. Return ONLY valid JSON with no additional text

        **RATIONALE GUIDELINES:**
        When providing rationales, include general academic references (e.g., NANDA-I 2021–2023, NANDA-I 2024–2026, Ackley 2022 Nursing Diagnosis Handbook, Doenges, M. E., et al. (2021). Nurse's Pocket Guide, 15th Edition, NIC/NOC textbooks, official NIC/NOC classifications, CDC/WHO guidelines). Do not cite page numbers or overly specific details — keep citations broad but verifiable.

        **OUTPUT FORMAT (JSON ONLY):**
        {{
            "assessment": {{
                "subjective": ["List of subjective findings from assessment data"],
                "objective": ["List of objective findings from assessment data"]
            }},
            "diagnosis": {{
                "statement": "Complete NANDA-I diagnosis statement: [Diagnosis] related to [etiology] as evidenced by [defining characteristics]"
            }},
            "outcomes": {{
                "short_term": {{
                    "timeframes": {{
                        "within 24 hours": [
                            "The patient will demonstrate proper inhaler technique independently",
                            "The patient will verbalize understanding of energy conservation techniques"
                        ],
                        "within 48 hours": [
                            "The patient will maintain oxygen saturation ≥ 95% during activity"
                        ]
                    }}
                }},
                "long_term": {{
                    "timeframes": {{
                        "within 5 days": [
                            "The patient will ambulate 100 feet without dyspnea",
                            "The patient will perform ADLs independently"
                        ],
                        "before discharge": [
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
        - Provide sources that are verifiable and widely recognized in nursing practice
        
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
        - Use clinically appropriate timeframes (within 2 hours, within 24 hours, within 48 hours, within 5 days, before discharge, etc.)
        - Ensure each timeframe group has related, achievable outcomes
        
        **Evaluation Grouping Rules:**
        - Group by status (Met, Partially Met, Not Met)
        - Within each status, group by timeframe
        - List specific evidence under each timeframe-status combination
        - Use past tense and measurable evidence
        """
    
    # Retry logic
    for attempt in range(max_retries):
        try:
            logger.info(f"Generating structured NCP - Attempt {attempt + 1}")
            
            response = model.generate_content(ncp_prompt)
            
            if not response or not response.text:
                raise Exception("No response from AI model")
            
            # Parse JSON response
            raw_response = response.text.strip()
            logger.info(f"Raw response from AI: {raw_response}")
            
            # Clean and extract JSON
            import json
            import re
            
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
                
                # Validate structure
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
                raise Exception(f"JSON parsing failed after all retries: {str(e)}")
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1}: Generation failed - {str(e)}")
            if attempt == max_retries - 1:
                raise Exception(f"NCP generation failed after all retries: {str(e)}")
    
    raise Exception("Failed to generate valid NCP after all retries")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)