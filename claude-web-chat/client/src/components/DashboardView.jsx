import { useState } from "react";
import CompanySummaryCard from "./CompanySummaryCard.jsx";

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

export default function DashboardView({
  profile,
  sessions,
  agents,
  selectedAgent,
  onSelectAgent,
  onNavigate,
  onSendMessage,
  onAddGoal,
  onDeleteGoal,
}) {
  const [promptText, setPromptText] = useState("");

  const recentSessions = (sessions || []).slice(0, 5);
  const goals = Array.isArray(profile?.goals) ? profile.goals : [];
  const activeGoalTitles = goals.map((g) => g.title);

  function handlePromptSubmit(e) {
    e.preventDefault();
    if (!promptText.trim()) return;
    onSendMessage(promptText.trim(), selectedAgent);
    setPromptText("");
  }

  async function toggleGoal(title) {
    const existing = goals.find((g) => g.title === title);
    if (existing) {
      await onDeleteGoal(existing.id);
    } else {
      await onAddGoal({ title, description: "", status: "in_progress", targetDate: null });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {(!profile || !profile.onboardingCompleted) && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Complete your business profile to get better advice from your Assistant.
          </p>
          <button onClick={() => onNavigate("onboarding")} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline ml-4 flex-shrink-0">
            Complete profile
          </button>
        </div>
      )}

      <CompanySummaryCard profile={profile} />

      {/* Goals */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Your Goals</h2>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_GOALS.map((title) => (
            <button
              key={title}
              onClick={() => toggleGoal(title)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeGoalTitles.includes(title)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Ask your Advisor */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ask your Advisor</h2>
        </div>
        <form onSubmit={handlePromptSubmit} className="flex gap-2">
          <select
            value={selectedAgent}
            onChange={(e) => onSelectAgent(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(agents || []).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="What would you like to discuss?"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={!promptText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
          >
            Send
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Recent Conversations</h2>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onNavigate(`chat/${session.id}`)}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <p className="text-sm font-medium truncate flex-1">{session.title || "Untitled"}</p>
                  <span className="text-xs text-gray-400 ml-2">{new Date(session.lastUsed).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Cards */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Your Agents</h2>
          <div className="grid grid-cols-2 gap-2">
            {(agents || []).map((agent) => (
              <button
                key={agent.id}
                onClick={() => { onSelectAgent(agent.id); onNavigate("chat"); }}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-left hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{agent.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
