from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """Health check endpoint to verify the AI service is running."""
    return {
        "success": True,
        "message": "AI service is running"
    }
