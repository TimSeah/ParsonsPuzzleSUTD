import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, MessageSquare } from "lucide-react";
import puzzleService from "../services/puzzleService.js";
import { getStableUserId } from "../services/userIdentity.js";
import { IS_DEMO } from "../demo/isDemo.js";

const MAX_COMMENT = 2000;
const RATINGS = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
];

const pageStyle = { maxWidth: 640, margin: "0 auto", width: "100%" };

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
      <div style={pageStyle}>
        <div className="card stack" style={{ alignItems: "flex-start" }}>
          <CheckCircle2 size={32} aria-hidden="true" style={{ color: "var(--color-success-fg)" }} />
          <h1 className="page-title">Thank you!</h1>
          <p role="status" style={{ margin: 0 }}>Thanks! Your feedback was sent to the course team.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate(from)}>
            Back to puzzles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Feedback</h1>
          <p className="page-subtitle">Help us improve SUTD Parsons Puzzles (50.004).</p>
        {IS_DEMO && (
          <p className="notice notice--info">This is the demo, so feedback isn&apos;t sent anywhere. The form works as it does in the full app.</p>
        )}
        </div>
      </div>

      <form onSubmit={submit} className="card stack" noValidate>
        <div className="field">
          <span className="field__label" id="rating-label">Overall experience</span>
          <div className="segmented segmented--block" role="radiogroup" aria-labelledby="rating-label">
            {RATINGS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} – ${label}`}
                className="segmented__option"
                onClick={() => setRating(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="field__hint">1 = poor, 5 = great. Currently {rating}/5.</span>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="feedback-comment">What worked well? What was confusing?</label>
          <textarea
            id="feedback-comment"
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            maxLength={MAX_COMMENT}
            placeholder="E.g. proof blocks confusing / hints helpful / UI suggestions..."
          />
          <span className="field__hint">{comment.length}/{MAX_COMMENT}</span>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="feedback-email">Email (optional, if you want a reply)</label>
          <input
            id="feedback-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@sutd.edu.sg"
            autoComplete="email"
          />
        </div>

        {error && <div className="notice notice--danger" role="alert">{error}</div>}

        <div className="cluster" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={() => navigate(from)}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
            <MessageSquare size={16} aria-hidden="true" />
            {status === "sending" ? "Sending..." : "Submit"}
          </button>
        </div>

        <p className="field__hint" style={{ margin: 0 }}>
          Feedback is stored on the course server with an anonymous browser ID and the page you came from. Your email is only stored if you enter one.
        </p>
      </form>
    </div>
  );
}
