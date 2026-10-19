import React, { useState, useEffect } from 'react';
import { DICTIONARY_TERMS } from '../../data/terms';
import styles from './DictionaryModal.module.css';

const DictionaryModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [terms, setTerms] = useState([]);
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);

  // Load terms on mount
  useEffect(() => {
    setTerms(DICTIONARY_TERMS);
    setFilteredTerms(DICTIONARY_TERMS);
  }, []);

  // Filter terms based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTerms(terms);
    } else {
      const filtered = terms.filter(t => 
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTerms(filtered);
    }
  }, [searchTerm, terms]);

  const handleQuickLookup = (term) => {
    const found = terms.find(t => t.term.toLowerCase() === term.toLowerCase());
    if (found) {
      setSelectedTerm(found);
    } else {
      // Fallback to MDN search
      window.open(`https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(term)}`, '_blank');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleQuickLookup(searchTerm);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles['dictionary-modal-overlay']} onClick={onClose}>
      <div className={styles['dictionary-modal']} onClick={e => e.stopPropagation()}>
        <div className={styles['dictionary-header']}>
          <h2>📚 Math & Programming Dictionary</h2>
          <button className={styles['close-btn']} onClick={onClose}>×</button>
        </div>
        
        <div className={styles['dictionary-content']}>
          <div className={styles['search-section']}>
            <input
              type="text"
              placeholder="Search terms or definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles['search-input']}
              autoFocus
            />
            <small>Press Enter to search online if term not found</small>
          </div>

          {selectedTerm && (
            <div className={styles['selected-term']}>
              <h3>{selectedTerm.term}</h3>
              <p>{selectedTerm.definition}</p>
              <button onClick={() => setSelectedTerm(null)}>← Back to list</button>
            </div>
          )}

          {!selectedTerm && (
            <div className={styles['terms-list']}>
              <div className={styles['terms-count']}>
                {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''} found
              </div>
              <div className={styles['terms-grid']}>
                {filteredTerms.map((term, index) => (
                  <div key={index} className={styles['term-item']} onClick={() => setSelectedTerm(term)}>
                    <strong>{term.term}</strong>
                    <p>{term.definition.substring(0, 80)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DictionaryModal;
