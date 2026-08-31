/**
 * Semantic Retrieval Routes
 * 
 * Provides endpoints for semantic similarity search.
 */

import { Router } from 'express';
import { retrieveForDocument } from '../controllers/semanticRetrievalController.js';

const router = Router();

// Semantic retrieval for a specific document
router.post('/documents/:id/retrieve', retrieveForDocument);

export default router;
