import os
import sqlite3
import json
from typing import Dict, Any, List, Optional

# Database Storage Directory
DB_DIR = os.path.dirname(os.path.abspath(__file__))
SQL_DB_PATH = os.path.join(DB_DIR, "intellidesk_relational.db")
MONGO_JSON_DIR = os.path.join(DB_DIR, "mongodb_collections")

os.makedirs(MONGO_JSON_DIR, exist_ok=True)

class SQLDatabaseManager:
    """
    Relational SQL Database Engine (SQLite / SQLAlchemy Compatible)
    Enforces ACID transactional integrity for structured financial & governance records:
    - claim_decisions
    - employees
    - financial_reserves
    """
    def __init__(self, db_path=SQL_DB_PATH):
        self.db_path = db_path
        self._init_tables()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Centralized Claim Decisions Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS claim_decisions (
                id TEXT PRIMARY KEY,
                request_id TEXT,
                customer TEXT,
                customer_id TEXT,
                policy_num TEXT,
                policy_type TEXT,
                gross_amount REAL,
                deductible REAL,
                net_payout REAL,
                requested_by TEXT,
                decided_by TEXT,
                decided_by_role TEXT,
                decision TEXT,
                timestamp TEXT,
                notes TEXT,
                fraud_prob INTEGER
            );
            """)

            # Enterprise Employee Directory Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                role TEXT,
                status TEXT,
                csat REAL,
                compliance REAL,
                open_cases INTEGER,
                escalations INTEGER,
                date_added TEXT
            );
            """)

            # Executive Financial Reserves Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS financial_reserves (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                ytd_loss REAL,
                budget REAL,
                fraud_savings REAL,
                auto_reserves REAL,
                home_reserves REAL
            );
            """)
            
            # Seed initial reserve baseline if empty
            cursor.execute("SELECT COUNT(*) FROM financial_reserves")
            if cursor.fetchone()[0] == 0:
                cursor.execute("""
                INSERT INTO financial_reserves (id, ytd_loss, budget, fraud_savings, auto_reserves, home_reserves)
                VALUES (1, 1200000.0, 1500000.0, 245000.0, 450000.0, 780000.0)
                """)

            conn.commit()

    def insert_claim_decision(self, decision_doc: Dict[str, Any]):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO claim_decisions (
                id, request_id, customer, customer_id, policy_num, policy_type,
                gross_amount, deductible, net_payout, requested_by, decided_by,
                decided_by_role, decision, timestamp, notes, fraud_prob
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                decision_doc.get("id"),
                decision_doc.get("requestId"),
                decision_doc.get("customer"),
                decision_doc.get("customerId"),
                decision_doc.get("policyNum"),
                decision_doc.get("policyType"),
                decision_doc.get("grossAmount", 0),
                decision_doc.get("deductible", 0),
                decision_doc.get("netPayout", 0),
                decision_doc.get("requestedBy"),
                decision_doc.get("decidedBy"),
                decision_doc.get("decidedByRole"),
                decision_doc.get("decision"),
                decision_doc.get("timestamp"),
                decision_doc.get("notes"),
                decision_doc.get("fraudProb", 0)
            ))
            conn.commit()

    def get_all_claim_decisions(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM claim_decisions ORDER BY timestamp DESC")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

class MongoDocumentManager:
    """
    MongoDB Document Store Manager (JSON / BSON Compliant Document Engine)
    Manages document-oriented collections:
    - customers collection
    - call_records collection
    - agent_directory_logs collection
    """
    def __init__(self, collections_dir=MONGO_JSON_DIR):
        self.dir = collections_dir

    def _get_coll_path(self, coll_name: str) -> str:
        return os.path.join(self.dir, f"{coll_name}.json")

    def find(self, coll_name: str, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        path = self._get_coll_path(coll_name)
        if not os.path.exists(path):
            return []
        try:
            with open(path, "r", encoding="utf-8") as f:
                docs = json.load(f)
            if not query:
                return docs
            # Simple field matching query filter
            filtered = []
            for d in docs:
                match = True
                for k, v in query.items():
                    if d.get(k) != v:
                        match = False
                        break
                if match:
                    filtered.append(d)
            return filtered
        except Exception:
            return []

    def insert_one(self, coll_name: str, doc: Dict[str, Any]) -> Dict[str, Any]:
        docs = self.find(coll_name)
        docs.insert(0, doc)
        path = self._get_coll_path(coll_name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(docs, f, indent=2)
        return doc

    def update_one(self, coll_name: str, match_key: str, match_val: str, update_fields: Dict[str, Any]) -> bool:
        docs = self.find(coll_name)
        updated = False
        for d in docs:
            if d.get(match_key) == match_val:
                d.update(update_fields)
                updated = True
                break
        if updated:
            path = self._get_coll_path(coll_name)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(docs, f, indent=2)
        return updated

# Global Database Singleton Instances
sql_db = SQLDatabaseManager()
mongo_db = MongoDocumentManager()
