export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid var(--color-border-default)",
        background: "var(--color-canvas-subtle)",
        color: "var(--color-fg-default)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14 }}>
        {isDark ? "☀️ Light" : "🌙 Dark"}
      </span>
    </button>
  );
}
