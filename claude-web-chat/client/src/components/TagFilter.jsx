export default function TagFilter({ tags, activeTags, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeTags.includes(tag)
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
