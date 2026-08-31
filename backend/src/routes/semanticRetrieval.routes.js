/**
 * Semantic Retrieval Routes
 * 
 * Provides endpoints for semantic similarity search and RAG answer generation.
 */

import { Router } from 'express';
import { retrieveForDocument, askDocument } from '../controllers/semanticRetrievalController.js';

const router = Router();

// Semantic retrieval for a specific document
router.post('/documents/:id/retrieve', retrieveForDocument);

// Grounded RAG answer generation for a specific document
router.post('/documents/:id/ask', askDocument);

export default router;
