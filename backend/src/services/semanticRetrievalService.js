/**
 * Semantic Retrieval Service
 * 
 * Handles semantic similarity search for document chunks.
 * Uses free local Sentence Transformers embeddings and cosine similarity.
 * 
 * Since pgvector extension is not available, similarity search is performed
 * in the application layer using cosine similarity on stored JSON embeddings.
 */

import prisma from '../config/prisma.js';
import { cosineSimilarity } from './vectorPersistenceService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
const DEFAULT_SIMILARITY_THRESHOLD = 0.1;

/**
 * Request question embedding from Python AI service.
 */
async function getQuestionEmbedding(question) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/rag/chunk-and-embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: question }),
    });

    if (!response.ok) {
      throw new Error(`Embedding service returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.chunks || data.chunks.length === 0) {
      throw new Error('Failed to generate question embedding');
    }

    return {
      success: true,
      embedding: data.chunks[0].embedding,
      dimension: data.dimension,
      model: data.model,
    };
  } catch (error) {
    console.error('Embedding service error:', error.message);
    return {
      success: false,
      error: `Embedding service unavailable: ${error.message}`,
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
  const topK = options.topK || DEFAULT_TOP_K;
  const threshold = options.threshold || DEFAULT_SIMILARITY_THRESHOLD;

  // Validate document exists
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, originalName: true },
  });

  if (!document) {
    return {
      success: false,
      error: 'Document not found',
      statusCode: 404,
    };
  }

  // Get question embedding from Python service
  const embeddingResult = await getQuestionEmbedding(question);
  if (!embeddingResult.success) {
    return {
      success: false,
      error: embeddingResult.error,
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
      embeddingDimension: true,
    },
  });

  if (!chunks || chunks.length === 0) {
    return {
      success: true,
      question,
      documentId,
      retrieval: {
        topK,
        chunksFound: 0,
        chunks: [],
      },
    };
  }

  // Compute cosine similarity for each chunk
  const scoredChunks = chunks
    .map((chunk) => {
      const chunkEmbedding = JSON.parse(chunk.embedding);

      if (chunkEmbedding.length !== questionEmbedding.length) {
        console.warn(`Dimension mismatch for chunk ${chunk.chunkIndex}`);
        return null;
      }

      const similarity = cosineSimilarity(questionEmbedding, chunkEmbedding);

      return {
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        characterCount: chunk.characterCount,
        similarity: Math.round(similarity * 10000) / 10000,
      };
    })
    .filter((chunk) => chunk !== null);

  console.log("SCORED CHUNKS RAW:", scoredChunks.map(c => ({ idx: c.chunkIndex, sim: c.similarity })));

  // Sort by similarity (descending)
  scoredChunks.sort((a, b) => b.similarity - a.similarity);

  // Apply threshold filter
  const relevantChunks = scoredChunks.filter((chunk) => chunk.similarity >= threshold);

  // Take top K
  const topChunks = relevantChunks.slice(0, topK);

  return {
    success: true,
    question,
    documentId,
    retrieval: {
      topK,
      chunksFound: topChunks.length,
      chunks: topChunks,
    },
  };
}
