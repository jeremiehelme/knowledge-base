export default function FileCard({ file, onView, onDelete }) {
  function handleClick() {
    if (file.type === "web" && file.url) {
      window.open(file.url, "_blank");
    } else {
      onView(file);
    }
  }

  return (
    <div
      onClick={handleClick}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col gap-2"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
          {file.title}
        </h3>
        {file.type === "web" && file.url && (
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
      {file.summary && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{file.summary}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-auto">
        {file.tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
        <span>{file.date}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file);
          }}
          className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
