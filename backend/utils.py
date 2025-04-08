def format_assessment_section(data: dict) -> str:
    """Format assessment data into a string"""
    if isinstance(data, dict):
        formatted = []
        for key, value in data.items():
            if isinstance(value, list):
                formatted.extend(value)
            elif isinstance(value, dict):
                for subkey, subvalue in value.items():
                    formatted.extend(subvalue)
        return "\n".join(f"- {item}" for item in formatted)
    return ""

def parse_ai_response(response: str) -> dict:
    """Parse AI response into structured NCP format"""
    # Add parsing logic here
    # For now, return a mock structure
    sections = response.split("\n\n")
    return {
        "assessment": sections[0] if len(sections) > 0 else "",
        "diagnosis": sections[1] if len(sections) > 1 else "",
        "outcomes": sections[2] if len(sections) > 2 else "",
        "interventions": sections[3] if len(sections) > 3 else "",
        "rationale": sections[4] if len(sections) > 4 else "",
        "implementation": sections[5] if len(sections) > 5 else "",
        "evaluation": sections[6] if len(sections) > 6 else ""
    }