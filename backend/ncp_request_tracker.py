import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class NCPRequestTracker:
    """
    Tracks complete NCP generation requests from start to finish.
    Stores detailed JSON data for each request instead of terminal logging.
    """
    
    def __init__(self):
        # Create requests directory
        self.requests_dir = Path(__file__).parent / 'ncp_requests'
        self.requests_dir.mkdir(exist_ok=True)
        
        # Current active request
        self.current_request = None
    
    def start_ncp_request(self, assessment_data: Dict, request_type: str = "manual") -> str:
        """
        Start tracking a new NCP generation request.
        
        Args:
            assessment_data: The original assessment data
            request_type: Type of request (manual, assisted, etc.)
        
        Returns:
            request_id: Unique identifier for this request
        """
        request_id = str(uuid.uuid4())
        
        # Create assessment summary instead of storing full data
        assessment_summary = self._create_assessment_summary(assessment_data)
        
        self.current_request = {
            "request_id": request_id,
            "request_type": request_type,
            "start_time": datetime.now(timezone.utc).isoformat(),
            "status": "in_progress",
            "assessment_summary": assessment_summary,
            "api_calls": [],
            "total_tokens": {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_billable": 0
            },
            "steps_completed": [],
            "errors": [],
            "result_summary": None,
            "end_time": None,
            "duration_seconds": None
        }
        
        logger.info(f"Started NCP request tracking: {request_id}")
        return request_id
    
    def _create_assessment_summary(self, assessment_data: Dict) -> Dict:
        """Create a summary of assessment data without storing the full content."""
        summary = {
            "type": "unknown"
        }
        
        # Check if this is manual assessment format
        if 'subjective' in assessment_data and 'objective' in assessment_data:
            summary.update({
                "type": "manual",
                "subjective_count": len(assessment_data.get('subjective', [])),
                "objective_count": len(assessment_data.get('objective', [])),
                "has_subjective": bool(assessment_data.get('subjective')),
                "has_objective": bool(assessment_data.get('objective'))
            })
        elif 'embedding_keywords' in assessment_data:
            summary.update({
                "type": "parsed_keywords",
                "has_keywords": bool(assessment_data.get('embedding_keywords')),
                "has_original_assessment": bool(assessment_data.get('original_assessment'))
            })
        else:
            # This might be structured assessment data
            summary["type"] = "structured"
            summary["fields_present"] = list(assessment_data.keys())
        
        return summary
    
    def _create_result_summary(self, final_result: Dict) -> Dict:
        """Create a summary of the final result without storing the full NCP."""
        if not final_result:
            return {"status": "no_result"}
        
        summary = {
            "has_diagnosis": "diagnosis" in final_result,
            "has_ncp": "ncp" in final_result,
            "diagnosis_name": None,
            "diagnosis_reasoning": None,  # Add reasoning field
            "ncp_sections": []
        }
        
        # Extract diagnosis name if present
        if final_result.get("diagnosis"):
            summary["diagnosis_name"] = final_result["diagnosis"]
        
        # Extract reasoning if present
        if final_result.get("reasoning"):
            summary["diagnosis_reasoning"] = final_result["reasoning"]
        
        # Extract NCP section info if present
        if final_result.get("ncp"):
            ncp = final_result["ncp"]
            if isinstance(ncp, dict):
                summary["ncp_sections"] = list(ncp.keys())
        
        return summary
    
    def track_api_call(
        self, 
        response: Any, 
        step: str, 
        operation: str,
        additional_context: Optional[Dict] = None
    ):
        """
        Track an individual API call within the current NCP request.
        
        Args:
            response: The AI model response
            step: The step in the process (parse_assessment, find_candidates, select_diagnosis, generate_ncp)
            operation: Description of the operation
            additional_context: Any additional context data
        """
        if not self.current_request:
            logger.warning("No active NCP request to track API call")
            return
        
        # Extract token usage
        usage_data = self._extract_usage_metadata(response)
        
        # Detect AI provider based on response object
        ai_provider = self._detect_ai_provider(response)
        
        api_call_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "step": step,
            "operation": operation,
            "ai_provider": ai_provider,
            "usage": usage_data,
            "context": additional_context or {},
            "success": True
        }
        
        # Update total token counts
        if usage_data:
            input_tokens = usage_data.get("input_tokens", 0)
            output_tokens = usage_data.get("output_tokens", 0)
            
            self.current_request["total_tokens"]["input_tokens"] += input_tokens
            self.current_request["total_tokens"]["output_tokens"] += output_tokens
            self.current_request["total_tokens"]["total_billable"] += (input_tokens + output_tokens)
        
        self.current_request["api_calls"].append(api_call_data)
        
        # Mark step as completed
        if step not in self.current_request["steps_completed"]:
            self.current_request["steps_completed"].append(step)
        
        logger.debug(f"Tracked API call for step: {step}")
    
    def track_error(self, step: str, error_message: str, error_details: Optional[Dict] = None):
        """Track an error that occurred during the NCP request."""
        if not self.current_request:
            logger.warning("No active NCP request to track error")
            return
        
        error_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "step": step,
            "error_message": error_message,
            "error_details": error_details or {}
        }
        
        self.current_request["errors"].append(error_data)
        logger.error(f"Tracked error in step {step}: {error_message}")
    
    def complete_ncp_request(self, final_result: Dict, status: str = "completed"):
        """
        Complete the current NCP request and save to JSON file.
        
        Args:
            final_result: The final NCP data or diagnosis result
            status: Status of completion (completed, failed, partial)
        """
        if not self.current_request:
            logger.warning("No active NCP request to complete")
            return
        
        # Finalize request data
        end_time = datetime.now(timezone.utc)
        start_time = datetime.fromisoformat(self.current_request["start_time"])
        duration = (end_time - start_time).total_seconds()
        
        # Create result summary instead of storing full result
        result_summary = self._create_result_summary(final_result)
        
        self.current_request.update({
            "status": status,
            "result_summary": result_summary,
            "end_time": end_time.isoformat(),
            "duration_seconds": round(duration, 2)
        })
        
        # Save to JSON file
        self._save_request_data()
        
        # Log summary
        self._log_request_summary()
        
        # Clear current request
        request_id = self.current_request["request_id"]
        self.current_request = None
        
        return request_id
    
    def _extract_usage_metadata(self, response: Any) -> Optional[Dict]:
        """Extract usage metadata from the response object (supports both Gemini and Claude)."""
        # Handle Claude response format
        if hasattr(response, 'usage') and hasattr(response.usage, 'input_tokens'):
            usage = response.usage
            return {
                'input_tokens': getattr(usage, 'input_tokens', 0),
                'output_tokens': getattr(usage, 'output_tokens', 0),
                'total_tokens': getattr(usage, 'input_tokens', 0) + getattr(usage, 'output_tokens', 0)
            }
        
        # Handle Gemini response format (legacy support)
        elif hasattr(response, 'usage_metadata'):
            metadata = response.usage_metadata
            return {
                'input_tokens': getattr(metadata, 'prompt_token_count', 0),
                'output_tokens': getattr(metadata, 'candidates_token_count', 0),
                'total_tokens': getattr(metadata, 'total_token_count', 0)
            }
        
        # Return empty dict if no usage data found
        return {}
    
    def _detect_ai_provider(self, response: Any) -> str:
        """Detect which AI provider was used based on response object."""
        # Claude response has 'usage' attribute with 'input_tokens' and 'output_tokens'
        if hasattr(response, 'usage') and hasattr(response.usage, 'input_tokens'):
            return "Claude"
        
        # Gemini response has 'usage_metadata' attribute
        elif hasattr(response, 'usage_metadata'):
            return "Gemini"
        
        # Check for other Claude-specific attributes
        elif hasattr(response, 'content') and hasattr(response, 'model'):
            return "Claude"
        
        # Check for Gemini-specific attributes
        elif hasattr(response, 'text') and hasattr(response, 'candidates'):
            return "Gemini"
        
        # Fallback - check object type names
        response_type = type(response).__name__
        if 'claude' in response_type.lower() or 'anthropic' in response_type.lower():
            return "Claude"
        elif 'gemini' in response_type.lower() or 'generative' in response_type.lower():
            return "Gemini"
        
        return "Unknown"
    
    def _save_request_data(self):
        """Save the current request data to a JSON file."""
        if not self.current_request:
            return
        
        # Create filename with timestamp and request ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        request_id_short = self.current_request["request_id"][:8]
        filename = f"ncp_request_{timestamp}_{request_id_short}.json"
        
        filepath = self.requests_dir / filename
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self.current_request, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved NCP request data to: {filepath}")
        except Exception as e:
            logger.error(f"Failed to save NCP request data: {e}")
    
    def _log_request_summary(self):
        """Log a simplified summary of the completed request."""
        if not self.current_request:
            return
        
        req = self.current_request
        total_calls = len(req["api_calls"])
        
        # Token info
        tokens = req["total_tokens"]
        input_tokens = tokens["input_tokens"]
        output_tokens = tokens["output_tokens"]
        total_billable = tokens["total_billable"]
        
        # AI provider breakdown
        provider_counts = {}
        for call in req["api_calls"]:
            provider = call.get("ai_provider", "Unknown")
            provider_counts[provider] = provider_counts.get(provider, 0) + 1
        
        provider_summary = ", ".join([f"{provider}: {count}" for provider, count in provider_counts.items()])
        
        summary = (
            f"NCP REQUEST COMPLETED - "
            f"ID: {req['request_id'][:8]}... | "
            f"Status: {req['status']} | "
            f"Duration: {req['duration_seconds']}s | "
            f"API Calls: {total_calls} ({provider_summary}) | "
            f"Tokens: {total_billable:,} (Input: {input_tokens:,}, Output: {output_tokens:,}) | "
            f"Steps: {', '.join(req['steps_completed'])}"
        )
        
        if req["errors"]:
            summary += f" | Errors: {len(req['errors'])}"
        
        logger.info(summary)
    
    def get_current_request_summary(self) -> Optional[Dict]:
        """Get a summary of the current active request."""
        if not self.current_request:
            return None
        
        return {
            "request_id": self.current_request["request_id"],
            "status": self.current_request["status"],
            "steps_completed": self.current_request["steps_completed"],
            "api_calls_count": len(self.current_request["api_calls"]),
            "total_tokens": self.current_request["total_tokens"],
            "errors_count": len(self.current_request["errors"])
        }

# Global tracker instance
ncp_tracker = NCPRequestTracker()

# Convenience functions
def start_ncp_request(assessment_data: Dict, request_type: str = "manual") -> str:
    """Start tracking a new NCP generation request."""
    return ncp_tracker.start_ncp_request(assessment_data, request_type)

def track_api_call(response: Any, step: str, operation: str, **context):
    """Track an API call within the current NCP request."""
    ncp_tracker.track_api_call(response, step, operation, context)

def track_error(step: str, error_message: str, **error_details):
    """Track an error during the NCP request."""
    ncp_tracker.track_error(step, error_message, error_details)

def complete_ncp_request(final_result: Dict, status: str = "completed") -> str:
    """Complete the current NCP request."""
    return ncp_tracker.complete_ncp_request(final_result, status)

def get_current_request_summary() -> Optional[Dict]:
    """Get summary of current active request."""
    return ncp_tracker.get_current_request_summary()