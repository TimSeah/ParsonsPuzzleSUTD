import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NavigationHeader } from './components/navigation';
import { StudentPage, EducatorPage } from './pages';
import FeedbackPage from './pages/FeedbackPage';
import DemoBanner from './demo/DemoBanner';
import { IS_DEMO } from './demo/isDemo';
import './App.css';

// '/' normally; '/ParsonsPuzzleSUTD/' for the GitHub Pages demo.
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

function App() {
  return (
    <Router basename={BASENAME}>
      <div className="App">
        <NavigationHeader />
        {IS_DEMO && <DemoBanner />}

        <main id="main-content" className="app-main page" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Navigate to="/student" replace />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/educator" element={<EducatorPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          SUTD 50.004 Algorithms · Parsons Puzzles for mathematical proofs
        </footer>
      </div>
    </Router>
  );
}

export default App;
