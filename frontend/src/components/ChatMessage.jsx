export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : isError
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-xs bg-white rounded border border-gray-200 text-gray-600"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                  Chunk {source.chunkIndex + 1}
                  {source.similarity && (
                    <span className="ml-1 text-gray-400">
                      ({Math.round(source.similarity * 100)}% match)
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {!isUser && message.metadata && (
          <div className="mt-2 text-xs text-gray-400">
            {message.metadata.processingTimeMs && (
              <span>
                Processed in {(message.metadata.processingTimeMs / 1000).toFixed(
                  1
                )}
                s
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
