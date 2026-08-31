import { Link } from 'react-router-dom';
import { formatFileSize, formatDate } from '../utils/formatters';

export default function DocumentCard({ document }) {
  return (
    <Link
      to={`/documents/${document.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {document.originalName}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.fileSize)} • {document.pageCount} pages
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>{document.taskCount || 0} tasks</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          <span>{document.riskCount || 0} risks</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          <span>{document.decisionCount || 0} decisions</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Uploaded {formatDate(document.createdAt)}
      </div>
    </Link>
  );
}
