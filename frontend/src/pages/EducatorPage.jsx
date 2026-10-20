import { useEffect, useState } from 'react';
import { BarChart3, Binary, Dices, Download, FunctionSquare, Layers, ListOrdered, Network, Plus, Repeat, Shapes, Sigma } from 'lucide-react';
import { StatusIndicator } from '../components/ui';
import { PuzzleCreator, PuzzleSuccessModal } from '../components/educator';
import { CATEGORIES } from '../components/educator/educatorCategories';
import { useApiHealth } from '../hooks/usePuzzles';
import puzzleManagerService from '../services/puzzleManagerService';
import styles from './EducatorPage.module.css';

const CATEGORY_ICONS = {
  'big-o': FunctionSquare,
  induction: ListOrdered,
  'set-theory': Shapes,
  recursion: Repeat,
  logic: Binary,
  combinatorics: Dices,
  'graph-theory': Network,
  'data-structures': Layers,
};

function EducatorPage() {
  const [showCreator, setShowCreator] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('big-o');
  const [statistics, setStatistics] = useState({
    totalPuzzles: 0,
    categories: 0,
    byDifficulty: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedPuzzle, setLastCreatedPuzzle] = useState(null);
  const { isHealthy, loading: healthLoading } = useApiHealth();

  // Load statistics on component mount
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      const stats = await puzzleManagerService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setStatistics({
        totalPuzzles: 0,
        categories: 0,
        byDifficulty: {},
        byCategory: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePuzzle = (category = 'big-o') => {
    setSelectedCategory(category);
    setShowCreator(true);
    window.scrollTo?.(0, 0);
  };

  const handleSavePuzzle = async (puzzle) => {
    setIsLoading(true);
    try {
      const result = await puzzleManagerService.savePuzzle(puzzle);
      setLastCreatedPuzzle({
        title: puzzle.displayTitle,
        filename: result.filename,
        savedTo: result.savedTo
      });
      setShowSuccessModal(true);
      setShowCreator(false);
      loadStatistics(); // Refresh statistics
    } catch (error) {
      console.error('Error saving puzzle:', error);
      throw error; // Let the creator handle the error display
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAll = () => {
    try {
      puzzleManagerService.exportAllPuzzles();
      setSuccessMessage('All puzzles exported successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error exporting puzzles:', error);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setLastCreatedPuzzle(null);
  };

  const byDifficulty = statistics.byDifficulty || {};
  const categoryEntries = Object.entries(statistics.byCategory || {});

  return (
    <div className={styles.educator} aria-busy={isLoading}>
      {showCreator ? (
        <PuzzleCreator
          onSave={handleSavePuzzle}
          onCancel={() => setShowCreator(false)}
          initialPuzzle={{ category: selectedCategory }}
        />
      ) : (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Educator dashboard</h1>
              <p className="page-subtitle">Create and manage proof puzzles for your students.</p>
            </div>
            <div className={styles.headerActions}>
              <StatusIndicator isUsingApi={isHealthy === true} isLoading={healthLoading && isHealthy === null} />
              <button type="button" className="btn" onClick={handleExportAll}>
                <Download size={16} aria-hidden="true" /> Export all
              </button>
              <button type="button" className="btn btn--primary" onClick={() => handleCreatePuzzle()}>
                <Plus size={16} aria-hidden="true" /> Create puzzle
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="notice notice--success" role="status">{successMessage}</div>
          )}

          <section aria-labelledby="stats-heading" className={styles.section}>
            <h2 id="stats-heading" className="visually-hidden">Statistics</h2>
            <dl className={styles.stats}>
              <div className={`card ${styles.stat}`}>
                <dt>Total puzzles</dt>
                <dd>{statistics.totalPuzzles}</dd>
              </div>
              <div className={`card ${styles.stat}`}>
                <dt>Categories</dt>
                <dd>{statistics.categories}</dd>
              </div>
              <div className={`card ${styles.stat} ${styles.statWide}`}>
                <dt>By difficulty</dt>
                <dd className={styles.difficulty}>
                  <span><strong>{byDifficulty.easy || 0}</strong> easy</span>
                  <span><strong>{byDifficulty.medium || 0}</strong> medium</span>
                  <span><strong>{byDifficulty.hard || 0}</strong> hard</span>
                </dd>
              </div>
            </dl>
          </section>

          <div className={styles.columns}>
            <section className="card" aria-labelledby="created-heading">
              <h2 id="created-heading" className="card-title">
                <BarChart3 size={18} aria-hidden="true" /> Your created puzzles
              </h2>
              {statistics.totalPuzzles === 0 ? (
                <div className={styles.empty}>
                  <p>No puzzles created yet. Start by creating your first puzzle!</p>
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => handleCreatePuzzle()}>
                    <Plus size={16} aria-hidden="true" /> Create puzzle
                  </button>
                </div>
              ) : (
                <>
                  <p className={styles.summary}>
                    You have created {statistics.totalPuzzles} puzzles across {statistics.categories} categories.
                  </p>
                  <ul className={styles.categoryList}>
                    {categoryEntries.map(([category, count]) => (
                      <li key={category}>
                        <span>{category}</span>
                        <span className="badge">{count} puzzles</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="card" aria-labelledby="quick-heading">
              <h2 id="quick-heading" className="card-title">
                <Sigma size={18} aria-hidden="true" /> Quick create
              </h2>
              <ul className={styles.quickList}>
                {Object.entries(CATEGORIES).map(([key, category]) => {
                  const Icon = CATEGORY_ICONS[key] || Sigma;
                  return (
                    <li key={key}>
                      <button type="button" className={styles.quickAction} onClick={() => handleCreatePuzzle(key)}>
                        <span className={styles.quickIcon} aria-hidden="true"><Icon size={18} /></span>
                        <span className={styles.quickText}>
                          <span className={styles.quickTitle}>{category.name}</span>
                          <span className={styles.quickDesc}>{category.description}</span>
                        </span>
                        <Plus size={16} aria-hidden="true" className={styles.quickPlus} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      )}

      <PuzzleSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        puzzleTitle={lastCreatedPuzzle?.title}
        filename={lastCreatedPuzzle?.filename}
        savedTo={lastCreatedPuzzle?.savedTo}
      />
    </div>
  );
}

export default EducatorPage;
