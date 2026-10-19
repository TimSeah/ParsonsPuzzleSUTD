import React, { useEffect, useState } from "react";
import { PuzzleDisplay, UnifiedControlPanel, LoadingState } from "../components";
import { FloatingHelpButton, StatusIndicator } from "../components/ui";
import { useAppState } from "../hooks/useAppState";
import styles from "./StudentPage.module.css";

const SUBMODE_KEY = "student_submode";
const SUBMODES = { PRACTICE: "practice", CHALLENGE: "challenge" };

export default function StudentPage() {
  const {
    currentPuzzle,
    useLocalData,
    puzzles,
    isUsingApi,
    isLoading,
    healthLoading,
    puzzlesError,
    isLastPuzzle,
    handlePuzzleChange,
    handleNextPuzzle,
    toggleDataSource,
  } = useAppState();

  const [submode, setSubmode] = useState(SUBMODES.PRACTICE);

  useEffect(() => {
    const saved = localStorage.getItem(SUBMODE_KEY);
    if (saved === SUBMODES.PRACTICE || saved === SUBMODES.CHALLENGE) setSubmode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(SUBMODE_KEY, submode);
  }, [submode]);

  if (isLoading) {
    return <LoadingState title="Loading puzzles..." message="Connecting to database..." />;
  }

  if (!currentPuzzle) {
    return (
      <LoadingState
        title="No puzzles available"
        message="Please check your connection or try refreshing the page."
      />
    );
  }

  return (
    <div className={styles["student-page"]}>
      <header className={styles["page-header"]}>
        <h1>Parsons Puzzles for Math Proofs</h1>
        <p>Practice formal mathematical proofs through interactive drag-and-drop puzzles</p>

        {/* Submodes */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setSubmode(SUBMODES.PRACTICE)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: submode === SUBMODES.PRACTICE ? "1px solid rgba(56,189,248,0.5)" : "1px solid var(--color-border-default)",
              background: submode === SUBMODES.PRACTICE ? "rgba(56,189,248,0.14)" : "var(--color-canvas-subtle)",
              color: submode === SUBMODES.PRACTICE ? "rgba(56,189,248,1)" :    "var(--color-fg-default)",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Practice Mode
          </button>

          <button
            type="button"
            onClick={() => setSubmode(SUBMODES.CHALLENGE)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: submode === SUBMODES.PRACTICE ? "1px solid rgba(56,189,248,0.5)" : "1px solid var(--color-border-default)",
              background: submode === SUBMODES.CHALLENGE ? "rgba(56,189,248,0.14)" : "var(--color-canvas-subtle)",
              color: submode === SUBMODES.CHALLENGE ? "rgba(56,189,248,1)" : "var(--color-fg-default)",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Challenge Mode
          </button>
        </div>
      </header>

      <UnifiedControlPanel
        isUsingApi={isUsingApi}
        puzzles={puzzles}
        currentPuzzle={currentPuzzle}
        useLocalData={useLocalData}
        onToggleDataSource={toggleDataSource}
        onPuzzleChange={handlePuzzleChange}
        healthLoading={healthLoading}
        puzzlesError={puzzlesError}
      />

      <main className={styles["main-content"]}>
        <PuzzleDisplay
          key={`${currentPuzzle.id}:${submode}`}
          puzzle={currentPuzzle}
          onNextPuzzle={handleNextPuzzle}
          isLastPuzzle={isLastPuzzle}
          mode={submode} // <<< IMPORTANT
        />
      </main>

      <StatusIndicator isUsingApi={isUsingApi} isLoading={isLoading || healthLoading} />
      <FloatingHelpButton />
    </div>
  );
}




