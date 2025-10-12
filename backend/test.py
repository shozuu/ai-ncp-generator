import google.generativeai as genai
from anthropic import Anthropic
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY"),
    client_options={"api_endpoint": "generativelanguage.googleapis.com"}
)

def test_claude_sonnet():
    """Test Claude Sonnet model"""
    try:
        # Initialize Claude client
        client = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
        
        # Try the specific model you requested first, then fallback to latest if needed
        MODEL_IDS_TO_TRY = [
            "claude-sonnet-4-5-20250929",  # Your requested model
        ]
        
        successful_model = None
        
        for MODEL_ID in MODEL_IDS_TO_TRY:
            try:
                logger.info(f"Trying Claude model: {MODEL_ID}")
                
                # Test prompt
                prompt = "Say hello and confirm you're working. Also tell me what model you are."
                
                logger.info("Sending test request to Claude API...")
                
                response = client.messages.create(
                    model=MODEL_ID,
                    max_tokens=1000,
                    temperature=0.7,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                
                print(f"✅ Claude API is working with model: {MODEL_ID}")
                print("Response:", response.content[0].text)
                print("Usage:", {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                })
                
                successful_model = MODEL_ID
                break
                
            except Exception as model_error:
                logger.warning(f"Model {MODEL_ID} failed: {str(model_error)}")
                continue
        
        if successful_model:
            return True
        else:
            logger.error("All Claude models failed to work")
            return False
        
    except Exception as e:
        logger.error(f"Claude API error: {str(e)}", exc_info=True)
        return False

def test_gemini():
    """Test Gemini model"""
    try:
        MODEL_ID = "gemini-2.5-flash"
        
        logger.info(f"Testing Gemini model: {MODEL_ID}")
        
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
        
        print("Gemini API is working")
        print("Response:", response.text)

        # Check for usage metadata in different possible locations
        if hasattr(response, 'usage_metadata'):
            print("Usage Metadata:", response.usage_metadata)
        else:
            print("Usage metadata not available in response")
            
        return True
        
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}", exc_info=True)
        return False

def main():
    """Test both Claude and Gemini models"""
    print("=" * 50)
    print("Testing AI Models")
    print("=" * 50)
    
    # Test Claude Sonnet
    print("\n🤖 Testing Claude Sonnet...")
    claude_success = test_claude_sonnet()
    
    print("\n" + "=" * 50)
    
    # Test Gemini
    print("\n🤖 Testing Gemini...")
    gemini_success = test_gemini()
    
    print("\n" + "=" * 50)
    print("SUMMARY:")
    print(f"Claude Sonnet: {'✅ Working' if claude_success else '❌ Failed'}")
    print(f"Gemini: {'✅ Working' if gemini_success else '❌ Failed'}")
    print("=" * 50)

if __name__ == "__main__":
    main()