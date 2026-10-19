import React, { useEffect, useState } from "react";
import styles from "./FeedbackModal.module.css";

/**
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - context: optional object (e.g., { page: "student", puzzleId: "ms-01" })
 */
export default function FeedbackModal({ isOpen, onClose, context }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState(""); // optional
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // reset each time modal opens
      setSubmitted(false);
      setRating(5);
      setComment("");
      setEmail("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = (e) => {
    e.preventDefault();

    const payload = {
      rating,
      comment: comment.trim(),
      email: email.trim(),
      context: context || null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      path: window.location.pathname,
    };

    // ✅ For now: store locally + log
    try {
      const key = "pp_feedback";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(payload);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      console.error("Failed to save feedback to localStorage:", err);
    }

    console.log("Feedback submitted:", payload);
    setSubmitted(true);
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={stop}>
        <div className={styles.header}>
          <h3 className={styles.title}>Feedback</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={submit} className={styles.body}>
            <p className={styles.subtitle}>
              Help us improve SUTD Parsons Puzzles (50.004).
            </p>

            <label className={styles.label}>Overall experience</label>
            <div className={styles.ratingRow}>
              <input
                className={styles.slider}
                type="range"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value, 10))}
              />
              <span className={styles.ratingValue}>{rating}/5</span>
            </div>

            <label className={styles.label} htmlFor="comment">
              What worked well? What was confusing?
            </label>
            <textarea
              id="comment"
              className={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="E.g. The hints were helpful / the proof blocks were unclear / UI suggestions..."
              rows={5}
            />

            <label className={styles.label} htmlFor="email">
              Email (optional, if you want a reply)
            </label>
            <input
              id="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@sutd.edu.sg"
            />

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryBtn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={!comment.trim()}>
                Submit
              </button>
            </div>

            <p className={styles.footnote}>
              (Stored locally for now. Later you can send to a backend/Google Form.)
            </p>
          </form>
        ) : (
          <div className={styles.body}>
            <p className={styles.thanks}>Thanks! Your feedback was recorded ✅</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
