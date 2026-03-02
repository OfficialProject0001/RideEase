import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Premium Theme Loaded!

import Login from './pages/Login';
import BookRide from './pages/BookRide';
// import DriverDashboard from './pages/DriverDashboard';
// import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Entry Point ab Login page hai */}
        <Route path="/" element={<Login />} />
        <Route path="/book" element={<BookRide />} />
        {/* Baaki routes next update me lagayenge */}
      </Routes>
    </Router>
  );
}

export default App;
