import re
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

def validate_assessment_data(data: Dict):
    """Validate the incoming assessment data (enhanced version)."""
    
    # Check if this is the legacy structured format first
    if 'demographics' in data and 'chief_complaint' in data:
        # Legacy structured format validation
        required_keys = ['demographics', 'chief_complaint', 'history', 'medical_history', 
                        'vital_signs', 'physical_exam', 'risk_factors', 'nurse_notes']
        
        if not all(key in data for key in required_keys):
            raise ValueError(f"Missing required keys in structured data. Expected: {required_keys}")
        
        # Check demographics and chief complaint
        demographics = data.get('demographics', {})
        chief_complaint = data.get('chief_complaint', '').strip()
        age = demographics.get('age')
        sex = demographics.get('sex', '').strip()
        
        # Count how many required fields are present
        required_fields_present = sum([
            bool(sex),
            bool(chief_complaint)
        ])
        
        # comprehensive check for clinical data
        def has_meaningful_value(value):
            """Check if a value is meaningful (not None, empty string, or empty array)"""
            if value is None:
                return False
            if isinstance(value, str):
                return len(value.strip()) > 0
            if isinstance(value, list):
                return len(value) > 0 and any(item.strip() if isinstance(item, str) else item for item in value)
            if isinstance(value, (int, float)):
                return True
            return bool(value)
        
        # Check each category of clinical data
        has_occupation = has_meaningful_value(demographics.get('occupation'))
        
        # Check history - any field with meaningful data
        history = data.get('history', {})
        has_history = any(has_meaningful_value(v) for v in history.values())
        
        # Check medical history
        has_med_history = (
            has_meaningful_value(data.get('medical_history')) or 
            has_meaningful_value(data.get('medical_history_other'))
        )
        
        # Check vital signs - any field with meaningful data
        vitals = data.get('vital_signs', {})
        has_vitals = any(has_meaningful_value(v) for v in vitals.values())
        
        # Check physical exam
        has_physical_exam = (
            has_meaningful_value(data.get('physical_exam')) or 
            has_meaningful_value(data.get('physical_exam_other'))
        )
        
        # Check risk factors
        has_risk_factors = (
            has_meaningful_value(data.get('risk_factors')) or 
            has_meaningful_value(data.get('risk_factors_other'))
        )
        
        # Check nurse notes
        has_nurse_notes = has_meaningful_value(data.get('nurse_notes'))
        
        # Count total clinical data categories
        clinical_data_categories = [
            has_occupation,
            has_history,
            has_med_history,
            has_vitals,
            has_physical_exam,
            has_risk_factors,
            has_nurse_notes
        ]
        
        clinical_data_count = sum(clinical_data_categories)
        has_clinical_data = clinical_data_count > 0
        
        # Determine the mode based on completeness and data richness
        if required_fields_present == 2:  
            # All required fields present - likely Assistant Mode
            mode = "assistant"
        elif required_fields_present == 0 and has_clinical_data:
            # No required fields but has clinical data - likely Pure Manual Mode
            mode = "pure_manual"
        elif required_fields_present > 0 and has_clinical_data:
            # Some required fields present - likely Partial Manual Mode
            mode = "partial_manual"
        else:
            # No required fields and no clinical data - Invalid
            mode = "invalid"
        
        # Apply validation based on detected mode
        if mode == "pure_manual":
            # For pure manual mode, require at least 2 different types of clinical data
            if clinical_data_count < 2:
                raise ValueError("Unable to extract sufficient clinical information from the provided assessment data. Please ensure your manual input includes clear details about patient symptoms, vital signs, physical findings, medical history, or other relevant clinical information.")
            
            logger.info("Pure manual mode assessment detected - proceeding with available clinical data")
            
        elif mode == "partial_manual":
            # For partial manual mode, be more lenient - require at least ONE key clinical component
            has_key_clinical_component = (
                chief_complaint or  # Has chief complaint
                has_history or  # Has history
                has_vitals or  # Has vital signs
                has_physical_exam or  # Has physical exam
                has_nurse_notes  # Has nurse notes
            )
            
            if not has_key_clinical_component:
                raise ValueError("Insufficient clinical information found. Please provide at least a chief complaint, patient history, vital signs, physical examination findings, or detailed nurse notes.")
            
            logger.info(f"Partial manual mode assessment detected ({required_fields_present}/2 required fields) - proceeding with available clinical data") 
            
        elif mode == "assistant":
            # For assistant mode, enforce required fields but age is optional
            if not sex:
                raise ValueError("Patient sex is required. Please provide the patient's sex or switch to Manual Mode if this information is not available.")
            
            if not chief_complaint:
                raise ValueError("Chief complaint is required. Please provide the main reason for the patient's visit or switch to Manual Mode for free-text input.")
            
            # For assistant mode, require at least 1 additional clinical data category
            if clinical_data_count < 1:
                raise ValueError("Please provide additional clinical information beyond the required fields. Include at least some history, vital signs, physical exam findings, or other relevant clinical data to generate a meaningful care plan.")
            
            logger.info(f"Assistant mode assessment detected - required fields present with {clinical_data_count} additional clinical data categories")
            
        else:  # mode == "invalid"
            raise ValueError("No meaningful clinical information found. Please provide patient assessment data including symptoms, vital signs, physical findings, or other relevant clinical information.")
        
        logger.info("Structured assessment data validation passed")
        return True
    
    # Default to comprehensive form validation for any non-legacy format
    logger.info("Detected comprehensive manual form format")
    
    # Check for meaningful clinical data
    def has_meaningful_value(value):
        """Check if a value is meaningful (not None, empty string, or empty array)"""
        if value is None:
            return False
        if isinstance(value, str):
            return len(value.strip()) > 0
        if isinstance(value, list):
            return len(value) > 0 and any(item.strip() if isinstance(item, str) else item for item in value)
        if isinstance(value, (int, float)):
            return True
        return bool(value)
    
    # Count clinical data categories
    clinical_data_categories = [
        has_meaningful_value(data.get('occupation')),
        has_meaningful_value(data.get('general_condition')),
        has_meaningful_value(data.get('onset_duration')),
        has_meaningful_value(data.get('severity_progression')),
        has_meaningful_value(data.get('medical_impression')),
        has_meaningful_value(data.get('associated_symptoms')),
        has_meaningful_value(data.get('other_symptoms')),
        has_meaningful_value(data.get('risk_factors')),
        has_meaningful_value(data.get('other_risk_factors')),
        has_meaningful_value(data.get('medical_history')),
        has_meaningful_value(data.get('other_medical_history')),
        has_meaningful_value(data.get('family_history')),
        has_meaningful_value(data.get('other_family_history')),
        has_meaningful_value(data.get('heart_rate_bpm')),
        has_meaningful_value(data.get('blood_pressure_mmhg')),
        has_meaningful_value(data.get('respiratory_rate_min')),
        has_meaningful_value(data.get('oxygen_saturation_percent')),
        has_meaningful_value(data.get('temperature_celsius')),
        has_meaningful_value(data.get('height')),
        has_meaningful_value(data.get('weight')),
        has_meaningful_value(data.get('cephalocaudal_assessment')),
        has_meaningful_value(data.get('laboratory_results')),
        has_meaningful_value(data.get('subjective')),
        has_meaningful_value(data.get('objective')),
    ]
    
    clinical_data_count = sum(clinical_data_categories)
    
    # Flexible validation - require at least some clinical data
    if clinical_data_count < 1:
        raise ValueError("Please provide some clinical information to generate a meaningful nursing care plan.")
    
    logger.info(f"Comprehensive form validation passed with {clinical_data_count} clinical data categories")
    return True

