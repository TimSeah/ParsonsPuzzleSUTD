import { Database, Sparkles } from 'lucide-react';

export const SOURCES = [
  { value: 'local', label: 'Bundled', icon: Database, hint: 'Built-in puzzles. Works offline.' },
  { value: 'smart', label: 'AI generated', icon: Sparkles, hint: 'Lean-verified puzzles from the course server, generated if needed.' },
];

export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const TOPICS = [
  { value: 'induction', label: 'Induction' },
  { value: 'set-theory', label: 'Set Theory' },
  { value: 'recursion', label: 'Recursion' },
  { value: 'logic', label: 'Logic' },
  { value: 'combinatorics', label: 'Combinatorics' },
  { value: 'graph-theory', label: 'Graph Theory' },
  { value: 'data-structures', label: 'Data Structures' },
];

// Short description such as "Bundled · Medium · All topics".
export function describeSettings({ dataSource, difficulty, topics }) {
  const source = SOURCES.find(s => s.value === dataSource)?.label ?? dataSource;
  const level = DIFFICULTIES.find(d => d.value === difficulty)?.label ?? difficulty;
  let topicText = 'All topics';
  if (topics.length === 1) topicText = TOPICS.find(t => t.value === topics[0])?.label ?? topics[0];
  else if (topics.length > 1) topicText = `${topics.length} topics`;
  return `${source} · ${level} · ${topicText}`;
}
