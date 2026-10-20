import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Dialog } from '../ui';
import puzzleService from '../../services/puzzleService.js';
import { setEducatorKey } from '../../services/educatorSession.js';

const FORM_ID = 'educator-sign-in';

function signInError(error) {
  if (error.status === 401) return 'That key is not correct.';
  if (error.code === 'NETWORK' || error.code === 'TIMEOUT') return "Can't reach the server. Check that the API is running and try again.";
  return error.message;
}

// Asks for the shared educator key, checks it with the server and keeps it
// for this browser tab. Calls onClose(true) once signed in.
function EducatorSignInDialog({ isOpen, onClose }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isOpen) { setKey(''); setError(''); setChecking(false); }
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = key.trim();
    if (!trimmed || checking) return;
    setChecking(true);
    setError('');
    try {
      await puzzleService.checkEducatorKey(trimmed);
      setEducatorKey(trimmed);
      onClose(true);
    } catch (err) {
      setError(signInError(err));
      setChecking(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => onClose(false)}
      title="Educator sign-in"
      footer={(
        <>
          <button type="button" className="btn" onClick={() => onClose(false)}>Cancel</button>
          <button type="submit" form={FORM_ID} className="btn btn--primary" disabled={!key.trim() || checking}>
            <KeyRound size={16} aria-hidden="true" /> {checking ? 'Checking…' : 'Sign in'}
          </button>
        </>
      )}
    >
      <form id={FORM_ID} className="stack" onSubmit={handleSubmit}>
        <p style={{ margin: 0 }}>Enter the educator key to publish and review puzzles. The course team can give it to you.</p>
        <div className="field">
          <label className="field__label" htmlFor="educator-key">Educator key</label>
          <input
            id="educator-key"
            type="password"
            className="input"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="current-password"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'educator-key-error' : undefined}
          />
        </div>
        {error && <div id="educator-key-error" className="notice notice--danger" role="alert">{error}</div>}
      </form>
    </Dialog>
  );
}

export default EducatorSignInDialog;
