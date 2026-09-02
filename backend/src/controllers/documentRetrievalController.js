import {
  getAllDocuments,
  getDocumentById,
  getDocumentTasks,
  getDocumentRisks,
  getDocumentDecisions
} from '../services/documentRetrievalService.js';

/**
 * Validate UUID format.
 * Returns true if the string is a valid UUID.
 */
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Parse and validate pagination parameters.
 */
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100; // Max limit to prevent abuse

  return { page, limit };
}

/**
 * GET /api/documents
 * List all documents with summary counts and pagination.
 */
export const listDocuments = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const sort = req.query.sort === 'asc' ? 'asc' : 'desc';

    const result = await getAllDocuments({ userId: req.user.id, page, limit, sort });

    res.status(200).json({
      success: true,
      data: result.documents,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Failed to list documents:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents'
    });
  }
};

/**
 * GET /api/documents/:id
 * Get a single document with all its intelligence.
 */
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format'
      });
    }

    const document = await getDocumentById(id, req.user.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Failed to get document:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document'
    });
  }
};

/**
 * GET /api/documents/:id/tasks
 * Get tasks for a specific document.
 */
export const getTasks = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format'
      });
    }

    const document = await getDocumentById(id, req.user.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { page, limit } = parsePagination(req.query);
    const result = await getDocumentTasks(id, { page, limit });

    res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Failed to get tasks:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks'
    });
  }
};

/**
 * GET /api/documents/:id/risks
 * Get risks for a specific document.
 */
export const getRisks = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format'
      });
    }

    const document = await getDocumentById(id, req.user.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { page, limit } = parsePagination(req.query);
    const result = await getDocumentRisks(id, { page, limit });

    res.status(200).json({
      success: true,
      data: result.risks,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Failed to get risks:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve risks'
    });
  }
};

/**
 * GET /api/documents/:id/decisions
 * Get decisions for a specific document.
 */
export const getDecisions = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format'
      });
    }

    const document = await getDocumentById(id, req.user.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { page, limit } = parsePagination(req.query);
    const result = await getDocumentDecisions(id, { page, limit });

    res.status(200).json({
      success: true,
      data: result.decisions,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Failed to get decisions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve decisions'
    });
  }
};
