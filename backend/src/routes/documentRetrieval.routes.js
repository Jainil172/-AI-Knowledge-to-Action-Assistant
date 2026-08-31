import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  getTasks,
  getRisks,
  getDecisions
} from '../controllers/documentRetrievalController.js';

const router = Router();

// GET /api/documents - List all documents with pagination
router.get('/documents', listDocuments);

// GET /api/documents/:id - Get a single document with all intelligence
router.get('/documents/:id', getDocument);

// GET /api/documents/:id/tasks - Get tasks for a document
router.get('/documents/:id/tasks', getTasks);

// GET /api/documents/:id/risks - Get risks for a document
router.get('/documents/:id/risks', getRisks);

// GET /api/documents/:id/decisions - Get decisions for a document
router.get('/documents/:id/decisions', getDecisions);

export default router;
