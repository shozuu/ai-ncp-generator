from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from utils import format_data, parse_ncp_response, validate_assessment_data
import google.generativeai as genai

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
        dummy_ncp = {
            'assessment': (
                '\nSubjective Data:\n'
                '- Reports severe throbbing headache (8/10).\n'
                '- Reports nausea and dizziness this morning.\n'
                '- Complains of photophobia.\n\n'
                'Objective Data:\n'
                '- Facial grimacing during head movement.\n'
                '- BP: 140/90 mmHg.\n'
                '- Temperature: 38.5°C.\n'
                '- PERL.\n'
            ),
            'diagnosis': (
                '\nAcute Pain related to physiological factors (possible migraine) as evidenced by reports of severe throbbing headache (8/10), facial grimacing, and elevated blood pressure.\n'
                'Diagnosis type: Actual.\n'
            ),
            'outcomes': (
                '\nShort-term Goal: Patient will report a decrease in headache pain to a level of 4/10 or less within 2 hours of intervention.\n\n'
                'Long-term Goal: Patient will verbalize understanding of headache triggers and management strategies and demonstrate adherence to the treatment plan prior to discharge within 3 days.\n'
            ),
            'interventions': (
                "\n1. Administer prescribed analgesic medication.\n"
                "2. Provide a dark, quiet, and cool environment.\n"
                "3. Apply a cool compress to the patient's forehead.\n"
                "4. Monitor vital signs, particularly blood pressure and temperature, every 4 hours.\n"
            ),
            'rationale': (
                "\n1. Analgesics block pain pathways and reduce pain perception.\n"
                "2. Reducing environmental stimuli minimizes triggers for headache exacerbation and promotes comfort.\n"
                "3. Cool compresses can constrict blood vessels, potentially reducing throbbing pain associated with headaches.\n"
                "4. Monitoring vital signs allows for early detection of complications or changes in the patient's condition.\n"
            ),
            'implementation': (
                "\n1. Administer prescribed analgesic (e.g., acetaminophen 650mg PO stat, as per physician order). RN responsible. Document medication administration and patient response.\n"
                "2. Dim lights, close curtains, and minimize noise in the patient's room. RN responsible.\n"
                "3. Apply a cool compress to the patient's forehead for 20 minutes. Repeat every 2 hours as needed. RN/PCA responsible.\n"
                "4. Monitor and document blood pressure, heart rate, respiratory rate, and temperature every 4 hours. RN responsible. Report any significant changes to the physician.\n"
                "3. Apply a cool compress to the patient's forehead for 20 minutes. Repeat every 2 hours as needed. RN/PCA responsible.\n"
                "4. Monitor and document blood pressure, heart rate, respiratory rate, and temperature every 4 hours. RN responsible. Report any significant changes to the physician.\n"
                "3. Apply a cool compress to the patient's forehead for 20 minutes. Repeat every 2 hours as needed. RN/PCA responsible.\n"
                "4. Monitor and document blood pressure, heart rate, respiratory rate, and temperature every 4 hours. RN responsible. Report any significant changes to the physician.\n"
            ),
            'evaluation': (
                "\nShort-term Goal: Assess the patient's pain level using a pain scale (0-10) every 30 minutes after analgesic administration. If pain remains above 4/10 after 1 hour, notify the physician for further orders.\n\n"
                "Long-term Goal: Evaluate patient's understanding of headache triggers and management strategies through verbal questioning and observation of self-care behaviors prior to discharge. If the patient does not demonstrate adequate understanding, provide additional education and resources."
            ),
        }

        # Construct the prompt for the AI model
        prompt = f"""
            You are a nursing expert trained in NANDA-I, NIC, and NOC standards. Based on the following patient assessment data, generate a comprehensive Nursing Care Plan (NCP).

            Follow these rules strictly:
            - Use **only** the specified section headings and format below.
            - Include all sections: Assessment, Diagnosis, Outcomes, Interventions, Rationale, Implementation, and Evaluation.
            - If a section is not applicable, explicitly state "Not applicable" under that section.
            - Tailor the NCP to the patient's specific needs and condition.
            - Do **not** include any introductions, explanations, examples, or general information.
            - Maintain a professional, concise, and clinical tone throughout.
            - Your output should follow the same format and writing style used in academic NCPs like those on NursesLabs.com. Each section must follow clinical best practices.

            ---

            PATIENT ASSESSMENT DATA

            Subjective Data:
            {formatted_subjective}

            Objective Data:
            {formatted_objective}

            ---

            Generate a complete Nursing Care Plan using the exact structure below:

            Assessment:
            - Provide a concise, structured summary of key findings.
            - Clearly separate subjective and objective data.

            Diagnosis:
            - State the primary nursing diagnosis using standardized NANDA-I terminology.
            - Indicate the diagnosis type (actual, risk, or wellness).

            Outcomes:
            - Define both short-term and long-term goals for the patient.
            - Each goal must be SMART (Specific, Measurable, Attainable, Realistic, Time-Oriented).
            - Begin each goal with a clear **time-bound phrase** (e.g., "After 24 hours of nursing intervention, the patient will...").
            - Ensure goals are specific and measurable (e.g., "demonstrate correct breathing techniques," "report pain level less than 3/10").
            - Align each goal directly with the identified nursing diagnosis and patient assessment.

            Interventions:
            - List 3–5 specific nursing interventions.
            - Include independent, dependent, and collaborative actions where applicable.

            Rationale:
            - Provide an evidence-based rationale for each intervention.
            - Justify with clinical reasoning, nursing theory, or guidelines.

            Implementation:
            - Describe how each intervention will be executed.
            - Include step-by-step actions and specify responsible healthcare team members.

            Evaluation:
            - Mirror the corresponding outcomes using **past tense**.
            - Begin each evaluation with the same **time-bound phrase** used in the outcome (e.g., "After 24 hours of nursing intervention, the patient was able to...").
            - Clearly state whether each goal was:
            - Achieved
            - Partially achieved
            - Not achieved
            - Support the evaluation with observed evidence (e.g., "as evidenced by normal respiratory rate and O2 saturation").
            - If goals were not fully met, briefly suggest follow-up actions or modifications.
        """
        
        # logger.info("Calling Gemini API...")
        # response = model.generate_content(prompt)

        logger.info("Returning dummy NCP data to the frontend.") # remove this
        return dummy_ncp  # Return dummy data instead of querying the Gemini API

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)