/**
 * Semantic Retrieval Service
 * 
 * Handles semantic similarity search for document chunks.
 * Uses free local Sentence Transformers embeddings and cosine similarity.
 * 
 * Since pgvector extension is not available, similarity search is performed
 * in the application layer using cosine similarity on stored JSON embeddings.
 * 
 * When pgvector is installed, migrate to native vector similarity operators
 * for better performance.
 */

import prisma from '../config/prisma.js';
import { cosineSimilarity } from './vectorPersistenceService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
const DEFAULT_SIMILARITY_THRESHOLD = 0.3;
const MAX_QUESTION_LENGTH = 1000;

/**
 * Validate the user question.
 * @param {string} question
 * @returns {{ valid: boolean, error?: string, normalized?: string }}
 */
function validateQuestion(question) {
  if (!question) {
    return { valid: false, error: 'No question provided' };
  }

  if (typeof question !== 'string') {
    return { valid: false, error: 'Question must be a string' };
  }

  const normalized = question.trim();
  if (normalized.length === 0) {
    return { valid: false, error: 'Question cannot be empty' };
  }

  if (normalized.length > MAX_QUESTION_LENGTH) {
    return { valid: false, error: `Question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters` };
  }

  return { valid: true, normalized };
}

/**
 * Validate and normalize topK parameter.
 * @param {number} topK
 * @returns {{ valid: boolean, error?: string, value?: number }}
 */
function validateTopK(topK) {
  if (topK === undefined || topK === null) {
    return { valid: true, value: DEFAULT_TOP_K };
  }

  const num = parseInt(topK, 10);
  if (isNaN(num) || num < 1) {
    return { valid: false, error: 'topK must be a positive integer' };
  }

  if (num > MAX_TOP_K) {
    return { valid: false, error: `topK cannot exceed ${MAX_TOP_K}` };
  }

  return { valid: true, value: num };
}

/**
 * Request question embedding from Python AI service.
 * @param {string} question
 * @returns {Promise<Object>} Embedding result
 */
async function getQuestionEmbedding(question) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/rag/embed-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: question })
    });

    if (!response.ok) {
      throw new Error(`Python service returned status ${response.status}`);
    }

    const data = await response.json();

    // The embed-preview endpoint returns a preview (first 3 values).
    // We need the full embedding for similarity search.
    // Let's use the generate_embedding endpoint instead.
    const fullResponse = await fetch(`${AI_SERVICE_URL}/api/rag/chunk-and-embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: question })
    });

    if (!fullResponse.ok) {
      throw new Error(`Python service returned status ${fullResponse.status}`);
    }

    const fullData = await fullResponse.json();

    if (!fullData.success || !fullData.chunks || fullData.chunks.length === 0) {
      throw new Error('Failed to generate question embedding');
    }

    // The question is treated as a single chunk
    return {
      success: true,
      embedding: fullData.chunks[0].embedding,
      dimension: fullData.dimension,
      model: fullData.model
    };
  } catch (error) {
    console.error('Failed to get question embedding:', error);
    return {
      success: false,
      error: `Embedding service unavailable: ${error.message}`
    };
  }
}

/**
 * Retrieve relevant document chunks for a question.
 * 
 * @param {string} documentId - The document ID to search within
 * @param {string} question - The user question
 * @param {Object} options - Optional parameters
 * @param {number} options.topK - Number of top chunks to return
 * @param {number} options.threshold - Minimum similarity threshold
 * @returns {Promise<Object>} Retrieval result
 */
export async function retrieveRelevantChunks(documentId, question, options = {}) {
  // Validate question
  const questionValidation = validateQuestion(question);
  if (!questionValidation.valid) {
    return {
      success: false,
      error: questionValidation.error
    };
  }

  const normalizedQuestion = questionValidation.normalized;

  // Validate topK
  const topKValidation = validateTopK(options.topK);
  if (!topKValidation.valid) {
    return {
      success: false,
      error: topKValidation.error
    };
  }

  const topK = topKValidation.value;
  const threshold = options.threshold || DEFAULT_SIMILARITY_THRESHOLD;

  // Validate document exists
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, originalName: true }
  });

  if (!document) {
    return {
      success: false,
      error: 'Document not found',
      statusCode: 404
    };
  }

  // Get question embedding from Python service
  const embeddingResult = await getQuestionEmbedding(normalizedQuestion);
  if (!embeddingResult.success) {
    return {
      success: false,
      error: embeddingResult.error
    };
  }

  const questionEmbedding = embeddingResult.embedding;

  // Retrieve all chunks for the document
  const chunks = await prisma.documentChunk.findMany({
    where: { documentId },
    select: {
      id: true,
      chunkIndex: true,
      text: true,
      characterCount: true,
      embedding: true,
      embeddingDimension: true
    }
  });

  if (!chunks || chunks.length === 0) {
    return {
      success: true,
      question: normalizedQuestion,
      documentId,
      retrieval: {
        topK,
        chunksFound: 0,
        chunks: []
      }
    };
  }

  // Compute cosine similarity for each chunk
  const scoredChunks = chunks.map(chunk => {
    const chunkEmbedding = JSON.parse(chunk.embedding);

    // Validate dimension match
    if (chunkEmbedding.length !== questionEmbedding.length) {
      console.warn(`Dimension mismatch for chunk ${chunk.chunkIndex}: ${chunkEmbedding.length} vs ${questionEmbedding.length}`);
      return null;
    }

    const similarity = cosineSimilarity(questionEmbedding, chunkEmbedding);

    return {
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      characterCount: chunk.characterCount,
      similarity: Math.round(similarity * 10000) / 10000 // Round to 4 decimal places
    };
  }).filter(chunk => chunk !== null);

  // Sort by similarity (descending)
  scoredChunks.sort((a, b) => b.similarity - a.similarity);

  // Apply threshold filter
  const relevantChunks = scoredChunks.filter(chunk => chunk.similarity >= threshold);

  // Take top K
  const topChunks = relevantChunks.slice(0, topK);

  return {
    success: true,
    question: normalizedQuestion,
    documentId,
    retrieval: {
      topK,
      chunksFound: topChunks.length,
      chunks: topChunks
    }
  };
}
