"""
RAG-related API routes.
Provides endpoints for document chunking, embedding generation, and RAG preparation.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.services.chunking_service import get_chunk_preview
from app.services.embedding_service import (
    get_embedding_preview,
    get_embedding_config,
    generate_embeddings_for_chunks,
    chunk_and_embed
)

router = APIRouter()


class ChunkPreviewRequest(BaseModel):
    """Request model for chunk preview."""
    text: str
    chunkSize: Optional[int] = None
    chunkOverlap: Optional[int] = None


class EmbedPreviewRequest(BaseModel):
    """Request model for embed preview."""
    text: str


class EmbedChunksRequest(BaseModel):
    """Request model for embedding multiple chunks."""
    chunks: List[dict]


class ChunkAndEmbedRequest(BaseModel):
    """Request model for chunk + embed pipeline."""
    text: str


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


@router.post("/embed-preview")
def preview_embedding(request: EmbedPreviewRequest):
    """
    Generate an embedding preview for a single text.
    Development/testing endpoint - returns only a small preview of the embedding.

    Request body:
    - text: The text to generate an embedding for

    Returns:
    - Model name
    - Embedding dimension
    - Preview of first 3 values
    """
    if not request.text or not request.text.strip():
        return {
            "success": False,
            "error": "No text provided"
        }

    result = get_embedding_preview(text=request.text)
    return result


@router.get("/embedding-config")
def embedding_config():
    """
    Get the current embedding configuration.
    Shows model name, batch size, and dimension.
    """
    return {
        "success": True,
        "configuration": get_embedding_config()
    }


@router.post("/embed-chunks")
def embed_chunks(request: EmbedChunksRequest):
    """
    Generate embeddings for multiple chunks.
    Accepts a list of chunks and returns them enriched with embeddings.

    Request body:
    - chunks: List of {"chunkIndex": int, "text": str}

    Returns:
    - Chunks with embeddings attached
    - Model and dimension metadata
    """
    if not request.chunks or not isinstance(request.chunks, list):
        return {
            "success": False,
            "error": "No chunks provided"
        }

    result = generate_embeddings_for_chunks(chunks=request.chunks)
    return result


@router.post("/chunk-and-embed")
def chunk_and_embed_endpoint(request: ChunkAndEmbedRequest):
    """
    Complete RAG pipeline: chunk text and generate embeddings.
    Combines chunking and embedding into a single call.

    Request body:
    - text: Cleaned document text to process

    Returns:
    - Chunks with embeddings
    - Chunking and embedding metadata
    """
    if not request.text or not request.text.strip():
        return {
            "success": False,
            "error": "No text provided"
        }

    result = chunk_and_embed(text=request.text)
    return result
