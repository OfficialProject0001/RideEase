import React, { useState } from 'react';

function AdminDashboard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'Rohit02' && password === 'Rohit2580@') {
      setIsLoggedIn(true); setError('');
    } else {
      setError('Invalid Admin ID or Password!');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="card bg-black p-5 shadow border-danger" style={{ width: '400px', borderTop: '5px solid red' }}>
          <h2 className="text-danger text-center mb-4">Admin Access</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleLogin}>
            <input type="text" className="form-control bg-dark text-white mb-3" placeholder="Admin ID" onChange={(e)=>setUsername(e.target.value)} required />
            <input type="password" className="form-control bg-dark text-white mb-4" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} required />
            <button className="btn btn-danger w-100 fw-bold">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-danger mb-4">Welcome, Rohit!</h2>
      <div className="row text-center">
        <div className="col-md-3"><div className="card bg-black border-danger p-4 shadow"><h5 className="text-muted">Total Rides</h5><h2 className="text-light">8,500</h2></div></div>
        <div className="col-md-3"><div className="card bg-black border-danger p-4 shadow"><h5 className="text-muted">Revenue</h5><h2 className="text-success">₹ 4.5 Lakh</h2></div></div>
      </div>
    </div>
  );
}
export default AdminDashboard;
