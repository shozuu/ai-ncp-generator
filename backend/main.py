from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from utils import format_data, parse_ncp_response, validate_assessment_data
import google.generativeai as genai
import uvicorn

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
        logger.info(f"Received assessment data: {assessment_data}")

        # Validate incoming data
        validate_assessment_data(assessment_data)

        # Format assessment data
        try:
            formatted_subjective = format_data(assessment_data['subjective'])
            formatted_objective = format_data(assessment_data['objective'])
        except Exception as format_error:
            logger.error(f"Error formatting data: {str(format_error)}")
            raise ValueError(f"Error formatting assessment data: {str(format_error)}")
        
        # Dummy data to return to the frontend
        # dummy_ncp = {
        #     'assessment': (
        #         '\nSubjective Data:\n'
        #         '- Reports severe throbbing headache (8/10).\n'
        #         '- Reports nausea and dizziness this morning.\n'
        #         '- Complains of photophobia.\n\n'
        #         'Objective Data:\n'
        #         '- Facial grimacing during head movement.\n'
        #         '- BP: 140/90 mmHg.\n'
        #         '- Temperature: 38.5°C.\n'
        #         '- PERL.\n'
        #     ),
        #     'diagnosis': (
        #         '\nAcute Pain related to physiological factors (possible migraine) as evidenced by reports of severe throbbing headache (8/10), facial grimacing, and elevated blood pressure.\n'
        #         'Diagnosis type: Actual.\n'
        #     ),
        #     'outcomes': (
        #         '\nShort-term Goal: Patient will report a decrease in headache pain to a level of 4/10 or less within 2 hours of intervention.\n\n'
        #         'Long-term Goal: Patient will verbalize understanding of headache triggers and management strategies and demonstrate adherence to the treatment plan prior to discharge within 3 days.\n'
        #     ),
        #     'interventions': (
        #         "\n1. Administer prescribed analgesic medication.\n"
        #         "2. Provide a dark, quiet, and cool environment.\n"
        #         "3. Apply a cool compress to the patient's forehead.\n"
        #         "4. Monitor vital signs, particularly blood pressure and temperature, every 4 hours.\n"
        #     ),
        #     'rationale': (
        #         "\n1. Analgesics block pain pathways and reduce pain perception.\n"
        #         "2. Reducing environmental stimuli minimizes triggers for headache exacerbation and promotes comfort.\n"
        #         "3. Cool compresses can constrict blood vessels, potentially reducing throbbing pain associated with headaches.\n"
        #         "4. Monitoring vital signs allows for early detection of complications or changes in the patient's condition.\n"
        #     ),
        #     'implementation': (
        #         "\n1. Administer prescribed analgesic (e.g., acetaminophen 650mg PO stat, as per physician order). RN responsible. Document medication administration and patient response.\n"
        #         "2. Dim lights, close curtains, and minimize noise in the patient's room. RN responsible.\n"
        #         "3. Apply a cool compress to the patient's forehead for 20 minutes. Repeat every 2 hours as needed. RN/PCA responsible.\n"
        #         "4. Monitor and document blood pressure, heart rate, respiratory rate, and temperature every 4 hours. RN responsible. Report any significant changes to the physician.\n"
        #         "3. Apply a cool compress to the patient's forehead for 20 minutes. Repeat every 2 hours as needed. RN/PCA responsible.\n"
        #         "4. Monitor and document blood pressure, heart rate, respiratory rate, and temperature every 4 hours. RN responsible. Report any significant changes to the physician.\n"
        #         "3. Apply a cool compress to the patient's forehead for 20 minutes. Repeat every 2 hours as needed. RN/PCA responsible.\n"
        #         "4. Monitor and document blood pressure, heart rate, respiratory rate, and temperature every 4 hours. RN responsible. Report any significant changes to the physician.\n"
        #     ),
        #     'evaluation': (
        #         "\nShort-term Goal: Assess the patient's pain level using a pain scale (0-10) every 30 minutes after analgesic administration. If pain remains above 4/10 after 1 hour, notify the physician for further orders.\n\n"
        #         "Long-term Goal: Evaluate patient's understanding of headache triggers and management strategies through verbal questioning and observation of self-care behaviors prior to discharge. If the patient does not demonstrate adequate understanding, provide additional education and resources."
        #     ),
        # }

        # Construct the prompt for the AI model
        prompt = f"""
            You are a nursing educator with deep knowledge of NANDA-I, NIC, and NOC standards, and you are referencing the "Nursing Diagnosis Handbook, 12th Edition Revised Reprint with 2021–2023 NANDA-I Updates" by Ackley, Ladwig, et al. Based on the assessment data I will provide, generate a structured Nursing Care Plan (NCP) that includes the following:

            
            PATIENT ASSESSMENT DATA

            Subjective Data:
            {formatted_subjective}

            Objective Data:
            {formatted_objective}

            ---

            Generate a complete Nursing Care Plan using the exact structure below:

            1. Use **only** the specified section headings and format below.
            2. Include all sections: **Assessment**, **Diagnosis**, **Outcomes**, **Interventions**, **Rationale**, **Implementation**, and **Evaluation**.
            3. Use headings for each section (e.g., **Assessment:**, **Diagnosis:**).
            4. Use bullet points (*) for lists and sub-bullet points (-) for nested items.
            5. Ensure proper spacing and formatting for readability.
            6. If a section is not applicable, explicitly state "Not applicable" under that section.
            7. Do **not** include any introductions, explanations, examples, or general information outside the specified sections.
            8. Maintain a professional, concise, and clinical tone throughout.

            ---

            Assessment:
            - Provide a concise, structured summary of key findings.
            - Clearly separate subjective and objective data.

            Diagnosis:
            - Correctly format NANDA-I nursing diagnosis based on the assessment data. Use the format: [Diagnosis] related to [Etiology] as evidenced by [Defining Characteristics]. 
            - Ensure that the diagnosis label matches NANDA-I terminology found in the Ackley & Ladwig textbook.
            - Ensure the diagnoses are aligned with the patient's assessment data and reflect evidence-based guidelines.

            Outcomes:
            - Define short-term goal that distinguishes a shift in behavior that can be completed immediately, usually within a few hours or days.
            - Define long-term goal that indicates an objective to be completed over a longer period, usually weeks or months.
            - Begin each goal with a clear **time-bound phrase** 
            - Align each goal directly with the identified nursing diagnosis and patient assessment.
            - Ensure outcomes are measurable, appropriate, and aligned with NOC terminology. 
            - Ensure they reflect realistic clinical goals.

            Interventions:
            - Provide relevant and evidence-based nursing interventions aligned with NIC taxonomy. 
            - Ensure they are taken from or inspired by the suggested interventions in the Ackley & Ladwig textbook.
            - List at least 3 specific nursing interventions.
            - Include and clearly separate independent, dependent, and collaborative actions where applicable.

            Rationale:
            - Provide an evidence-based rationale for each intervention.
            - Justify with clinical reasoning, nursing theory, or guidelines.
            - If applicable, the rationale may include general textbook-based knowledge

            Implementation:
            - Provide implementation for every intervention.
            - Include a realistic placeholder result (e.g., “3/10 pain”, “BP 120/80 mmHg”)
            - Write in **past tense** as if the intervention was already performed.

            Evaluation:
            - Mirror the corresponding outcomes using **past tense**.
            - Begin each evaluation with the same **time-bound phrase** used in the outcome 
            - Include observable data or patient responses that support your evaluation
            - Support the evaluation with observed evidence.

            ---

            ### Example Format:

            **Assessment:**
            * Subjective Data:
            - Example subjective data point 1.
            - Example subjective data point 2.
            * Objective Data:
            - Example objective data point 1.
            - Example objective data point 2.

            **Diagnosis:**
            [Diagnosis] related to [Etiology] as evidenced by [Defining Characteristics].

            **Outcomes:**
            Within [Short-term Goal], the patient will be able to demonstrate the following:
            - Example short-term goal.
            Within [Long-term Goal], the patient will be able to demonstrate the following:
            - Example long-term goal.

            **Interventions:**
            * Independent:
            - Example independent intervention 1.
            - Example independent intervention 2.
            * Dependent:
            - Example dependent intervention 1.
            * Collaborative:
            - Example collaborative intervention 1.

            **Rationale:**
            * Independent:
            - Example rationale for independent intervention 1.
            - Example rationale for independent intervention 2.
            * Dependent:
            - Example rationale for dependent intervention 1.
            * Collaborative:
            - Example rationale for collaborative intervention 1.

            **Implementation:**
            * Independent:
            - Example implementation for independent intervention 1.
            - Example implementation for independent intervention 2.
            * Dependent:
            - Example implementation for dependent intervention 1.
            * Collaborative:
            - Example implementation for collaborative intervention 1.

            **Evaluation:**
            After [Short-term Goal], the patient was be able to demonstrate the following:
            - Example evaluation for short-term goal.
            After [Long-term Goal], the patient was be able to demonstrate the following:
            - Example evaluation for long-term goal.
        """
        
        logger.info("Calling Gemini API...")
        response = model.generate_content(prompt)

        # logger.info("Returning dummy NCP data to the frontend.") # remove this
        # return dummy_ncp  # Return dummy data instead of querying the Gemini API

        # Check for errors in the response
        if hasattr(response, '_error') and response._error:
            raise ValueError(f"Gemini API error: {response._error}")

        # Parse and validate the response
        ncp_text = response.text
        logger.info(f"Raw Gemini response: {ncp_text}")
        sections = parse_ncp_response(ncp_text)

        if not all(sections.values()):
            raise ValueError("Generated NCP is missing required sections")

        return sections # This is sent back to the frontend
    except Exception as e:
        logger.error(f"Error generating NCP: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to generate NCP", "error": str(e)}
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
        [4–8 sentences: cite NANDA-I codes, NIC/NOC standards, or research evidence; 
        include specific references to authoritative nursing literature and guidelines]

        Student Guidance Summary:
        [2–3 sentences: main learning takeaways for students]

        Student Guidance Detailed:
        [4–8 sentences: practical learning pathway including reflection questions, 
        case application examples, common mistakes to avoid, and skill-building exercises]

        IMPORTANT RULES:
        - Use the exact headers above
        - Each explanation must be clear, professional, and educational
        - Avoid special characters like quotes/apostrophes that may cause parsing issues
        - Always ground reasoning in NANDA-I, NIC, and NOC standards where relevant
        - If an intervention, outcome, or rationale could have multiple valid options, 
        explain why the given choice is appropriate and what alternatives exist

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

