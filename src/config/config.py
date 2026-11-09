import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    # Google Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # DB Directory
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "chroma_db")
    
    # Server Ports
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", 8000))
    FRONTEND_PORT: int = int(os.getenv("FRONTEND_PORT", 8501))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Document folder
    DATA_DIR: Path = Path("data")

    # Copilot autonomy: when True, informational draft_reply auto-sends without HITL.
    # Escalations always require human approval regardless of this flag.
    COPILOT_AUTONOMY: bool = os.getenv("COPILOT_AUTONOMY", "true").lower() in ("1", "true", "yes")

    # RBAC Thresholds
    LEVEL_1_APPROVAL_MAX_INR: float = 100000.0 # Under ₹1,00,000: Senior CSR or CSM
    DUAL_APPROVAL_THRESHOLD_INR: float = 500000.0 # Above ₹5,00,000: CSM + Dual Approver

settings = Settings()
