"""
OpenAI LLM service layer.
Handles connection to OpenAI API for LLM operations and document analysis.
"""

import os
import json
from openai import OpenAI


# Maximum characters to send to OpenAI (approx 12K tokens)
MAX_DOCUMENT_CHARS = 48000


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


def test_openai_connection() -> dict:
    """
    Test the OpenAI API connection by sending a simple prompt.

    Returns:
        Dictionary with success status, model name, and response
    """
    model = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")

    try:
        client = get_openai_client()

        # Send a simple test prompt
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Reply with a short confirmation that the OpenAI connection is working. Keep it to one sentence."
                }
            ],
            model=model,
            max_tokens=50,
            temperature=0.5
        )

        response_text = chat_completion.choices[0].message.content.strip()

        return {
            "success": True,
            "message": "Successfully connected to OpenAI",
            "model": model,
            "response": response_text
        }

    except ValueError as e:
        return {
            "success": False,
            "message": "Configuration error",
            "error": str(e)
        }
    except Exception as e:
        error_msg = str(e)
        # Provide user-friendly error messages
        if "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower() or "invalid" in error_msg.lower():
            return {
                "success": False,
                "message": "Invalid API key. Please check your OPENAI_API_KEY.",
                "error": "Authentication failed"
            }
        elif "model" in error_msg.lower():
            return {
                "success": False,
                "message": f"Invalid model configuration: {model}",
                "error": error_msg
            }
        else:
            return {
                "success": False,
                "message": "Failed to connect to OpenAI API",
                "error": error_msg
            }


def analyze_document(cleaned_text: str, filename: str) -> dict:
    """
    Send cleaned document text to OpenAI for basic document understanding.

    Args:
        cleaned_text: The cleaned and normalized document text
        filename: Original filename for context

    Returns:
        Dictionary with structured analysis results
    """
    model = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")

    # Handle empty or very short text
    if not cleaned_text or not cleaned_text.strip():
        return {
            "success": False,
            "message": "No meaningful text to analyze",
            "error": "Document contains no extractable text"
        }

    # Handle large documents by truncating for MVP
    is_truncated = False
    text_to_analyze = cleaned_text
    if len(cleaned_text) > MAX_DOCUMENT_CHARS:
        text_to_analyze = cleaned_text[:MAX_DOCUMENT_CHARS]
        is_truncated = True

    try:
        client = get_openai_client()

        system_prompt = """You are an AI assistant for project management teams. 
Analyze the provided project document and understand its project context. 
Do not invent information that is not present in the document.
Only include information that is explicitly stated or strongly implied by the document content.
If information is missing or unclear, state it clearly in the missingOrUnclearInformation field."""

        user_prompt = f"""Analyze the following project document and provide a structured response.

Document filename: {filename}

--- DOCUMENT TEXT ---
{text_to_analyze}
--- END OF DOCUMENT ---

Respond with a JSON object containing exactly these fields:
{{
  "summary": "A concise 2-3 sentence summary of the document",
  "projectContext": "The main project context or objective described in the document",
  "keyTopics": ["list", "of", "main", "topics", "discussed"],
  "peopleMentioned": ["list", "of", "people", "or", "teams", "mentioned"],
  "importantPoints": ["list", "of", "important", "points", "requiring", "attention"],
  "missingOrUnclearInformation": ["list", "of", "information", "that", "seems", "missing", "or", "unclear"]
}}

Important rules:
- Only include peopleMentioned if actual names or team names appear in the document
- Only include importantPoints that are explicitly supported by the document text
- Do not invent project facts not present in the document
- Return ONLY valid JSON, no other text"""

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=model,
            temperature=0.3,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )

        response_text = chat_completion.choices[0].message.content.strip()

        # Parse and validate the JSON response
        try:
            analysis = json.loads(response_text)
        except json.JSONDecodeError:
            return {
                "success": False,
                "message": "Invalid response format from AI",
                "error": "Failed to parse AI response as JSON"
            }

        # Validate required fields exist
        required_fields = ["summary", "projectContext", "keyTopics", "peopleMentioned", "importantPoints", "missingOrUnclearInformation"]
        for field in required_fields:
            if field not in analysis:
                analysis[field] = [] if field not in ["summary", "projectContext"] else ""

        # Ensure list fields are actually lists
        list_fields = ["keyTopics", "peopleMentioned", "importantPoints", "missingOrUnclearInformation"]
        for field in list_fields:
            if not isinstance(analysis[field], list):
                analysis[field] = []

        result = {
            "success": True,
            "message": "Document analyzed successfully",
            "analysis": analysis
        }

        # Add truncation notice if applicable
        if is_truncated:
            result["warning"] = f"Document was truncated to {MAX_DOCUMENT_CHARS} characters for processing. Some content may not be analyzed."

        return result

    except ValueError as e:
        return {
            "success": False,
            "message": "Configuration error",
            "error": str(e)
        }
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            return {
                "success": False,
                "message": "Invalid API key. Please check your OPENAI_API_KEY.",
                "error": "Authentication failed"
            }
        elif "model" in error_msg.lower():
            return {
                "success": False,
                "message": f"Invalid model configuration: {model}",
                "error": error_msg
            }
        else:
            return {
                "success": False,
                "message": "Failed to analyze document",
                "error": error_msg
            }


