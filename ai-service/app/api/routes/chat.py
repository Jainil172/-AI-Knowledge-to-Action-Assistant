from fastapi import APIRouter

router = APIRouter()


@router.post("/")
def chat_with_documents():
    """Placeholder: RAG-based chat with documents."""
    return {"message": "Document chat not yet implemented"}
