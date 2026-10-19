import React from 'react';
import styles from './LoadingState.module.css';

const LoadingState = ({ title, message }) => (
  <div className="App">
    <div className="container">
      <div className={styles.loadingState}>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  </div>
);

export default LoadingState;
