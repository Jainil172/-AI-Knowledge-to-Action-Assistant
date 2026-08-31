"""
Embedding service for RAG preparation.
Generates vector embeddings for document chunks using OpenAI embedding API.
"""

import os
import re
from typing import List, Dict, Optional
from openai import OpenAI

# Default configuration
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
DEFAULT_BATCH_SIZE = 100


def get_embedding_config() -> Dict[str, str]:
    """
    Get embedding configuration from environment variables.
    Returns default values if not configured.
    """
    return {
        "model": os.getenv("OPENAI_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL),
        "batchSize": int(os.getenv("RAG_EMBEDDING_BATCH_SIZE", DEFAULT_BATCH_SIZE))
    }


def get_openai_client() -> OpenAI:
    """
    Create and return an OpenAI client using the API key from environment variables.

    Returns:
        OpenAI client instance

    Raises:
        ValueError: If OPENAI_API_KEY is not configured
    """
    api_key = os.getenv("OPENAI_API_KEY", "")

    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set. Please add it to your .env file.")

    return OpenAI(api_key=api_key)


def _validate_embedding(embedding: list, expected_dimension: Optional[int] = None) -> bool:
    """
    Validate that an embedding is a proper numeric vector.

    Args:
        embedding: The embedding vector to validate
        expected_dimension: Expected dimension if known

    Returns:
        True if valid, False otherwise
    """
    if not embedding or not isinstance(embedding, list):
        return False

    # Check all elements are numbers
    if not all(isinstance(x, (int, float)) for x in embedding):
        return False

    # Check dimension if expected
    if expected_dimension is not None and len(embedding) != expected_dimension:
        return False

    return True


def generate_embedding(text: str) -> Dict:
    """
    Generate an embedding for a single text chunk.

    Args:
        text: Text to generate embedding for

    Returns:
        Dictionary with embedding vector, dimension, and model info
    """
    # Validate input
    if not text or not isinstance(text, str):
        return {
            "success": False,
            "error": "No text provided for embedding"
        }

    text = text.strip()
    if not text:
        return {
            "success": False,
            "error": "Empty or whitespace-only text cannot be embedded"
        }

    # Get configuration
    config = get_embedding_config()
    model = config["model"]

    try:
        client = get_openai_client()

        # Generate embedding
        response = client.embeddings.create(
            model=model,
            input=text
        )

        # Extract embedding
        embedding = response.data[0].embedding

        # Validate embedding
        if not _validate_embedding(embedding):
            return {
                "success": False,
                "error": "Invalid embedding received from API"
            }

        return {
            "success": True,
            "embedding": embedding,
            "dimension": len(embedding),
            "model": model
        }

    except ValueError as e:
        return {
            "success": False,
            "error": f"Configuration error: {str(e)}"
        }
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            return {
                "success": False,
                "error": "Invalid API key. Please check your OPENAI_API_KEY."
            }
        elif "rate_limit" in error_msg.lower():
            return {
                "success": False,
                "error": "API rate limit exceeded. Please try again later."
            }
        elif "model" in error_msg.lower():
            return {
                "success": False,
                "error": f"Invalid embedding model: {model}"
            }
        else:
            return {
                "success": False,
                "error": f"Failed to generate embedding: {error_msg}"
            }


def generate_embeddings_for_chunks(chunks: List[Dict]) -> Dict:
    """
    Generate embeddings for multiple document chunks with batching.

    Args:
        chunks: List of chunk dictionaries with chunkIndex and text

    Returns:
        Dictionary with success status and chunks with embeddings
    """
    if not chunks or not isinstance(chunks, list):
        return {
            "success": False,
            "error": "No chunks provided for embedding"
        }

    # Validate all chunks have required fields
    for i, chunk in enumerate(chunks):
        if not isinstance(chunk, dict):
            return {
                "success": False,
                "error": f"Chunk at index {i} is not a valid dictionary"
            }
        if "text" not in chunk or not chunk["text"]:
            return {
                "success": False,
                "error": f"Chunk at index {i} has no text content"
            }

    # Get configuration
    config = get_embedding_config()
    model = config["model"]
    batch_size = config["batchSize"]

    try:
        client = get_openai_client()

        # Prepare all texts for embedding
        texts = [chunk["text"].strip() for chunk in chunks]

        # Process in batches
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]

            # Generate embeddings for batch
            response = client.embeddings.create(
                model=model,
                input=batch_texts
            )

            # Extract embeddings in order
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)

        # Validate all embeddings have consistent dimensions
        dimensions = [len(e) for e in all_embeddings]
        if len(set(dimensions)) > 1:
            return {
                "success": False,
                "error": "Inconsistent embedding dimensions detected"
            }

        # Validate each embedding
        expected_dimension = dimensions[0] if dimensions else 0
        for i, embedding in enumerate(all_embeddings):
            if not _validate_embedding(embedding, expected_dimension):
                return {
                    "success": False,
                    "error": f"Invalid embedding for chunk at index {i}"
                }

        # Combine chunks with their embeddings
        result_chunks = []
        for i, chunk in enumerate(chunks):
            result_chunks.append({
                "chunkIndex": chunk.get("chunkIndex", i),
                "text": chunk["text"],
                "characterCount": chunk.get("characterCount", len(chunk["text"])),
                "embedding": all_embeddings[i],
                "dimension": len(all_embeddings[i])
            })

        return {
            "success": True,
            "model": model,
            "dimension": expected_dimension,
            "chunkCount": len(result_chunks),
            "chunks": result_chunks
        }

    except ValueError as e:
        return {
            "success": False,
            "error": f"Configuration error: {str(e)}"
        }
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            return {
                "success": False,
                "error": "Invalid API key. Please check your OPENAI_API_KEY."
            }
        elif "rate_limit" in error_msg.lower():
            return {
                "success": False,
                "error": "API rate limit exceeded. Please try again later."
            }
        elif "model" in error_msg.lower():
            return {
                "success": False,
                "error": f"Invalid embedding model: {model}"
            }
        else:
            return {
                "success": False,
                "error": f"Failed to generate embeddings: {error_msg}"
            }


def get_embedding_preview(text: str) -> Dict:
    """
    Get a preview of an embedding for testing/development.
    Returns only a small preview of the embedding vector.

    Args:
        text: Text to generate embedding preview for

    Returns:
        Dictionary with model info, dimension, and preview values
    """
    result = generate_embedding(text)

    if not result["success"]:
        return result

    # Return only preview (first 5 values)
    preview_values = result["embedding"][:5]

    return {
        "success": True,
        "model": result["model"],
        "dimension": result["dimension"],
        "embeddingPreview": preview_values
    }


def chunk_and_embed(text: str) -> Dict:
    """
    Complete RAG preparation pipeline: chunk text and generate embeddings.

    Args:
        text: Cleaned document text to process

    Returns:
        Dictionary with chunks and their embeddings
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

    # Step 2: Generate embeddings for chunks
    embedding_result = generate_embeddings_for_chunks(chunks)

    if not embedding_result["success"]:
        return embedding_result

    return {
        "success": True,
        "model": embedding_result["model"],
        "dimension": embedding_result["dimension"],
        "chunkCount": len(embedding_result["chunks"]),
        "chunks": embedding_result["chunks"]
    }
