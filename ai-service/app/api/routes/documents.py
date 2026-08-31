from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.pdf_service import extract_text_from_pdf
from app.services.text_processing_service import process_extracted_text
from app.services.groq_service import extract_project_intelligence
from app.services.project_intelligence_validation_service import validate_project_intelligence

router = APIRouter()


@router.get("/")
def list_documents():
    """Placeholder: List uploaded documents."""
    return {"message": "Document listing not yet implemented"}


@router.post("/upload")
def upload_document():
    """Placeholder: Upload a document for processing."""
    return {"message": "Document upload not yet implemented"}


@router.post("/process")
async def process_document(file: UploadFile = File(...)):
    """
    Receive a PDF document from Node.js backend for processing.
    Validates the file, extracts text, cleans it, extracts project intelligence,
    validates the intelligence, and returns structured results.
    """
    # Validate file exists
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file is a PDF
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF files are allowed"
        )

    # Read file content to check size (10MB limit)
    content = await file.read()
    max_size = 10 * 1024 * 1024  # 10MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB"
        )

    # Check if file is empty
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Empty file provided"
        )

    # Step 1: Extract text from PDF
    try:
        extraction_result = extract_text_from_pdf(content)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to process PDF: {str(e)}"
        )

    # Step 2: Clean and normalize the extracted text
    processing_result = process_extracted_text(extraction_result["pages"])

    # Step 3: Extract project intelligence with Groq (if text is available)
    intelligence_result = None
    validated_result = None
    if processing_result["metadata"]["hasMeaningfulText"]:
        intelligence_result = extract_project_intelligence(
            processing_result["combinedText"],
            file.filename
        )

        # Step 4: Validate and normalize the extracted intelligence
        if intelligence_result and intelligence_result.get("success"):
            validated_result = validate_project_intelligence(
                intelligence_result.get("intelligence", {})
            )

    # Build and return the response
    response = {
        "success": extraction_result["success"],
        "message": "PDF processed successfully",
        "document": {
            "filename": file.filename,
            "contentType": file.content_type,
            "size": len(content),
            "pageCount": processing_result["metadata"]["pageCount"],
            "originalCharacterCount": processing_result["metadata"]["originalCharacterCount"],
            "cleanedCharacterCount": processing_result["metadata"]["cleanedCharacterCount"],
            "hasMeaningfulText": processing_result["metadata"]["hasMeaningfulText"],
            "pagesWithContent": processing_result["metadata"]["pagesWithContent"],
            "cleanedText": processing_result["combinedText"]  # Preserved for RAG processing
        },
        "pages": processing_result["pages"]
    }

    # Add validated intelligence if available
    if validated_result:
        intelligence_dict = validated_result.model_dump() if hasattr(validated_result, 'model_dump') else vars(validated_result)
        response["intelligence"] = intelligence_dict
        if intelligence_dict.get("success"):
            response["message"] = "PDF processed and project intelligence extracted successfully"
        else:
            response["message"] = "PDF processed but intelligence extraction failed"
            response["intelligenceError"] = intelligence_dict.get("message")
    elif intelligence_result:
        # Intelligence extraction failed
        response["intelligence"] = intelligence_result
        response["message"] = "PDF processed but intelligence extraction failed"
        response["intelligenceError"] = intelligence_result.get("error")
    else:
        response["message"] = "PDF processed but no meaningful text found for analysis"

    return response
