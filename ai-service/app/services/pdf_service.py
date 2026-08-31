"""
PDF text extraction service.
Extracts text from PDF files page by page using PyPDF2.
"""

from io import BytesIO
from PyPDF2 import PdfReader


def extract_text_from_pdf(pdf_content: bytes) -> dict:
    """
    Extract text from a PDF file.

    Args:
        pdf_content: Raw bytes of the PDF file

    Returns:
        Dictionary with extraction results including pages, metadata, and any errors

    Raises:
        ValueError: If the PDF is corrupted or cannot be read
    """
    try:
        # Create a PDF reader from the bytes
        pdf_stream = BytesIO(pdf_content)
        reader = PdfReader(pdf_stream)

        # Get basic document info
        page_count = len(reader.pages)

        if page_count == 0:
            return {
                "success": False,
                "message": "PDF document contains no pages",
                "document": {
                    "pageCount": 0,
                    "characterCount": 0
                },
                "pages": []
            }

        # Extract text from each page
        pages = []
        total_characters = 0

        for page_number, page in enumerate(reader.pages, start=1):
            try:
                page_text = page.extract_text() or ""
                char_count = len(page_text)
                total_characters += char_count

                pages.append({
                    "pageNumber": page_number,
                    "text": page_text,
                    "characterCount": char_count
                })
            except Exception as e:
                # Handle individual page extraction errors
                pages.append({
                    "pageNumber": page_number,
                    "text": "",
                    "characterCount": 0,
                    "error": f"Failed to extract text from page {page_number}: {str(e)}"
                })

        # Check if any text was extracted
        if total_characters == 0:
            return {
                "success": True,
                "message": "PDF processed but contains no extractable text. The document may be image-based or scanned.",
                "document": {
                    "pageCount": page_count,
                    "characterCount": 0
                },
                "pages": pages
            }

        return {
            "success": True,
            "message": "PDF processed and text extracted successfully",
            "document": {
                "pageCount": page_count,
                "characterCount": total_characters
            },
            "pages": pages
        }

    except Exception as e:
        raise ValueError(f"Failed to read PDF: {str(e)}")
