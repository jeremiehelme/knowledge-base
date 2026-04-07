import { useState } from "react";
import GoalEditModal from "./GoalEditModal.jsx";

const STATUS_STYLES = {
  not_started: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-400", label: "Not started" },
  in_progress: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "In progress" },
  achieved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", label: "Achieved" },
};

const NEXT_STATUS = { not_started: "in_progress", in_progress: "achieved", achieved: "not_started" };

export default function GoalsSection({ goals = [], onAdd, onUpdate, onDelete }) {
  const [editingGoal, setEditingGoal] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  async function handleStatusToggle(goal) {
    await onUpdate(goal.id, { status: NEXT_STATUS[goal.status] || "not_started" });
  }

  async function handleSave(data) {
    if (editingGoal?.id) {
      await onUpdate(editingGoal.id, data);
    } else {
      await onAdd(data);
    }
    setEditingGoal(null);
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
        <div className="space-y-2">
          {goals.map((goal) => {
            const style = STATUS_STYLES[goal.status] || STATUS_STYLES.not_started;
            return (
              <div key={goal.id} className="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group">
                <button
                  onClick={() => handleStatusToggle(goal)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    goal.status === "achieved"
                      ? "border-green-500 bg-green-500 text-white"
                      : goal.status === "in_progress"
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  title="Toggle status"
                >
                  {goal.status === "achieved" && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${goal.status === "achieved" ? "line-through text-gray-400" : ""}`}>
                    {goal.title}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                {goal.targetDate && (
                  <span className="text-xs text-gray-400">{goal.targetDate}</span>
                )}
                <button
                  onClick={() => setEditingGoal(goal)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(goal.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(showAdd || editingGoal) && (
        <GoalEditModal
          goal={editingGoal?.id ? editingGoal : null}
          existingGoals={goals.map((g) => g.title)}
          onSave={handleSave}
          onClose={() => { setEditingGoal(null); setShowAdd(false); }}
        />
      )}
    </div>
  );
}
