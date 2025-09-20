from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def get_rsvp():
    return {"status": "pending", "dietary_notes": "", "song_request": ""}

@router.post("/me")
async def submit_rsvp(status: str, dietary_notes: str = "", song_request: str = ""):
    return {"ok": True, "status": status, "dietary_notes": dietary_notes, "song_request": song_request}
