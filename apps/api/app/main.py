from fastapi import FastAPI
from app.api.v1 import auth, rsvps

app = FastAPI(title="Cactus Makes Perfect API")

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(rsvps.router, prefix="/api/v1/rsvps", tags=["rsvps"])
