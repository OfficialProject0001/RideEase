import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import BookRide from './pages/BookRide';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SOSVideoCall from './pages/SOSVideoCall';

function App() {
  return (
    <Router>
      <div className="bg-dark min-vh-100">
        {/* Global Red/Black Navbar with Logo */}
        <nav className="navbar navbar-dark bg-black p-3 shadow" style={{ borderBottom: '2px solid red' }}>
          <div className="container-fluid">
            <Link className="navbar-brand fw-bold text-danger fs-3 d-flex align-items-center" to="/">
              <img src="YOUR_LOGO_URL_HERE" alt="Logo" style={{ height: '40px', marginRight: '10px' }} onError={(e)=>{e.target.style.display='none'}} />
              RideEase
            </Link>
            <div>
              <Link to="/" className="btn btn-outline-danger me-2 fw-bold">Book Ride</Link>
              <Link to="/driver" className="btn btn-outline-light me-2 fw-bold">Captain</Link>
              <Link to="/sos" className="btn btn-danger me-2 fw-bold">SOS Call</Link>
              <Link to="/admin" className="btn btn-dark border-danger text-danger fw-bold">Admin</Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<BookRide />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/sos" element={<SOSVideoCall />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
