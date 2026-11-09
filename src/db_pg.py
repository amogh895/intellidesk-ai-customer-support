import os
import socket
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from src.models import Base

load_dotenv()

logger = logging.getLogger("intellidesk.db")

sqlite_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "intellidesk_real.db")
default_db = f"sqlite:///{sqlite_path}"

DATABASE_URL = os.getenv("DATABASE_URL", default_db)

# Engine initialization
try:
    if "postgresql" in DATABASE_URL:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to PostgreSQL Database engine.")
    else:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as e:
    logger.warning(f"PostgreSQL connection offline ({e}). Fallback to local SQLite DB engine.")
    engine = create_engine(default_db, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all tables in database and run additive schema migrations if needed"""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.begin() as conn:
            if engine.name == "sqlite":
                # customers table
                res = conn.execute(text("PRAGMA table_info(customers)"))
                cols = [row[1] for row in res.fetchall()]
                if cols and "hashed_password" not in cols:
                    conn.execute(text("ALTER TABLE customers ADD COLUMN hashed_password VARCHAR"))
                
                # approval_queue table
                res_app = conn.execute(text("PRAGMA table_info(approval_queue)"))
                cols_app = [row[1] for row in res_app.fetchall()]
                for col_name, col_type in [
                    ("reason_code", "VARCHAR"),
                    ("reviewer_note", "TEXT"),
                    ("resolved_by", "VARCHAR"),
                    ("second_approver", "VARCHAR"),
                    ("requires_dual_approval", "BOOLEAN DEFAULT 0"),
                    ("dual_approved", "BOOLEAN DEFAULT 0")
                ]:
                    if cols_app and col_name not in cols_app:
                        conn.execute(text(f"ALTER TABLE approval_queue ADD COLUMN {col_name} {col_type}"))

                # claims table
                res_clm = conn.execute(text("PRAGMA table_info(claims)"))
                cols_clm = [row[1] for row in res_clm.fetchall()]
                if cols_clm and "created_at" not in cols_clm:
                    conn.execute(text("ALTER TABLE claims ADD COLUMN created_at VARCHAR"))

            elif engine.name == "postgresql":
                conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS hashed_password VARCHAR"))
                conn.execute(text("ALTER TABLE approval_queue ADD COLUMN IF NOT EXISTS reason_code VARCHAR"))
                conn.execute(text("ALTER TABLE approval_queue ADD COLUMN IF NOT EXISTS reviewer_note TEXT"))
                conn.execute(text("ALTER TABLE approval_queue ADD COLUMN IF NOT EXISTS resolved_by VARCHAR"))
                conn.execute(text("ALTER TABLE approval_queue ADD COLUMN IF NOT EXISTS second_approver VARCHAR"))
                conn.execute(text("ALTER TABLE approval_queue ADD COLUMN IF NOT EXISTS requires_dual_approval BOOLEAN DEFAULT FALSE"))
                conn.execute(text("ALTER TABLE approval_queue ADD COLUMN IF NOT EXISTS dual_approved BOOLEAN DEFAULT FALSE"))
                conn.execute(text("ALTER TABLE claims ADD COLUMN IF NOT EXISTS created_at VARCHAR"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_claims_status_created ON claims(status, created_at)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_approvals_status_ts ON approval_queue(status, timestamp)"))
    except Exception as err:
        logger.warning(f"Schema migration note: {err}")

def get_db():
    """Dependency session generator"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
