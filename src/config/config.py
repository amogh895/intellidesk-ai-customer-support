import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Force Hugging Face to operate in offline mode now that weights are cached
os.environ["HF_HUB_OFFLINE"] = "1"

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

settings = Settings()
