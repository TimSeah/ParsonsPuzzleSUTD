import React from 'react';
import styles from './DataSourceToggle.module.css';

const DataSourceToggle = ({ useLocalData, onToggle, isLoading = false }) => {
  if (isLoading) return null;

  return (
    <button 
      className={`${styles.toggleDataSource} ${styles.compact}`}
      onClick={onToggle}
      title={`Switch to ${useLocalData ? 'database' : 'local'} data`}
      disabled={isLoading}
    >
      {useLocalData ? 'Use Database' : 'Use Local Data'}
    </button>
  );
};

export default DataSourceToggle;
