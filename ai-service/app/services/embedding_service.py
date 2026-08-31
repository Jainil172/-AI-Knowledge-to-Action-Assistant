"""
Embedding service for RAG preparation.
Uses Sentence Transformers for free local embedding generation.
No external API key required.
"""

import os
import logging
import re
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_BATCH_SIZE = 32
EXPECTED_DIMENSION = 384

# Reusable model instance (lazy-loaded)
_model = None
_model_name = None


def _get_model():
    """
    Load the Sentence Transformer model once and reuse it.
    Lazy loading: model is only loaded on first use.
    """
    global _model, _model_name

    from app.config.settings import settings
    model_name = settings.RAG_EMBEDDING_MODEL

    # Return cached model if already loaded with same name
    if _model is not None and _model_name == model_name:
        return _model

    try:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {model_name}")
        _model = SentenceTransformer(model_name)
        _model_name = model_name
        logger.info(f"Embedding model loaded successfully. Dimension: {_model.get_sentence_embedding_dimension()}")
        return _model
    except Exception as e:
        logger.error(f"Failed to load embedding model '{model_name}': {e}")
        _model = None
        _model_name = None
        raise RuntimeError(f"Could not load embedding model '{model_name}': {e}")


def _normalize_text(text: str) -> str:
    """
    Normalize text by cleaning up whitespace and control characters.
    """
    if not text:
        return ""
    # Remove control characters except newlines and tabs
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    # Collapse multiple whitespace into single spaces
    text = re.sub(r'[ \t]+', ' ', text)
    # Collapse multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def _validate_embedding(embedding: list, expected_dimension: Optional[int] = None) -> bool:
    """
    Validate that an embedding is a proper numeric vector.
    """
    if embedding is None:
        return False
    if not isinstance(embedding, list):
        return False
    if len(embedding) == 0:
        return False
    if not all(isinstance(x, (int, float)) for x in embedding):
        return False
    if expected_dimension is not None and len(embedding) != expected_dimension:
        return False
    return True


def get_embedding_config() -> Dict:
    """
    Get embedding configuration from environment variables.
    """
    from app.config.settings import settings
    return {
        "model": settings.RAG_EMBEDDING_MODEL,
        "batchSize": settings.RAG_EMBEDDING_BATCH_SIZE,
        "dimension": EXPECTED_DIMENSION
    }


def generate_embedding(text: str) -> Dict:
    """
    Generate an embedding for a single text.

    Args:
        text: Text to generate embedding for

    Returns:
        Dictionary with embedding vector and metadata, or error
    """
    if not text or not isinstance(text, str):
        return {
            "success": False,
            "error": "No text provided for embedding generation"
        }

    text = _normalize_text(text)
    if not text:
        return {
            "success": False,
            "error": "Text is empty after normalization"
        }

    try:
        model = _get_model()
        embedding = model.encode(text, normalize_embeddings=True).tolist()

        if not _validate_embedding(embedding):
            return {
                "success": False,
                "error": "Generated embedding is invalid"
            }

        return {
            "success": True,
            "embedding": embedding,
            "dimension": len(embedding),
            "model": _model_name
        }
    except RuntimeError:
        raise
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return {
            "success": False,
            "error": f"Embedding generation failed: {str(e)}"
        }


def generate_embeddings_for_chunks(chunks: List[Dict]) -> Dict:
    """
    Generate embeddings for multiple document chunks using batch processing.

    Args:
        chunks: List of chunk dictionaries with chunkIndex and text

    Returns:
        Dictionary with chunks enriched with embeddings, or error
    """
    if not chunks or not isinstance(chunks, list):
        return {
            "success": False,
            "error": "No chunks provided for embedding generation"
        }

    # Validate input chunks
    for i, chunk in enumerate(chunks):
        if not isinstance(chunk, dict):
            return {
                "success": False,
                "error": f"Chunk at index {i} is not a valid dictionary"
            }
        if "text" not in chunk:
            return {
                "success": False,
                "error": f"Chunk at index {i} missing 'text' field"
            }
        if not chunk["text"] or not isinstance(chunk["text"], str):
            return {
                "success": False,
                "error": f"Chunk at index {i} has empty or invalid text"
            }

    try:
        model = _get_model()
        from app.config.settings import settings
        batch_size = settings.RAG_EMBEDDING_BATCH_SIZE

        # Extract texts and normalize
        texts = [_normalize_text(chunk["text"]) for chunk in chunks]

        # Check for empty texts after normalization
        for i, text in enumerate(texts):
            if not text:
                return {
                    "success": False,
                    "error": f"Chunk at index {i} is empty after text normalization"
                }

        # Generate embeddings in batches
        logger.info(f"Generating embeddings for {len(texts)} chunks (batch_size={batch_size})")
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=True,
            show_progress_bar=False
        ).tolist()

        # Validate and attach embeddings to chunks
        enriched_chunks = []
        for i, chunk in enumerate(chunks):
            embedding = embeddings[i]

            if not _validate_embedding(embedding):
                return {
                    "success": False,
                    "error": f"Invalid embedding generated for chunk at index {i}"
                }

            enriched_chunks.append({
                "chunkIndex": chunk.get("chunkIndex", i),
                "text": chunk["text"],
                "characterCount": len(chunk["text"]),
                "embedding": embedding,
                "dimension": len(embedding)
            })

        # Verify consistent dimensions
        dimensions = set(c["dimension"] for c in enriched_chunks)
        if len(dimensions) != 1:
            return {
                "success": False,
                "error": f"Inconsistent embedding dimensions: {dimensions}"
            }

        logger.info(f"Successfully generated {len(enriched_chunks)} embeddings (dim={dimensions.pop()})")

        return {
            "success": True,
            "chunks": enriched_chunks,
            "chunkCount": len(enriched_chunks),
            "model": _model_name,
            "dimension": enriched_chunks[0]["dimension"] if enriched_chunks else 0
        }
    except RuntimeError:
        raise
    except Exception as e:
        logger.error(f"Batch embedding generation failed: {e}")
        return {
            "success": False,
            "error": f"Batch embedding generation failed: {str(e)}"
        }


def get_embedding_preview(text: str) -> Dict:
    """
    Get a preview of an embedding for testing/development.
    Returns only a small preview, not the full vector.

    Args:
        text: Text to generate embedding preview for

    Returns:
        Dictionary with embedding preview and metadata
    """
    result = generate_embedding(text)
    if not result.get("success"):
        return result

    embedding = result["embedding"]
    preview = embedding[:3] if len(embedding) >= 3 else embedding

    return {
        "success": True,
        "model": result["model"],
        "dimension": result["dimension"],
        "embeddingPreview": preview
    }


def chunk_and_embed(text: str) -> Dict:
    """
    Complete RAG preparation pipeline: chunk text and generate embeddings.

    Args:
        text: Cleaned document text to process

    Returns:
        Dictionary with chunks enriched with embeddings
    """
    from app.services.chunking_service import chunk_text

    if not text or not isinstance(text, str):
        return {
            "success": False,
            "error": "No text provided for processing"
        }

    text = text.strip()
    if not text:
        return {
            "success": False,
            "error": "Empty text provided for processing"
        }

    # Step 1: Chunk the text
    chunks = chunk_text(text)
    if not chunks:
        return {
            "success": False,
            "error": "No chunks could be generated from the text"
        }

    # Step 2: Generate embeddings for all chunks
    return generate_embeddings_for_chunks(chunks)
