/**
 * Vector Storage Routes
 * 
 * Provides endpoints for testing and managing document vector storage.
 * Development/testing endpoints for RAG vector persistence.
 */

import { Router } from 'express';
import {
  testVectorStorage,
  getDocumentVectorChunks,
  deleteDocumentVectors
} from '../controllers/vectorStorageController.js';

const router = Router();

// Development testing endpoint for vector storage
router.post('/rag/vector-storage-test', testVectorStorage);

// Get all vector chunks for a document
router.get('/rag/vectors/:documentId', getDocumentVectorChunks);

// Delete all vector chunks for a document
router.delete('/rag/vectors/:documentId', deleteDocumentVectors);

export default router;
