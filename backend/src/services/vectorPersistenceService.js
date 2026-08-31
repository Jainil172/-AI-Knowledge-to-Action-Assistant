/**
 * Vector Persistence Service
 * 
 * Handles storage of document chunks with embeddings in PostgreSQL.
 * Embeddings are stored as JSON arrays for Prisma compatibility.
 * 
 * When pgvector extension is available, migrate the embedding column
 * to vector(384) type and update the raw SQL queries accordingly.
 * 
 * Isolated raw SQL for vector operations keeps the rest of the project
 * using Prisma normally.
 */

import prisma from '../config/prisma.js';

const VALID_EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const EXPECTED_DIMENSION = 384;

/**
 * Validate a single embedding vector.
 * @param {Array} embedding - The embedding vector to validate
 * @param {number} expectedDimension - Expected dimension (default 384)
 * @returns {{ valid: boolean, error?: string }}
 */
function validateEmbedding(embedding, expectedDimension = EXPECTED_DIMENSION) {
  if (!embedding || !Array.isArray(embedding)) {
    return { valid: false, error: 'Embedding must be a non-empty array' };
  }

  if (embedding.length === 0) {
    return { valid: false, error: 'Embedding array is empty' };
  }

  if (embedding.length !== expectedDimension) {
    return { valid: false, error: `Embedding dimension mismatch: expected ${expectedDimension}, got ${embedding.length}` };
  }

  if (!embedding.every(v => typeof v === 'number' && !isNaN(v))) {
    return { valid: false, error: 'Embedding contains non-numeric values' };
  }

  return { valid: true };
}

/**
 * Validate all chunks before storage.
 * @param {string} documentId
 * @param {Array} chunks - Array of chunk objects with embeddings
 * @returns {{ valid: boolean, error?: string }}
 */
function validateChunks(documentId, chunks) {
  if (!documentId || typeof documentId !== 'string') {
    return { valid: false, error: 'Invalid documentId' };
  }

  if (!Array.isArray(chunks) || chunks.length === 0) {
    return { valid: false, error: 'No chunks provided for storage' };
  }

  const dimensions = new Set();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const label = `Chunk at index ${i}`;

    if (!chunk || typeof chunk !== 'object') {
      return { valid: false, error: `${label} is not a valid object` };
    }

    if (typeof chunk.chunkIndex !== 'number' || chunk.chunkIndex < 0) {
      return { valid: false, error: `${label} has invalid chunkIndex` };
    }

    if (!chunk.text || typeof chunk.text !== 'string' || chunk.text.trim().length === 0) {
      return { valid: false, error: `${label} has empty or missing text` };
    }

    if (typeof chunk.characterCount !== 'number' || chunk.characterCount <= 0) {
      return { valid: false, error: `${label} has invalid characterCount` };
    }

    if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
      return { valid: false, error: `${label} has missing or invalid embedding` };
    }

    const embeddingCheck = validateEmbedding(chunk.embedding);
    if (!embeddingCheck.valid) {
      return { valid: false, error: `${label}: ${embeddingCheck.error}` };
    }

    dimensions.add(chunk.embedding.length);
  }

  if (dimensions.size > 1) {
    return { valid: false, error: `Inconsistent embedding dimensions: ${[...dimensions].join(', ')}` };
  }

  return { valid: true };
}

/**
 * Store document chunks with embeddings in a single transaction.
 * Uses upsert to prevent duplicates (documentId + chunkIndex uniqueness).
 * 
 * @param {string} documentId - The document ID
 * @param {Array} chunks - Array of chunk objects with embeddings
 * @param {string} embeddingModel - Model name (default: sentence-transformers/all-MiniLM-L6-v2)
 * @returns {Object} Storage result
 */
export async function storeDocumentChunks(documentId, chunks, embeddingModel = VALID_EMBEDDING_MODEL) {
  // Validate document exists
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true }
  });

  if (!document) {
    return {
      success: false,
      error: `Document not found: ${documentId}`
    };
  }

  // Validate all chunks and embeddings
  const validation = validateChunks(documentId, chunks);
  if (!validation.valid) {
    return {
      success: false,
      error: `Validation failed: ${validation.error}`
    };
  }

  try {
    // Store all chunks in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const storedChunks = [];

      for (const chunk of chunks) {
        // Upsert: update if exists, create if not
        const storedChunk = await tx.documentChunk.upsert({
          where: {
            documentId_chunkIndex: {
              documentId: documentId,
              chunkIndex: chunk.chunkIndex
            }
          },
          update: {
            text: chunk.text.trim(),
            characterCount: chunk.characterCount,
            embedding: JSON.stringify(chunk.embedding),
            embeddingModel: embeddingModel,
            embeddingDimension: chunk.embedding.length
          },
          create: {
            documentId: documentId,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text.trim(),
            characterCount: chunk.characterCount,
            embedding: JSON.stringify(chunk.embedding),
            embeddingModel: embeddingModel,
            embeddingDimension: chunk.embedding.length
          }
        });

        storedChunks.push({
          id: storedChunk.id,
          chunkIndex: storedChunk.chunkIndex,
          characterCount: storedChunk.characterCount,
          embeddingDimension: storedChunk.embeddingDimension
        });
      }

      return storedChunks;
    });

    return {
      success: true,
      documentId: documentId,
      chunksStored: result.length,
      embeddingModel: embeddingModel,
      embeddingDimension: result[0]?.embeddingDimension || EXPECTED_DIMENSION,
      chunks: result
    };
  } catch (error) {
    console.error('Vector storage transaction failed:', error);
    return {
      success: false,
      error: `Transaction failed: ${error.message}`
    };
  }
}

/**
 * Retrieve all chunks for a document with parsed embeddings.
 * @param {string} documentId
 * @returns {Object} Chunks with parsed embeddings
 */
export async function getDocumentChunks(documentId) {
  try {
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
      select: {
        id: true,
        chunkIndex: true,
        text: true,
        characterCount: true,
        embedding: true,
        embeddingModel: true,
        embeddingDimension: true,
        createdAt: true
      }
    });

    // Parse embedding JSON for each chunk
    const parsedChunks = chunks.map(chunk => ({
      ...chunk,
      embedding: JSON.parse(chunk.embedding)
    }));

    return {
      success: true,
      documentId,
      chunkCount: parsedChunks.length,
      chunks: parsedChunks
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to retrieve chunks: ${error.message}`
    };
  }
}

/**
 * Delete all chunks for a document.
 * @param {string} documentId
 * @returns {Object} Deletion result
 */
export async function deleteDocumentChunks(documentId) {
  try {
    const result = await prisma.documentChunk.deleteMany({
      where: { documentId }
    });

    return {
      success: true,
      documentId,
      chunksDeleted: result.count
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete chunks: ${error.message}`
    };
  }
}

/**
 * Compute cosine similarity between two vectors.
 * Used for future semantic search when pgvector is not available.
 * @param {Array} vecA
 * @param {Array} vecB
 * @returns {number} Similarity score between -1 and 1
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
