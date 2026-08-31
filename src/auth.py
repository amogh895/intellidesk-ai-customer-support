import os
import time
from typing import Dict, Any, List, Optional
import jwt
from fastapi import HTTPException, Security, Depends
from fastapi.security import OAuth2PasswordBearer

JWT_SECRET = os.getenv("JWT_SECRET", "northbridge_governance_secret_key_9988!")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_SECONDS = 28800  # 8 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Enterprise mock credentials directory matching INITIAL_EMPLOYEES
MOCK_USER_DIRECTORY = {
    "sarah.connor@northbridge.com": {"id": "EMP-401", "name": "Sarah Connor", "password": "sarah@nb123", "role": "agent"},
    "john.miller@northbridge.com": {"id": "EMP-402", "name": "John Miller", "password": "john@nb123", "role": "agent"},
    "elena.rostova@northbridge.com": {"id": "EMP-403", "name": "Elena Rostova", "password": "elena@nb123", "role": "agent"},
    "marcus.aurelius@northbridge.com": {"id": "EMP-404", "name": "Marcus Aurelius", "password": "super@nb123", "role": "supervisor"},
    "diana.harlow@northbridge.com": {"id": "EMP-500", "name": "Diana Harlow", "password": "manager@nb123", "role": "manager"}
}

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    user = MOCK_USER_DIRECTORY.get(email.strip().lower())
    if user and user["password"] == password:
        return {
            "id": user["id"],
            "name": user["name"],
            "email": email,
            "role": user["role"]
        }
    return None

def create_access_token(data: Dict[str, Any]) -> str:
    payload = data.copy()
    payload.update({
        "exp": time.time() + TOKEN_EXPIRY_SECONDS,
        "iss": "NorthBridge Governance Authority"
    })
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is missing. Please log in."
        )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("exp") < time.time():
            raise HTTPException(status_code=401, detail="Authentication token has expired.")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authorization token.")

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if user.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden. Access requires one of the following roles: {', '.join(self.allowed_roles)}"
            )
        return user