def parse_ncp_response(text: str) -> Dict:
    """
    Parse the AI response into structured sections with better formatting.
    Returns clean text with preserved structure for frontend formatting.
    """
    sections = {
        "assessment": "",
        "diagnosis": "", 
        "outcomes": "",
        "interventions": "",
        "rationale": "",
        "implementation": "",
        "evaluation": ""
    }
    
    # Define regex pattern to match section headers
    section_pattern = re.compile(r'\*\*(.*?):\*\*', re.IGNORECASE)
    current_section = None
    section_content = []

    # Iterate through each line of the text
    for line in text.splitlines():
        line = line.strip()
        
        # Check if this is a section header
        match = section_pattern.match(line)
        if match:
            # Save previous section content if exists
            if current_section and section_content:
                # Join content and clean it up
                content = '\n'.join(section_content).strip()
                sections[current_section] = content
            
            # Start new section
            section_name = match.group(1).lower()
            if "diagnosis" in section_name:
                current_section = "diagnosis"
            elif "assessment" in section_name:
                current_section = "assessment"
            elif "outcome" in section_name or "goal" in section_name:
                current_section = "outcomes"
            elif "intervention" in section_name:
                current_section = "interventions"
            elif "rationale" in section_name:
                current_section = "rationale"
            elif "implementation" in section_name:
                current_section = "implementation"
            elif "evaluation" in section_name:
                current_section = "evaluation"
            else:
                current_section = None
            
            section_content = []
            
        elif current_section and line:
            section_content.append(line)
    
    # Don't forget the last section
    if current_section and section_content:
        content = '\n'.join(section_content).strip()
        sections[current_section] = content
    
    # Ensure all sections have content (use fallback if empty)
    for section, content in sections.items():
        if not content or content.lower() in ['not applicable', 'n/a', '']:
            sections[section] = "Not provided"
    
    return sections

