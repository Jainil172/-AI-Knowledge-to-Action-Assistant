"""
Document chunking service for RAG preparation.
Splits cleaned document text into meaningful chunks for future embedding generation.
"""

import os
import re
from typing import List, Dict, Optional

# Default chunking configuration
DEFAULT_CHUNK_SIZE = 1000  # characters
DEFAULT_CHUNK_OVERLAP = 200  # characters

# Minimum chunk size to avoid tiny meaningless chunks
MIN_CHUNK_SIZE = 100


def get_chunk_config() -> Dict[str, int]:
    """
    Get chunking configuration from environment variables.
    Returns default values if not configured.
    """
    chunk_size = int(os.getenv("RAG_CHUNK_SIZE", DEFAULT_CHUNK_SIZE))
    chunk_overlap = int(os.getenv("RAG_CHUNK_OVERLAP", DEFAULT_CHUNK_OVERLAP))

    # Ensure reasonable bounds
    chunk_size = max(200, min(chunk_size, 5000))
    chunk_overlap = max(0, min(chunk_overlap, chunk_size // 2))

    return {
        "chunkSize": chunk_size,
        "chunkOverlap": chunk_overlap
    }


def _find_sentence_boundary(text: str, position: int, search_range: int = 100) -> int:
    """
    Find the nearest sentence boundary from a given position.
    Prefers paragraph breaks, then sentence endings.
    Returns the position to split at.
    """
    # Look for paragraph break first (double newline)
    para_break = text.rfind("\n\n", max(0, position - search_range), position + search_range)
    if para_break > position - search_range // 2:
        return para_break + 2  # Include the newlines in the previous chunk

    # Look for sentence endings
    for pattern in ['. ', '! ', '? ', '.\n', '!\n', '?\n']:
        idx = text.rfind(pattern, max(0, position - search_range), position + search_range)
        if idx > position - search_range // 2:
            return idx + 2  # Include the sentence ending

    # Look for any whitespace
    for i in range(position, max(0, position - search_range), -1):
        if text[i].isspace():
            return i + 1

    return position


def chunk_text(text: str, chunk_size: Optional[int] = None, chunk_overlap: Optional[int] = None) -> List[Dict]:
    """
    Split cleaned document text into meaningful chunks.

    Args:
        text: Cleaned document text to chunk
        chunk_size: Maximum characters per chunk (uses config if None)
        chunk_overlap: Overlap between chunks (uses config if None)

    Returns:
        List of chunk dictionaries with metadata
    """
    # Handle empty or whitespace-only text
    if not text or not text.strip():
        return []

    text = text.strip()

    # Get configuration
    config = get_chunk_config()
    if chunk_size is None:
        chunk_size = config["chunkSize"]
    if chunk_overlap is None:
        chunk_overlap = config["chunkOverlap"]

    # Handle very short text (smaller than chunk size)
    if len(text) <= chunk_size:
        return [{
            "chunkIndex": 0,
            "text": text,
            "characterCount": len(text)
        }]

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(text):
        # Calculate end position
        end = start + chunk_size

        # If we're not at the end of the text, find a good break point
        if end < len(text):
            end = _find_sentence_boundary(text, end - chunk_overlap, chunk_size // 2)
            # Ensure we don't go backwards
            end = max(end, start + MIN_CHUNK_SIZE)

        # Extract chunk text
        chunk_text = text[start:end].strip()

        # Only add non-empty, meaningful chunks
        if chunk_text and len(chunk_text) >= MIN_CHUNK_SIZE // 2:
            chunks.append({
                "chunkIndex": chunk_index,
                "text": chunk_text,
                "characterCount": len(chunk_text)
            })
            chunk_index += 1

        # Move to next chunk with overlap
        start = end - chunk_overlap
        if start <= chunks[-1]["characterCount"] if chunks else 0:
            start = end

    # Handle case where last chunk is very small - merge with previous
    if len(chunks) > 1:
        last_chunk = chunks[-1]
        if last_chunk["characterCount"] < MIN_CHUNK_SIZE:
            prev_chunk = chunks[-2]
            # Merge if combined size is reasonable
            if prev_chunk["characterCount"] + last_chunk["characterCount"] <= chunk_size:
                prev_chunk["text"] = prev_chunk["text"] + "\n\n" + last_chunk["text"]
                prev_chunk["characterCount"] = len(prev_chunk["text"])
                chunks.pop()

    # Re-index chunks
    for i, chunk in enumerate(chunks):
        chunk["chunkIndex"] = i

    return chunks


def get_chunk_preview(text: str, chunk_size: Optional[int] = None, chunk_overlap: Optional[int] = None) -> Dict:
    """
    Get a preview of how text would be chunked.
    Useful for testing and development.

    Args:
        text: Text to preview chunking for
        chunk_size: Maximum characters per chunk
        chunk_overlap: Overlap between chunks

    Returns:
        Dictionary with chunk metadata and configuration
    """
    config = get_chunk_config()
    if chunk_size is None:
        chunk_size = config["chunkSize"]
    if chunk_overlap is None:
        chunk_overlap = config["chunkOverlap"]

    chunks = chunk_text(text, chunk_size, chunk_overlap)

    return {
        "success": True,
        "configuration": {
            "chunkSize": chunk_size,
            "chunkOverlap": chunk_overlap,
            "minChunkSize": MIN_CHUNK_SIZE
        },
        "input": {
            "characterCount": len(text) if text else 0,
            "isEmpty": not text or not text.strip()
        },
        "output": {
            "chunkCount": len(chunks),
            "totalCharacterCount": sum(c["characterCount"] for c in chunks),
            "chunks": chunks
        }
    }
