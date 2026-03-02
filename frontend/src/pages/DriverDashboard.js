import React, { useState } from 'react';

const DriverDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  // Demo ke liye 3 second baad request dikhao
  const simulateRequest = () => {
    if(isOnline) setTimeout(() => setShowRequest(true), 3000);
  };

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4 glass-card p-3 px-4">
        <div>
          <h2 className="text-warning fw-bold mb-0">Captain Hub</h2>
          <small className="text-white-50">Welcome back, Captain Sameer!</small>
        </div>
        <div className="form-check form-switch">
          <input className="form-check-input p-3" type="checkbox" role="switch" 
            onChange={(e) => { setIsOnline(e.target.checked); simulateRequest(); }} />
          <label className="ms-2 fw-bold">{isOnline ? 'ONLINE' : 'OFFLINE'}</label>
        </div>
      </div>

      <div className="row g-4">
        {/* STATS CARDS */}
        <div className="col-md-3">
          <div className="glass-card p-4 text-center border-bottom border-warning border-4">
            <h6 className="text-white-50">Today's Earnings</h6>
            <h2 className="fw-bold text-success">₹1,450</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card p-4 text-center">
            <h6 className="text-white-50">Completed Rides</h6>
            <h2 className="fw-bold text-warning">12</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card p-4 text-center">
            <h6 className="text-white-50">Rating</h6>
            <h2 className="fw-bold text-primary">4.8 ⭐</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card p-4 text-center">
            <h6 className="text-white-50">Documents</h6>
            <h2 className="fw-bold text-info">Verified</h2>
          </div>
        </div>
      </div>

      {/* RIDE REQUEST POPUP (REAL-TIME DEMO) */}
      {showRequest && (
        <div className="mt-5 glass-card p-5 border-warning animate__animated animate__bounceIn" style={{border: '2px solid'}}>
           <div className="row align-items-center">
              <div className="col-md-8">
                 <h3 className="text-warning">🔥 New Ride Request!</h3>
                 <p className="fs-5 mb-0"><b>Pickup:</b> College Road, Nashik</p>
                 <p className="fs-5"><b>Drop:</b> City Center Mall | <b>Fare: ₹185</b></p>
              </div>
              <div className="col-md-4 d-flex gap-3">
                 <button onClick={() => setShowRequest(false)} className="btn btn-success btn-lg flex-grow-1 fw-bold">ACCEPT</button>
                 <button onClick={() => setShowRequest(false)} className="btn btn-outline-danger btn-lg flex-grow-1">REJECT</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
