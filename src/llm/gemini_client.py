import logging
import re
from typing import Type, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from src.config.config import settings

logger = logging.getLogger(__name__)

class GeminiClient:
    """
    Wrapper around the official google-genai SDK.
    Handles general chat, completions, and structured output generation.
    Supports a simulated offline mode when GEMINI_API_KEY is not configured.
    """
    def __init__(self):
        api_key = settings.GEMINI_API_KEY or None
        self.model_name = "gemini-2.5-flash"
        
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set. Running Gemini client in MOCK/FALLBACK mode.")
            self.client = None
        else:
            try:
                self.client = genai.Client(api_key=api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}. Switching to mock.")
                self.client = None

    def generate_response(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """
        Generate a text response for a given prompt and optional system instructions.
        """
        if not self.client:
            return self._mock_generate_response(prompt, system_instruction)
            
        try:
            config = None
            if system_instruction:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.1
                )
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return response.text
        except Exception as e:
            logger.warning(f"Error calling Gemini API: {e}. Falling back to mock response.")
            return self._mock_generate_response(prompt, system_instruction)

    def generate_structured_output(self, prompt: str, schema: Type[BaseModel], system_instruction: Optional[str] = None) -> BaseModel:
        """
        Generate structured outputs validated by a Pydantic model.
        """
        if not self.client:
            return self._mock_generate_structured_output(prompt, schema, system_instruction)
            
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.0,
                response_mime_type="application/json",
                response_schema=schema,
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return schema.model_validate_json(response.text)
        except Exception as e:
            logger.warning(f"Error generating structured output: {e}. Falling back to mock schema.")
            return self._mock_generate_structured_output(prompt, schema, system_instruction)

    def _mock_generate_response(self, prompt: str, system_instruction: Optional[str]) -> str:
        """
        Offline fallback response generator that parses content out of RAG contexts.
        """
        # If context is passed in the prompt, try to construct a grounded response
        if "CONTEXT:" in prompt or (system_instruction and "CONTEXT:" in system_instruction):
            # Locate context block
            context = ""
            for line in prompt.split("\n"):
                if line.startswith("Content:"):
                    context += line.replace("Content:", "").strip() + " "
                    
            if not context and system_instruction:
                context_match = re.search(r"CONTEXT:\s*(.*?)\s*(?:INSTRUCTIONS|$)", system_instruction, re.DOTALL)
                if context_match:
                    context = context_match.group(1).strip()
            
            if context:
                # Split context by sentences or newlines (list elements)
                q = prompt.lower()
                sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', context) if s.strip()]
                matches = []
                
                # Suffix-stemming: extract root 4 characters of words of length > 3
                query_roots = [w[:4] for w in re.split(r'\W+', q) if len(w) > 3]
                
                for s in sentences:
                    # check if any root word matches a word in the sentence
                    sentence_lower = s.lower()
                    if any(root in sentence_lower for root in query_roots):
                        # Clean up formatting artifact prefixes
                        cleaned = re.sub(r'^(?:-\s+|\d+\.\s+|\[\d+\]\s+Source:.*?Content:\s*)', '', s)
                        if cleaned.strip():
                            matches.append(cleaned.strip())
                            
                if matches:
                    return "Based on NorthBridge guidelines: " + " ".join(matches[:3]) + " [1]"
                    
        return "I don't have enough information to answer that confidently. Please check the query details or escalate to a supervisor if necessary."

    def _mock_generate_structured_output(self, prompt: str, schema: Type[BaseModel], system_instruction: Optional[str]) -> BaseModel:
        """
        Offline fallback structured schema generator that performs keyword-based routing.
        """
        # We only support IntentRouter schema currently in this mock
        text = prompt.lower()
        
        # Default routing params
        intent = "search_knowledge"
        customer_id = None
        subject = "Support Follow-up"
        details = prompt
        
        # Check CRM IDs
        crm_match = re.search(r'crm-\d+', text)
        if crm_match:
            customer_id = crm_match.group(0).upper()
            
        # Classify intent
        if "draft" in text or "email" in text or "reply" in text or "write" in text:
            intent = "draft_reply"
            subject = "Outbound Email Draft"
            details = f"Dear {customer_id or 'Customer'}, we have updated your claim status..."
        elif "escalate" in text or "supervisor" in text or "dispute" in text:
            intent = "escalate"
            subject = "Claim Denial Escalation"
            details = f"Request supervisor review for {customer_id or 'unidentified customer'} due to underwriting rules dispute."
        elif customer_id and ("lookup" in text or "profile" in text or "record" in text or "claims" in text or "status" in text):
            intent = "lookup_customer"
            
        # Build mock data dict matching the schema
        mock_data = {
            "intent": intent,
            "customer_id": customer_id,
            "subject": subject,
            "details": details
        }
        
        return schema.model_validate(mock_data)
