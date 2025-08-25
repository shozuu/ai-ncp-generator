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
    Parse the AI response into structured sections.
    Returns clean text without HTML formatting.
    """
    sections = {
        "assessment": "Not applicable",
        "diagnosis": "Not applicable", 
        "outcomes": "Not applicable",
        "interventions": "Not applicable",
        "rationale": "Not applicable",
        "implementation": "Not applicable",
        "evaluation": "Not applicable"
    }
    
    # Define regex pattern to match section headers
    section_pattern = re.compile(r'\*\*(.*?):\*\*', re.IGNORECASE)
    current_section = None

    # Iterate through each line of the text
    for line in text.splitlines():
        line = line.strip()
        match = section_pattern.match(line)
        if match:
            current_section = match.group(1).lower()
            if current_section == "diagnosis (nanda-i)":
                current_section = "diagnosis"
        elif current_section:
            if sections[current_section] == "Not applicable":
                sections[current_section] = line
            else:
                sections[current_section] += f"\n{line}"

    # Return clean text without HTML formatting
    # The frontend will handle formatting during display
    return sections