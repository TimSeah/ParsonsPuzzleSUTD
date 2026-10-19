import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

// Accessible modal dialog. `variant="sheet"` docks it to the bottom of the
// screen on mobile. Closes on Escape and backdrop click, locks page scroll,
// focuses the first field and restores focus on close. Children should not
// use `autoFocus`, which would run before the previous focus is recorded.
export default function Dialog({ isOpen, onClose, title, variant = 'dialog', children, footer }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const focusTarget = dialogRef.current?.querySelector('input, select, textarea, button:not([data-dialog-close])')
      || dialogRef.current;
    focusTarget?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`overlay${variant === 'sheet' ? ' overlay--sheet' : ''}`}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="dialog__header">
          <h2 id={titleId} className="dialog__title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" data-dialog-close>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="dialog__body">{children}</div>
        {footer && <div className="dialog__footer">{footer}</div>}
      </div>
    </div>
  );
}
