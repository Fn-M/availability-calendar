import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import PublicPage from './pages/PublicPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<PublicPage />} />
      </Routes>
    </Router>
  );
};

export default App;
