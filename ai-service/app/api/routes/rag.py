"""
RAG-related API routes.
Provides endpoints for document chunking and RAG preparation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.chunking_service import get_chunk_preview

router = APIRouter()


class ChunkPreviewRequest(BaseModel):
    """Request model for chunk preview."""
    text: str
    chunkSize: Optional[int] = None
    chunkOverlap: Optional[int] = None


@router.post("/chunk-preview")
def preview_chunks(request: ChunkPreviewRequest):
    """
    Preview how text would be chunked for RAG processing.
    This is a development/testing endpoint.

    Request body:
    - text: The text to chunk
    - chunkSize: Optional maximum characters per chunk
    - chunkOverlap: Optional overlap between chunks

    Returns:
    - Chunking configuration
    - Input text metadata
    - Generated chunks with metadata
    """
    if not request.text or not request.text.strip():
        return {
            "success": True,
            "configuration": {
                "chunkSize": request.chunkSize or 1000,
                "chunkOverlap": request.chunkOverlap or 200,
                "minChunkSize": 100
            },
            "input": {
                "characterCount": 0,
                "isEmpty": True
            },
            "output": {
                "chunkCount": 0,
                "totalCharacterCount": 0,
                "chunks": []
            }
        }

    result = get_chunk_preview(
        text=request.text,
        chunk_size=request.chunkSize,
        chunk_overlap=request.chunkOverlap
    )

    return result


@router.get("/chunk-config")
def get_chunk_config():
    """
    Get the current chunking configuration.
    Shows default values and environment variable settings.
    """
    import os
    from app.services.chunking_service import DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, MIN_CHUNK_SIZE

    return {
        "success": True,
        "configuration": {
            "chunkSize": int(os.getenv("RAG_CHUNK_SIZE", DEFAULT_CHUNK_SIZE)),
            "chunkOverlap": int(os.getenv("RAG_CHUNK_OVERLAP", DEFAULT_CHUNK_OVERLAP)),
            "minChunkSize": MIN_CHUNK_SIZE,
            "environmentVariables": {
                "RAG_CHUNK_SIZE": os.getenv("RAG_CHUNK_SIZE", "not set (using default)"),
                "RAG_CHUNK_OVERLAP": os.getenv("RAG_CHUNK_OVERLAP", "not set (using default)")
            }
        }
    }
