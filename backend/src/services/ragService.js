/**
 * RAG Orchestration Service
 * 
 * Single orchestration point for the complete RAG pipeline:
 * Question → Embedding → Retrieval → Answer Generation
 * 
 * Uses Groq via Python AI service for answer generation.
 * Embeddings generated via Sentence Transformers (local, free).
 */

import prisma from '../config/prisma.js';
import { retrieveRelevantChunks } from './semanticRetrievalService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// RAG Configuration
const RAG_CONFIG = {
  DEFAULT_TOP_K: 5,
  MAX_TOP_K: 20,
  DEFAULT_SIMILARITY_THRESHOLD: 0.1,
  MAX_QUESTION_LENGTH: 1000,
};

// Error codes for structured error responses
const ERROR_CODES = {
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  INVALID_QUESTION: 'INVALID_QUESTION',
  INVALID_TOP_K: 'INVALID_TOP_K',
  CHUNKS_NOT_FOUND: 'CHUNKS_NOT_FOUND',
  EMBEDDING_SERVICE_UNAVAILABLE: 'EMBEDDING_SERVICE_UNAVAILABLE',
  ANSWER_GENERATION_FAILED: 'ANSWER_GENERATION_FAILED',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * Create a structured error response.
 */
function createErrorResponse(code, message, details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Create a structured success response.
 */
function createSuccessResponse(data) {
  return {
    success: true,
    ...data,
  };
}

/**
 * Validate the user question.
 */
function validateQuestion(question) {
  if (!question || typeof question !== 'string') {
    return createErrorResponse(ERROR_CODES.INVALID_QUESTION, 'Question is required and must be a string');
  }

  const normalized = question.trim();
  if (normalized.length === 0) {
    return createErrorResponse(ERROR_CODES.INVALID_QUESTION, 'Question cannot be empty');
  }

  if (normalized.length > RAG_CONFIG.MAX_QUESTION_LENGTH) {
    return createErrorResponse(
      ERROR_CODES.INVALID_QUESTION,
      `Question exceeds maximum length of ${RAG_CONFIG.MAX_QUESTION_LENGTH} characters`
    );
  }

  return { success: true, normalized };
}

/**
 * Validate and normalize topK parameter.
 */
function validateTopK(topK) {
  if (topK === undefined || topK === null) {
    return { success: true, value: RAG_CONFIG.DEFAULT_TOP_K };
  }

  const num = parseInt(topK, 10);
  if (isNaN(num) || num < 1) {
    return createErrorResponse(ERROR_CODES.INVALID_TOP_K, 'topK must be a positive integer');
  }

  if (num > RAG_CONFIG.MAX_TOP_K) {
    return createErrorResponse(ERROR_CODES.INVALID_TOP_K, `topK cannot exceed ${RAG_CONFIG.MAX_TOP_K}`);
  }

  return { success: true, value: num };
}

/**
 * Generate a grounded RAG answer using Groq via Python service.
 */
async function generateAnswer(question, chunks) {
  if (!chunks || chunks.length === 0) {
    return {
      success: true,
      answer: "I could not find relevant information about this in the uploaded document.",
      sources: [],
    };
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/rag/generate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        chunks: chunks.map((c) => ({
          chunkIndex: c.chunkIndex,
          text: c.text,
          similarity: c.similarity,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return createErrorResponse(
        ERROR_CODES.ANSWER_GENERATION_FAILED,
        data.error || data.message || 'Failed to generate answer'
      );
    }

    return {
      success: true,
      answer: data.answer,
      sources: data.sources || [],
    };
  } catch (error) {
    console.error('Answer generation failed:', error.message);
    return createErrorResponse(
      ERROR_CODES.AI_SERVICE_UNAVAILABLE,
      `Answer generation service unavailable: ${error.message}`
    );
  }
}

/**
 * Complete RAG pipeline: retrieve relevant chunks and generate a grounded answer.
 * 
 * @param {string} documentId - The document ID to search within
 * @param {string} question - The user question
 * @param {Object} options - Optional parameters
 * @param {number} options.topK - Number of top chunks to return (default: 5)
 * @param {number} options.threshold - Minimum similarity threshold (default: 0.3)
 * @returns {Promise<Object>} Structured response with answer and metadata
 */
export async function askDocument(documentId, question, options = {}) {
  const startTime = Date.now();

  // Step 1: Validate question
  const questionValidation = validateQuestion(question);
  if (!questionValidation.success) {
    return questionValidation;
  }

  const normalizedQuestion = questionValidation.normalized;

  // Step 2: Validate topK
  const topKValidation = validateTopK(options.topK);
  if (!topKValidation.success) {
    return topKValidation;
  }

  const topK = topKValidation.value;
  const threshold = options.threshold || RAG_CONFIG.DEFAULT_SIMILARITY_THRESHOLD;

  // Step 3: Validate document exists
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, originalName: true },
  });

  if (!document) {
    return createErrorResponse(ERROR_CODES.DOCUMENT_NOT_FOUND, 'Document not found');
  }

  // Step 4: Retrieve relevant chunks
  const retrievalResult = await retrieveRelevantChunks(documentId, normalizedQuestion, { topK, threshold });

  if (!retrievalResult.success) {
    return retrievalResult;
  }

  const chunks = retrievalResult.retrieval?.chunks || [];

  // Step 5: Generate answer using retrieved chunks
  const answerResult = await generateAnswer(normalizedQuestion, chunks);

  if (!answerResult.success) {
    return answerResult;
  }

  const processingTimeMs = Date.now() - startTime;

  // Step 6: Return structured response
  return createSuccessResponse({
    question: normalizedQuestion,
    documentId,
    documentName: document.originalName,
    answer: answerResult.answer,
    sources: answerResult.sources,
    metadata: {
      chunksRetrieved: chunks.length,
      topK,
      similarityThreshold: threshold,
      processingTimeMs,
    },
  });
}

/**
 * Retrieve relevant chunks only (without answer generation).
 * 
 * @param {string} documentId - The document ID to search within
 * @param {string} question - The user question
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} Structured response with chunks
 */
export async function retrieveChunks(documentId, question, options = {}) {
  // Validate question
  const questionValidation = validateQuestion(question);
  if (!questionValidation.success) {
    return questionValidation;
  }

  // Validate topK
  const topKValidation = validateTopK(options.topK);
  if (!topKValidation.success) {
    return topKValidation;
  }

  // Retrieve chunks
  const retrievalResult = await retrieveRelevantChunks(documentId, questionValidation.normalized, options);

  if (!retrievalResult.success) {
    return retrievalResult;
  }

  return createSuccessResponse({
    question: questionValidation.normalized,
    documentId,
    retrieval: retrievalResult.retrieval,
  });
}

/**
 * Check RAG service health and configuration.
 */
export async function getHealthStatus() {
  let aiServiceHealthy = false;

  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);
    if (response.ok) {
      aiServiceHealthy = true;
    }
  } catch (error) {
    // AI service unavailable
  }

  return {
    success: true,
    status: aiServiceHealthy ? 'healthy' : 'degraded',
    config: {
      aiServiceUrl: AI_SERVICE_URL,
      defaultTopK: RAG_CONFIG.DEFAULT_TOP_K,
      maxTopK: RAG_CONFIG.MAX_TOP_K,
      defaultSimilarityThreshold: RAG_CONFIG.DEFAULT_SIMILARITY_THRESHOLD,
      maxQuestionLength: RAG_CONFIG.MAX_QUESTION_LENGTH,
    },
    services: {
      postgresql: 'connected',
      aiService: aiServiceHealthy ? 'connected' : 'unavailable',
      embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
      llmProvider: 'Groq',
    },
  };
}
