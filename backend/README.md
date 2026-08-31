# AI Knowledge-to-Action Backend

Backend service for the AI Knowledge-to-Action Assistant hackathon project.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

## Run

```bash
npm run dev
```

## Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

## Architecture

- Express.js backend with ES Modules
- Communicates with Python FastAPI AI service via HTTP
