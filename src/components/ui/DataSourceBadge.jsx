import React from 'react';
import { Globe, HardDrive } from 'lucide-react';
import styles from './DataSourceBadge.module.css';

const DataSourceBadge = ({ isUsingApi, puzzleCount }) => {
  return (
    <span className={`${styles.statusBadge} ${isUsingApi ? styles.api : styles.local}`}>
      {isUsingApi ? (
        <>
          <Globe size={14} />
          Database
        </>
      ) : (
        <>
          <HardDrive size={14} />
          Local
        </>
      )}
      ({puzzleCount} puzzles)
    </span>
  );
};

export default DataSourceBadge;
