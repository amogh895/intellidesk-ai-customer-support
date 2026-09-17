import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from src.models import Base

load_dotenv()

logger = logging.getLogger("intellidesk.db")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/intellidesk"
)

# Engine initialization with fallback to SQLite if PostgreSQL container is unavailable
try:
    if "postgresql" in DATABASE_URL:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 3})
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to PostgreSQL Database engine.")
    else:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as e:
    logger.warning(f"PostgreSQL connection offline ({e}). Fallback to local SQLite DB engine.")
    sqlite_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "intellidesk_real.db")
    engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all tables in database and run schema migrations if needed"""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.begin() as conn:
            if engine.name == "sqlite":
                res = conn.execute(text("PRAGMA table_info(customers)"))
                columns = [row[1] for row in res.fetchall()]
                if columns and "hashed_password" not in columns:
                    conn.execute(text("ALTER TABLE customers ADD COLUMN hashed_password VARCHAR"))
            elif engine.name == "postgresql":
                conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS hashed_password VARCHAR"))
    except Exception as err:
        logger.warning(f"Schema migration note: {err}")

def get_db():
    """Dependency session generator"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
