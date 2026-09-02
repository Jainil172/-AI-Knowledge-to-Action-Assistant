import config from '../config/index.js';
import fs from 'fs';
import path from 'path';

const AI_SERVICE_URL = config.aiServiceUrl;

// Health check function
export const getAIServiceHealth = async () => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send PDF file to Python AI service for processing
export const sendPDFToAIService = async (filePath, originalName) => {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    // Create multipart/form-data body
    const boundary = '----FormBoundary' + Date.now();
    const CRLF = '\r\n';

    // Build the multipart body
    let body = '';
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="file"; filename="${originalName}"${CRLF}`;
    body += `Content-Type: application/pdf${CRLF}${CRLF}`;

    // Convert body parts to buffers
    const bodyStart = Buffer.from(body, 'utf-8');
    const bodyEnd = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf-8');

    // Combine all parts
    const fullBody = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

    // Send request to Python AI service
    const response = await fetch(`${AI_SERVICE_URL}/api/documents/process`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: fullBody
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || data.message || 'AI service error' };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Start background task to generate embeddings and save chunks for RAG
export const generateDocumentChunks = async (documentId, cleanedText) => {
  if (!cleanedText) return;
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/rag/chunk-and-embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanedText })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.chunks && data.chunks.length > 0) {
        // Dynamically import vector service to store chunks in pg
        const { storeDocumentChunks } = await import('./vectorPersistenceService.js');
        await storeDocumentChunks(documentId, data.chunks, data.model);
        console.log(`Document ${documentId}: Successfully stored ${data.chunks.length} RAG chunks.`);
      }
    }
  } catch (err) {
    console.error(`Failed to generate embeddings for ${documentId}:`, err);
  }
};
