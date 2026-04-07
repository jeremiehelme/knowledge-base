import { useState } from "react";
import GoalEditModal from "./GoalEditModal.jsx";

export default function GoalsSection({ goals = [], onAdd, onDelete }) {
  const [showAdd, setShowAdd] = useState(false);

  async function handleSave(data) {
    await onAdd(data);
    setShowAdd(false);
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Goals</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs font-medium text-blue-500 hover:text-blue-600"
        >
          + Add
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-gray-400">No goals yet. Add your first goal!</p>
      ) : (
        <div className="space-y-1">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <p className="text-sm font-medium flex-1">{goal.title}</p>
              <button
                onClick={() => onDelete(goal.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <GoalEditModal
          existingGoals={goals.map((g) => g.title)}
          onSave={handleSave}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
