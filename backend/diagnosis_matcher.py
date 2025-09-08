import google.generativeai as genai
import json
import re
import logging
from typing import Dict, List

from lookup_service import lookup_service

logger = logging.getLogger(__name__)


class DiagnosisMatcher:
    def __init__(self):
        self.lookup_data = None
        # Use the same model instance as main.py
        self.model = None

    def _get_model(self):
        """Get the AI model instance (lazy loading)"""
        if self.model is None:
            import os
            from dotenv import load_dotenv

            load_dotenv()

            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            generation_config = {
                "temperature": 0.3,  # Lower temperature for more consistent keyword extraction
                "top_p": 1,
                "top_k": 1,
                "max_output_tokens": 1024,
            }
            self.model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config=generation_config,
            )
        return self.model

    def load_lookup_data(self):
        """Load lookup data if not already loaded."""
        if self.lookup_data is None:
            self.lookup_data = lookup_service.get_lookup_data()
        return self.lookup_data

    def extract_keywords(self, assessment_data: Dict) -> List[str]:
        """Extract relevant clinical keywords from assessment data using AI."""
        try:
            # Format the assessment data for AI processing
            formatted_assessment = self._format_assessment_for_ai(assessment_data)

            # Create AI prompt for keyword extraction
            keyword_prompt = f"""
            You are a clinical terminology expert. Your task is to extract relevant medical and nursing keywords from patient assessment data that would be useful for matching against nursing diagnoses.

            **ASSESSMENT DATA:**
            {formatted_assessment}

            **INSTRUCTIONS:**
            1. Extract clinically relevant keywords and phrases (1-3 words max)
            2. Focus on symptoms, conditions, findings, and clinical descriptors
            3. Normalize medical terminology (e.g., "shortness of breath" → "dyspnea")
            4. Include both lay terms and medical terms when relevant
            5. Prioritize keywords that would appear in nursing diagnosis criteria
            6. EXCLUDE non-clinical words, patient identifiers, temporal words

            **EXAMPLES OF GOOD KEYWORDS:**
            - "dyspnea", "chest pain", "hypertension", "crackles"
            - "anxiety", "fatigue", "tachycardia", "edema"
            - "acute", "chronic", "severe", "sudden onset"
            - "COPD", "diabetes", "infection", "surgery", etc.

            **EXAMPLES TO EXCLUDE:**
            - "patient", "client", "reports", "states", "yesterday", "walking"

            **OUTPUT FORMAT:**
            Return ONLY a JSON array of keywords:
            ["keyword1", "keyword2", "keyword3", ...]

            **RULES:**
            - Maximum 20 keywords
            - Each keyword should be 1-3 words maximum
            - Use lowercase
            - No duplicates
            - Focus ONLY on clinically significant terms
            """

            logger.info("Calling AI for keyword extraction...")
            model = self._get_model()
            response = model.generate_content(keyword_prompt)

            logger.info(f"AI response for keyword extraction: {response.text}")

            if not response or not response.text:
                logger.warning("No AI response for keyword extraction, falling back to basic extraction")
                return self._fallback_keyword_extraction(assessment_data)

            # Parse and validate AI response
            keywords = self._parse_and_validate_keywords(response.text)

            logger.info(f"extracted AI keywords: {keywords}")
            return keywords

        except Exception as e:
            logger.error(f"Error in AI keyword extraction: {str(e)}")
            logger.info("Falling back to basic keyword extraction")
            return self._fallback_keyword_extraction(assessment_data)

    def _format_assessment_for_ai(self, assessment_data: Dict) -> str:
        """Format assessment data for AI keyword extraction."""
        sections = []

        # Chief complaint
        if assessment_data.get("chief_complaint"):
            sections.append(f"Chief Complaint: {assessment_data['chief_complaint']}")

        # History
        history = assessment_data.get("history", {})
        if any(history.values()):
            history_parts = []
            for key, value in history.items():
                if value:
                    if isinstance(value, list):
                        history_parts.append(f"{key}: {', '.join(value)}")
                    else:
                        history_parts.append(f"{key}: {value}")
            if history_parts:
                sections.append(f"History: {'; '.join(history_parts)}")

        # Vital signs
        vitals = assessment_data.get("vital_signs", {})
        if any(v for v in vitals.values() if v is not None and v != ""):
            vital_parts = []
            for key, value in vitals.items():
                if value is not None and value != "":
                    vital_parts.append(f"{key}: {value}")
            if vital_parts:
                sections.append(f"Vital Signs: {'; '.join(vital_parts)}")

        # Physical exam
        phys_exam = assessment_data.get("physical_exam", [])
        phys_exam_other = assessment_data.get("physical_exam_other", "")
        if phys_exam or phys_exam_other:
            exam_items = phys_exam.copy()
            if phys_exam_other:
                exam_items.append(phys_exam_other)
            sections.append(f"Physical Exam: {', '.join(exam_items)}")

        # Medical history
        med_history = assessment_data.get("medical_history", [])
        med_history_other = assessment_data.get("medical_history_other", "")
        if med_history or med_history_other:
            history_items = med_history.copy()
            if med_history_other:
                history_items.append(med_history_other)
            sections.append(f"Medical History: {', '.join(history_items)}")

        # Risk factors
        risk_factors = assessment_data.get("risk_factors", [])
        risk_factors_other = assessment_data.get("risk_factors_other", "")
        if risk_factors or risk_factors_other:
            risk_items = risk_factors.copy()
            if risk_factors_other:
                risk_items.append(risk_factors_other)
            sections.append(f"Risk Factors: {', '.join(risk_items)}")

        # Nurse notes
        if assessment_data.get("nurse_notes"):
            sections.append(f"Nurse Notes: {assessment_data['nurse_notes']}")

        return "\n".join(sections)

    def _parse_and_validate_keywords(self, response_text: str) -> List[str]:
        """Parse AI response to extract keywords array."""
        try:
            # Clean response text
            cleaned_response = response_text.strip()

            # Remove code blocks if present
            json_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', cleaned_response, re.DOTALL)
            if json_match:
                cleaned_response = json_match.group(1)

            # Find JSON array
            start_bracket = cleaned_response.find("[")
            end_bracket = cleaned_response.rfind("]")

            if start_bracket != -1 and end_bracket != -1:
                json_part = cleaned_response[start_bracket:end_bracket+1]
                keywords = json.loads(json_part)

                if isinstance(keywords, list):
                    # Apply minimal validation (trust the AI's clinical judgment)
                    cleaned_keywords = []
                    
                    # Basic blacklist for obvious non-clinical terms
                    non_clinical_blacklist = {
                        'patient', 'client', 'reports', 'states', 'says', 'feels', 
                        'mentions', 'yesterday', 'today', 'tomorrow', 'the', 'and', 
                        'or', 'but', 'with', 'walking', 'sitting', 'lying', 'standing'
                    }
                    
                    for kw in keywords[:20]:  # Limit to 20
                        if not kw:
                            continue
                            
                        keyword = str(kw).lower().strip()
                        
                        # Basic cleaning
                        if len(keyword) < 2:
                            continue
                            
                        # Remove special characters except spaces and hyphens
                        keyword = re.sub(r"[^a-zA-Z0-9\s\-]", "", keyword)
                        
                        # Skip if too long or in blacklist
                        if len(keyword.split()) > 3 or keyword in non_clinical_blacklist:
                            continue
                        
                        if keyword and keyword not in cleaned_keywords:
                            cleaned_keywords.append(keyword)
                    
                    return cleaned_keywords

            logger.warning("Could not parse AI keyword response as JSON array")
            return []

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error for keywords: {str(e)}")
            return []

    def _fallback_keyword_extraction(self, assessment_data: Dict) -> List[str]:
        """Fallback keyword extraction using improved basic method."""
        keywords = []

        # Define priority clinical terms to look for
        priority_terms = [
            "pain",
            "dyspnea",
            "shortness of breath",
            "chest pain",
            "fatigue",
            "anxiety",
            "restlessness",
            "hypertension",
            "diabetes",
            "copd",
            "crackles",
            "wheezing",
            "edema",
            "tachycardia",
            "fever",
        ]

        # Extract from all text fields
        all_text = []

        # Collect all text content
        if assessment_data.get("chief_complaint"):
            all_text.append(assessment_data["chief_complaint"].lower())

        # History
        history = assessment_data.get("history", {})
        for value in history.values():
            if isinstance(value, str) and value:
                all_text.append(value.lower())
            elif isinstance(value, list):
                all_text.extend([str(item).lower() for item in value if item])

        # Other fields
        for field in [
            "physical_exam_other",
            "medical_history_other",
            "risk_factors_other",
            "nurse_notes",
        ]:
            if assessment_data.get(field):
                all_text.append(assessment_data[field].lower())

        # Lists
        for field in ["physical_exam", "medical_history", "risk_factors"]:
            items = assessment_data.get(field, [])
            all_text.extend([str(item).lower() for item in items if item])

        # Extract priority terms
        combined_text = " ".join(all_text)
        for term in priority_terms:
            if term in combined_text:
                keywords.append(term)

        # Extract individual meaningful words
        words = re.findall(r"\b[a-zA-Z]{4,}\b", combined_text)
        clinical_words = [w for w in words if len(w) >= 4][:10]  # Limit to 10
        keywords.extend(clinical_words)

        return list(set(keywords))  # Remove duplicates

    def calculate_relevance_score(
        self,
        diagnosis_entry: Dict,
        keywords: List[str],
        vital_signs: Dict,
        demographics: Dict,
    ) -> float:
        """Calculate relevance score for a diagnosis entry."""
        score = 0.0

        # Check defining characteristics (high weight)
        defining_chars = [
            char.lower() for char in diagnosis_entry.get("defining_characteristics", [])
        ]
        for keyword in keywords:
            for char in defining_chars:
                if keyword in char or char in keyword:
                    score += 3.0

        # Check related factors (medium weight)
        related_factors = [
            factor.lower() for factor in diagnosis_entry.get("related_factors", [])
        ]
        for keyword in keywords:
            for factor in related_factors:
                if keyword in factor or factor in keyword:
                    score += 2.0

        # Check risk factors (medium weight)
        risk_factors = [factor.lower() for factor in diagnosis_entry.get("risk_factors", [])]
        for keyword in keywords:
            for factor in risk_factors:
                if keyword in factor or factor in keyword:
                    score += 2.0

        # Check diagnosis name and definition (lower weight)
        diagnosis_text = (
            diagnosis_entry.get("diagnosis", "") + " " + diagnosis_entry.get("definition", "")
        ).lower()
        for keyword in keywords:
            if keyword in diagnosis_text:
                score += 1.0

        # Age-specific adjustments
        age = demographics.get("age")
        if age:
            diagnosis_lower = diagnosis_entry.get("diagnosis", "").lower()
            if age > 65 and any(term in diagnosis_lower for term in ["elderly", "older", "geriatric"]):
                score += 1.0
            elif age < 18 and any(term in diagnosis_lower for term in ["pediatric", "child"]):
                score += 1.0

        # Vital signs pattern matching
        score += self._assess_vital_signs_relevance(diagnosis_entry, vital_signs)

        return score

    def _assess_vital_signs_relevance(self, diagnosis_entry: Dict, vital_signs: Dict) -> float:
        """Assess relevance based on vital signs patterns."""
        score = 0.0
        diagnosis_text = (
            diagnosis_entry.get("diagnosis", "")
            + " "
            + diagnosis_entry.get("definition", "")
            + " "
            + " ".join(diagnosis_entry.get("defining_characteristics", []))
        ).lower()

        # Heart rate patterns
        hr = vital_signs.get("HR")
        if hr:
            if hr > 100 and any(term in diagnosis_text for term in ["tachycardia", "rapid heart", "anxiety", "pain"]):
                score += 0.5
            elif hr < 60 and any(term in diagnosis_text for term in ["bradycardia", "slow heart"]):
                score += 0.5

        # Blood pressure patterns
        bp = vital_signs.get("BP", "")
        if bp and "/" in bp:
            try:
                systolic = int(bp.split("/")[0])
                if systolic > 140 and any(term in diagnosis_text for term in ["hypertension", "elevated pressure"]):
                    score += 0.5
                elif systolic < 90 and any(term in diagnosis_text for term in ["hypotension", "low pressure"]):
                    score += 0.5
            except:
                pass

        # Respiratory rate patterns
        rr = vital_signs.get("RR")
        if rr:
            if rr > 20 and any(term in diagnosis_text for term in ["tachypnea", "respiratory", "breathing"]):
                score += 0.5
            elif rr < 12 and any(term in diagnosis_text for term in ["bradypnea", "slow breathing"]):
                score += 0.5

        # Oxygen saturation patterns
        spo2 = vital_signs.get("SpO2")
        if spo2 and spo2 < 95:
            if any(term in diagnosis_text for term in ["oxygenation", "respiratory", "airway"]):
                score += 0.5

        # Temperature patterns
        temp = vital_signs.get("Temp")
        if temp:
            if temp > 38.0 and any(term in diagnosis_text for term in ["fever", "infection", "inflammatory"]):
                score += 0.5
            elif temp < 36.0 and any(term in diagnosis_text for term in ["hypothermia", "temperature"]):
                score += 0.5

        return score

    def find_candidate_diagnoses(self, assessment_data: Dict, top_n: int = 10) -> List[Dict]:
        """Find top candidate diagnoses based on assessment data."""
        try:
            # Load lookup data
            lookup_data = self.load_lookup_data()

            # Extract keywords from assessment
            keywords = self.extract_keywords(assessment_data)
            vital_signs = assessment_data.get("vital_signs", {})
            demographics = assessment_data.get("demographics", {})

            # Calculate relevance scores
            scored_diagnoses = []
            for diagnosis_entry in lookup_data:
                score = self.calculate_relevance_score(
                    diagnosis_entry, keywords, vital_signs, demographics
                )
                if score > 0:  # Only include diagnoses with some relevance
                    scored_diagnoses.append(
                        {"diagnosis_entry": diagnosis_entry, "relevance_score": score}
                    )

            # Sort by relevance score and return top candidates
            scored_diagnoses.sort(key=lambda x: x["relevance_score"], reverse=True)
            top_candidates = scored_diagnoses[:top_n]

            logger.info(f"Found {len(top_candidates)} candidate diagnoses")
            for i, candidate in enumerate(top_candidates[:top_n]):
                logger.info(
                    f"Candidate {i+1}: {candidate['diagnosis_entry']['diagnosis']} (score: {candidate['relevance_score']:.2f})"
                )

            return [candidate["diagnosis_entry"] for candidate in top_candidates]

        except Exception as e:
            logger.error(f"Error finding candidate diagnoses: {str(e)}")
            raise


# Create singleton instance
diagnosis_matcher = DiagnosisMatcher()