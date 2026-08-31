/**
 * Vector Storage Controller
 * 
 * Handles HTTP requests for vector storage operations.
 * Development/testing endpoints for RAG vector persistence.
 */

import {
  storeDocumentChunks,
  getDocumentChunks,
  deleteDocumentChunks
} from '../services/vectorPersistenceService.js';

/**
 * POST /api/rag/vector-storage-test
 * 
 * Development endpoint to test vector storage.
 * Accepts chunks with embeddings and stores them for a document.
 * 
 * Request body:
 * {
 *   "documentId": "uuid",
 *   "chunks": [
 *     {
 *       "chunkIndex": 0,
 *       "text": "...",
 *       "characterCount": 150,
 *       "embedding": [0.1, 0.2, ...]
 *     }
 *   ]
 * }
 */
export async function testVectorStorage(req, res) {
  try {
    const { documentId, chunks } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'documentId is required'
      });
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'chunks array is required and must not be empty'
      });
    }

    const result = await storeDocumentChunks(documentId, chunks);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Return safe response without full embedding vectors
    res.json({
      success: true,
      message: 'Document vectors stored successfully',
      documentId: result.documentId,
      chunksStored: result.chunksStored,
      embeddingModel: result.embeddingModel,
      embeddingDimension: result.embeddingDimension
    });
  } catch (error) {
    console.error('Vector storage test error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during vector storage'
    });
  }
}

/**
 * GET /api/rag/vectors/:documentId
 * 
 * Retrieve all vector chunks for a document.
 * Returns chunks with parsed embeddings.
 */
export async function getDocumentVectorChunks(req, res) {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'documentId parameter is required'
      });
    }

    const result = await getDocumentChunks(documentId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    // Return safe response - embedding preview only
    res.json({
      success: true,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
      chunks: result.chunks.map(c => ({
        id: c.id,
        chunkIndex: c.chunkIndex,
        characterCount: c.characterCount,
        embeddingModel: c.embeddingModel,
        embeddingDimension: c.embeddingDimension,
        embeddingPreview: c.embedding.slice(0, 3),
        textPreview: c.text.substring(0, 100) + (c.text.length > 100 ? '...' : '')
      }))
    });
  } catch (error) {
    console.error('Get vector chunks error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error retrieving vector chunks'
    });
  }
}

/**
 * DELETE /api/rag/vectors/:documentId
 * 
 * Delete all vector chunks for a document.
 */
export async function deleteDocumentVectors(req, res) {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'documentId parameter is required'
      });
    }

    const result = await deleteDocumentChunks(documentId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Document vectors deleted successfully',
      documentId: result.documentId,
      chunksDeleted: result.chunksDeleted
    });
  } catch (error) {
    console.error('Delete vector chunks error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error deleting vector chunks'
    });
  }
}
