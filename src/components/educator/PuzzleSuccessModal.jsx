import React from 'react';
import styles from './PuzzleSuccessModal.module.css';

function PuzzleSuccessModal({ isOpen, onClose, puzzleTitle, filename }) {
  if (!isOpen) return null;

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content']}>
        <div className={styles['success-icon']}>✅</div>
        
        <h2>Puzzle Created Successfully!</h2>
        
        <div className={styles['success-details']}>
          <p><strong>Puzzle:</strong> {puzzleTitle}</p>
          <p><strong>File:</strong> {filename}</p>
        </div>

        <div className={styles['instructions']}>
          <h3>📥 Next Steps:</h3>
          <ol>
            <li>The updated JSON file has been downloaded to your computer</li>
            <li>Replace the existing <code>{filename}</code> in your project</li>
            <li>The puzzle will be available to students immediately</li>
          </ol>
        </div>

        <div className={styles['modal-actions']}>
          <button 
            className={styles['close-btn']} 
            onClick={onClose}
          >
            🎉 Great! Create Another
          </button>
        </div>
      </div>
    </div>
  );
}

export default PuzzleSuccessModal;
