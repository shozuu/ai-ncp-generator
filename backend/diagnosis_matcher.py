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
        """Format assessment data to match diagnosis database embedding format"""
        
        sections = []
        
        # 1. DEFINING CHARACTERISTICS INDICATORS
        # Physical exam findings that could be defining characteristics
        phys_exam = assessment_data.get('physical_exam', [])
        phys_exam_other = assessment_data.get('physical_exam_other', '')
        if phys_exam or phys_exam_other:
            exam_items = []
            for item in phys_exam:
                # Keep clinical findings that indicate diagnoses
                clean_item = item.replace("Respiratory: ", "").replace("Cardiac: ", "").replace("Mobility: ", "").replace("Skin: ", "")
                exam_items.append(clean_item)
            if phys_exam_other:
                exam_items.append(phys_exam_other)
            sections.append(f"Clinical Findings: {', '.join(exam_items)}")
        
        # Associated symptoms from history (potential defining characteristics)
        history = assessment_data.get('history', {})
        if history.get('associated_symptoms'):
            sections.append(f"Symptoms: {', '.join(history['associated_symptoms'])}")
        if history.get('other_symptoms'):
            sections.append(f"Other Symptoms: {history['other_symptoms']}")
        
        # 2. RISK FACTORS
        risk_factors = assessment_data.get('risk_factors', [])
        risk_factors_other = assessment_data.get('risk_factors_other', '')
        if risk_factors or risk_factors_other:
            risk_items = risk_factors.copy()
            if risk_factors_other:
                risk_items.append(risk_factors_other)
            sections.append(f"Risk Factors: {', '.join(risk_items)}")
        
        # 3. RELATED FACTORS (from medical history)
        med_history = assessment_data.get('medical_history', [])
        med_history_other = assessment_data.get('medical_history_other', '')
        if med_history or med_history_other:
            history_items = med_history.copy()
            if med_history_other:
                history_items.append(med_history_other)
            sections.append(f"Medical Conditions: {', '.join(history_items)}")
        
        # 4. SEVERITY INDICATORS (only if relevant to defining characteristics)
        if history.get('severity'):
            sections.append(f"Severity: {history['severity']}")
        
        # 5. ABNORMAL VITALS (only if significantly abnormal)
        vitals = assessment_data.get('vital_signs', {})
        abnormal_vitals = []
        
        # Only include vitals that are clinically significant
        if vitals.get('HR') and (int(vitals['HR']) < 60 or int(vitals['HR']) > 100):
            abnormal_vitals.append(f"HR {vitals['HR']}")
        if vitals.get('SpO2') and int(vitals['SpO2']) < 95:
            abnormal_vitals.append(f"SpO2 {vitals['SpO2']}%")
        if vitals.get('RR') and (int(vitals['RR']) < 12 or int(vitals['RR']) > 20):
            abnormal_vitals.append(f"RR {vitals['RR']}")
        
        # Include significant additional vitals
        additional_vitals = vitals.get('additional_vitals', {})
        for vital_name, vital_value in additional_vitals.items():
            if vital_value and any(keyword in vital_name.lower() for keyword in ['pain', 'glucose', 'pressure']):
                abnormal_vitals.append(f"{vital_name} {vital_value}")
        
        if abnormal_vitals:
            sections.append(f"Abnormal Vitals: {', '.join(abnormal_vitals)}")
        
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
                - If multiple diagnoses seem possible, apply the prioritization rules below
                - The selected diagnosis must align with the patient's assessment data and the prioritization rules. 
                - The patient’s chief complaint may only guide the choice if higher-priority physiological or safety concerns are not present.
                - Return the complete information for the selected diagnosis as JSON
                - Include a brief clinical explanation of why this diagnosis was selected over others, including how it matches the patient's assessment data and clinical priorities
                
                # PRIORITIZATION FRAMEWORKS
                1. **Actual Problems First**: If the assessment data clearly supports an actual diagnosis, always select it over any "Risk for" diagnosis. 
                2. **ABC (Airway, Breathing, Circulation)**: Among actual diagnoses, prioritize those that involve airway, breathing, or circulation.
                3. **Maslow’s Hierarchy of Needs**: After ABCs, address physiological and safety needs before psychosocial or self-actualization.
                4. **Safety and Urgency**: Problems that could quickly compromise health or safety are prioritized over less urgent concerns.
                5. **Time Sensitivity**: Diagnoses that may worsen rapidly if untreated should be addressed before those that develop slowly.
                6. **Patient-Centered Priorities**: When multiple diagnoses are equal in priority (same level of physiological risk), then consider the patient’s chief complaint.

                # Patient Assessment Data
                {formatted_assessment}

                # Candidate Diagnoses (CHOOSE EXACTLY ONE FROM THIS LIST)
                {candidates_text}

                # Expected Output (JSON)
                {{
                    "diagnosis": "EXACT diagnosis name from candidate list - copy it precisely",
                    "reasoning": "brief explanation of why this diagnosis best fits the patient and why not the other closest/related/similar possible diagnoses"
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