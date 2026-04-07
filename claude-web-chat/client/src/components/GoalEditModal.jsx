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

export default function GoalEditModal({ goal, onSave, onClose, existingGoals = [] }) {
  const [title, setTitle] = useState(goal?.title || "");
  const [status, setStatus] = useState(goal?.status || "not_started");
  const [targetDate, setTargetDate] = useState(goal?.targetDate || "");

  const isEditing = !!goal;

  // Filter out goals already added
  const availableGoals = PREDEFINED_GOALS.filter(
    (g) => !existingGoals.includes(g) || g === goal?.title
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!title) return;
    onSave({ title, description: "", status, targetDate: targetDate || null });
  }

  const statuses = [
    { value: "not_started", label: "Not started" },
    { value: "in_progress", label: "In progress" },
    { value: "achieved", label: "Achieved" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-4">{isEditing ? "Edit Goal" : "Add Goal"}</h3>

        {isEditing ? (
          <>
            <label className="block text-sm font-medium mb-1">Goal</label>
            <p className="text-sm mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">{title}</p>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium mb-2">Select a goal</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableGoals.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setTitle(g)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    title === g
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="block text-sm font-medium mb-1">Status</label>
        <div className="flex gap-2 mb-3">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                status === s.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium mb-1">Target date</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-4"
        />

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="submit" disabled={!title} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400">
            {isEditing ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
