from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt  # ✅ switched to python-jose
import os

SECRET = os.getenv("SECRET_KEY", "devsecret")
ALG = "HS256"

router = APIRouter()

class VerifyPayload(BaseModel):
    token: str
    email: str
    code: str

@router.post("/request-login")
async def request_login(email: str):
    return {"token": "devtoken123", "code": "1234"}

@router.post("/verify")
async def verify(p: VerifyPayload):
    if p.code != "1234":
        raise HTTPException(status_code=401, detail="Invalid code")
    payload = {
        "sub": p.email,
        "scope": "guest",
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    jwt_token = jwt.encode(payload, SECRET, algorithm=ALG)
    return {"ok": True, "token": jwt_token}
