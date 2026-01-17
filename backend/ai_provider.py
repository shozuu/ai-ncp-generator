"""
Unified AI Provider Interface
Handles switching between Claude and Gemini APIs with transparent syntax conversion
Persists provider setting to database for cross-restart persistence
"""
from anthropic import Anthropic
import google.generativeai as genai
from supabase import create_client, Client
from typing import Dict, List, Optional
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / '.env')

# Settings key for database storage
SETTINGS_KEY = "ai_provider"

# ============================================================================
# AI PROVIDER CLASS (CORE AI ABSTRACTION LAYER) - START
# ============================================================================
class AIProvider:
    """
    Unified interface for AI providers (Claude and Gemini)
    
    This class provides a seamless abstraction layer over multiple AI providers,
    allowing the application to switch between Claude and Gemini without code changes.
    Provider settings persist across application restarts via database storage.
    
    Key Features:
    - Transparent API switching between Claude and Gemini
    - Database persistence for provider preference
    - Automatic fallback handling
    - Unified response format regardless of provider
    """
    
    def __init__(self):
        # Initialize Supabase for persistence
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if supabase_url and supabase_key:
            self.supabase: Client = create_client(supabase_url, supabase_key)
        else:
            self.supabase = None
            logger.warning("Supabase not configured - provider setting will not persist")
        
        # Initialize Claude
        claude_api_key = os.getenv("CLAUDE_API_KEY")
        if claude_api_key:
            self.claude_client = Anthropic(
                api_key=claude_api_key,
                timeout=300.0
            )
        else:
            self.claude_client = None
            logger.warning("Claude API key not found")
        
        # Initialize Gemini
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            genai.configure(
                api_key=gemini_api_key,
                client_options={"api_endpoint": "generativelanguage.googleapis.com"}
            )
            self.gemini_available = True
        else:
            self.gemini_available = False
            logger.warning("Gemini API key not found")
        
        # Model configurations
        self.configs = {
            "claude": {
                "model": "claude-sonnet-4-5-20250929",
                "max_tokens": 20000,
                "temperature": 0.3
            },
            "gemini": {
                "model": "gemini-2.5-pro",
                "max_tokens": 20000,
                "temperature": 0.3
            }
        }
        
        # Load provider from database or default to Claude
        self.current_provider = self._load_provider_from_db()
        logger.info(f"AI Provider initialized with: {self.current_provider}")
    
    def _load_provider_from_db(self) -> str:
        """Load the saved provider setting from database"""
        if not self.supabase:
            return "claude"
        
        try:
            response = self.supabase.table("app_settings").select("value").eq("key", SETTINGS_KEY).execute()
            
            if response.data and len(response.data) > 0:
                saved_provider = response.data[0].get("value", "claude")
                # Validate the saved provider is still available
                if saved_provider == "claude" and self.claude_client:
                    return "claude"
                elif saved_provider == "gemini" and self.gemini_available:
                    return "gemini"
                else:
                    logger.warning(f"Saved provider '{saved_provider}' not available, defaulting to claude")
                    return "claude"
            else:
                # No setting found, create default
                self._save_provider_to_db("claude")
                return "claude"
        except Exception as e:
            logger.error(f"Error loading provider from database: {str(e)}")
            return "claude"
    
    def _save_provider_to_db(self, provider: str):
        """Save the provider setting to database"""
        if not self.supabase:
            logger.warning("Cannot save provider - Supabase not configured")
            return
        
        try:
            # Upsert the setting
            self.supabase.table("app_settings").upsert({
                "key": SETTINGS_KEY,
                "value": provider,
                "updated_at": "now()"
            }, on_conflict="key").execute()
            logger.info(f"Provider setting saved to database: {provider}")
        except Exception as e:
            logger.error(f"Error saving provider to database: {str(e)}")
    
    def set_provider(self, provider: str):
        """Set the active AI provider and persist to database"""
        if provider not in ["claude", "gemini"]:
            raise ValueError(f"Invalid provider: {provider}. Must be 'claude' or 'gemini'")
        
        if provider == "claude" and not self.claude_client:
            raise ValueError("Claude API is not configured")
        
        if provider == "gemini" and not self.gemini_available:
            raise ValueError("Gemini API is not configured")
        
        old_provider = self.current_provider
        self.current_provider = provider
        
        # Persist to database
        self._save_provider_to_db(provider)
        
        logger.info(f"AI provider switched from {old_provider} to {provider}")
    
    def get_current_provider(self) -> str:
        """Get the current active provider"""
        return self.current_provider
    
    def generate_content(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate content using the current provider.
        
        This method intelligently routes requests to the active AI provider,
        handling API-specific differences transparently.
        
        Args:
            prompt: The main user prompt to send to the AI
            system_prompt: Optional system instructions (context/role definition)
        
        Returns:
            str: The generated text response from the AI
        
        Workflow:
        1. Check which provider is currently active (Claude or Gemini)
        2. Route to the appropriate provider-specific method
        3. Handle API differences (e.g., system prompt placement)
        4. Return normalized response text
        """
        if self.current_provider == "claude":
            return self._generate_with_claude(prompt, system_prompt)
        else:
            return self._generate_with_gemini(prompt, system_prompt)
    
    def _generate_with_claude(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate content using Claude API
        
        Claude uses a structured message format with separate system prompts.
        This method formats the request according to Anthropic's API specifications.
        
        Args:
            prompt: User message content
            system_prompt: Separate system instruction parameter
        
        Returns:
            str: Generated text from Claude
        
        API Structure:
        - Messages: Array of role/content pairs
        - System: Separate parameter for system instructions
        - Response: Nested in content[0].text
        """
        config = self.configs["claude"]
        
        # Format as message structure required by Claude
        messages = [{"role": "user", "content": prompt}]
        
        # Build request parameters with model configuration
        kwargs = {
            "model": config["model"],
            "max_tokens": config["max_tokens"],
            "temperature": config["temperature"],
            "messages": messages
        }
        
        # Claude accepts system prompt as a separate parameter
        if system_prompt:
            kwargs["system"] = system_prompt
        
        # Make API call to Claude
        response = self.claude_client.messages.create(**kwargs)
        
        if not response or not response.content:
            raise ValueError("Claude API returned empty response")
        
        # Extract text from nested response structure
        return response.content[0].text
    
    def _generate_with_gemini(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate content using Gemini API
        
        Gemini uses a combined prompt approach where system instructions
        are prepended to the user message rather than sent separately.
        
        Args:
            prompt: User message content
            system_prompt: System instructions to prepend
        
        Returns:
            str: Generated text from Gemini
        
        API Difference Handling:
        - Gemini doesn't have separate system parameter
        - System prompt is concatenated with user prompt
        - Model initialization includes generation config
        """
        config = self.configs["gemini"]
        
        # Combine system prompt and user prompt (Gemini requirement)
        # Unlike Claude, Gemini doesn't support separate system instructions
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        
        # Initialize model with generation parameters
        model = genai.GenerativeModel(
            model_name=config["model"],
            generation_config={
                "temperature": config["temperature"],
                "max_output_tokens": config["max_tokens"],
            }
        )
        
        # Make API call to Gemini
        response = model.generate_content(full_prompt)
        
        if not response or not response.text:
            raise ValueError("Gemini API returned empty response")
        
        # Gemini provides direct text access (simpler than Claude)
        return response.text
# ============================================================================
# AI PROVIDER CLASS (CORE AI ABSTRACTION LAYER) - END
# ============================================================================
    
    def get_config(self) -> Dict:
        """Get current provider configuration"""
        return {
            "provider": self.current_provider,
            "config": self.configs[self.current_provider],
            "available_providers": self._get_available_providers()
        }
    
    def _get_available_providers(self) -> List[str]:
        """Get list of available providers"""
        available = []
        if self.claude_client:
            available.append("claude")
        if self.gemini_available:
            available.append("gemini")
        return available

# Global AI provider instance
ai_provider = AIProvider()
