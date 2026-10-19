// src/components/ui/ThemeToggle.jsx
import React from "react";



export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      title="Toggle theme"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        color: "var(--text)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14 }}>
        {isDark ? "☀️ Light" : "🌙 Dark" }
      </span>
    </button>
  );
}



