import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsApi } from '../services/api';
import { formatFileSize, formatDate } from '../utils/formatters';
import IntelligencePanel from '../components/IntelligencePanel';
import AskDocument from '../components/AskDocument';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocument();
  }, [id]);

  async function loadDocument() {
    try {
      setLoading(true);
      setError(null);

      const result = await documentsApi.get(id);

      if (result.success) {
        setDocument(result.data);
      } else {
        setError('Document not found');
      }
    } catch (err) {
      if (err.status === 404) {
        setError('Document not found');
      } else {
        setError(err.message || 'Failed to load document');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="ml-3 text-gray-600">Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{error}</h3>
        <div className="mt-4 space-x-3">
          <button
            onClick={loadDocument}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Back to documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {document.originalName}
          </h1>
          <p className="text-sm text-gray-500">
            {formatFileSize(document.fileSize)} • {document.pageCount} pages •{' '}
            Uploaded {formatDate(document.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <IntelligencePanel
            title="Tasks"
            items={document.tasks}
            type="tasks"
          />

          <IntelligencePanel
            title="Risks"
            items={document.risks}
            type="risks"
          />

          <IntelligencePanel
            title="Decisions"
            items={document.decisions}
            type="decisions"
          />
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <AskDocument documentId={document.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
