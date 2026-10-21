import { Info } from 'lucide-react';
import { REPO_URL } from './isDemo.js';

// Shown at the top of every page in the GitHub Pages demo.
export default function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      <Info size={16} aria-hidden="true" />
      <p>
        <strong>Demo.</strong> Everything runs in your browser: AI-generated puzzles come from a fixed set of samples,
        educators don&apos;t need to sign in, and anything you publish or review stays in this browser.{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Get the full app on GitHub</a>
      </p>
    </div>
  );
}
