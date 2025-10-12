import google.generativeai as genai
from anthropic import Anthropic
import json
import logging
import re
from typing import Dict, List
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from utils import (
    format_structured_data, 
    format_assessment_for_selection,
    validate_ai_selection,
    find_matching_candidate
)
from ncp_request_tracker import track_api_call, track_error

logger = logging.getLogger(__name__)

class VectorDiagnosisMatcher:
    def __init__(self):
        """Initialize with Supabase client."""
        load_dotenv()
        
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not found in environment variables")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        self.claude_client = None
        
        # Claude configuration
        self.claude_model = "claude-sonnet-4-5-20250929"
        self.claude_max_tokens = 10000
        self.claude_temperature = 0.3
        
        self.embedding_model = "models/text-embedding-004"
        
        # Configure Gemini for embeddings only
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("Gemini API key not found in environment variables")
        genai.configure(api_key=gemini_api_key)
        
    def _get_claude_client(self):
        """Get the Claude client instance (lazy loading)"""
        if self.claude_client is None:
            claude_api_key = os.getenv("CLAUDE_API_KEY")
            if not claude_api_key:
                raise ValueError("Claude API key not found in environment variables")
            self.claude_client = Anthropic(
                api_key=claude_api_key,
                timeout=300.0  # 5 minutes timeout
            )
        return self.claude_client

    async def embed_assessment_data(self, keywords: str) -> List[float]:
        """Convert keywords string directly to embedding."""
        try:
            result = genai.embed_content(
                model=self.embedding_model,
                content=keywords,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
        
    async def find_candidate_diagnoses(
        self, 
        keywords: str, 
        top_n: int = 10, 
        similarity_threshold: float = 0.3
    ) -> List[Dict]:
        """Find candidates using keywords string."""
        try:
            # Generate embedding for the keywords
            embedding = await self.embed_assessment_data(keywords)
            
            # Search for similar diagnoses
            response = self.client.rpc(
                'match_diagnoses',
                {
                    'query_embedding': embedding,
                    'similarity_threshold': similarity_threshold, 
                    'match_count': top_n
                }
            ).execute()
            
            if response.data:
                candidates = []
                for row in response.data:
                    candidate = {
                        "id": str(row['id']),
                        "diagnosis": row['diagnosis'],
                        "definition": row['definition'],
                        "defining_characteristics": row['defining_characteristics'] or [],
                        "related_factors": row['related_factors'] or [], 
                        "risk_factors": row['risk_factors'] or [],
                        "suggested_outcomes": row['suggested_outcomes'] or [],
                        "suggested_interventions": row['suggested_interventions'] or []
                    }
                    candidates.append(candidate)
                
                # Simple diagnosis + similarity logging
                logger.info(f"Found {len(candidates)} candidates:")
                for i, (candidate, row) in enumerate(zip(candidates, response.data), 1):
                    similarity = float(row['similarity'])
                    logger.info(f"  {i}. {candidate['diagnosis']} (similarity: {similarity:.3f})")
                
                return candidates
            else:
                logger.warning("No candidates found")
                return []
                
        except Exception as e:
            logger.error(f"Error finding candidates: {str(e)}")
            raise

    async def select_best_diagnosis(
        self, 
        assessment_data: Dict, 
        candidates: List[Dict]
    ) -> Dict:
        """Use AI to select the best diagnosis from candidates."""
        
        try:
            if not candidates:
                return {
                    "diagnosis": None,
                    "definition": None,
                    "defining_characteristics": [],
                    "related_factors": [],
                    "risk_factors": [],
                    "suggested_outcomes": [],
                    "suggested_interventions": [],
                    "reasoning": "No suitable diagnoses found for the provided assessment data."
                }
            
            # Format assessment data appropriately for the AI
            formatted_assessment = format_assessment_for_selection(assessment_data)
            logger.info(f"Formatted assessment data for AI: {formatted_assessment}")
            
            candidates_text = ""
            for i, candidate in enumerate(candidates, 1):
                # Handle empty arrays safely
                def safe_join(arr):
                    return ', '.join(arr) if arr else 'None'
                
                # No similarity score shown to AI - pure clinical judgment
                candidates_text += f"""
                    **Candidate: {candidate['diagnosis']}**
                """

            ai_prompt = f"""
                You are a nursing educator AI with deep knowledge of NANDA-I (2021–2023), NIC, and NOC standards.
                Your task is to select the single best nursing diagnosis for a patient, based strictly on the provided assessment data and the candidate diagnoses from the database lookup.

                # CRITICAL RULES
                - You MUST choose EXACTLY ONE diagnosis from the provided candidate list below
                - You CANNOT invent, modify, or create any diagnosis names
                - Copy the diagnosis name EXACTLY as written in the candidate list
                - If multiple diagnoses seem possible, apply the prioritization rules below
                - The selected diagnosis must align with the patient's assessment data and the prioritization rules
                - Return the complete information for the selected diagnosis as JSON
                - Include a brief clinical explanation of why this diagnosis was selected over others, including how it matches the patient's assessment data and clinical priorities
                
                # PRIORITIZATION FRAMEWORKS (STRICT CLINICAL PRIORITY ORDER)
                
                1. **ABC – Life-Threatening Conditions (Airway, Breathing, Circulation)**
                * Select an ABC diagnosis **only if the assessment data clearly demonstrates current compromise of airway, breathing, or circulation.**
                * Do **not** select an ABC diagnosis if the data merely shows the presence of external support or monitoring (e.g., intubation, IV line, mechanical ventilation) without explicit evidence of dysfunction.
                * If no such evidence exists, evaluate other physiological needs according to Maslow's hierarchy.

                2. **Maslow's Hierarchy of Needs**
                * Physiological → pain, sleep, nutrition, elimination, hydration, mobility, thermoregulation.
                * Safety → infection prevention, fall risk, injury prevention, protection from harm.
                * Psychosocial → anxiety, coping, knowledge deficit, self-esteem, body image.
                * **Rule:** A psychosocial actual problem is always **lower priority** than a physiological or safety risk.

                3. **Actual Problems Over Risk Problems**
                * At the same Maslow level, prioritize the **actual diagnosis** over a "risk for" diagnosis.
                * Exception: A "risk for" diagnosis may override only if it is **ABC-related**

                4. **Acute Over Chronic**
                * If two actual problems exist at the same Maslow level, prioritize the **acute, severe, or unstable** condition over the **chronic or stable** one.

                # Patient Assessment Data
                {formatted_assessment}

                # Candidate Diagnoses (CHOOSE EXACTLY ONE FROM THIS LIST)
                {candidates_text}

                # Return ONLY a valid JSON object with this exact structure
                {{
                    "diagnosis": "EXACT diagnosis name from candidate list - copy it precisely",
                    "reasoning": "Brief explanation addressing: 1) How this diagnosis matches the assessment data, 2) Why this takes priority over other possible diagnoses using the nursing prioritization framework above, 3) Specific evidence from the assessment that supports this selection"
                }}
            """
            
            claude_client = self._get_claude_client()
            max_retries = 3
            
            for attempt in range(max_retries):
                logger.info(f"AI diagnosis selection attempt {attempt + 1}/{max_retries}")

                try:
                    response = claude_client.messages.create(
                        model=self.claude_model,
                        max_tokens=self.claude_max_tokens,
                        temperature=self.claude_temperature,
                        messages=[
                            {
                                "role": "user",
                                "content": ai_prompt
                            }
                        ]
                    )
                    
                    # Track this API call using the new tracker
                    track_api_call(
                        response,
                        step="select_diagnosis",
                        operation="AI Diagnosis Selection",
                        attempt=attempt + 1,
                        max_retries=max_retries,
                        candidates_count=len(candidates),
                        assessment_type=assessment_data.get('type', 'unknown')
                    )
                    
                    if not response or not response.content:
                        logger.warning(f"Attempt {attempt + 1}: No response from AI model")
                        continue
                    
                    # Parse AI response
                    raw_response = response.content[0].text.strip()
                    logger.info(f"Raw AI selection response (attempt {attempt + 1}): {raw_response}")
                    
                    # Clean and extract JSON
                    cleaned_response = raw_response.encode('utf-8').decode('utf-8-sig')
                    
                    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', cleaned_response, re.DOTALL)
                    if json_match:
                        cleaned_response = json_match.group(1)
                    
                    start_brace = cleaned_response.find('{')
                    end_brace = cleaned_response.rfind('}')
                    
                    if start_brace != -1 and end_brace != -1:
                        json_part = cleaned_response[start_brace:end_brace+1]
                        ai_response = json.loads(json_part)
                        
                        # Validate that AI selected from candidate list
                        if validate_ai_selection(ai_response, candidates):
                            # Find and return the matching candidate with AI reasoning
                            result = find_matching_candidate(ai_response, candidates)
                            if result:
                                logger.info(f"AI selected valid diagnosis: {result.get('diagnosis')}")
                                return result
                            else:
                                logger.warning(f"Attempt {attempt + 1}: Could not find matching candidate")
                        else:
                            selected = ai_response.get('diagnosis', 'None')
                            candidate_list = [c['diagnosis'] for c in candidates]
                            logger.warning(f"Attempt {attempt + 1}: AI selected invalid diagnosis '{selected}'. Valid options: {candidate_list}")
                            
                            # Add more specific instruction for next attempt
                            if attempt < max_retries - 1:
                                ai_prompt = ai_prompt.replace(
                                    "# CRITICAL RULES",
                                    f"""# CRITICAL RULES - PREVIOUS ATTEMPT FAILED
                                    YOUR LAST SELECTION "{selected}" WAS INVALID!
                                    You must select from these EXACT names: {', '.join([f'"{c["diagnosis"]}"' for c in candidates])}
                                    """
                                )
                    else:
                        logger.warning(f"Attempt {attempt + 1}: Could not extract valid JSON")
                        
                except json.JSONDecodeError as e:
                    logger.warning(f"Attempt {attempt + 1}: JSON decode error - {str(e)}")
                except Exception as e:
                    logger.warning(f"Attempt {attempt + 1}: Unexpected error - {str(e)}")
            
            # If all retries failed, return the first candidate as fallback
            logger.error("All AI selection attempts failed, falling back to first candidate")
            track_error("select_diagnosis", "All AI selection attempts failed")
            fallback = candidates[0].copy()
            fallback["reasoning"] = "AI selection failed after multiple attempts. Returned first candidate as fallback based on highest similarity score."
            return fallback
                
        except Exception as e:
            logger.error(f"Error in AI diagnosis selection: {str(e)}")
            track_error("select_diagnosis", f"Error in AI diagnosis selection: {str(e)}")
            raise


# Factory function
async def create_vector_diagnosis_matcher() -> VectorDiagnosisMatcher:
    """Create and return a VectorDiagnosisMatcher instance."""
    return VectorDiagnosisMatcher()