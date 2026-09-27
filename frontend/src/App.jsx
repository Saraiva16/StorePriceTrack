import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ImportReceipt from './pages/ImportReceipt';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/import" element={<ImportReceipt />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
