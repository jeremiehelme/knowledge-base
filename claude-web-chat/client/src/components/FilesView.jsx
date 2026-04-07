import { useState, useEffect, useMemo } from "react";
import FileCard from "./FileCard.jsx";
import FileSlideOver from "./FileSlideOver.jsx";
import TagFilter from "./TagFilter.jsx";

export default function FilesView({ files, loading, fetchFiles, fetchFileContent, deleteFile }) {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    files.forEach((f) => f.tags.forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = !search ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        (f.summary && f.summary.toLowerCase().includes(search.toLowerCase()));
      const matchesTags = activeTags.length === 0 ||
        activeTags.some((t) => f.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [files, search, activeTags]);

  function handleToggleTag(tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleDelete(file) {
    setDeleteConfirm(file);
  }

  async function confirmDelete() {
    if (deleteConfirm) {
      await deleteFile(deleteConfirm.path);
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold mb-3">Files</h1>
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3"
        />
        {allTags.length > 0 && (
          <TagFilter tags={allTags} activeTags={activeTags} onToggle={handleToggleTag} />
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-gray-400">Loading files...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">No files found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((file) => (
              <FileCard
                key={file.path}
                file={file}
                onView={setViewingFile}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {viewingFile && (
        <FileSlideOver
          file={viewingFile}
          fetchContent={fetchFileContent}
          onClose={() => setViewingFile(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="font-semibold mb-2">Delete file?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This will permanently delete <strong>{deleteConfirm.title}</strong> and remove it from the index.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
