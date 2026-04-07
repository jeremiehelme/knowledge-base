import { useState } from "react";

const inputClass =
  "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

export default function CompetitorList({ competitors = [], onChange }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    onChange([...competitors, { name: name.trim(), url: url.trim() || "" }]);
    setName("");
    setUrl("");
  }

  function handleRemove(index) {
    onChange(competitors.filter((_, i) => i !== index));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div>
      {competitors.length > 0 && (
        <div className="space-y-2 mb-3">
          {competitors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.name}</p>
                {c.url && (
                  <p className="text-xs text-gray-400 truncate">{c.url}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="text-gray-400 hover:text-red-500 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Competitor name"
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://..."
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors flex-shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}
