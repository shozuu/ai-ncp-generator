import google.generativeai as genai
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini with safety settings
genai.configure(
    api_key=os.getenv("GEMINI_API_KEY"),
    client_options={"api_endpoint": "generativelanguage.googleapis.com"}
)

def main():
    try:
        # Set up the model
        generation_config = {
            "temperature": 0.7,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 2048,
        }

        # Initialize the model
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config
        )

        # Test prompt
        prompt = "Say hello and confirm you're working"
        
        logger.info("Sending test request to Gemini API...")
        response = model.generate_content(prompt)
        
        print("API key is working")
        print("Response:", response.text)
        
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}", exc_info=True)

if __name__ == "__main__":
    main()