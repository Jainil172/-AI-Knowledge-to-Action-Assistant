import os


class Settings:
    """Application settings loaded from environment variables."""

    APP_NAME: str = "AI Knowledge-to-Action Service"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Node.js backend URL (for future inter-service communication)
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:3000")

    # Groq LLM settings (REQUIRED)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    # Vector database settings (placeholder for future RAG)
    VECTOR_DB_PATH: str = os.getenv("VECTOR_DB_PATH", "./data/vectordb")


settings = Settings()
