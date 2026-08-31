import pytest
from src.database import SQLDatabaseManager

@pytest.fixture
def test_db():
    # Setup test database in-memory
    db = SQLDatabaseManager(db_path=":memory:")
    return db

def test_initial_reserves_are_zero(test_db):
    reserves = test_db.get_financial_reserves()
    assert reserves["ytd_loss"] == 0.0
    assert reserves["budget"] == 0.0
    assert reserves["fraud_savings"] == 0.0
    assert reserves["auto_reserves"] == 0.0
    assert reserves["home_reserves"] == 0.0

def test_add_claim_budget_positive(test_db):
    result = test_db.add_claim_budget(5000.0, "general")
    assert result["status"] == "success"
    
    reserves = test_db.get_financial_reserves()
    assert reserves["budget"] == 5000.0
    assert reserves["auto_reserves"] == 0.0
    assert reserves["home_reserves"] == 0.0

def test_add_claim_budget_invalid_amount(test_db):
    with pytest.raises(ValueError, match="Budget addition amount must be strictly greater than 0."):
        test_db.add_claim_budget(-100.0, "general")
        
    with pytest.raises(ValueError, match="Budget addition amount must be strictly greater than 0."):
        test_db.add_claim_budget(0.0, "general")

def test_add_claim_budget_category_routing(test_db):
    # Auto routing
    test_db.add_claim_budget(1500.0, "auto")
    reserves = test_db.get_financial_reserves()
    assert reserves["budget"] == 1500.0
    assert reserves["auto_reserves"] == 1500.0
    assert reserves["home_reserves"] == 0.0
    
    # Home routing
    test_db.add_claim_budget(2500.0, "home")
    reserves = test_db.get_financial_reserves()
    assert reserves["budget"] == 4000.0
    assert reserves["auto_reserves"] == 1500.0
    assert reserves["home_reserves"] == 2500.0
