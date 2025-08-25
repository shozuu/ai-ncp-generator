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
        # prompt = f"""
        #     You are a nursing educator with deep knowledge of NANDA-I, NIC, and NOC standards, and you are referencing the "Nursing Diagnosis Handbook, 12th Edition Revised Reprint with 2021–2023 NANDA-I Updates" by Ackley, Ladwig, et al. Based on the assessment data I will provide, generate a structured Nursing Care Plan (NCP) that includes the following:

            
        #     PATIENT ASSESSMENT DATA

        #     Subjective Data:
        #     {formatted_subjective}

        #     Objective Data:
        #     {formatted_objective}

        #     ---

        #     Generate a complete Nursing Care Plan using the exact structure below:

        #     1. Use **only** the specified section headings and format below.
        #     2. Include all sections: **Assessment**, **Diagnosis**, **Outcomes**, **Interventions**, **Rationale**, **Implementation**, and **Evaluation**.
        #     3. Use headings for each section (e.g., **Assessment:**, **Diagnosis:**).
        #     4. Use bullet points (*) for lists and sub-bullet points (-) for nested items.
        #     5. Ensure proper spacing and formatting for readability.
        #     6. If a section is not applicable, explicitly state "Not applicable" under that section.
        #     7. Do **not** include any introductions, explanations, examples, or general information outside the specified sections.
        #     8. Maintain a professional, concise, and clinical tone throughout.

        #     ---

        #     Assessment:
        #     - Provide a concise, structured summary of key findings.
        #     - Clearly separate subjective and objective data.

        #     Diagnosis:
        #     - Correctly format NANDA-I nursing diagnosis based on the assessment data. Use the format: [Diagnosis] related to [Etiology] as evidenced by [Defining Characteristics]. 
        #     - Ensure that the diagnosis label matches NANDA-I terminology found in the Ackley & Ladwig textbook.
        #     - Ensure the diagnoses are aligned with the patient's assessment data and reflect evidence-based guidelines.

        #     Outcomes:
        #     - Define short-term goal that distinguishes a shift in behavior that can be completed immediately, usually within a few hours or days.
        #     - Define long-term goal that indicates an objective to be completed over a longer period, usually weeks or months.
        #     - Begin each goal with a clear **time-bound phrase** 
        #     - Align each goal directly with the identified nursing diagnosis and patient assessment.
        #     - Ensure outcomes are measurable, appropriate, and aligned with NOC terminology. 
        #     - Ensure they reflect realistic clinical goals.

        #     Interventions:
        #     - Provide relevant and evidence-based nursing interventions aligned with NIC taxonomy. 
        #     - Ensure they are taken from or inspired by the suggested interventions in the Ackley & Ladwig textbook.
        #     - List at least 3 specific nursing interventions.
        #     - Include and clearly separate independent, dependent, and collaborative actions where applicable.

        #     Rationale:
        #     - Provide an evidence-based rationale for each intervention.
        #     - Justify with clinical reasoning, nursing theory, or guidelines.
        #     - If applicable, the rationale may include general textbook-based knowledge

        #     Implementation:
        #     - Provide implementation for every intervention.
        #     - Include a realistic placeholder result (e.g., “3/10 pain”, “BP 120/80 mmHg”)
        #     - Write in **past tense** as if the intervention was already performed.

        #     Evaluation:
        #     - Mirror the corresponding outcomes using **past tense**.
        #     - Begin each evaluation with the same **time-bound phrase** used in the outcome 
        #     - Include observable data or patient responses that support your evaluation
        #     - Support the evaluation with observed evidence.

        #     ---

        #     ### Example Format:

        #     **Assessment:**
        #     * Subjective Data:
        #     - Example subjective data point 1.
        #     - Example subjective data point 2.
        #     * Objective Data:
        #     - Example objective data point 1.
        #     - Example objective data point 2.

        #     **Diagnosis:**
        #     [Diagnosis] related to [Etiology] as evidenced by [Defining Characteristics].

        #     **Outcomes:**
        #     Within [Short-term Goal], the patient will be able to demonstrate the following:
        #     - Example short-term goal.
        #     Within [Long-term Goal], the patient will be able to demonstrate the following:
        #     - Example long-term goal.

        #     **Interventions:**
        #     * Independent:
        #     - Example independent intervention 1.
        #     - Example independent intervention 2.
        #     * Dependent:
        #     - Example dependent intervention 1.
        #     * Collaborative:
        #     - Example collaborative intervention 1.

        #     **Rationale:**
        #     * Independent:
        #     - Example rationale for independent intervention 1.
        #     - Example rationale for independent intervention 2.
        #     * Dependent:
        #     - Example rationale for dependent intervention 1.
        #     * Collaborative:
        #     - Example rationale for collaborative intervention 1.

        #     **Implementation:**
        #     * Independent:
        #     - Example implementation for independent intervention 1.
        #     - Example implementation for independent intervention 2.
        #     * Dependent:
        #     - Example implementation for dependent intervention 1.
        #     * Collaborative:
        #     - Example implementation for collaborative intervention 1.

        #     **Evaluation:**
        #     After [Short-term Goal], the patient was be able to demonstrate the following:
        #     - Example evaluation for short-term goal.
        #     After [Long-term Goal], the patient was be able to demonstrate the following:
        #     - Example evaluation for long-term goal.
        # """
        
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

