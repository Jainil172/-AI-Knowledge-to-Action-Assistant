from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import health, documents, analyze, chat, ai, rag
from app.config.settings import settings

# Load environment variables from .env file
load_dotenv()

# Create FastAPI application instance
app = FastAPI(
    title="AI Knowledge-to-Action Service",
    description="AI microservice for document processing and information extraction",
    version="1.0.0"
)

# Enable CORS so Node.js backend can communicate with this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check at root level (no /api prefix)
app.include_router(health.router)

# Include API routers for future features
app.include_router(documents.router, prefix="/api/documents")
app.include_router(analyze.router, prefix="/api/analyze")
app.include_router(chat.router, prefix="/api/chat")
app.include_router(ai.router, prefix="/api/ai")
app.include_router(rag.router, prefix="/api/rag")


@app.get("/")
def root():
    return {"message": "AI Knowledge-to-Action Service"}
