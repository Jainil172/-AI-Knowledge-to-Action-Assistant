from fastapi import APIRouter
from app.services.groq_service import test_groq_connection
from app.services.openai_service import test_openai_connection

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


@router.get("/openai-status")
def openai_status():
    """
    Test endpoint to verify OpenAI API connectivity.
    Returns connection status, model info, and test response.
    """
    result = test_openai_connection()

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
