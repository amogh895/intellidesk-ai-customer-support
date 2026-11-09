import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from src.db_pg import get_db
from src.models import CustomerModel, StaffModel
from src.config.config import settings

SECRET_KEY = os.getenv("JWT_SECRET", "intellidesk_secret_jwt_key_2026_northbridge")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Hash plain password using bcrypt"""
    if not password:
        password = "Customer@2026"
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against bcrypt hash"""
    if not plain_password or not hashed_password:
        return False
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT access token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )

def get_current_customer(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> CustomerModel:
    """
    FastAPI dependency enforcing Customer Realm authentication.
    Returns authenticated CustomerModel object.
    Raises 401/403 if missing or invalid token.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer realm authentication required. Please log in."
        )

    payload = decode_access_token(credentials.credentials)
    realm = payload.get("realm")
    customer_id = payload.get("sub") or payload.get("customer_id")

    if realm != "customer" or not customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Customer Realm token required."
        )

    customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated customer account not found."
        )

    return customer

def get_current_staff(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    FastAPI dependency enforcing Staff Realm authentication.
    Returns staff user info payload (sub, role, tier, team, staff_id).
    Raises 401/403 if invalid or missing token.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff authentication required. Please log in."
        )

    payload = decode_access_token(credentials.credentials)
    realm = payload.get("realm")

    if realm != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Staff Realm authorization required."
        )

    return payload

def require_senior_csr_or_csm(staff: Dict[str, Any] = Depends(get_current_staff)) -> Dict[str, Any]:
    """Requires at least Tier 2 (Technical Support Specialist or CSM)"""
    role = staff.get("role", "")
    tier = staff.get("tier", 3)
    if tier > 2 and role not in ["Customer Service Manager (CSM)", "Technical Support Specialist (Senior CSR)"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Action requires Technical Support Specialist (Senior CSR) or Customer Service Manager (CSM) privileges."
        )
    return staff

def require_csm(staff: Dict[str, Any] = Depends(get_current_staff)) -> Dict[str, Any]:
    """Strictly requires Tier 1 Customer Service Manager (CSM)"""
    role = staff.get("role", "")
    tier = staff.get("tier", 3)
    if tier != 1 and role != "Customer Service Manager (CSM)":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Action strictly requires Customer Service Manager (CSM) role."
        )
    return staff

def validate_approval_permission(staff: Dict[str, Any], amount: float) -> None:
    """
    Enforces RBAC on payout amounts:
    - Support Agent: 403 Forbidden on all approvals
    - Level 1 (< 100,000 INR): Senior CSR or CSM
    - Level 2 (>= 100,000 INR): CSM only
    """
    role = staff.get("role", "")
    tier = staff.get("tier", 3)

    if role == "Support Agent" or tier > 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="RBAC Violation: Support Agents do not have approval permissions. Escalated to Senior CSR or CSM."
        )

    if amount >= settings.LEVEL_1_APPROVAL_MAX_INR and tier != 1 and role != "Customer Service Manager (CSM)":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"RBAC Violation: Payout of ₹{amount:,.0f} requires Level 2 (Customer Service Manager) authorization."
        )
