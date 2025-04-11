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

        # Construct the prompt for the AI model
        prompt = f"""
            You are a nursing expert trained in NANDA-I, NIC, and NOC standards. Based on the following patient assessment data, generate a comprehensive Nursing Care Plan (NCP).

            Follow these rules strictly:
            - Use **only** the specified section headings and format below.
            - Tailor the NCP to the patient's specific needs and condition.
            - Do **not** include any introductions, explanations, examples, or general information.
            - Maintain a professional, concise, and clinical tone throughout.

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
            - Include a **specific timeframe** for each goal (e.g., "After 24 hours...", "Within 3 days...").
            - Align each goal with the diagnosis and patient condition.

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
            - Define clear criteria to assess progress toward outcomes.
            - Recommend adjustments if goals are not met.
        """
        
        logger.info("Calling Gemini API...")
        response = model.generate_content(prompt)

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