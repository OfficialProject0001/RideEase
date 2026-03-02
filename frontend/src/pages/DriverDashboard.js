import React, { useState } from 'react';

function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  return (
    <div className="p-4 text-white">
      <div className="d-flex justify-content-between mb-4">
        <h2 className="text-danger">Captain Dashboard</h2>
        <button onClick={() => setIsOnline(!isOnline)} className={`btn fw-bold px-4 ${isOnline ? 'btn-success' : 'btn-danger'}`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </button>
      </div>
      {isOnline && (
        <div className="card bg-black text-white p-4 border-danger text-center shadow">
          <h4 className="text-danger animate-pulse">New Ride Request!</h4>
          <p className="fs-5">Mumbai Central to Bandra West</p>
          <h3 className="text-success mb-3">Fare: ₹ 350</h3>
          <div><button className="btn btn-success me-3 px-4">Accept</button><button className="btn btn-danger px-4">Reject</button></div>
        </div>
      )}
    </div>
  );
}
export default DriverDashboard;
