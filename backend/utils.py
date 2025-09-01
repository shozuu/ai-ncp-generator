import re
from typing import Dict
import logging

logger = logging.getLogger(__name__)

def validate_assessment_data(data: Dict):
    # Validate the incoming assessment data.

    # Check if 'subjective' and 'objective' keys exist
    if not all(key in data for key in ['subjective', 'objective']):
        raise ValueError("Missing required 'subjective' or 'objective' data")

    # Validate 'subjective' field
    if not isinstance(data['subjective'], (list, dict)):
        raise ValueError("'subjective' must be a list (manual mode) or a dictionary (assistant mode)")

    # Validate 'objective' field
    if not isinstance(data['objective'], (list, dict)):
        raise ValueError("'objective' must be a list (manual mode) or a dictionary (assistant mode)")

    # Additional validation for manual mode (list)
    if isinstance(data['subjective'], list) and not all(isinstance(item, str) for item in data['subjective']):
        raise ValueError("All items in 'subjective' (manual mode) must be strings")
    if isinstance(data['objective'], list) and not all(isinstance(item, str) for item in data['objective']):
        raise ValueError("All items in 'objective' (manual mode) must be strings")

    # Additional validation for assistant mode (dict)
    if isinstance(data['subjective'], dict):
        for key, value in data['subjective'].items():
            if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
                raise ValueError(f"All items in 'subjective.{key}' (assistant mode) must be strings")
    if isinstance(data['objective'], dict):
        for key, value in data['objective'].items():
            if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
                raise ValueError(f"All items in 'objective.{key}' (assistant mode) must be strings")

def format_data(data) -> str:
    # Format assessment data into a string.
    # Handles both manual and assistant modes.
    
    if isinstance(data, list):  # Manual mode (list/array)
        # Join each item in the array as a bullet point
        return '\n'.join(f"- {item}" for item in data)
    elif isinstance(data, dict):  # Assistant mode (dict/object)
        # Iterate through each key and its values in the object
        formatted = []
        for key, values in data.items():
            if isinstance(values, list):  # Ensure the value is a list
                formatted.append(f"{key.capitalize()}:")
                formatted.extend(f"- {item}" for item in values)
        return '\n'.join(formatted)
    else:
        raise ValueError("Invalid data format for assessment data")

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