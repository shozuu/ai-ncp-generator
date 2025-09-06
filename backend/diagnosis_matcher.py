import logging
from typing import Dict, List, Tuple
from lookup_service import lookup_service
import re

logger = logging.getLogger(__name__)

class DiagnosisMatcher:
    def __init__(self):
        self.lookup_data = None
    
    def load_lookup_data(self):
        """Load lookup data if not already loaded."""
        if self.lookup_data is None:
            self.lookup_data = lookup_service.get_lookup_data()
        return self.lookup_data
    
    def extract_keywords(self, assessment_data: Dict) -> List[str]:
        """Extract relevant keywords from assessment data."""
        keywords = []
        
        # Extract from chief complaint
        chief_complaint = assessment_data.get('chief_complaint', '').lower()
        if chief_complaint:
            keywords.extend(self._extract_clinical_terms(chief_complaint))
        
        # Extract from history
        history = assessment_data.get('history', {})
        for key, value in history.items():
            if isinstance(value, str) and value:
                keywords.extend(self._extract_clinical_terms(value.lower()))
            elif isinstance(value, list):
                keywords.extend([item.lower() for item in value if item])
        
        # Extract from physical exam
        physical_exam = assessment_data.get('physical_exam', [])
        physical_exam_other = assessment_data.get('physical_exam_other', '')
        keywords.extend([item.lower() for item in physical_exam if item])
        if physical_exam_other:
            keywords.extend(self._extract_clinical_terms(physical_exam_other.lower()))
        
        # Extract from medical history
        med_history = assessment_data.get('medical_history', [])
        med_history_other = assessment_data.get('medical_history_other', '')
        keywords.extend([item.lower() for item in med_history if item])
        if med_history_other:
            keywords.extend(self._extract_clinical_terms(med_history_other.lower()))
        
        # Extract from risk factors
        risk_factors = assessment_data.get('risk_factors', [])
        risk_factors_other = assessment_data.get('risk_factors_other', '')
        keywords.extend([item.lower() for item in risk_factors if item])
        if risk_factors_other:
            keywords.extend(self._extract_clinical_terms(risk_factors_other.lower()))
        
        # Extract from nurse notes
        nurse_notes = assessment_data.get('nurse_notes', '')
        if nurse_notes:
            keywords.extend(self._extract_clinical_terms(nurse_notes.lower()))
        
        return list(set(keywords))  # Remove duplicates
    
    def _extract_clinical_terms(self, text: str) -> List[str]:
        """Extract clinical terms from text."""
        # Split by common separators and clean
        terms = re.split(r'[,;.\n\r]+', text)
        cleaned_terms = []
        
        for term in terms:
            term = term.strip()
            if len(term) > 2:  # Ignore very short terms
                cleaned_terms.append(term)
        
        return cleaned_terms
    
    def calculate_relevance_score(self, diagnosis_entry: Dict, keywords: List[str], 
                                vital_signs: Dict, demographics: Dict) -> float:
        """Calculate relevance score for a diagnosis entry."""
        score = 0.0
        
        # Check defining characteristics (high weight)
        defining_chars = [char.lower() for char in diagnosis_entry.get('defining_characteristics', [])]
        for keyword in keywords:
            for char in defining_chars:
                if keyword in char or char in keyword:
                    score += 3.0
        
        # Check related factors (medium weight)
        related_factors = [factor.lower() for factor in diagnosis_entry.get('related_factors', [])]
        for keyword in keywords:
            for factor in related_factors:
                if keyword in factor or factor in keyword:
                    score += 2.0
        
        # Check risk factors (medium weight)
        risk_factors = [factor.lower() for factor in diagnosis_entry.get('risk_factors', [])]
        for keyword in keywords:
            for factor in risk_factors:
                if keyword in factor or factor in keyword:
                    score += 2.0
        
        # Check diagnosis name and definition (lower weight)
        diagnosis_text = (diagnosis_entry.get('diagnosis', '') + ' ' + 
                         diagnosis_entry.get('definition', '')).lower()
        for keyword in keywords:
            if keyword in diagnosis_text:
                score += 1.0
        
        # Age-specific adjustments
        age = demographics.get('age')
        if age:
            diagnosis_lower = diagnosis_entry.get('diagnosis', '').lower()
            if age > 65 and any(term in diagnosis_lower for term in ['elderly', 'older', 'geriatric']):
                score += 1.0
            elif age < 18 and any(term in diagnosis_lower for term in ['pediatric', 'child']):
                score += 1.0
        
        # Vital signs pattern matching
        score += self._assess_vital_signs_relevance(diagnosis_entry, vital_signs)
        
        return score
    
    def _assess_vital_signs_relevance(self, diagnosis_entry: Dict, vital_signs: Dict) -> float:
        """Assess relevance based on vital signs patterns."""
        score = 0.0
        diagnosis_text = (diagnosis_entry.get('diagnosis', '') + ' ' + 
                         diagnosis_entry.get('definition', '') + ' ' +
                         ' '.join(diagnosis_entry.get('defining_characteristics', []))).lower()
        
        # Heart rate patterns
        hr = vital_signs.get('HR')
        if hr:
            if hr > 100 and any(term in diagnosis_text for term in ['tachycardia', 'rapid heart', 'anxiety', 'pain']):
                score += 0.5
            elif hr < 60 and any(term in diagnosis_text for term in ['bradycardia', 'slow heart']):
                score += 0.5
        
        # Blood pressure patterns
        bp = vital_signs.get('BP', '')
        if bp and '/' in bp:
            try:
                systolic = int(bp.split('/')[0])
                if systolic > 140 and any(term in diagnosis_text for term in ['hypertension', 'elevated pressure']):
                    score += 0.5
                elif systolic < 90 and any(term in diagnosis_text for term in ['hypotension', 'low pressure']):
                    score += 0.5
            except:
                pass
        
        # Respiratory rate patterns
        rr = vital_signs.get('RR')
        if rr:
            if rr > 20 and any(term in diagnosis_text for term in ['tachypnea', 'respiratory', 'breathing']):
                score += 0.5
            elif rr < 12 and any(term in diagnosis_text for term in ['bradypnea', 'slow breathing']):
                score += 0.5
        
        # Oxygen saturation patterns
        spo2 = vital_signs.get('SpO2')
        if spo2 and spo2 < 95:
            if any(term in diagnosis_text for term in ['oxygenation', 'respiratory', 'airway']):
                score += 0.5
        
        # Temperature patterns
        temp = vital_signs.get('Temp')
        if temp:
            if temp > 38.0 and any(term in diagnosis_text for term in ['fever', 'infection', 'inflammatory']):
                score += 0.5
            elif temp < 36.0 and any(term in diagnosis_text for term in ['hypothermia', 'temperature']):
                score += 0.5
        
        return score
    
    def find_candidate_diagnoses(self, assessment_data: Dict, top_n: int = 10) -> List[Dict]:
        """Find top candidate diagnoses based on assessment data."""
        try:
            # Load lookup data
            lookup_data = self.load_lookup_data()
            
            # Extract keywords from assessment
            keywords = self.extract_keywords(assessment_data)
            vital_signs = assessment_data.get('vital_signs', {})
            demographics = assessment_data.get('demographics', {})
            
            logger.info(f"Extracted keywords: {keywords}")
            
            # Calculate relevance scores
            scored_diagnoses = []
            for diagnosis_entry in lookup_data:
                score = self.calculate_relevance_score(
                    diagnosis_entry, keywords, vital_signs, demographics
                )
                if score > 0:  # Only include diagnoses with some relevance
                    scored_diagnoses.append({
                        'diagnosis_entry': diagnosis_entry,
                        'relevance_score': score
                    })
            
            # Sort by relevance score and return top candidates
            scored_diagnoses.sort(key=lambda x: x['relevance_score'], reverse=True)
            top_candidates = scored_diagnoses[:top_n]
            
            logger.info(f"Found {len(top_candidates)} candidate diagnoses")
            for i, candidate in enumerate(top_candidates[:5]):
                logger.info(f"Candidate {i+1}: {candidate['diagnosis_entry']['diagnosis']} (score: {candidate['relevance_score']:.2f})")
            
            return [candidate['diagnosis_entry'] for candidate in top_candidates]
            
        except Exception as e:
            logger.error(f"Error finding candidate diagnoses: {str(e)}")
            raise

# Create singleton instance
diagnosis_matcher = DiagnosisMatcher()