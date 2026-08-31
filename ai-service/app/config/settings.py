import os


class Settings:
    """Application settings loaded from environment variables."""

    APP_NAME: str = "AI Knowledge-to-Action Service"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Node.js backend URL (for future inter-service communication)
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:3000")

    # Groq LLM settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

    # OpenAI LLM settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")

    # Vector database settings (placeholder for future RAG)
    VECTOR_DB_PATH: str = os.getenv("VECTOR_DB_PATH", "./data/vectordb")


settings = Settings()