@app.post("/api/generate-explanation")
async def generate_explanation(request_data: Dict) -> Dict:
    """
    Generate explanations for each component of an NCP.
    """
    try:
        ncp = request_data.get('ncp')
        if not ncp:
            raise ValueError("NCP data is required")

        logger.info(f"Generating explanation for NCP: {ncp.get('title', 'Unknown')}")

        # For now, return dummy explanations
        # You can replace this with actual AI-generated explanations later
        dummy_explanations = {
            'assessment': """
                <p><strong>Clinical Reasoning:</strong> The assessment section provides the foundation for all nursing interventions by systematically collecting both subjective and objective data.</p>
                <p><strong>Subjective Data:</strong> Patient's self-reported symptoms like pain level (8/10) and associated symptoms (nausea, photophobia) help establish the patient's perspective and experience.</p>
                <p><strong>Objective Data:</strong> Measurable findings such as vital signs (BP 140/90, temp 38.5°C) and observable behaviors (facial grimacing) provide evidence-based support for nursing diagnoses.</p>
                <p><strong>NNN Alignment:</strong> This comprehensive assessment aligns with NOC outcome indicators for pain management and follows evidence-based assessment protocols.</p>
            """,
            'diagnosis': """
                <p><strong>NANDA-I Format:</strong> This diagnosis follows the proper three-part format: Problem + Etiology + Signs/Symptoms.</p>
                <p><strong>Acute Pain:</strong> NANDA-I approved diagnosis label that accurately reflects the patient's primary concern.</p>
                <p><strong>Related to physiological factors:</strong> The etiology identifies the underlying cause, which helps guide appropriate interventions.</p>
                <p><strong>As evidenced by:</strong> The defining characteristics provide objective and subjective validation for the chosen diagnosis.</p>
                <p><strong>Clinical Significance:</strong> This diagnosis prioritizes immediate patient comfort and safety, following Maslow's hierarchy of needs.</p>
            """,
            'outcomes': """
                <p><strong>SMART Goals:</strong> Both goals are Specific, Measurable, Achievable, Relevant, and Time-bound.</p>
                <p><strong>Short-term Goal:</strong> Focuses on immediate pain relief within 2 hours, which is realistic for analgesic intervention.</p>
                <p><strong>Long-term Goal:</strong> Addresses patient education and self-management within 3 days, promoting continuity of care.</p>
                <p><strong>NOC Alignment:</strong> Goals align with NOC indicators for Pain Level (2102) and Knowledge: Pain Management (1843).</p>
                <p><strong>Patient-Centered:</strong> Goals focus on patient-reported outcomes and functional improvement rather than just clinical measures.</p>
            """,
            'interventions': """
                <p><strong>Evidence-Based Practice:</strong> All interventions are supported by current pain management guidelines and research.</p>
                <p><strong>NIC Classification:</strong> Interventions align with NIC taxonomy including Pain Management (1400) and Environmental Management: Comfort (6482).</p>
                <p><strong>Holistic Approach:</strong> Combines pharmacological (analgesics) and non-pharmacological (environment, cold therapy) approaches.</p>
                <p><strong>Safety Considerations:</strong> Vital sign monitoring ensures early detection of complications or medication effects.</p>
                <p><strong>Nursing Scope:</strong> All interventions fall within the registered nurse's scope of practice and competency.</p>
            """,
            'rationale': """
                <p><strong>Pathophysiology:</strong> Each rationale explains the underlying physiological or psychological mechanism.</p>
                <p><strong>Evidence Base:</strong> Rationales are grounded in current nursing research and clinical guidelines.</p>
                <p><strong>Analgesic rationale:</strong> Explains how pain medications work at the neurological level to provide relief.</p>
                <p><strong>Environmental rationale:</strong> Based on research showing environmental stimuli can exacerbate headache pain.</p>
                <p><strong>Cold therapy rationale:</strong> Explains vasoconstriction effects that can reduce throbbing pain associated with migraines.</p>
                <p><strong>Monitoring rationale:</strong> Emphasizes the importance of ongoing assessment for patient safety.</p>
            """,
            'implementation': """
                <p><strong>Past Tense Documentation:</strong> Written as if interventions have been completed, following proper documentation standards.</p>
                <p><strong>Specific Details:</strong> Includes exact medications, dosages, and timeframes for reproducibility.</p>
                <p><strong>Role Clarity:</strong> Specifies which healthcare team member is responsible for each intervention.</p>
                <p><strong>Measurable Results:</strong> Includes realistic patient responses and vital sign changes.</p>
                <p><strong>Legal Documentation:</strong> Follows healthcare documentation standards that would be acceptable in legal proceedings.</p>
                <p><strong>Continuity of Care:</strong> Provides clear guidance for subsequent shifts and healthcare providers.</p>
            """,
            'evaluation': """
                <p><strong>Goal-Oriented:</strong> Directly correlates with the established outcomes using the same timeframes.</p>
                <p><strong>Objective Measures:</strong> Uses measurable criteria (pain scales, vital signs) rather than subjective impressions.</p>
                <p><strong>Past Tense Format:</strong> Written as if evaluation has been completed, showing the results of interventions.</p>
                <p><strong>Decision Points:</strong> Includes clear criteria for when to continue, modify, or discontinue interventions.</p>
                <p><strong>Quality Improvement:</strong> Provides data that can be used to improve future care plans and interventions.</p>
                <p><strong>Patient Outcomes:</strong> Focuses on actual patient improvement and functional status changes.</p>
            """
        }

        logger.info("Returning dummy explanation data")
        return dummy_explanations

    except Exception as e:
        logger.error(f"Error generating explanation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to generate explanation", "error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)