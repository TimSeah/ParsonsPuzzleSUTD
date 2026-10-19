import React, { useState } from 'react';
import styles from './CustomTagInput.module.css';

function CustomTagInput({ onAddTag, existingTags = [] }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim().toLowerCase();
    
    if (trimmedValue && !existingTags.includes(trimmedValue)) {
      onAddTag(trimmedValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className={styles['custom-tag-input']}>
      <h4>Add Custom Tag:</h4>
      <form onSubmit={handleSubmit} className={styles['input-form']}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter custom tag..."
          className={styles['tag-input']}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || existingTags.includes(inputValue.trim().toLowerCase())}
          className={styles['add-tag-btn']}
        >
          ➕ Add
        </button>
      </form>
      {inputValue.trim() && existingTags.includes(inputValue.trim().toLowerCase()) && (
        <div className={styles['duplicate-warning']}>
          This tag already exists
        </div>
      )}
    </div>
  );
}

export default CustomTagInput;
