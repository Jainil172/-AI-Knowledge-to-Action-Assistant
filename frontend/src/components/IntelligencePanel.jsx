import { getPriorityColor, getSeverityColor } from '../utils/formatters';

export default function IntelligencePanel({ title, items, type }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500 text-sm">No {type} found in this document.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {title}
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({items.length})
        </span>
      </h3>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              {item.priority && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                    item.priority
                  )}`}
                >
                  {item.priority}
                </span>
              )}
              {item.severity && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                    item.severity
                  )}`}
                >
                  {item.severity}
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            )}

            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
              {item.owner && <span>Owner: {item.owner}</span>}
              {item.deadline && <span>Deadline: {item.deadline}</span>}
              {item.sourcePageNumber && (
                <span>Page {item.sourcePageNumber}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