def parse_explanation_text(text: str, available_sections: list) -> Dict:
    """
    Parse plain text AI response into structured explanation format.
    """
    explanations = {}
    
    # Split text into sections
    lines = text.split('\n')
    current_section = None
    current_content = {}
    current_type = None
    current_text = []
    
    for line in lines:
        line = line.strip()
        
        # Check if this is a section header
        if line.startswith('**') and line.endswith(':**'):
            # Save previous section if exists
            if current_section and current_content:
                explanations[current_section] = current_content
            
            # Start new section
            section_name = line.replace('**', '').replace(':', '').strip().lower()
            # Map section names back to our format
            for available_section in available_sections:
                if available_section.replace('_', ' ').lower() in section_name:
                    current_section = available_section
                    break
            
            current_content = {
                'clinical_reasoning': {'summary': '', 'detailed': ''},
                'evidence_based_support': {'summary': '', 'detailed': ''},
                'student_guidance': {'summary': '', 'detailed': ''}
            }
            current_type = None
            current_text = []
            
        # Check if this is an explanation type header
        elif line.endswith(':') and any(key_phrase in line.lower() for key_phrase in [
            'clinical reasoning summary',
            'clinical reasoning detailed', 
            'evidence-based support summary',
            'evidence-based support detailed',
            'student guidance summary',
            'student guidance detailed'
        ]):
            # Save previous type content
            if current_type and current_text and current_section:
                content = ' '.join(current_text).strip()
                if content:
                    if 'clinical reasoning summary' in current_type:
                        current_content['clinical_reasoning']['summary'] = content
                    elif 'clinical reasoning detailed' in current_type:
                        current_content['clinical_reasoning']['detailed'] = content
                    elif 'evidence-based support summary' in current_type:
                        current_content['evidence_based_support']['summary'] = content
                    elif 'evidence-based support detailed' in current_type:
                        current_content['evidence_based_support']['detailed'] = content
                    elif 'student guidance summary' in current_type:
                        current_content['student_guidance']['summary'] = content
                    elif 'student guidance detailed' in current_type:
                        current_content['student_guidance']['detailed'] = content
            
            # Start new type
            current_type = line.lower()
            current_text = []
            
        # Regular content line
        elif line and current_section and current_type:
            current_text.append(line)
    
    # Don't forget the last section
    if current_section and current_content:
        # Save the last type content
        if current_type and current_text:
            content = ' '.join(current_text).strip()
            if content:
                if 'clinical reasoning summary' in current_type:
                    current_content['clinical_reasoning']['summary'] = content
                elif 'clinical reasoning detailed' in current_type:
                    current_content['clinical_reasoning']['detailed'] = content
                elif 'evidence-based support summary' in current_type:
                    current_content['evidence_based_support']['summary'] = content
                elif 'evidence-based support detailed' in current_type:
                    current_content['evidence_based_support']['detailed'] = content
                elif 'student guidance summary' in current_type:
                    current_content['student_guidance']['summary'] = content
                elif 'student guidance detailed' in current_type:
                    current_content['student_guidance']['detailed'] = content
        
        explanations[current_section] = current_content
    
    # Ensure all available sections have explanations (with fallbacks if needed)
    for section in available_sections:
        if section not in explanations:
            explanations[section] = {
                'clinical_reasoning': {
                    'summary': f'Clinical reasoning for this {section.replace("_", " ")} component involves systematic analysis of patient data and evidence-based decision making.',
                    'detailed': f'The {section.replace("_", " ")} component requires comprehensive clinical thinking, incorporating patient assessment data, nursing knowledge, and evidence-based guidelines to ensure safe and effective care delivery.'
                },
                'evidence_based_support': {
                    'summary': f'Evidence-based nursing practice supports comprehensive {section.replace("_", " ")} documentation according to current standards.',
                    'detailed': f'Current nursing literature and professional guidelines emphasize the importance of thorough {section.replace("_", " ")} documentation for quality patient outcomes and professional accountability.'
                },
                'student_guidance': {
                    'summary': f'Students should understand the purpose and components of effective {section.replace("_", " ")}.',
                    'detailed': f'Learning objectives include theoretical foundation, practical application, and competency demonstration in {section.replace("_", " ")}. Students should engage in guided practice and reflective learning.'
                }
            }
    
    return explanations

