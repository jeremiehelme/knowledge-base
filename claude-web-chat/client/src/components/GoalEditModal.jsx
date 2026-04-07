import { useState } from "react";

const PREDEFINED_GOALS = [
  "Get more clients",
  "Grow revenue",
  "Make smarter decisions",
  "Launch my product",
  "Build an online presence",
  "Automate repetitive tasks",
  "Find product-market fit",
  "Create a content strategy",
  "Improve pricing",
  "Hire my first employee",
];

export default function GoalEditModal({ onSave, onClose, existingGoals = [] }) {
  const [selected, setSelected] = useState([]);

  const availableGoals = PREDEFINED_GOALS.filter(
    (g) => !existingGoals.includes(g)
  );

  function toggle(goal) {
    setSelected((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selected.length === 0) return;
    for (const title of selected) {
      await onSave({ title, description: "", status: "in_progress", targetDate: null });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-4">Add Goals</h3>

        {availableGoals.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">All goals already added.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {availableGoals.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggle(g)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selected.includes(g)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="submit" disabled={selected.length === 0} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400">
            Add {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
        </div>
      </form>
    </div>
  );
}
