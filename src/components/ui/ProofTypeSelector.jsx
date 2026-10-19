import React from 'react';
import styles from './ProofTypeSelector.module.css';

const ProofTypeSelector = ({ 
  selectedProofTypes = [], 
  onProofTypesChange, 
  disabled = false 
}) => {
  const proofTypes = [
    { value: 'induction', label: 'Induction' },
    { value: 'set-theory', label: 'Set Theory' },
    { value: 'recursion', label: 'Recursion' },
    { value: 'logic', label: 'Logic' },
    { value: 'combinatorics', label: 'Combinatorics' },
    { value: 'graph-theory', label: 'Graph Theory' },
    { value: 'data-structures', label: 'Data Structures' }
  ];

  const handleProofTypeClick = (proofType) => {
    if (disabled) return;
    
    // Toggle selection - add if not selected, remove if selected
    if (selectedProofTypes.includes(proofType)) {
      onProofTypesChange(selectedProofTypes.filter(type => type !== proofType));
    } else {
      onProofTypesChange([...selectedProofTypes, proofType]);
    }
  };

  return (
    <div className={styles.proofTypeSelector}>
      <span className={styles.selectorLabel}>Proof Types:</span>
      <div className={styles.buttonGroup}>
        {proofTypes.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.proofTypeButton} ${
              selectedProofTypes.includes(value) ? styles.selected : styles.unselected
            }`}
            onClick={() => handleProofTypeClick(value)}
            disabled={disabled}
            type="button"
            aria-pressed={selectedProofTypes.includes(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProofTypeSelector;
