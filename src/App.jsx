import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NavigationHeader } from './components/navigation';
import { StudentPage, EducatorPage } from './pages';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <NavigationHeader />
        
        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/student" replace />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/educator" element={<EducatorPage />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </div>

        <footer className="app-footer">
          <p>SUTD 50.004 Algorithms - Interactive Learning Tool</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