def parse_explanation_text(text: str, available_sections: list) -> Dict:
    """
    Parse plain text AI response into structured explanation format.
    """
    explanations = {}
    
    # Split text into sections
    lines = text.split('\n')
    current_section = None
    current_content = {}
    current_type = None
    current_text = []
    
    for line in lines:
        line = line.strip()
        
        # Check if this is a section header
        if line.startswith('**') and line.endswith(':**'):
            # Save previous section if exists
            if current_section and current_content:
                explanations[current_section] = current_content
            
            # Start new section
            section_name = line.replace('**', '').replace(':', '').strip().lower()
            # Map section names back to our format
            for available_section in available_sections:
                if available_section.replace('_', ' ').lower() in section_name:
                    current_section = available_section
                    break
            
            current_content = {
                'clinical_reasoning': {'summary': '', 'detailed': ''},
                'evidence_based_support': {'summary': '', 'detailed': ''},
                'student_guidance': {'summary': '', 'detailed': ''}
            }
            current_type = None
            current_text = []
            
        # Check if this is an explanation type header
        elif line.endswith(':') and any(key_phrase in line.lower() for key_phrase in [
            'clinical reasoning summary',
            'clinical reasoning detailed', 
            'evidence-based support summary',
            'evidence-based support detailed',
            'student guidance summary',
            'student guidance detailed'
        ]):
            # Save previous type content
            if current_type and current_text and current_section:
                content = ' '.join(current_text).strip()
                if content:
                    if 'clinical reasoning summary' in current_type:
                        current_content['clinical_reasoning']['summary'] = content
                    elif 'clinical reasoning detailed' in current_type:
                        current_content['clinical_reasoning']['detailed'] = content
                    elif 'evidence-based support summary' in current_type:
                        current_content['evidence_based_support']['summary'] = content
                    elif 'evidence-based support detailed' in current_type:
                        current_content['evidence_based_support']['detailed'] = content
                    elif 'student guidance summary' in current_type:
                        current_content['student_guidance']['summary'] = content
                    elif 'student guidance detailed' in current_type:
                        current_content['student_guidance']['detailed'] = content
            
            # Start new type
            current_type = line.lower()
            current_text = []
            
        # Regular content line
        elif line and current_section and current_type:
            current_text.append(line)
    
    # Don't forget the last section
    if current_section and current_content:
        # Save the last type content
        if current_type and current_text:
            content = ' '.join(current_text).strip()
            if content:
                if 'clinical reasoning summary' in current_type:
                    current_content['clinical_reasoning']['summary'] = content
                elif 'clinical reasoning detailed' in current_type:
                    current_content['clinical_reasoning']['detailed'] = content
                elif 'evidence-based support summary' in current_type:
                    current_content['evidence_based_support']['summary'] = content
                elif 'evidence-based support detailed' in current_type:
                    current_content['evidence_based_support']['detailed'] = content
                elif 'student guidance summary' in current_type:
                    current_content['student_guidance']['summary'] = content
                elif 'student guidance detailed' in current_type:
                    current_content['student_guidance']['detailed'] = content
        
        explanations[current_section] = current_content
    
    # Ensure all available sections have explanations (with fallbacks if needed)
    for section in available_sections:
        if section not in explanations:
            explanations[section] = {
                'clinical_reasoning': {
                    'summary': f'Clinical reasoning for this {section.replace("_", " ")} component involves systematic analysis of patient data and evidence-based decision making.',
                    'detailed': f'The {section.replace("_", " ")} component requires comprehensive clinical thinking, incorporating patient assessment data, nursing knowledge, and evidence-based guidelines to ensure safe and effective care delivery.'
                },
                'evidence_based_support': {
                    'summary': f'Evidence-based nursing practice supports comprehensive {section.replace("_", " ")} documentation according to current standards.',
                    'detailed': f'Current nursing literature and professional guidelines emphasize the importance of thorough {section.replace("_", " ")} documentation for quality patient outcomes and professional accountability.'
                },
                'student_guidance': {
                    'summary': f'Students should understand the purpose and components of effective {section.replace("_", " ")}.',
                    'detailed': f'Learning objectives include theoretical foundation, practical application, and competency demonstration in {section.replace("_", " ")}. Students should engage in guided practice and reflective learning.'
                }
            }
    
    return explanations

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)