import { CheckCircle2, Download } from 'lucide-react';
import { Dialog } from '../ui';
import { IS_DEMO } from '../../demo/isDemo';

// Confirms a published puzzle. `savedTo` is 'server' (students see it now)
// or 'local' (server unavailable: saved in this browser and downloaded).
function PuzzleSuccessModal({ isOpen, onClose, puzzleTitle, filename, savedTo = 'server' }) {
  const savedLocally = savedTo === 'local';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Puzzle published"
      footer={<button type="button" className="btn btn--primary" onClick={onClose}>Done</button>}
    >
      <div className="stack">
        <div className={`notice ${savedLocally ? 'notice--warning' : 'notice--success'}`}>
          {savedLocally ? <Download size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
          <div>
            <strong>{puzzleTitle || 'Your puzzle'}</strong>
            <p style={{ margin: '0.25rem 0 0' }}>
              {savedLocally
                ? 'The server was unavailable, so the puzzle was saved in this browser and downloaded as a JSON file.'
                : IS_DEMO
                  ? 'Saved in this browser for the demo and counted on the dashboard. In the full app it goes to the course database.'
                  : 'Saved to the course database. Students can solve it now.'}
            </p>
          </div>
        </div>

        {savedLocally && (
          <div>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Students can&apos;t see it yet. Next steps:</p>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>Publish it again once the server is back online, or</li>
              <li>
                Keep {filename ? <code>{filename}</code> : 'the downloaded file'} and ask the project maintainer to import it.
                Don&apos;t replace the bundled file with it: it only holds puzzles saved in this browser.
              </li>
            </ol>
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default PuzzleSuccessModal;
