import google.generativeai as genai
import json
import logging
import re
from typing import Dict, List
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from utils import format_structured_data

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
        self.model = None
        self.embedding_model = "models/text-embedding-004"
        
    def _get_model(self):
        """Get the AI model instance (lazy loading)"""
        if self.model is None:
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            generation_config = {
                "temperature": 0.3,
                "top_p": 1,
                "max_output_tokens": 1024,
            }
            self.model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config=generation_config,
            )
        return self.model

    def format_assessment_for_embedding(self, assessment_data: Dict) -> str:
        """Format assessment data to match diagnosis database embedding format (pipe-separated)"""
        
        # Build pipe-separated format
        sections = []
        
        # Demographics
        demographics = assessment_data.get('demographics', {})
        if demographics.get('age'):
            sections.append(f"Age: {demographics['age']}")
        if demographics.get('sex'):
            sections.append(f"Sex: {demographics['sex']}")
        if demographics.get('religion'):
            sections.append(f"Religion: {demographics['religion']}")
        if demographics.get('cultural_background'):
            sections.append(f"Cultural Background: {demographics['cultural_background']}")
        if demographics.get('language') and demographics['language'].lower() != 'english':
            sections.append(f"Language: {demographics['language']}")
        
        # Chief Complaint
        chief_complaint = assessment_data.get('chief_complaint', '').strip()
        if chief_complaint:
            sections.append(f"Chief Complaint: {chief_complaint}")
        
        # History of Present Illness
        history = assessment_data.get('history', {})
        history_parts = []
        
        if history.get('onset_duration'):
            history_parts.append(history['onset_duration'])
        if history.get('severity'):
            history_parts.append(f"severity {history['severity']}")
        if history.get('associated_symptoms'):
            history_parts.extend(history['associated_symptoms'])
        if history.get('other_symptoms'):
            history_parts.append(history['other_symptoms'])

        if history_parts:
            sections.append(f"History of Present Illness: {', '.join(history_parts)}")
        
        # Past Medical History
        med_history = assessment_data.get('medical_history', [])
        med_history_other = assessment_data.get('medical_history_other', '')
        if med_history or med_history_other:
            history_items = med_history.copy()
            if med_history_other:
                history_items.append(med_history_other)
            sections.append(f"Past Medical History: {', '.join(history_items)}")
        
        # Vital Signs (enhanced with additional vitals)
        vitals = assessment_data.get('vital_signs', {})
        vital_parts = []
        if vitals.get('HR'):
            vital_parts.append(f"HR {vitals['HR']}")
        if vitals.get('BP'):
            vital_parts.append(f"BP {vitals['BP']}")
        if vitals.get('RR'):
            vital_parts.append(f"RR {vitals['RR']}")
        if vitals.get('SpO2'):
            vital_parts.append(f"SpO2 {vitals['SpO2']}%")
        if vitals.get('Temp'):
            vital_parts.append(f"Temp {vitals['Temp']}")
        
        # Add additional vitals
        additional_vitals = vitals.get('additional_vitals', {})
        for vital_name, vital_value in additional_vitals.items():
            if vital_value:
                vital_parts.append(f"{vital_name} {vital_value}")

        if vital_parts:
            sections.append(f"Vitals: {', '.join(vital_parts)}")
        
        # Physical Exam (shortened to "Exam")
        phys_exam = assessment_data.get('physical_exam', [])
        phys_exam_other = assessment_data.get('physical_exam_other', '')
        if phys_exam or phys_exam_other:
            exam_items = []
            for item in phys_exam:
                # Remove system prefixes for embedding consistency
                clean_item = item.replace("Respiratory: ", "").replace("Cardiac: ", "").replace("Mobility: ", "").replace("Skin: ", "")
                exam_items.append(clean_item)
            if phys_exam_other:
                exam_items.append(phys_exam_other)
            sections.append(f"Exam: {', '.join(exam_items)}")
        
        # Risk Factors
        risk_factors = assessment_data.get('risk_factors', [])
        risk_factors_other = assessment_data.get('risk_factors_other', '')
        if risk_factors or risk_factors_other:
            risk_items = risk_factors.copy()
            if risk_factors_other:
                risk_items.append(risk_factors_other)
            sections.append(f"Risk Factors: {', '.join(risk_items)}")
        
        # Cultural Considerations (new section)
        cultural = assessment_data.get('cultural_considerations', {})
        cultural_parts = []
        
        if cultural.get('dietary_restrictions'):
            cultural_parts.append(f"Diet: {cultural['dietary_restrictions']}")
        if cultural.get('religious_practices'):
            cultural_parts.append(f"Religious: {cultural['religious_practices']}")
        if cultural.get('communication_preferences'):
            cultural_parts.append(f"Communication: {cultural['communication_preferences']}")
        if cultural.get('family_involvement'):
            cultural_parts.append(f"Family: {cultural['family_involvement']}")
        if cultural.get('health_beliefs'):
            cultural_parts.append(f"Health Beliefs: {cultural['health_beliefs']}")
        if cultural.get('other_considerations'):
            cultural_parts.append(cultural['other_considerations'])
        
        if cultural_parts:
            sections.append(f"Cultural Considerations: {', '.join(cultural_parts)}")
        
        # Nurse Notes (shortened to "Notes")
        nurse_notes = assessment_data.get('nurse_notes', '').strip()
        if nurse_notes:
            sections.append(f"Notes: {nurse_notes}")
        
        return " | ".join(sections)

    async def embed_assessment_data(self, assessment_data: Dict) -> List[float]:
        """Convert assessment data to embedding vector using diagnosis-aligned format."""
        try:
            # Use the new pipe-separated format that matches database embeddings
            formatted_assessment = self.format_assessment_for_embedding(assessment_data)
            logger.info(f"Formatted assessment for embedding: {formatted_assessment}")

            # Create embedding using Gemini
            result = genai.embed_content(
                model=self.embedding_model,
                content=formatted_assessment,
                task_type="retrieval_query"
            )
            
            embedding = result['embedding']
            logger.info(f"Generated embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    async def find_candidate_diagnoses(
        self, 
        assessment_data: Dict, 
        top_n: int = 10, 
        similarity_threshold: float = 0.3
    ) -> List[Dict]:
        """Find candidate diagnoses using vector similarity search via Supabase."""
        try:
            # Generate embedding for assessment data
            assessment_embedding = await self.embed_assessment_data(assessment_data)
            
            # Use Supabase RPC for vector similarity search
            result = self.client.rpc(
                'match_diagnoses',
                {
                    'query_embedding': assessment_embedding,
                    'similarity_threshold': similarity_threshold,
                    'match_count': top_n
                }
            ).execute()
            
            if result.data:
                candidates = []
                for row in result.data:
                    # Keep similarity score for logging but exclude from candidate data
                    similarity_score = float(row['similarity'])
                    
                    candidate = {
                        "id": str(row['id']),
                        "diagnosis": row['diagnosis'],
                        "definition": row['definition'],
                        "defining_characteristics": row['defining_characteristics'] or [],
                        "related_factors": row['related_factors'] or [], 
                        "risk_factors": row['risk_factors'] or [],
                        "suggested_outcomes": row['suggested_outcomes'] or [],
                        "suggested_interventions": row['suggested_interventions'] or []
                        # Note: similarity_score intentionally excluded from candidate data
                    }
                    candidates.append(candidate)
                
                logger.info(f"Found {len(candidates)} candidate diagnoses above threshold {similarity_threshold}")
                # Log similarity scores for debugging/reference only
                for i, (candidate, row) in enumerate(zip(candidates, result.data)):
                    similarity_score = float(row['similarity'])
                    logger.info(f"Candidate {i+1}: {candidate['diagnosis']} (similarity: {similarity_score:.3f})")
                
                return candidates
            else:
                logger.info("No candidates found")
                return []
                
        except Exception as e:
            logger.error(f"Error finding candidate diagnoses: {str(e)}")
            raise

    async def select_best_diagnosis(
        self, 
        assessment_data: Dict, 
        candidates: List[Dict]
    ) -> Dict:
        """Use AI to select the best diagnosis from candidates."""
        
        def validate_ai_selection(ai_response: Dict, candidates: List[Dict]) -> bool:
            """Validate that AI selected a diagnosis from the candidate list."""
            selected_diagnosis = ai_response.get('diagnosis', '').strip()
            
            if not selected_diagnosis:
                return False
            
            # Check if the selected diagnosis matches any candidate (case-insensitive)
            candidate_diagnoses = [candidate['diagnosis'].strip().lower() for candidate in candidates]
            return selected_diagnosis.lower() in candidate_diagnoses
        
        def find_matching_candidate(ai_response: Dict, candidates: List[Dict]) -> Dict:
            """Find the matching candidate and return its complete data."""
            selected_diagnosis = ai_response.get('diagnosis', '').strip().lower()
            
            for candidate in candidates:
                if candidate['diagnosis'].strip().lower() == selected_diagnosis:
                    # Return the candidate data with AI reasoning
                    return {
                        **candidate,  # All original candidate data
                        "reasoning": ai_response.get('reasoning', 'No reasoning provided')
                    }
            
            return None
        
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
            
            # Format assessment and candidates for AI
            formatted_assessment = format_structured_data(assessment_data)
            logger.info(f"Formatted assessment data for AI: {formatted_assessment}")
            
            candidates_text = ""
            for i, candidate in enumerate(candidates, 1):
                # Handle empty arrays safely
                def safe_join(arr):
                    return ', '.join(arr) if arr else 'None'
                
                # No similarity score shown to AI - pure clinical judgment
                candidates_text += f"""
                    **Candidate: {candidate['diagnosis']}**
                    Definition: {candidate['definition'] or 'Not available'}
                    Defining Characteristics: {safe_join(candidate['defining_characteristics'])}
                    Related Factors: {safe_join(candidate['related_factors'])}
                    Risk Factors: {safe_join(candidate['risk_factors'])}
                    Suggested Outcomes: {safe_join(candidate['suggested_outcomes'])}
                    Suggested Interventions: {safe_join(candidate['suggested_interventions'])}
                """

            ai_prompt = f"""
                You are a nursing educator AI with deep knowledge of NANDA-I (2021–2023), NIC, and NOC standards.
                Your task is to select the single best nursing diagnosis for a patient, based strictly on the provided assessment data and the candidate diagnoses from the database lookup.

                # CRITICAL RULES
                - You MUST choose EXACTLY ONE diagnosis from the provided candidate list below
                - You CANNOT invent, modify, or create any diagnosis names
                - Copy the diagnosis name EXACTLY as written in the candidate list
                - Always apply nursing prioritization frameworks when selecting:
                    * ABC (Airway, Breathing, Circulation) → highest priority
                    * Maslow’s hierarchy of needs → physiological and safety before psychosocial
                    * Actual problems > Risk for > Psychosocial
                - If multiple diagnoses seem possible, select the one with the **highest immediate clinical risk** 
                - The selected diagnosis must align with the patient’s priority problem/chief complaint
                - Return the complete information for the selected diagnosis as JSON
                - Include a brief clinical explanation of why this diagnosis was selected over others, including how it matches the patient's assessment data and clinical priorities

                # Patient Assessment Data
                {formatted_assessment}

                # Candidate Diagnoses (CHOOSE EXACTLY ONE FROM THIS LIST)
                {candidates_text}

                # Expected Output (JSON)
                {{
                    "diagnosis": "EXACT diagnosis name from candidate list - copy it precisely",
                    "reasoning": "brief explanation of why this diagnosis best fits the patient"
                }}

                IMPORTANT: Only return the diagnosis name and reasoning. Do not include other fields like definition, characteristics, etc. - we will get those from the original candidate data.

                Ensure the response is valid JSON with no additional text.
            """
            
            model = self._get_model()
            max_retries = 3
            
            for attempt in range(max_retries):
                logger.info(f"AI diagnosis selection attempt {attempt + 1}/{max_retries}")
                
                try:
                    response = model.generate_content(ai_prompt)
                    
                    if not response or not response.text:
                        logger.warning(f"Attempt {attempt + 1}: No response from AI model")
                        continue
                    
                    # Parse AI response
                    raw_response = response.text.strip()
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
            fallback = candidates[0].copy()
            fallback["reasoning"] = "AI selection failed after multiple attempts. Returned first candidate as fallback based on highest similarity score."
            return fallback
                
        except Exception as e:
            logger.error(f"Error in AI diagnosis selection: {str(e)}")
            raise


# Factory function
async def create_vector_diagnosis_matcher() -> VectorDiagnosisMatcher:
    """Create and return a VectorDiagnosisMatcher instance."""
    return VectorDiagnosisMatcher()