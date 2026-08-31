import time
import pytest
from src.auth import authenticate_user, create_access_token, get_current_user, RoleChecker
from fastapi import HTTPException

def test_authenticate_user_valid():
    user = authenticate_user("sarah.connor@northbridge.com", "sarah@nb123")
    assert user is not None
    assert user["name"] == "Sarah Connor"
    assert user["role"] == "agent"

def test_authenticate_user_invalid():
    user = authenticate_user("sarah.connor@northbridge.com", "wrong_password")
    assert user is None
    
    user = authenticate_user("unknown@northbridge.com", "sarah@nb123")
    assert user is None

def test_token_creation_and_decoding():
    user_data = {"id": "EMP-401", "name": "Sarah Connor", "role": "agent"}
    token = create_access_token(user_data)
    assert token is not None
    
    # Decoded payload checks
    decoded = get_current_user(token)
    assert decoded["id"] == "EMP-401"
    assert decoded["name"] == "Sarah Connor"
    assert decoded["role"] == "agent"
    assert "exp" in decoded

def test_token_decoding_invalid():
    with pytest.raises(HTTPException) as exc:
        get_current_user("invalid.token.value")
    assert exc.value.status_code == 401
    assert "Invalid authorization token" in exc.value.detail

def test_role_checker_allowed():
    user_payload = {"role": "manager", "name": "Diana Harlow"}
    checker = RoleChecker(["manager", "supervisor"])
    
    # Should not raise exception
    res = checker(user_payload)
    assert res == user_payload

def test_role_checker_forbidden():
    user_payload = {"role": "agent", "name": "Sarah Connor"}
    checker = RoleChecker(["manager", "supervisor"])
    
    with pytest.raises(HTTPException) as exc:
        checker(user_payload)
    assert exc.value.status_code == 403
    assert "Forbidden" in exc.value.detail