def format_structured_data(structured_data) -> str:
    """Format structured assessment data into a string for AI processing."""
    formatted_sections = []
    
    # Check if this is the new comprehensive manual form format (flat structure)
    if any(key in structured_data for key in ['age', 'sex', 'general_condition', 'onset_duration', 'heart_rate_bpm']):
        # Format comprehensive manual form data
        
        # Demographics
        demo_info = []
        if structured_data.get('age'): demo_info.append(f"Age: {structured_data['age']}")
        if structured_data.get('sex'): demo_info.append(f"Sex: {structured_data['sex']}")
        if structured_data.get('occupation'): demo_info.append(f"Occupation: {structured_data['occupation']}")
        if structured_data.get('religion'): demo_info.append(f"Religion: {structured_data['religion']}")
        if structured_data.get('cultural_background'): demo_info.append(f"Cultural Background: {structured_data['cultural_background']}")
        if structured_data.get('language') and structured_data['language'].lower() != 'english': 
            demo_info.append(f"Language: {structured_data['language']}")
        if demo_info:
            formatted_sections.append(f"Patient Demographics:\n- {'; '.join(demo_info)}")
        
        # Chief Complaint
        if structured_data.get('general_condition'):
            formatted_sections.append(f"Chief Complaint:\n- {structured_data['general_condition']}")
        
        # History of Present Illness
        history_info = []
        if structured_data.get('onset_duration'): history_info.append(f"Onset/Duration: {structured_data['onset_duration']}")
        if structured_data.get('severity_progression'): history_info.append(f"Severity/Progression: {structured_data['severity_progression']}")
        if structured_data.get('medical_impression'): history_info.append(f"Medical Impression: {structured_data['medical_impression']}")
        if structured_data.get('associated_symptoms'): 
            history_info.append(f"Associated symptoms: {', '.join(structured_data['associated_symptoms'])}")
        if structured_data.get('other_symptoms'): history_info.append(f"Other symptoms: {structured_data['other_symptoms']}")
        if history_info:
            formatted_sections.append(f"History of Present Illness:\n- {'; '.join(history_info)}")
        
        # Risk Factors
        risk_factors = []
        if structured_data.get('risk_factors'): risk_factors.extend(structured_data['risk_factors'])
        if structured_data.get('other_risk_factors'): risk_factors.append(structured_data['other_risk_factors'])
        if risk_factors:
            formatted_sections.append(f"Risk Factors:\n- {', '.join(risk_factors)}")
        
        # Past Medical History
        med_history = []
        if structured_data.get('medical_history'): med_history.extend(structured_data['medical_history'])
        if structured_data.get('other_medical_history'): med_history.append(structured_data['other_medical_history'])
        if med_history:
            formatted_sections.append(f"Past Medical History:\n- {', '.join(med_history)}")
        
        # Family History
        family_history = []
        if structured_data.get('family_history'): family_history.extend(structured_data['family_history'])
        if structured_data.get('other_family_history'): family_history.append(structured_data['other_family_history'])
        if family_history:
            formatted_sections.append(f"Family History:\n- {', '.join(family_history)}")
        
        # Vital Signs
        vital_info = []
        if structured_data.get('heart_rate_bpm'): vital_info.append(f"Heart Rate: {structured_data['heart_rate_bpm']} bpm")
        if structured_data.get('blood_pressure_mmhg'): vital_info.append(f"Blood Pressure: {structured_data['blood_pressure_mmhg']} mmHg")
        if structured_data.get('respiratory_rate_min'): vital_info.append(f"Respiratory Rate: {structured_data['respiratory_rate_min']}/min")
        if structured_data.get('oxygen_saturation_percent'): vital_info.append(f"SpO2: {structured_data['oxygen_saturation_percent']}%")
        if structured_data.get('temperature_celsius'): vital_info.append(f"Temperature: {structured_data['temperature_celsius']}°C")
        if vital_info:
            formatted_sections.append(f"Vital Signs:\n- {'; '.join(vital_info)}")
        
        # Physical Examination
        physical_exam = []
        if structured_data.get('height'): physical_exam.append(f"Height: {structured_data['height']}")
        if structured_data.get('weight'): physical_exam.append(f"Weight: {structured_data['weight']}")
        
        # Cephalocaudal Assessment
        cephalocaudal = structured_data.get('cephalocaudal_assessment', {})
        if isinstance(cephalocaudal, dict) and any(cephalocaudal.values()):
            cc_findings = []
            for system, findings in cephalocaudal.items():
                if findings and isinstance(findings, str) and findings.strip():
                    cc_findings.append(f"{system.replace('_', ' ').title()}: {findings}")
            if cc_findings:
                physical_exam.extend(cc_findings)
        
        if physical_exam:
            formatted_sections.append(f"Physical Examination:\n- {'; '.join(physical_exam)}")
        
        # Laboratory Findings
        if structured_data.get('laboratory_results'):
            formatted_sections.append(f"Laboratory Results:\n- {structured_data['laboratory_results']}")
        
        # Subjective and Objective Data (if present)
        subjective_data = structured_data.get('subjective', [])
        if subjective_data and isinstance(subjective_data, list) and subjective_data:
            formatted_sections.append(f"Subjective Data:\n- {chr(10).join([f'• {item}' for item in subjective_data if item.strip()])}")
        
        objective_data = structured_data.get('objective', [])
        if objective_data and isinstance(objective_data, list) and objective_data:
            formatted_sections.append(f"Objective Data:\n- {chr(10).join([f'• {item}' for item in objective_data if item.strip()])}")
        
        return '\n\n'.join(formatted_sections)
    
    # Legacy structured format handling
    else:
        # Demographics
        demographics = structured_data.get('demographics', {})
        if any(demographics.values()):
            demo_info = []
            if demographics.get('age'): demo_info.append(f"Age: {demographics['age']}")
            if demographics.get('sex'): demo_info.append(f"Sex: {demographics['sex']}")
            if demographics.get('occupation'): demo_info.append(f"Occupation: {demographics['occupation']}")
            if demographics.get('religion'): demo_info.append(f"Religion: {demographics['religion']}")
            if demographics.get('cultural_background'): demo_info.append(f"Cultural Background: {demographics['cultural_background']}")
            if demographics.get('language') and demographics['language'].lower() != 'english': 
                demo_info.append(f"Language: {demographics['language']}")
            if demo_info:
                formatted_sections.append(f"Demographics:\n- {'; '.join(demo_info)}")
        
        # Chief Complaint
        if structured_data.get('chief_complaint'):
            formatted_sections.append(f"Chief Complaint:\n- {structured_data['chief_complaint']}")
        
        # History
        history = structured_data.get('history', {})
        if any(history.values()):
            history_info = []
            if history.get('onset_duration'): history_info.append(f"Onset/Duration: {history['onset_duration']}")
            if history.get('severity'): history_info.append(f"Severity: {history['severity']}")
            if history.get('associated_symptoms'): 
                history_info.append(f"Associated symptoms: {', '.join(history['associated_symptoms'])}")
            if history.get('other_symptoms'): history_info.append(f"Other symptoms: {history['other_symptoms']}")
            if history_info:
                formatted_sections.append(f"History of Present Illness:\n- {'; '.join(history_info)}")
        
        # Medical History
        med_history = structured_data.get('medical_history', [])
        med_history_other = structured_data.get('medical_history_other', '')
        if med_history or med_history_other:
            history_items = med_history.copy()
            if med_history_other: history_items.append(med_history_other)
            formatted_sections.append(f"Past Medical History:\n- {', '.join(history_items)}")
        
        # Vital Signs
        vitals = structured_data.get('vital_signs', {})
        if any(v for v in vitals.values() if v is not None and v != ''):
            vital_info = []
            if vitals.get('HR'): vital_info.append(f"HR: {vitals['HR']} bpm")
            if vitals.get('BP'): vital_info.append(f"BP: {vitals['BP']} mmHg")
            if vitals.get('RR'): vital_info.append(f"RR: {vitals['RR']}/min")
            if vitals.get('SpO2'): vital_info.append(f"SpO2: {vitals['SpO2']}%")
            if vitals.get('Temp'): vital_info.append(f"Temp: {vitals['Temp']}°C")
        
        # Add additional vitals
        additional_vitals = vitals.get('additional_vitals', {})
        for vital_name, vital_value in additional_vitals.items():
            if vital_value:
                vital_info.append(f"{vital_name}: {vital_value}")
        
        if vital_info:
            formatted_sections.append(f"Vital Signs:\n- {'; '.join(vital_info)}")
    
    # Physical Exam
    phys_exam = structured_data.get('physical_exam', [])
    phys_exam_other = structured_data.get('physical_exam_other', '')
    if phys_exam or phys_exam_other:
        exam_items = phys_exam.copy()
        if phys_exam_other: exam_items.append(phys_exam_other)
        formatted_sections.append(f"Physical Examination:\n- {'; '.join(str(item) for item in exam_items)}")
    
    # Risk Factors
    risk_factors = structured_data.get('risk_factors', [])
    risk_factors_other = structured_data.get('risk_factors_other', '')
    if risk_factors or risk_factors_other:
        risk_items = risk_factors.copy()
        if risk_factors_other: risk_items.append(risk_factors_other)
        formatted_sections.append(f"Risk Factors:\n- {', '.join(risk_items)}")
    
    # Cultural Considerations
    cultural = structured_data.get('cultural_considerations', {})
    if any(cultural.values()):
        cultural_info = []
        if cultural.get('dietary_restrictions'): 
            cultural_info.append(f"Dietary restrictions: {cultural['dietary_restrictions']}")
        if cultural.get('religious_practices'): 
            cultural_info.append(f"Religious practices: {cultural['religious_practices']}")
        if cultural.get('communication_preferences'): 
            cultural_info.append(f"Communication preferences: {cultural['communication_preferences']}")
        if cultural.get('family_involvement'): 
            cultural_info.append(f"Family involvement: {cultural['family_involvement']}")
        if cultural.get('health_beliefs'): 
            cultural_info.append(f"Health beliefs: {cultural['health_beliefs']}")
        if cultural.get('other_considerations'): 
            cultural_info.append(cultural['other_considerations'])
        if cultural_info:
            formatted_sections.append(f"Cultural Considerations:\n- {'; '.join(cultural_info)}")
    
    # Nurse Notes
    if structured_data.get('nurse_notes'):
        formatted_sections.append(f"Nurse Notes:\n- {structured_data['nurse_notes']}")
    
    return '\n\n'.join(formatted_sections)

