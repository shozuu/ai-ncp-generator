import json
import logging
from typing import Dict, List, Optional
from supabase import create_client, Client
import os
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parent
ENV_PATH = BACKEND_ROOT / '.env'
load_dotenv(dotenv_path=ENV_PATH)

class LookupService:
    def __init__(self):
        """Initialize the Supabase client for lookup operations."""
        self.supabase_url = os.getenv("SUPABASE_URL")  
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not found in environment variables")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        self._lookup_data: Optional[List[Dict]] = None
        
    def load_lookup_table(self) -> List[Dict]:
        """Load the lookup table from Supabase storage."""
        try:
            # Download the lookup table file from Supabase storage
            response = self.client.storage.from_("nnn-lookup-table").download("normalized_NNN_content.json")
            
            if not response:
                raise Exception("Failed to download lookup table from storage")
            
            # decode bytes → str → parse JSON
            lookup_data = json.loads(response.decode("utf-8"))
            
            if not isinstance(lookup_data, list):
                raise Exception("Lookup table format is invalid - expected a list")
            
            self._lookup_data = lookup_data
            logger.info(f"Successfully loaded {len(lookup_data)} entries from lookup table")
            
            return lookup_data
        except Exception as e:
            logger.error(f"Error loading lookup table: {str(e)}")
            raise Exception(f"Failed to load lookup table: {str(e)}")
    
    def get_lookup_data(self) -> List[Dict]:
        """Return cached lookup data, load if not already loaded."""
        if self._lookup_data is None:
            return self.load_lookup_table()
        return self._lookup_data


# Create a singleton instance
lookup_service = LookupService()
