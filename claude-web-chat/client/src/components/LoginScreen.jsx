import { useState } from "react";

export default function LoginScreen({ onLogin, error }) {
  const [token, setToken] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (token.trim()) {
      onLogin(token.trim());
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Claude Web Chat</h1>
        <label className="block text-sm font-medium mb-2" htmlFor="token">
          Access Token
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your token"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
        >
          Connect
        </button>
      </form>
    </div>
  );
}