def format_assessment_for_selection(assessment_data: Dict) -> str:
    """Format assessment data specifically for diagnosis selection."""
    # Check if this is the new comprehensive manual form format
    if any(key in assessment_data for key in ['age', 'sex', 'general_condition', 'onset_duration', 'heart_rate_bpm']):
        # Use the comprehensive formatter with selection header
        formatted_data = format_structured_data(assessment_data)
        return f"**PATIENT ASSESSMENT DATA:**\n\n{formatted_data}"
    
    # Check if this is legacy manual mode format (subjective/objective lists only)
    elif 'subjective' in assessment_data and 'objective' in assessment_data and len(assessment_data) <= 3:
        subjective_items = assessment_data.get('subjective', [])
        objective_items = assessment_data.get('objective', [])
        
        formatted = "**PATIENT ASSESSMENT DATA:**\n\n"
        
        if subjective_items:
            formatted += "**Subjective Data:**\n"
            for item in subjective_items:
                formatted += f"- {item}\n"
            formatted += "\n"
        
        if objective_items:
            formatted += "**Objective Data:**\n"
            for item in objective_items:
                formatted += f"- {item}\n"
            formatted += "\n"
        
        return formatted
    else:
        # This is assistant mode format - use the existing formatter
        return format_structured_data(assessment_data)

