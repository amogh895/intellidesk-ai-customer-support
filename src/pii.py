import re

# PII Patterns for Redaction
EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
PHONE_PATTERN = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
CREDIT_CARD_PATTERN = re.compile(r'\b(?:\d[ -]*?){13,16}\b')
SSN_PAN_PATTERN = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b|\b\d{3}-\d{2}-\d{4}\b')

def redact_pii(text: str) -> str:
    """
    Sanitizes untrusted customer input by redacting PII patterns 
    (emails, phone numbers, credit card numbers, SSN/PAN numbers)
    before logging, database storage, or LLM context ingestion.
    """
    if not text:
        return ""
    
    redacted = text
    redacted = CREDIT_CARD_PATTERN.sub('[REDACTED_CARD_NUMBER]', redacted)
    redacted = SSN_PAN_PATTERN.sub('[REDACTED_ID_NUMBER]', redacted)
    redacted = EMAIL_PATTERN.sub('[REDACTED_EMAIL]', redacted)
    redacted = PHONE_PATTERN.sub('[REDACTED_PHONE]', redacted)
    
    return redacted
