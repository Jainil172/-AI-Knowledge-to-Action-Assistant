"""
Text processing service.
Cleans and normalizes extracted PDF text for future AI analysis.
Preserves meaning, structure, and task-related information.
"""

import re


def clean_page_text(text: str) -> str:
    """
    Clean and normalize text from a single page.

    Args:
        text: Raw extracted text from a PDF page

    Returns:
        Cleaned and normalized text
    """
    if not text or not text.strip():
        return ""

    cleaned = text

    # Remove control characters except newlines and tabs
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', cleaned)

    # Normalize multiple tabs to a single space
    cleaned = re.sub(r'\t+', ' ', cleaned)

    # Normalize multiple spaces (but not newlines) to single space
    cleaned = re.sub(r'[^\S\n]+', ' ', cleaned)

    # Normalize excessive blank lines (3+ newlines to 2)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    # Remove trailing whitespace on each line
    cleaned = re.sub(r'[ \t]+$', '', cleaned, flags=re.MULTILINE)

    # Remove leading/trailing whitespace from the whole text
    cleaned = cleaned.strip()

    return cleaned


def process_extracted_text(pages: list) -> dict:
    """
    Clean and normalize extracted PDF text page by page.

    Creates cleaned versions of each page and a combined document text
    suitable for future AI analysis.

    Args:
        pages: List of page objects with pageNumber and text

    Returns:
        Dictionary with cleaned pages, combined text, and metadata
    """
    cleaned_pages = []
    original_char_count = 0
    cleaned_char_count = 0
    has_meaningful_text = False

    for page in pages:
        page_number = page.get("pageNumber", 0)
        raw_text = page.get("text", "")

        # Track original character count
        original_char_count += len(raw_text)

        # Clean the text
        cleaned_text = clean_page_text(raw_text)
        cleaned_len = len(cleaned_text)
        cleaned_char_count += cleaned_len

        # Check if this page has meaningful content (more than just whitespace/punctuation)
        # Meaningful = contains at least some letters or numbers
        is_meaningful = bool(re.search(r'[a-zA-Z0-9]{3,}', cleaned_text))
        if is_meaningful:
            has_meaningful_text = True

        cleaned_pages.append({
            "pageNumber": page_number,
            "text": cleaned_text,
            "characterCount": cleaned_len,
            "hasContent": cleaned_len > 0
        })

    # Create combined text from all pages (for future AI processing)
    # Pages are separated by double newlines for clear boundaries
    combined_parts = []
    for page in cleaned_pages:
        if page["text"]:
            combined_parts.append(page["text"])

    combined_text = "\n\n".join(combined_parts)

    return {
        "pages": cleaned_pages,
        "combinedText": combined_text,
        "metadata": {
            "originalCharacterCount": original_char_count,
            "cleanedCharacterCount": cleaned_char_count,
            "pageCount": len(pages),
            "hasMeaningfulText": has_meaningful_text,
            "pagesWithContent": sum(1 for p in cleaned_pages if p["hasContent"])
        }
    }
