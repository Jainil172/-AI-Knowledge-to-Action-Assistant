# AI Knowledge-to-Action Service

Python FastAPI microservice for AI-powered document processing and information extraction.

## Setup

```bash
cd ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload
```

## Test Health Endpoint

```bash
curl http://localhost:8000/api/health
```

## Architecture

- FastAPI application with modular route structure
- Independent microservice communicating with Node.js backend via HTTP
- Ready for future: PDF processing, Gemini/LLM, embeddings, RAG
