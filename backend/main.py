from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from typing import Dict
import os
from dotenv import load_dotenv
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the backend directory path and load environment variables
BACKEND_DIR = Path(__file__).resolve().parent
ENV_PATH = BACKEND_DIR / '.env'

# Load environment variables from backend/.env
load_dotenv(dotenv_path=ENV_PATH)

# Log environment loading
logger.info(f"Loading environment variables from: {ENV_PATH}")

app = FastAPI(title="NCP Generator API")

# Development CORS settings - more permissive
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use the origins list directly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("Gemini API key not found in environment variables")
    raise RuntimeError("Gemini API key not configured")

genai.configure(
    api_key=api_key,
    client_options={"api_endpoint": "generativelanguage.googleapis.com"}
)

# Set up the model configuration
generation_config = {
    "temperature": 0.7,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 2048,
}

# Initialize the model
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=generation_config
)

@app.post("/api/generate-ncp")
async def generate_ncp(assessment_data: Dict) -> Dict:
    try:
        # Log the incoming request structure
        logger.info(f"Received assessment data: {assessment_data}")
        
        if not assessment_data.get('data'):
            raise ValueError("Missing 'data' in assessment")
            
        if not all(key in assessment_data['data'] for key in ['subjective', 'objective']):
            raise ValueError("Missing required subjective or objective data")

        # Format assessment data
        try:
            formatted_subjective = format_data(assessment_data['data']['subjective'])
            formatted_objective = format_data(assessment_data['data']['objective'])
        except Exception as format_error:
            logger.error(f"Error formatting data: {str(format_error)}")
            raise ValueError(f"Error formatting assessment data: {str(format_error)}")

        # Construct prompt for Gemini
        prompt = f"""
            You are a nursing expert trained in NANDA-I, NIC, and NOC standards. Based on the following patient assessment data, generate a comprehensive Nursing Care Plan (NCP). Ensure the care plan strictly follows the structure below and uses **only** the specified headings — no additional text or commentary.
            ---

            PATIENT ASSESSMENT DATA
            
            SUBJECTIVE DATA:
            {formatted_subjective}

            OBJECTIVE DATA:
            {formatted_objective}

            ---

            Generate a complete Nursing Care Plan using the following format:

            Assessment:
            - Provide a concise, structured summary of key findings.
            - Clearly separate subjective and objective data.

            Diagnosis:
            - State the primary nursing diagnosis using standardized NANDA-I terminology.
            - Indicate the type: actual, risk, or wellness diagnosis.

            Outcomes:
            - Define both short-term and long-term goals for the patient.
            - Each goal must be SMART (Specific, Measurable, Attainable, Realistic, Time-Oriented).
            - Clearly include a **timeframe** for each goal (e.g., "After 24 hours of nursing intervention, the patient will...", "Within 3 days, the patient is able to...").
            - Align each goal with the identified diagnosis and patient's current condition.

            Interventions:
            - List 3–5 specific interventions.
            - Include independent, dependent, and collaborative actions as appropriate.

            Rationale:
            - For each intervention, explain the evidence-based rationale.
            - Support each with clinical reasoning, guidelines, or research.

            Implementation:
            - Describe how each intervention will be carried out.
            - Include step-by-step actions and assign roles (e.g., nurse, physician, caregiver).

            Evaluation:
            - State clear criteria for evaluating progress toward outcomes.
            - Suggest modifications if goals are not being met.

            ---

            Guidelines:
            - Tailor the NCP to the patient’s unique needs, preferences, and condition.
            - Make it concise and clear.
            - Maintain a professional, concise, and clinical tone.
            - Do **not** include explanations, introductions, or summaries outside the required sections.
        """
        # Log before API call
        logger.info("Calling Gemini API...")
        
        # Call Gemini API and handle potential safety errors
        try:
            response = model.generate_content(prompt)
            
            # Check for errors in the response
            if hasattr(response, '_error') and response._error:
                raise ValueError(f"Gemini API error: {response._error}")
            
            # Extract text from successful response
            ncp_text = response.text
            
            # Log the raw response for debugging
            logger.info(f"Raw Gemini response: {ncp_text}")
            
            # Parse the response into sections
            sections = parse_ncp_response(ncp_text)
            
            # Validate sections
            if not all(sections.values()):
                raise ValueError("Generated NCP is missing required sections")
                
            return sections
            
        except Exception as api_error:
            logger.error(f"Gemini API error: {str(api_error)}")
            raise ValueError(f"Error generating NCP: {str(api_error)}")
        
    except Exception as e:
        logger.error(f"Error in generate_ncp: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to generate NCP",
                "error": str(e),
                "type": type(e).__name__
            }
        )

def format_data(data: Dict) -> str:
    """Format assessment data into a string"""
    if 'rawText' in data:  # Manual mode
        return '\n'.join(f"- {item}" for item in data['rawText'])
    
    # Assistant mode
    formatted = []
    if data.get('primary'):
        formatted.extend(f"- {item}" for item in data['primary'])
    if data.get('secondary'):
        formatted.extend(f"- {item}" for item in data['secondary'])
    if data.get('exam'):
        formatted.extend(f"- {item}" for item in data['exam'])
    if data.get('vitals'):
        formatted.extend(f"- {item}" for item in data['vitals'])
    if data.get('other'):
        formatted.extend(f"- {item}" for item in data['other'])
    
    return '\n'.join(formatted)

def parse_ncp_response(text: str) -> Dict:
    """Parse the Gemini response into NCP sections."""
    sections = {
        "assessment": "",
        "diagnosis": "",
        "outcomes": "",
        "interventions": "",
        "rationale": "",
        "implementation": "",
        "evaluation": ""
    }
    
    current_section = None
    lines = text.split('\n')
    extra_text = []  # To capture any text outside the defined sections

    for line in lines:
        line = line.strip()
        lower_line = line.lower()
        
        # Identify sections
        if 'assessment:' in lower_line:
            current_section = 'assessment'
            continue
        elif 'diagnosis:' in lower_line or 'nursing diagnosis:' in lower_line:
            current_section = 'diagnosis'
            continue
        elif 'outcomes:' in lower_line or 'expected outcomes:' in lower_line:
            current_section = 'outcomes'
            continue
        elif 'interventions:' in lower_line or 'nursing interventions:' in lower_line:
            current_section = 'interventions'
            continue
        elif 'rationale:' in lower_line:
            current_section = 'rationale'
            continue
        elif 'implementation:' in lower_line:
            current_section = 'implementation'
            continue
        elif 'evaluation:' in lower_line:
            current_section = 'evaluation'
            continue
            
        # Append content to the current section or capture as extra text
        if current_section and line:
            sections[current_section] += line + '\n'
        elif line:  # If no current section, treat as extra text
            extra_text.append(line)
    
    # Clean up the sections
    for key in sections:
        sections[key] = sections[key].strip()
    
    # Log missing sections for debugging
    missing_sections = [key for key, value in sections.items() if not value]
    if missing_sections:
        logger.warning(f"Missing sections in NCP: {', '.join(missing_sections)}")
    
    # Log extra text for debugging
    if extra_text:
        logger.info(f"Extra text outside sections: {' '.join(extra_text)}")
    
    return sections

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)