def format_assessment_for_ncp(assessment_data: Dict) -> str:
    """Format assessment data specifically for NCP generation."""
    # Check if this is the new comprehensive manual form format
    if any(key in assessment_data for key in ['age', 'sex', 'general_condition', 'onset_duration', 'heart_rate_bpm']):
        # Use the comprehensive formatter with NCP header
        formatted_data = format_structured_data(assessment_data)
        return f"**PATIENT ASSESSMENT DATA:**\n\n{formatted_data}"
    
    # Check if this is legacy manual mode format (subjective/objective lists only)
    elif 'subjective' in assessment_data and 'objective' in assessment_data and len(assessment_data) <= 3:
        subjective_items = assessment_data.get('subjective', [])
        objective_items = assessment_data.get('objective', [])
        
        formatted = "**PATIENT ASSESSMENT DATA:**\n\n"
        
        if subjective_items:
            formatted += "**Subjective Data:**\n"
            for item in subjective_items:
                formatted += f"- {item}\n"
            formatted += "\n"
        
        if objective_items:
            formatted += "**Objective Data:**\n"
            for item in objective_items:
                formatted += f"- {item}\n"
            formatted += "\n"
        
        return formatted
    else:
        # This is assistant mode format - use the existing formatter
        return format_structured_data(assessment_data)

