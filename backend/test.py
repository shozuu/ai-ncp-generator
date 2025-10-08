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
        MODEL_ID = "gemini-2.5-flash"
        
        # Get model information
        try:
            client = genai.GenerativeServiceClient()
            model_info = client.models.get(model=MODEL_ID)
            print("Context window:", model_info.input_token_limit, "tokens")
            print("Max output window:", model_info.output_token_limit, "tokens")
        except Exception as model_info_error:
            print(f"Could not get model info: {model_info_error}")
            # Alternative approach
            try:
                model_info = genai.get_model(f"models/{MODEL_ID}")
                print("Context window:", model_info.input_token_limit, "tokens")
                print("Max output window:", model_info.output_token_limit, "tokens")
            except Exception as alt_error:
                print(f"Alternative model info failed: {alt_error}")

        # Set up the model
        generation_config = {
            "temperature": 0.7,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 2048,
        }

        # Initialize the model
        model = genai.GenerativeModel(
            model_name=MODEL_ID,
            generation_config=generation_config
        )

        # Test prompt
        prompt = "Say hello and confirm you're working"
        
        logger.info("Sending test request to Gemini API...")
        response = model.generate_content(prompt)
        
        print("API key is working")
        print("Response:", response.text)

        # Check for usage metadata in different possible locations
        if hasattr(response, 'usage_metadata'):
            print("Usage Metadata:", response.usage_metadata)
        else:
            print("Usage metadata not available in response")
        
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}", exc_info=True)

if __name__ == "__main__":
    main()