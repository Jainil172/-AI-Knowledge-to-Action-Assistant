const API_BASE = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
  list: (page = 1, limit = 10) =>
    request(`/documents?page=${page}&limit=${limit}`),

  get: (id) => request(`/documents/${id}`),

  upload: async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
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

  getTasks: (id, page = 1, limit = 50) =>
    request(`/documents/${id}/tasks?page=${page}&limit=${limit}`),

  getRisks: (id, page = 1, limit = 50) =>
    request(`/documents/${id}/risks?page=${page}&limit=${limit}`),

  getDecisions: (id, page = 1, limit = 50) =>
    request(`/documents/${id}/decisions?page=${page}&limit=${limit}`),
};

export const ragApi = {
  ask: (documentId, question, topK = 5) =>
    request(`/documents/${documentId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question, topK }),
    }),

  retrieve: (documentId, question, topK = 5) =>
    request(`/rag/retrieve`, {
      method: 'POST',
      body: JSON.stringify({ documentId, question, topK }),
    }),

  health: () => request('/rag/health'),
};

export const healthApi = {
  check: () => request('/health'),
  aiStatus: () => request('/ai/status'),
  dbStatus: () => request('/database/status'),
};
