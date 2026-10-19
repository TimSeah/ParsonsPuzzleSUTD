import { DIFFICULTIES, SOURCES, TOPICS } from './puzzleSettingsOptions';
import styles from './PuzzleSettings.module.css';

function RadioSegments({ label, options, value, onChange }) {
  return (
    <div className="segmented segmented--block" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className="segmented__option"
            onClick={() => onChange(option.value)}
          >
            {Icon && <Icon size={15} aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Source, difficulty and topic choices for the next puzzle.
export default function PuzzleSettings({ dataSource, onDataSourceChange, difficulty, onDifficultyChange, topics, onTopicsChange }) {
  const toggleTopic = (value) => {
    onTopicsChange(topics.includes(value) ? topics.filter(t => t !== value) : [...topics, value]);
  };
  const sourceHint = SOURCES.find(s => s.value === dataSource)?.hint;

  return (
    <div className={styles.settings}>
      <div className={styles.group}>
        <span className={styles.label}>Puzzles</span>
        <RadioSegments label="Puzzle source" options={SOURCES} value={dataSource} onChange={onDataSourceChange} />
        {sourceHint && <p className={styles.hint}>{sourceHint}</p>}
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Difficulty</span>
        <RadioSegments label="Difficulty" options={DIFFICULTIES} value={difficulty} onChange={onDifficultyChange} />
      </div>

      <div className={styles.group}>
        <div className={styles.labelRow}>
          <span className={styles.label} id="settings-topics">Topics</span>
          {topics.length > 0 && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => onTopicsChange([])}>
              Clear
            </button>
          )}
        </div>
        <div className={styles.chips} role="group" aria-labelledby="settings-topics">
          {TOPICS.map((topic) => (
            <button
              key={topic.value}
              type="button"
              className="chip"
              aria-pressed={topics.includes(topic.value)}
              onClick={() => toggleTopic(topic.value)}
            >
              {topic.label}
            </button>
          ))}
        </div>
        <p className={styles.hint}>{topics.length ? 'Puzzles from any selected topic.' : 'No topic selected: any topic.'}</p>
      </div>
    </div>
  );
}
