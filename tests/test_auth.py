import pytest
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.auth import hash_password, verify_password, create_access_token, decode_access_token
from src.db_pg import SessionLocal, init_db
from src.seed import seed_database
from src.models import CustomerModel

@pytest.fixture(scope="module", autouse=True)
def setup_auth_db():
    init_db()
    seed_database()

def test_password_hashing_and_verification():
    plain = "Customer@2026"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_creation_and_decoding():
    payload = {"sub": "CRM-101", "email": "rahul.verma@example.com", "realm": "customer"}
    token = create_access_token(payload)
    assert token is not None

    decoded = decode_access_token(token)
    assert decoded["sub"] == "CRM-101"
    assert decoded["realm"] == "customer"

def test_customer_isolation_and_credentials():
    db = SessionLocal()
    cust1 = db.query(CustomerModel).filter(CustomerModel.id == "CRM-101").first()
    cust2 = db.query(CustomerModel).filter(CustomerModel.id == "CRM-102").first()
    db.close()

    assert cust1 is not None and cust2 is not None
    assert cust1.id != cust2.id
    assert verify_password("Customer@2026", cust1.hashed_password) is True
