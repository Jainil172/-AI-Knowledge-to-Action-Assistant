"""
Groq LLM service layer.
Handles connection to Groq API for LLM operations.
"""

import os
from groq import Groq


def get_groq_client() -> Groq:
    """
    Create and return a Groq client using the API key from environment variables.

    Returns:
        Groq client instance

    Raises:
        ValueError: If GROQ_API_KEY is not configured
    """
    api_key = os.getenv("GROQ_API_KEY", "")

    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set. Please add it to your .env file.")

    return Groq(api_key=api_key)


def test_groq_connection() -> dict:
    """
    Test the Groq API connection by sending a simple prompt.

    Returns:
        Dictionary with success status, model name, and response
    """
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    try:
        client = get_groq_client()

        # Send a simple test prompt
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Reply with a short confirmation that the Groq connection is working. Keep it to one sentence."
                }
            ],
            model=model,
            max_tokens=50,
            temperature=0.5
        )

        response_text = chat_completion.choices[0].message.content.strip()

        return {
            "success": True,
            "message": "Successfully connected to Groq",
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
        if "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            return {
                "success": False,
                "message": "Invalid API key. Please check your GROQ_API_KEY.",
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
                "message": "Failed to connect to Groq API",
                "error": error_msg
            }
