from openai import OpenAI
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def main():
    try:
        # Test both models
        models_to_test = ["gpt-5"]
        
        for MODEL_NAME in models_to_test:
            print(f"\n=== Testing {MODEL_NAME} ===")
            
            # Test prompt
            prompt = "Hello"
            
            logger.info(f"Sending test request to {MODEL_NAME}...")
            
            try:
                if MODEL_NAME == "gpt-5":
                    response = client.chat.completions.create(
                        model=MODEL_NAME,
                        messages=[
                            {"role": "system", "content": "You are a helpful assistant specialized in nursing care plans and medical assessments."},
                            {"role": "user", "content": prompt}
                        ],
                        max_completion_tokens=1000
                    )
                else:
                    response = client.chat.completions.create(
                        model=MODEL_NAME,
                        messages=[
                            {"role": "system", "content": "You are a helpful assistant specialized in nursing care plans and medical assessments."},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=1000
                    )
                
                print(f"Model: {MODEL_NAME}")
                response_content = response.choices[0].message.content
                print(f"Response length: {len(response_content) if response_content else 'None'}")
                print(f"Response repr: {repr(response_content)}")
                print("Response:", response_content)
                
                # Check usage metadata
                if hasattr(response, 'usage'):
                    usage = response.usage
                    print(f"Token usage - Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}, Total: {usage.total_tokens}")
                
            except Exception as model_error:
                logger.error(f"Error with {MODEL_NAME}: {str(model_error)}")
                continue
        
        # Check usage metadata
        if hasattr(response, 'usage'):
            usage = response.usage
            print(f"Token usage - Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}, Total: {usage.total_tokens}")
        else:
            print("Usage metadata not available in response")
        
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}", exc_info=True)

if __name__ == "__main__":
    main()