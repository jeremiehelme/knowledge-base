import { useState, useRef } from "react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  function handleSubmit() {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
