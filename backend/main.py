from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Union
import json
import os
from dotenv import load_dotenv
from openai import OpenAI
from anthropic import Anthropic

load_dotenv()

app = FastAPI()

# Initialize AI clients
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
anthropic_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
# deepseek_client = Anthropic(api_key=os.getenv('DEEPSEEK_API_KEY'))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AssessmentData(BaseModel):
    format: Dict[str, str]
    data: Dict[str, Dict[str, Union[List[str], Dict[str, List[str]]]]]
    metadata: Dict[str, str]

@app.post("/generate-ncp")
async def generate_ncp(assessment: AssessmentData):
    try:
        # Construct prompt from assessment data
        prompt = construct_ncp_prompt(assessment)
        
        # Get response from AI model
        response = await generate_ai_response(prompt)
        
        # Parse and structure the response
        structured_ncp = parse_ai_response(response)
        
        return structured_ncp
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def construct_ncp_prompt(assessment: AssessmentData) -> str:
    # Format assessment data into a prompt
    subjective_data = format_assessment_section(assessment.data["subjective"])
    objective_data = format_assessment_section(assessment.data["objective"])
    
    return f"""Generate a Nursing Care Plan (NCP) following NANDA-I, NIC, and NOC standards based on:

Subjective Data:
{subjective_data}

Objective Data:
{objective_data}

Generate the following sections:
1. Assessment (summary)
2. Nursing Diagnosis
3. Expected Outcomes
4. Nursing Interventions
5. Rationale
6. Implementation
7. Evaluation

Format each section clearly and professionally."""

async def generate_ai_response(prompt: str) -> str:
    # Try OpenAI first
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a nursing expert specialized in creating Nursing Care Plans."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        # Fallback to Claude
        try:
            response = await anthropic_client.messages.create(
                model="claude-2",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content
        except Exception as e:
            raise Exception("Failed to generate NCP using AI models")



@app.post("/validate-ncp")
async def validate_ncp(ncp_data: dict):
    try:
        # TODO: Implement NCP validation logic
        return {
            "isValid": True,
            "feedback": "NCP follows NANDA-I standards...",
            "suggestions": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
