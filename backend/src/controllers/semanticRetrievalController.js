/**
 * Semantic Retrieval Controller
 * 
 * Handles HTTP requests for semantic retrieval operations.
 */

import { retrieveRelevantChunks } from '../services/semanticRetrievalService.js';

/**
 * POST /api/documents/:id/retrieve
 * 
 * Retrieve relevant document chunks for a question.
 * 
 * Request body:
 * {
 *   "question": "What tasks must be completed before launch?",
 *   "topK": 5
 * }
 */
export async function retrieveForDocument(req, res) {
  try {
    const { id: documentId } = req.params;
    const { question, topK, threshold } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required'
      });
    }

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    const result = await retrieveRelevantChunks(documentId, question, { topK, threshold });

    if (!result.success) {
      const statusCode = result.statusCode || 400;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Semantic retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during semantic retrieval'
    });
  }
}
