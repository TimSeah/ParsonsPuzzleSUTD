import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './ErrorTooltip.module.css';

const ErrorTooltip = ({ error, show = true }) => {
  if (!show || !error) return null;

  return (
    <div className={styles.errorTooltipWrapper}>
      <span className={styles.errorIndicator} title="Connection Issues">
        <AlertTriangle size={16} />
      </span>
      <div className={styles.errorTooltip}>
        <div className={styles.errorTooltipArrow}></div>
        <div className={styles.errorTooltipContent}>
          <strong>Connection Issue</strong><br />
          {error}<br />
          Using local data instead.
        </div>
      </div>
    </div>
  );
};

export default ErrorTooltip;
