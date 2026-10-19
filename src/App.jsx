import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NavigationHeader } from './components/navigation';
import { StudentPage, EducatorPage } from './pages';
import FeedbackPage from './pages/FeedbackPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <NavigationHeader />

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
