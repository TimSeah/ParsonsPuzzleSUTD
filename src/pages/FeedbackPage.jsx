import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import puzzleService from "../services/puzzleService.js";
import { getStableUserId } from "../services/userIdentity.js";

const MAX_COMMENT = 2000;

const fieldStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid var(--color-border-default)",
  background: "var(--color-canvas-subtle)",
  color: "var(--color-fg-default)",
  font: "inherit",
};

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  font: "inherit",
};

export default function FeedbackPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState(null);

  // so you can go back to where the student came from
  const from = location.state?.from || "/student";
  const canSubmit = comment.trim().length > 0 && status !== "sending";

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    setError(null);
    try {
      await puzzleService.submitFeedback({
        rating,
        comment: comment.trim(),
        email: email.trim() || undefined,
        page: from,
        userId: getStableUserId(),
      });
      setStatus("sent");
    } catch (err) {
      setError(err.message || "Feedback couldn't be sent. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
        <h2>Feedback</h2>
        <p role="status">Thanks! Your feedback was sent to the course team ✅</p>
        <button
          type="button"
          onClick={() => navigate(from)}
          style={{ ...buttonStyle, border: "1px solid var(--color-accent-emphasis)", background: "var(--color-accent-emphasis)", color: "var(--color-fg-on-emphasis)" }}
        >
          Back to puzzles
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
      <h2>Feedback</h2>
      <p>Help us improve SUTD Parsons Puzzles (50.004).</p>

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>
          Overall experience: <b>{rating}/5</b>
          <input
            type="range"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value, 10))}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          What worked well? What was confusing?
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            maxLength={MAX_COMMENT}
            placeholder="E.g. proof blocks confusing / hints helpful / UI suggestions..."
            style={fieldStyle}
          />
        </label>

        <label>
          Email (optional, if you want a reply)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@sutd.edu.sg"
            style={fieldStyle}
          />
        </label>

        {error && (
          <div
            role="alert"
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid var(--color-danger-fg)",
              background: "var(--color-danger-subtle)",
              color: "var(--color-fg-default)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate(from)}
            style={{ ...buttonStyle, border: "1px solid var(--color-border-default)", background: "transparent", color: "var(--color-fg-default)" }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...buttonStyle,
              border: "1px solid var(--color-accent-emphasis)",
              background: "var(--color-accent-emphasis)",
              color: "var(--color-fg-on-emphasis)",
              opacity: canSubmit ? 1 : 0.6,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {status === "sending" ? "Sending..." : "Submit"}
          </button>
        </div>

        <p style={{ color: "var(--color-fg-muted)", fontSize: 13, margin: 0 }}>
          Feedback is stored on the course server with an anonymous browser ID and the page you came from. Your email is only stored if you enter one.
        </p>
      </form>
    </div>
  );
}
