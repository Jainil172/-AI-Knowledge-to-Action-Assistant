// Centralized frontend API client connecting to Node.js backend

// Base URL allows for overriding via environment variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Core wrapper for json fetch requests
 */
async function request(url, options = {}) {
  const token = sessionStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.error?.message || data.message || 'Request failed',
      code: data.error?.code || 'UNKNOWN_ERROR',
    };
  }

  return data;
}

export const documentsApi = {
  // GET /api/documents - List all documents
  list: (page = 1, limit = 10) =>
    request(`/documents?page=${page}&limit=${limit}`),

  // GET /api/documents/:id - Get single document analysis
  get: (id) => request(`/documents/${id}`),

  // POST /api/documents/upload - Upload and process PDF
  upload: async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);

    const token = sessionStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData, // fetch natively sets multipart boundary
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'Upload failed',
        code: 'UPLOAD_FAILED',
      };
    }

    return data;
  },

  // GET /api/documents/:id/tasks
  getTasks: (id, page = 1, limit = 50) =>
    request(`/documents/${id}/tasks?page=${page}&limit=${limit}`),

  // GET /api/documents/:id/risks
  getRisks: (id, page = 1, limit = 50) =>
    request(`/documents/${id}/risks?page=${page}&limit=${limit}`),

  // GET /api/documents/:id/decisions
  getDecisions: (id, page = 1, limit = 50) =>
    request(`/documents/${id}/decisions?page=${page}&limit=${limit}`),
};

export const ragApi = {
  // POST /api/rag/ask - Complete RAG QA pipeline
  ask: (documentId, question, topK = 5) =>
    request(`/rag/ask`, {
      method: 'POST',
      body: JSON.stringify({ documentId, question, topK }),
    }),

  // POST /api/rag/retrieve - Manual retrieval testing
  retrieve: (documentId, question, topK = 5) =>
    request(`/rag/retrieve`, {
      method: 'POST',
      body: JSON.stringify({ documentId, question, topK }),
    }),

  // GET /api/rag/health
  health: () => request('/rag/health'),
};

export const healthApi = {
  // GET /api/health
  check: () => request('/health'),

  // GET /api/ai/status
  aiStatus: () => request('/ai/status'),

  // GET /api/database/status
  dbStatus: () => request('/database/status'),
};
