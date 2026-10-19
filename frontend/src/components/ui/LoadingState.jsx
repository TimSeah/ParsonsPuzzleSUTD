import styles from './LoadingState.module.css';

// `size="small"` renders just an inline spinner (e.g. inside a button).
const LoadingState = ({ title, message, size = 'page' }) => {
  if (size === 'small') {
    return <span className={styles.spinner} role="status" aria-label={title || 'Loading'} />;
  }

  return (
    <div className={styles.loadingState} role="status">
      <span className={`${styles.spinner} ${styles.spinnerLarge}`} aria-hidden="true" />
      {title && <h2 className={styles.title}>{title}</h2>}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default LoadingState;