def safe_format_list(items, fallback="Not specified in database"):
    """Helper function to safely join arrays or provide fallback."""
    if not items or (isinstance(items, list) and len(items) == 0):
        return fallback
    if isinstance(items, list):
        return ', '.join(str(item) for item in items if item)
    return str(items) if items else fallback

def validate_ncp_structure(ncp_data: Dict) -> bool:
    """Validate that the NCP has the required structure and content."""
    required_sections = ["assessment", "diagnosis", "outcomes", "interventions", "rationale", "implementation", "evaluation"]
    
    # Check all sections exist
    if not all(section in ncp_data for section in required_sections):
        return False
    
    # Check each section has meaningful content
    for section, content in ncp_data.items():
        if section in required_sections:
            if not content or (isinstance(content, str) and len(content.strip()) < 10):
                return False
            if isinstance(content, dict) and not any(v for v in content.values() if v):
                return False
    
    # Validate outcomes structure (allow flexibility for short_term or long_term only)
    outcomes = ncp_data.get("outcomes", {})
    if not isinstance(outcomes, dict):
        return False
    
    # At least one type of outcome should exist
    has_short_term = outcomes.get("short_term") and len(outcomes["short_term"]) > 0
    has_long_term = outcomes.get("long_term") and len(outcomes["long_term"]) > 0
    
    if not (has_short_term or has_long_term):
        return False
    
    # Validate interventions structure
    interventions = ncp_data.get("interventions", {})
    if not isinstance(interventions, dict):
        return False
    
    # At least one intervention category should have content
    has_independent = interventions.get("independent") and len(interventions["independent"]) > 0
    has_dependent = interventions.get("dependent") and len(interventions["dependent"]) > 0
    has_collaborative = interventions.get("collaborative") and len(interventions["collaborative"]) > 0
    
    if not (has_independent or has_dependent or has_collaborative):
        return False
    
    # Validate rationale structure (should have intervention-specific rationales)
    rationale = ncp_data.get("rationale", {})
    if not isinstance(rationale, dict) or not rationale.get("interventions"):
        return False
    
    return True

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