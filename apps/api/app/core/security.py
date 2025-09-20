import jwt, os
from datetime import datetime, timedelta, timezone

SECRET = os.getenv("SECRET_KEY", "devsecret")
ALG = "HS256"

def create_jwt(*, sub: str, scope: str, minutes: int = 60):
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=minutes)
    payload = {"sub": sub, "scope": scope, "iat": int(now.timestamp()), "exp": int(exp.timestamp())}
    return jwt.encode(payload, SECRET, algorithm=ALG)
