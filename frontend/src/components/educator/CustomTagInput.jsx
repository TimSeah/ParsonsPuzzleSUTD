import { useId, useState } from 'react';
import { Plus } from 'lucide-react';

// Free-text tag entry. Not a <form>, so it can sit inside other forms.
function CustomTagInput({ onAddTag, existingTags = [] }) {
  const [inputValue, setInputValue] = useState('');
  const inputId = useId();
  const normalized = inputValue.trim().toLowerCase();
  const isDuplicate = Boolean(normalized) && existingTags.includes(normalized);

  const add = () => {
    if (!normalized || isDuplicate) return;
    onAddTag(normalized);
    setInputValue('');
  };

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>Add a custom tag</label>
      <div className="cluster" style={{ flexWrap: 'nowrap' }}>
        <input
          id={inputId}
          type="text"
          className="input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. strong-induction"
          aria-invalid={isDuplicate || undefined}
        />
        <button type="button" className="btn" onClick={add} disabled={!normalized || isDuplicate}>
          <Plus size={16} aria-hidden="true" /> Add
        </button>
      </div>
      {isDuplicate && <p className="field__error">This tag is already selected.</p>}
    </div>
  );
}

export default CustomTagInput;
