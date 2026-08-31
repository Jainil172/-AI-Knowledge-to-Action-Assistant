/**
 * Semantic Retrieval Controller
 * 
 * Handles HTTP requests for semantic retrieval and RAG answer generation.
 * Uses ragService.js for orchestration with structured error codes.
 */

import { askDocument, retrieveChunks, getHealthStatus } from '../services/ragService.js';

/**
 * POST /api/rag/ask
 * 
 * Complete RAG pipeline: retrieve relevant chunks and generate a grounded answer.
 * 
 * Request body:
 * {
 *   "documentId": "uuid",
 *   "question": "What tasks must be completed before launch?",
 *   "topK": 5,
 *   "threshold": 0.3
 * }
 */
export async function askQuestion(req, res) {
  try {
    const { documentId, question, topK, threshold } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DOCUMENT_ID',
          message: 'documentId is required in request body',
        },
      });
    }

    if (!question) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUESTION',
          message: 'question is required in request body',
        },
      });
    }

    const result = await askDocument(documentId, question, { topK, threshold });

    if (!result.success) {
      // Map error codes to HTTP status codes
      const statusCodeMap = {
        DOCUMENT_NOT_FOUND: 404,
        INVALID_QUESTION: 400,
        INVALID_TOP_K: 400,
        CHUNKS_NOT_FOUND: 404,
        EMBEDDING_SERVICE_UNAVAILABLE: 503,
        ANSWER_GENERATION_FAILED: 500,
        AI_SERVICE_UNAVAILABLE: 503,
        INTERNAL_ERROR: 500,
      };

      const statusCode = statusCodeMap[result.error?.code] || 400;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('RAG ask error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during answer generation',
      },
    });
  }
}

/**
 * POST /api/rag/retrieve
 * 
 * Retrieve relevant document chunks for a question (no answer generation).
 * 
 * Request body:
 * {
 *   "documentId": "uuid",
 *   "question": "What tasks must be completed before launch?",
 *   "topK": 5,
 *   "threshold": 0.3
 * }
 */
export async function retrieveDocumentChunks(req, res) {
  try {
    const { documentId, question, topK, threshold } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DOCUMENT_ID',
          message: 'documentId is required in request body',
        },
      });
    }

    if (!question) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUESTION',
          message: 'question is required in request body',
        },
      });
    }

    const result = await retrieveChunks(documentId, question, { topK, threshold });

    if (!result.success) {
      const statusCodeMap = {
        DOCUMENT_NOT_FOUND: 404,
        INVALID_QUESTION: 400,
        INVALID_TOP_K: 400,
        EMBEDDING_SERVICE_UNAVAILABLE: 503,
      };

      const statusCode = statusCodeMap[result.error?.code] || 400;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('RAG retrieve error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during retrieval',
      },
    });
  }
}

/**
 * GET /api/rag/health
 * 
 * Check RAG service health and configuration.
 */
export async function getRagHealth(req, res) {
  try {
    const result = await getHealthStatus();
    res.json(result);
  } catch (error) {
    console.error('RAG health check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during health check',
      },
    });
  }
}
