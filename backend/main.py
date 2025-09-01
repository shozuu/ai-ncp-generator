from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from utils import format_data, parse_ncp_response, validate_assessment_data, parse_explanation_text
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
        #         "4. Monitor and document blood pressure, heart_rate, respiratory_rate, and temperature every 4 hours. RN responsible. Report any significant changes to the physician.\n"
        #     ),
        #     'evaluation': (
        #         "\nShort-term Goal: Assess the patient's pain level using a pain scale (0-10) every 30 minutes after analgesic administration. If pain remains above 4/10 after 1 hour, notify the physician for further orders.\n\n"
        #         "Long-term Goal: Evaluate patient's understanding of headache triggers and management strategies through verbal questioning and observation of self-care behaviors prior to discharge. If the patient does not demonstrate adequate understanding, provide additional education and resources."
        #     ),
        # }

        # Construct the prompt for the AI model
        prompt = f"""
            You are a nursing educator with deep knowledge of NANDA-I, NIC, and NOC standards. 
            Base your care plan on established nursing textbooks, specifically:
            - Ackley, B. J., et al. (2022). Nursing Diagnosis Handbook, 12th Edition (with 2021–2023 NANDA-I updates)
            - Doenges, M. E., et al. (2021). Nurse’s Pocket Guide, 15th Edition

            Use these as your guiding sources when structuring the Nursing Care Plan (NCP). 
            IMPORTANT: Do NOT provide page numbers, direct quotations, or fabricated citations. 
            Instead, reference standards generally (e.g., “According to NANDA-I classification” or “Based on Ackley, 2022”) 
            to show evidence alignment without risk of false citations.

            ---

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
            9. All content must align with NANDA-I diagnoses, NIC interventions, and NOC outcomes.

            ---

            Assessment:
            - Provide a concise, structured summary of key findings.
            - Clearly separate subjective and objective data.

            
            Diagnosis:
            - Correctly format NANDA-I nursing diagnosis based on the assessment data. 
            - Use the format: [Diagnosis] related to [Etiology] as evidenced by [Defining Characteristics]. 
            - Ensure the diagnosis label matches NANDA-I terminology from Ackley (2022).
            - Align with the patient’s assessment data and reflect evidence-based standards.
            

            Outcomes:
            - Generate outcomes that are directly derived from the given assessment data and the identified nursing diagnosis.  
            - Distinguish clearly between **Short-Term Outcomes (STO)** and **Long-Term Outcomes (LTO)**.  
                - Short-Term: Achievable within hours to 1–2 days, directly measurable, related to immediate physiological or safety needs.  
                - Long-Term: Achievable over several days, before discharge, or at home, focusing on sustained health, knowledge, or lifestyle change.  
            - Each outcome must:  
                1. Use standardized **NOC terminology/labels**.  
                2. Be stated as a **SMART goal** (specific, measurable, achievable, relevant, time-bound).  
                3. Include at least **2–3 indicators with rating scales** (e.g., reports pain ≤ 3/10, oxygen saturation ≥ 95%).  
                4. Match logically with the interventions and rationales provided.  
            - Avoid vague terms like “improve” or “normalize” without measurable indicators.  
            

            
            Interventions:
            - Provide at least 3 evidence-based nursing interventions aligned with NIC taxonomy.  
            - Organize into Independent, Dependent, and Collaborative actions where applicable.  
            - For **Dependent Interventions**, explicitly include medication-related actions such as:
                * Administering prescribed drugs (use generic names only; do not invent or prescribe new drugs).  
                * Monitoring therapeutic effects and possible adverse reactions.  
                * Educating the patient about proper use, timing, and side effects of medications.  
            - Ensure interventions are consistent with Ackley (2022), Doenges (2021), and nursing practice standards.  
            - Do NOT fabricate specific prescriptions or dosages; instead, reference the drug class or generic name (e.g., “Administer prescribed bronchodilator” rather than “Give 2mg Salbutamol”).  


            Rationale:
            - Provide a rationale for each intervention.
            - Justify with clinical reasoning, nursing theory, or general textbook-based standards.
            - Do not fabricate citations; instead, refer to established nursing guidelines.

            Implementation:
            - Provide implementation steps for each intervention.
            - Write in **past tense** as if performed, with placeholder results (e.g., “Pain reduced to 3/10”).

            Evaluation:
            - Mirror outcomes in **past tense**.
            - Begin with the same time-bound phrase from the outcome.
            - Include observable patient responses and evidence of progress.

            ---

            ### Example Format:

            **Assessment:**
            * Subjective Data:
            - Example subjective data point 1.
            * Objective Data:
            - Example objective data point 1.

            **Diagnosis:**
            [Diagnosis] related to [Etiology] as evidenced by [Defining Characteristics].

            **Outcomes:**
            Within [Short-term Goal], the patient will be able to:
            - Example short-term goal.
            Within [Long-term Goal], the patient will be able to:
            - Example long-term goal.

            **Interventions:**
            * Independent:
            - Example intervention 1.
            * Dependent:
            - Example intervention 1.
            * Collaborative:
            - Example intervention 1.

            **Rationale:**
            * Independent:
            - Example rationale for independent intervention 1.
            * Dependent:
            - Example rationale for dependent intervention 1.
            * Collaborative:
            - Example rationale for collaborative intervention 1.

            **Implementation:**
            * Independent:
            - Example implementation result.
            * Dependent:
            - Example implementation result.
            * Collaborative:
            - Example implementation result.

            **Evaluation:**
            After [Short-term Goal], the patient was able to:
            - Example evaluation result.
            After [Long-term Goal], the patient was able to:
            - Example evaluation result.
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)