/**
 * RAG Routes
 * 
 * Provides endpoints for RAG question answering and health checks.
 */

import { Router } from 'express';
import { askQuestion, retrieveDocumentChunks, getRagHealth } from '../controllers/ragController.js';

const router = Router();

// RAG question answering (complete pipeline)
router.post('/rag/ask', askQuestion);

// RAG retrieval only (chunks without answer)
router.post('/rag/retrieve', retrieveDocumentChunks);

// RAG health check
router.get('/rag/health', getRagHealth);

export default router;
