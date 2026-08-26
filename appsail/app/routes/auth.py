from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginRequest, UserResponse

router = APIRouter()

@router.post("/login", response_model=UserResponse)
async def login(payload: LoginRequest):
    # Role-based mock routing matching frontend expectations
    valid_roles = ["Admin", "Inspector", "Sub Inspector", "Constable"]
    username = payload.username.strip()
    
    # Assign roles based on prefix or default to Inspector for easy hackathon demoing
    assigned_role = "Inspector"
    for role in valid_roles:
        if role.lower().replace(" ", "") in username.lower():
            assigned_role = role

    if payload.password == "ksp@123":
        return {
            "username": username,
            "role": assigned_role,
            "token": "mock-jwt-token-xyz123",
            "badgeNumber": "KSP-2026-8891"
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. Use password 'ksp@123'"
    )