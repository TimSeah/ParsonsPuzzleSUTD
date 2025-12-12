import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './NavigationHeader.module.css';

const NavigationHeader = () => {
  const location = useLocation();
  const isStudentPage = location.pathname === '/' || location.pathname === '/student';
  const isEducatorPage = location.pathname === '/educator';

  return (
    <nav className={styles.navigationHeader}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <h2>🧮 SUTD Parsons Puzzles</h2>
          <span className={styles.subtitle}>50.004 Algorithms</span>
        </div>
        
        <div className={styles.navTabs}>
          <Link 
            to="/student" 
            className={`${styles.navTab} ${isStudentPage ? styles.active : ''}`}
          >
            <span className={styles.tabIcon}>🎓</span>
            <span>Student Mode</span>
          </Link>
          <Link 
            to="/educator" 
            className={`${styles.navTab} ${isEducatorPage ? styles.active : ''}`}
          >
            <span className={styles.tabIcon}>👨‍🏫</span>
            <span>Educator Mode</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavigationHeader;
