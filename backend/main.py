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
from lookup_service import lookup_service

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
    "max_output_tokens": 2048,
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
            section_content = ncp.get(section, '').strip() if ncp.get(section) else ''
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
        
        # Create the parsing prompt (same as before)
        parsing_prompt = f"""
            You are a nursing assessment data parser. Your task is to analyze free-text nursing assessment data and extract structured information that fits into predefined categories.

            Given the following subjective and objective data, extract and categorize the information into the JSON structure provided below. If information for a category is not available or cannot be determined from the given data, leave those fields empty or with default values.

            **SUBJECTIVE DATA:**
            {subjective_text}

            **OBJECTIVE DATA:**
            {objective_text}

            **INSTRUCTIONS:**
            1. Extract demographics information (age, sex, occupation) if mentioned
            2. Identify the main chief complaint or primary concern
            3. Look for history details (onset, duration, severity, progression)
            4. Extract associated symptoms from the available options or identify others
            5. Identify past medical history conditions
            6. Extract vital signs data (HR, BP, RR, SpO2, Temperature)
            7. Identify physical examination findings
            8. Look for risk factors
            9. Capture any additional nurse notes or observations

            **AVAILABLE OPTIONS FOR CATEGORIZATION:**
            - Associated Symptoms: Shortness of breath, Chest pain, Fatigue, Dizziness, Nausea/vomiting
            - Medical History: Hypertension, Diabetes mellitus, COPD/asthma, Heart disease, Kidney disease, Immunocompromised condition
            - Physical Exam: Respiratory: Crackles, Respiratory: Wheezing, Respiratory: Diminished breath sounds, Cardiac: Irregular rhythm, Cardiac: Edema, Cardiac: Cyanosis, Mobility: Limited ROM, Mobility: Bedridden, Mobility: Weak gait, Skin: Intact, Skin: Pressure ulcer, Skin: Pallor
            - Risk Factors: Surgery (recent), Indwelling catheter, Prolonged immobility, Smoking, Malnutrition, Advanced age

            **OUTPUT FORMAT:**
            Return ONLY a valid JSON object with this exact structure (no additional text or explanation):

            {{
                "demographics": {{
                    "age": null,
                    "sex": "",
                    "occupation": ""
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
                    "Temp": null
                }},
                "physical_exam": [],
                "physical_exam_other": "",
                "risk_factors": [],
                "risk_factors_other": "",
                "nurse_notes": ""
            }}

            **RULES:**
            - Use null for numeric fields when no data is available
            - Use empty strings for text fields when no data is available
            - Use empty arrays for list fields when no data is available
            - If symptoms/conditions don't match the predefined options, put them in the "other" fields
            - Extract only factual information present in the data
            - Do not make assumptions or add information not explicitly stated
        """
        
        logger.info("Calling API for manual data parsing...")
        response = model.generate_content(parsing_prompt)
        
        if not response or not response.text:
            raise Exception("No response from AI model")
        
        # Enhanced JSON parsing with better error handling
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

@app.post("/api/test-lookup")
async def test_lookup() -> Dict:
    """
    Test the lookup table connection and functionality.
    """
    try:
        lookup_data = lookup_service.load_lookup_table()
        
        return {
            "status": "success",
            "message": f"Successfully loaded {len(lookup_data)} entries from lookup table",
            "sample_entry": lookup_data[0] if lookup_data else None
        }
        
    except Exception as e:
        logger.error(f"Lookup test failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error_type": "lookup_test_error",
                "message": f"Failed to test lookup table: {str(e)}",
                "suggestion": "Check if the lookup table file exists in Supabase storage and has the correct format."
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)