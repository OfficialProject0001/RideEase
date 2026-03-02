import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from './pages/Login';
import BookRide from './pages/BookRide';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SOSVideoCall from './pages/SOSVideoCall';

// Ek chota sa component banaya hai taaki Login aur Admin page par top wala Navbar na dikhe
const NavigationBar = () => {
  const location = useLocation();
  // Agar user Login ("/") ya Admin ("/admin") par hai, toh Navbar mat dikhao
  if (location.pathname === '/' || location.pathname === '/admin') return null;

  return (
    <nav className="navbar navbar-dark bg-black p-3 shadow" style={{ borderBottom: '2px solid red' }}>
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-danger fs-3 d-flex align-items-center" to="/book">
          <img src="YOUR_LOGO_URL_HERE" alt="Logo" style={{ height: '40px', marginRight: '10px' }} onError={(e)=>{e.target.style.display='none'}} />
          RideEase
        </Link>
        <div>
          <Link to="/book" className="btn btn-outline-danger me-2 fw-bold">Book Ride</Link>
          <Link to="/driver" className="btn btn-outline-light me-2 fw-bold">Captain</Link>
          <Link to="/sos" className="btn btn-danger me-2 fw-bold">SOS Call</Link>
          <Link to="/" className="btn btn-dark border-secondary text-muted fw-bold">Log Out</Link>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="bg-dark min-vh-100">
        <NavigationBar />

        <Routes>
          {/* Main page ab Login hai */}
          <Route path="/" element={<Login />} /> 
          
          {/* Map wala page ab /book par chala gaya */}
          <Route path="/book" element={<BookRide />} /> 
          
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/sos" element={<SOSVideoCall />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
