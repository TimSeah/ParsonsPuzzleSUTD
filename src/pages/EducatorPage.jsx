import React, { useState, useEffect } from 'react';
import { StatusIndicator } from '../components/ui';
import { PuzzleCreator, PuzzleSuccessModal } from '../components/educator';
import puzzleManagerService from '../services/puzzleManagerService';
import styles from './EducatorPage.module.css';

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
      // Set default statistics on error
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
  };

  const handleSavePuzzle = async (puzzle) => {
    setIsLoading(true);
    try {
      const result = await puzzleManagerService.savePuzzle(puzzle);
      setLastCreatedPuzzle({
        title: puzzle.displayTitle,
        filename: result.filename
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

  const handleCancelCreator = () => {
    setShowCreator(false);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setLastCreatedPuzzle(null);
  };

  return (
    <div className={styles['educator-page']}>
      {!showCreator ? (
        <>
          <header className={styles['page-header']}>
            <h1>Educator Dashboard</h1>
            <p>Create and manage mathematical proof puzzles for students</p>
            {successMessage && (
              <div className={styles['success-message']}>
                ✅ {successMessage}
              </div>
            )}
          </header>

          <div className={styles['educator-content']}>
            <div className={styles['content-grid']}>
              <div className={styles['puzzle-manager']}>
                <h2>📚 Puzzle Management</h2>
                <div className={styles['manager-actions']}>
                  <button 
                    className={styles['primary-btn']}
                    onClick={() => handleCreatePuzzle()}
                  >
                    ➕ Create New Puzzle
                  </button>
                  <button 
                    className={styles['secondary-btn']}
                    onClick={handleExportAll}
                  >
                    📤 Export All Puzzles
                  </button>
                </div>
                
                <div className={styles['puzzle-list']}>
                  <h3>Your Created Puzzles</h3>
                  {statistics.totalPuzzles === 0 ? (
                    <p className={styles['empty-state']}>
                      No puzzles created yet. Start by creating your first puzzle!
                    </p>
                  ) : (
                    <div className={styles['puzzle-summary']}>
                      <p>You have created {statistics.totalPuzzles} puzzles across {statistics.categories} categories.</p>
                      {statistics.byCategory && Object.entries(statistics.byCategory).map(([category, count]) => (
                        <div key={category} className={styles['category-stat']}>
                          <span>{category}:</span> <strong>{count} puzzles</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles['statistics']}>
                <h2>📊 Statistics</h2>
                <div className={styles['stats-grid']}>
                  <div className={styles['stat-card']}>
                    <div className={styles['stat-number']}>{statistics.totalPuzzles}</div>
                    <div className={styles['stat-label']}>Total Puzzles</div>
                  </div>
                  <div className={styles['stat-card']}>
                    <div className={styles['stat-number']}>{statistics.categories}</div>
                    <div className={styles['stat-label']}>Categories</div>
                  </div>
                  <div className={styles['stat-card']}>
                    <div className={styles['stat-number']}>
                      {statistics.byDifficulty?.easy || 0}
                    </div>
                    <div className={styles['stat-label']}>Easy Puzzles</div>
                  </div>
                </div>
              </div>

              <div className={styles['quick-actions']}>
                <h2>🚀 Quick Actions</h2>
                <div className={styles['action-list']}>
                  <button 
                    className={styles['action-item']}
                    onClick={() => handleCreatePuzzle('big-o')}
                  >
                    <span className={styles['action-icon']}>🎯</span>
                    <div>
                      <div className={styles['action-title']}>Create Big O Puzzle</div>
                      <div className={styles['action-desc']}>Add algorithmic complexity problems</div>
                    </div>
                  </button>
                  <button 
                    className={styles['action-item']}
                    onClick={() => handleCreatePuzzle('induction')}
                  >
                    <span className={styles['action-icon']}>🔢</span>
                    <div>
                      <div className={styles['action-title']}>Create Induction Puzzle</div>
                      <div className={styles['action-desc']}>Mathematical induction proofs</div>
                    </div>
                  </button>
                  <button 
                    className={styles['action-item']}
                    onClick={() => handleCreatePuzzle('set-theory')}
                  >
                    <span className={styles['action-icon']}>📋</span>
                    <div>
                      <div className={styles['action-title']}>Create Set Theory Puzzle</div>
                      <div className={styles['action-desc']}>Set operations and properties</div>
                    </div>
                  </button>
                  <button 
                    className={styles['action-item']}
                    onClick={() => handleCreatePuzzle('recursion')}
                  >
                    <span className={styles['action-icon']}>🔄</span>
                    <div>
                      <div className={styles['action-title']}>Create Recursion Puzzle</div>
                      <div className={styles['action-desc']}>Recursive algorithms and proofs</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <PuzzleCreator
          onSave={handleSavePuzzle}
          onCancel={handleCancelCreator}
          initialPuzzle={{ category: selectedCategory }}
        />
      )}

      <StatusIndicator 
        isUsingApi={false} 
        isLoading={isLoading}
      />

      <PuzzleSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        puzzleTitle={lastCreatedPuzzle?.title}
        filename={lastCreatedPuzzle?.filename}
      />
    </div>
  );
}

export default EducatorPage;
