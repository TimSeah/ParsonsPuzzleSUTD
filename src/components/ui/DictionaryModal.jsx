import { useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Search } from 'lucide-react';
import { DICTIONARY_TERMS } from '../../data/terms';
import Dialog from './Dialog';
import styles from './DictionaryModal.module.css';

const onlineSearchUrl = (term) => `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(term)}`;

const DictionaryModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(null);

  const filteredTerms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return DICTIONARY_TERMS;
    return DICTIONARY_TERMS.filter((t) => t.term.toLowerCase().includes(query) || t.definition.toLowerCase().includes(query));
  }, [searchTerm]);

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || !searchTerm.trim()) return;
    const exact = DICTIONARY_TERMS.find((t) => t.term.toLowerCase() === searchTerm.trim().toLowerCase());
    if (exact) setSelectedTerm(exact);
    else if (filteredTerms.length === 1) setSelectedTerm(filteredTerms[0]);
    else if (filteredTerms.length === 0) window.open(onlineSearchUrl(searchTerm.trim()), '_blank', 'noopener');
  };

  const close = () => {
    setSelectedTerm(null);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={close} title="Dictionary" variant="sheet">
      {selectedTerm ? (
        <div className={styles.detail}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelectedTerm(null)}>
            <ArrowLeft size={16} aria-hidden="true" /> All terms
          </button>
          <h3 className={styles.detailTerm}>{selectedTerm.term}</h3>
          <p className={styles.detailDefinition}>{selectedTerm.definition}</p>
        </div>
      ) : (
        <div className="stack">
          <label className={styles.search}>
            <Search size={16} aria-hidden="true" className={styles.searchIcon} />
            <span className="visually-hidden">Search terms</span>
            <input
              type="search"
              className="input"
              placeholder="Search terms or definitions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </label>

          <p className={styles.count} aria-live="polite">
            {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''}
          </p>

          {filteredTerms.length > 0 ? (
            <ul className={styles.list}>
              {filteredTerms.map((term, index) => (
                <li key={`${term.term}-${index}`}>
                  <button type="button" className={styles.item} onClick={() => setSelectedTerm(term)}>
                    <span className={styles.itemTerm}>{term.term}</span>
                    <span className={styles.itemDefinition}>{term.definition}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p>No matching terms.</p>
              <a className="btn btn--sm" href={onlineSearchUrl(searchTerm.trim())} target="_blank" rel="noopener noreferrer">
                Search online <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
};

export default DictionaryModal;
