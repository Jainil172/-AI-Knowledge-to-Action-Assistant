from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": str(exc)
        }
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
