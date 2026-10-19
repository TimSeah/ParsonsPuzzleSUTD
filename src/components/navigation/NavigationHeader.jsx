//import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from './NavigationHeader.module.css';
import useTheme from "../../hooks/useTheme";
import ThemeToggle from "../ui/ThemeToggle";
import React, { useState } from "react";
import FeedbackModal from "../ui/FeedbackModal";

const NavigationHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isStudentPage = location.pathname === '/' || location.pathname === '/student';
  const isEducatorPage = location.pathname === '/educator';
  const { theme, toggleTheme } = useTheme();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);


  return (
    <>
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
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            type="button"
            onClick={() => navigate("/feedback", { state: { from: location.pathname } })}
            style={{
              marginLeft: 12,
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            💬 Feedback
          </button>


      </div>
      </nav>
    </>
  );
};

export default NavigationHeader;
