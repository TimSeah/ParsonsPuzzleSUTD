import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, MessageSquare, Presentation, Puzzle } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import ThemeToggle from '../ui/ThemeToggle';
import DictionaryModal from '../ui/DictionaryModal';
import styles from './NavigationHeader.module.css';

const SECTIONS = [
  { to: '/student', label: 'Student', icon: GraduationCap },
  { to: '/educator', label: 'Educator', icon: Presentation },
];

const navClass = (base, active) => ({ isActive }) => `${base} ${isActive ? active : ''}`;

// App header (all sizes) plus a bottom tab bar on small screens.
const NavigationHeader = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const feedbackState = location.pathname === '/feedback' ? location.state : { from: location.pathname };

  return (
    <>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>

      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/student" className={styles.brand} aria-label="Parsons Puzzles home">
            <span className={styles.brandMark} aria-hidden="true"><Puzzle size={18} /></span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>Parsons Puzzles</span>
              <span className={styles.brandCourse}>SUTD 50.004 Algorithms</span>
            </span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Main">
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={navClass(styles.navLink, styles.navLinkActive)}>
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className={styles.actions}>
            <NavLink
              to="/feedback"
              state={feedbackState}
              className={navClass(`${styles.navLink} ${styles.feedbackLink}`, styles.navLinkActive)}
            >
              <MessageSquare size={16} aria-hidden="true" />
              Feedback
            </NavLink>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsDictionaryOpen(true)}
              aria-label="Open dictionary"
              title="Dictionary"
            >
              <BookOpen size={18} aria-hidden="true" />
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <nav className={styles.tabBar} aria-label="Main">
        {[...SECTIONS, { to: '/feedback', label: 'Feedback', icon: MessageSquare, state: feedbackState }].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} state={item.state} className={navClass(styles.tab, styles.tabActive)}>
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <DictionaryModal isOpen={isDictionaryOpen} onClose={() => setIsDictionaryOpen(false)} />
    </>
  );
};

export default NavigationHeader;
