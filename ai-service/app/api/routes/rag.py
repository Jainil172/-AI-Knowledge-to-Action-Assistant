"""
RAG-related API routes.
Provides endpoints for document chunking, embedding generation, and RAG preparation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.chunking_service import get_chunk_preview
from app.services.embedding_service import get_embedding_preview, generate_embeddings_for_chunks

router = APIRouter()


class ChunkPreviewRequest(BaseModel):
    """Request model for chunk preview."""
    text: str
    chunkSize: Optional[int] = None
    chunkOverlap: Optional[int] = None


class EmbedPreviewRequest(BaseModel):
    """Request model for embedding preview."""
    text: str


class EmbedChunksRequest(BaseModel):
    """Request model for embedding multiple chunks."""
    chunks: List[dict]


class PipelineRequest(BaseModel):
    """Request model for complete RAG pipeline (chunk + embed)."""
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
    Preview an embedding for a single text.
    This is a development/testing endpoint.

    Request body:
    - text: The text to generate embedding for

    Returns:
    - Model name
    - Embedding dimension
    - Preview of first 5 embedding values (not full vector)
    """
    if not request.text or not request.text.strip():
        return {
            "success": False,
            "error": "No text provided"
        }

    result = get_embedding_preview(request.text)
    return result


@router.post("/embed-chunks")
def embed_chunks(request: EmbedChunksRequest):
    """
    Generate embeddings for multiple document chunks.
    This is a development/testing endpoint.

    Request body:
    - chunks: List of chunk objects with text field

    Returns:
    - Chunks with embeddings attached
    """
    if not request.chunks or not isinstance(request.chunks, list):
        return {
            "success": False,
            "error": "No chunks provided"
        }

    result = generate_embeddings_for_chunks(request.chunks)
    return result


@router.get("/embed-config")
def get_embed_config():
    """
    Get the current embedding configuration.
    Shows default values and environment variable settings.
    """
    import os
    from app.services.embedding_service import DEFAULT_EMBEDDING_MODEL, DEFAULT_BATCH_SIZE

    return {
        "success": True,
        "configuration": {
            "embeddingModel": os.getenv("OPENAI_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL),
            "batchSize": int(os.getenv("RAG_EMBEDDING_BATCH_SIZE", DEFAULT_BATCH_SIZE)),
            "environmentVariables": {
                "OPENAI_EMBEDDING_MODEL": os.getenv("OPENAI_EMBEDDING_MODEL", "not set (using default)"),
                "RAG_EMBEDDING_BATCH_SIZE": os.getenv("RAG_EMBEDDING_BATCH_SIZE", "not set (using default)")
            }
        }
    }


@router.post("/pipeline")
def run_rag_pipeline(request: PipelineRequest):
    """
    Run the complete RAG pipeline: chunk text and generate embeddings.
    This is a development/testing endpoint.

    Request body:
    - text: The cleaned document text to process

    Returns:
    - Chunks with embeddings
    - Pipeline metadata
    """
    from app.services.embedding_service import chunk_and_embed

    if not request.text or not request.text.strip():
        return {
            "success": False,
            "error": "No text provided"
        }

    result = chunk_and_embed(request.text)
    return result