def extract_project_intelligence(cleaned_text: str, filename: str) -> dict:
    """
    Send cleaned document text to OpenAI to extract structured project intelligence.
    Extracts tasks, risks, decisions, and other project-related information.

    Args:
        cleaned_text: The cleaned and normalized document text
        filename: Original filename for context

    Returns:
        Dictionary with structured project intelligence
    """
    model = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")

    # Handle empty or very short text
    if not cleaned_text or not cleaned_text.strip():
        return {
            "success": False,
            "message": "No meaningful text to analyze",
            "error": "Document contains no extractable text"
        }

    # Handle large documents by truncating for MVP
    is_truncated = False
    text_to_analyze = cleaned_text
    if len(cleaned_text) > MAX_DOCUMENT_CHARS:
        text_to_analyze = cleaned_text[:MAX_DOCUMENT_CHARS]
        is_truncated = True

    try:
        client = get_openai_client()

        system_prompt = """You are an AI assistant for project management teams.
Extract structured project intelligence from the provided document.

CRITICAL RULES:
- Do NOT invent information not present in the document
- Only extract information that is explicitly stated or clearly implied
- If a field cannot be determined, use null
- Do not guess owners, deadlines, or priorities
- Only include items that have actual content from the document"""

        user_prompt = f"""Analyze the following project document and extract structured project intelligence.

Document filename: {filename}

--- DOCUMENT TEXT ---
{text_to_analyze}
--- END OF DOCUMENT ---

Respond with a JSON object containing exactly these fields:
{{
  "summary": "A concise 2-3 sentence summary of the document",
  "projectContext": "The main project context or objective described in the document",
  "tasks": [
    {{
      "title": "Task title (required)",
      "description": "Task description if available, or null",
      "owner": "Person or team responsible if mentioned, or null",
      "deadline": "Deadline if mentioned (exact date or relative phrase), or null",
      "priority": "high, medium, or low if mentioned, or null",
      "source": {{
        "pageNumber": "Page number where found, or null",
        "evidence": "Short quote or evidence from the document supporting this task"
      }}
    }}
  ],
  "risks": [
    {{
      "title": "Risk title (required)",
      "description": "Risk description if available, or null",
      "severity": "high, medium, or low if mentioned, or null",
      "source": {{
        "pageNumber": "Page number where found, or null",
        "evidence": "Short quote or evidence from the document"
      }}
    }}
  ],
  "decisions": [
    {{
      "title": "Decision title (required)",
      "description": "Decision description if available, or null",
      "source": {{
        "pageNumber": "Page number where found, or null",
        "evidence": "Short quote or evidence from the document"
      }}
    }}
  ],
  "keyTopics": ["main", "topics", "discussed"],
  "peopleMentioned": ["names", "of", "people", "or", "teams"],
  "importantPoints": ["important", "points", "requiring", "attention"],
  "missingOrUnclearInformation": ["information", "that", "seems", "missing"]
}}

Important rules:
- Only include tasks that are explicitly mentioned as tasks or action items
- Only include risks that are explicitly identified as risks or concerns
- Only include decisions that are explicitly stated as decisions made
- Do not invent priority or severity if not stated in the document
- Do not guess page numbers if not clear
- Keep evidence fields short (max 150 characters)
- Return ONLY valid JSON, no other text"""

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=model,
            temperature=0.2,  # Lower temperature for more factual extraction
            max_tokens=3000,
            response_format={"type": "json_object"}
        )

        response_text = chat_completion.choices[0].message.content.strip()

        # Parse and validate the JSON response
        try:
            intelligence = json.loads(response_text)
        except json.JSONDecodeError:
            return {
                "success": False,
                "message": "Invalid response format from AI",
                "error": "Failed to parse AI response as JSON"
            }

        # Validate required fields exist
        required_fields = ["summary", "projectContext", "tasks", "risks", "decisions",
                          "keyTopics", "peopleMentioned", "importantPoints", "missingOrUnclearInformation"]
        for field in required_fields:
            if field not in intelligence:
                if field in ["summary", "projectContext"]:
                    intelligence[field] = ""
                else:
                    intelligence[field] = []

        # Ensure list fields are actually lists
        list_fields = ["tasks", "risks", "decisions", "keyTopics", "peopleMentioned",
                      "importantPoints", "missingOrUnclearInformation"]
        for field in list_fields:
            if not isinstance(intelligence[field], list):
                intelligence[field] = []

        result = {
            "success": True,
            "message": "Project intelligence extracted successfully",
            "intelligence": intelligence
        }

        # Add truncation notice if applicable
        if is_truncated:
            result["warning"] = f"Document was truncated to {MAX_DOCUMENT_CHARS} characters for processing. Some content may not be analyzed."

        return result

    except ValueError as e:
        return {
            "success": False,
            "message": "Configuration error",
            "error": str(e)
        }
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            return {
                "success": False,
                "message": "Invalid API key. Please check your OPENAI_API_KEY.",
                "error": "Authentication failed"
            }
        elif "model" in error_msg.lower():
            return {
                "success": False,
                "message": f"Invalid model configuration: {model}",
                "error": error_msg
            }
        else:
            return {
                "success": False,
                "message": "Failed to extract project intelligence",
                "error": error_msg
            }
