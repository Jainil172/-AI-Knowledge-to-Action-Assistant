import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  getTasks,
  getRisks,
  getDecisions
} from '../controllers/documentRetrievalController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/documents - List all documents with pagination
router.get('/documents', authenticate, listDocuments);

// GET /api/documents/:id - Get a single document with all intelligence
router.get('/documents/:id', authenticate, getDocument);

// GET /api/documents/:id/tasks - Get tasks for a document
router.get('/documents/:id/tasks', authenticate, getTasks);

// GET /api/documents/:id/risks - Get risks for a document
router.get('/documents/:id/risks', authenticate, getRisks);

// GET /api/documents/:id/decisions - Get decisions for a document
router.get('/documents/:id/decisions', authenticate, getDecisions);

export default router;
