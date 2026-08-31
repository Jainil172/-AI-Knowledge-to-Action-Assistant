from fastapi import APIRouter
from app.services.groq_service import test_groq_connection

router = APIRouter()


@router.get("/groq-status")
def groq_status():
    """
    Test endpoint to verify Groq API connectivity.
    Returns connection status, model info, and test response.
    """
    result = test_groq_connection()

    if not result["success"]:
        return {
            "success": False,
            "message": result["message"],
            "error": result.get("error", "Unknown error")
        }

    return {
        "success": True,
        "message": result["message"],
        "model": result["model"],
        "response": result["response"]
    }
