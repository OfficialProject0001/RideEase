import React, { useState } from 'react';

function AdminDashboard() {
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');

  // Admin Login Logic (Strict Check)
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (username === 'Rohit02' && password === 'Rohit2580@') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Access Denied: Invalid Admin ID or Password!');
    }
  };

  // Agar login nahi hai, toh secure login screen dikhao
  if (!isLoggedIn) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-dark" style={{ background: 'radial-gradient(circle, #2a2a2a, #000000)' }}>
        <div className="card bg-black p-5 shadow-lg" style={{ width: '400px', borderTop: '5px solid red', borderRadius: '15px' }}>
          <h2 className="text-danger text-center mb-4 fw-bold">Admin Portal</h2>
          {error && <div className="alert alert-danger p-2 text-center">{error}</div>}
          <form onSubmit={handleAdminLogin}>
            <div className="mb-3">
              <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Admin ID" onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="mb-4">
              <input type="password" className="form-control bg-dark text-white border-secondary" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-danger w-100 fw-bold">Login Securely</button>
          </form>
        </div>
      </div>
    );
  }

  // Agar login success hai, toh ye Dashboard dikhega
  return (
    <div className="bg-dark text-white min-vh-100 p-0">
      {/* Admin Navbar */}
      <nav className="navbar navbar-dark bg-black p-3 shadow" style={{ borderBottom: '2px solid red' }}>
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-danger fs-3">RideEase Admin (Rohit)</span>
          <button className="btn btn-outline-danger fw-bold" onClick={() => setIsLoggedIn(false)}>Log Out</button>
        </div>
      </nav>

      {/* Admin Stats */}
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-3">
            <div className="card bg-black text-center p-4 border-danger shadow">
              <h5 className="text-muted">Total Users</h5>
              <h2 className="text-light">1,250</h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-black text-center p-4 border-danger shadow">
              <h5 className="text-muted">Total Captains</h5>
              <h2 className="text-light">340</h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-black text-center p-4 border-danger shadow">
              <h5 className="text-muted">Total Rides</h5>
              <h2 className="text-light">8,500</h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-black text-center p-4 border-danger shadow">
              <h5 className="text-muted">Revenue</h5>
              <h2 className="text-success">₹ 4.5 Lakh</h2>
            </div>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="mt-5 bg-black p-4 rounded border-danger shadow" style={{ border: '1px solid red' }}>
          <h4 className="text-danger mb-3">Pending Captain Approvals</h4>
          <table className="table table-dark table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Vehicle</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rahul Sharma</td>
                <td>MH-04-AB-1234 (Bike)</td>
                <td>
                  <button className="btn btn-sm btn-success me-2">Approve</button>
                  <button className="btn btn-sm btn-danger">Reject</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
