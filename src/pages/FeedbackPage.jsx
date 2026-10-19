import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");

  // so you can go back to where the student came from
  const from = location.state?.from || "/student";

  const submit = (e) => {
    e.preventDefault();

    const payload = {
      rating,
      comment: comment.trim(),
      email: email.trim(),
      path: window.location.pathname,
      from,
      timestamp: new Date().toISOString(),
    };

    const key = "pp_feedback";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(payload);
    localStorage.setItem(key, JSON.stringify(existing));

    alert("Thanks! Your feedback was saved ✅");
    navigate(from);
  };

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
            placeholder="E.g. proof blocks confusing / hints helpful / UI suggestions..."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--text)",
            }}
          />
        </label>

        <label>
          Email (optional)
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@sutd.edu.sg"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--text)",
            }}
          />
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate(from)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!comment.trim()}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "white",
              cursor: "pointer",
              opacity: !comment.trim() ? 0.6 : 1,
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
