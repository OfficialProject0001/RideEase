import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

export default function RideEaseV3() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('landing'); // landing, customer, captain, admin
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => { setTimeout(() => setLoading(false), 4000); }, []);

  if (loading) return (
    <div className="loader-wrap">
      <div className="bike-img">🏍️💨</div>
      <h1 className="text-warning display-3 fw-bold">RideEase</h1>
    </div>
  );

  // --- SUB-COMPONENT: CUSTOMER DASHBOARD ---
  const CustomerPanel = () => (
    <div className="container py-4 animate__animated animate__fadeIn">
      <div className="row g-4">
        <div className="col-md-3">
          <div className="glass-card p-4">
            <div className="text-center mb-4">
              <img src="https://ui-avatars.com/api/?name=Rohit&background=fbbf24" className="rounded-circle mb-2" width="80" />
              <h4>Rohit <span className="badge bg-success small" style={{fontSize: '10px'}}>PRO</span></h4>
              <p className="text-muted small">ID: RE-8821</p>
            </div>
            <div className="d-grid gap-2">
              <button onClick={()=>setActiveTab('home')} className={`btn text-start ${activeTab==='home'?'text-warning':'text-white-50'}`}>📍 Book Ride</button>
              <button onClick={()=>setActiveTab('history')} className={`btn text-start ${activeTab==='history'?'text-warning':'text-white-50'}`}>📜 History</button>
              <button onClick={()=>setActiveTab('wallet')} className={`btn text-start ${activeTab==='wallet'?'text-warning':'text-white-50'}`}>💳 Wallet (₹540)</button>
              <button onClick={()=>setRole('landing')} className="btn text-start text-danger mt-5">🚪 Logout</button>
            </div>
          </div>
        </div>
        <div className="col-md-9">
          {activeTab === 'home' ? (
            <div className="glass-card p-4" style={{minHeight: '500px'}}>
              <h4 className="text-warning mb-4">Where to, Rohit?</h4>
              <div className="row g-3 mb-4">
                <div className="col-md-5"><input className="form-control bg-dark border-secondary text-white p-3" placeholder="Pickup Location" defaultValue="My Current Location" /></div>
                <div className="col-md-5"><input className="form-control bg-dark border-secondary text-white p-3" placeholder="Drop Destination" /></div>
                <div className="col-md-2"><button className="btn btn-ride w-100 h-100">GO</button></div>
              </div>
              <div className="bg-dark rounded-4 p-5 text-center border border-secondary" style={{height: '300px'}}>
                <p className="text-muted">Interactive Map Engine Initializing...</p>
                <div className="spinner-grow text-warning"></div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-4"><h4>{activeTab.toUpperCase()} Section</h4><p className="text-muted">History and Wallet Data loaded from Secure Vault.</p></div>
          )}
        </div>
      </div>
    </div>
  );

  // --- LANDING PAGE ---
  const LandingPage = () => (
    <div className="container text-center py-5">
      <nav className="d-flex justify-content-between align-items-center mb-5 glass-card p-3 px-5">
        <h2 className="text-warning fw-bold mb-0">RideEase</h2>
        <div className="d-flex gap-4">
          <span className="nav-link-custom active">Home</span>
          <span className="nav-link-custom">Safety</span>
          <span className="nav-link-custom">Help</span>
        </div>
        <button onClick={()=>setRole('admin')} className="btn btn-outline-warning btn-sm">Admin Access</button>
      </nav>

      <div className="py-5">
        <h1 className="display-2 fw-bold mb-3">Your Ride, <span className="text-warning">Simplified.</span></h1>
        <p className="lead text-white-50 mb-5">Premium Bike, Auto, and Car rentals at your fingertips.</p>
        <div className="d-flex justify-content-center gap-4">
          <button onClick={()=>setRole('customer')} className="btn btn-ride btn-lg px-5">Book a Ride</button>
          <button onClick={()=>setRole('captain')} className="btn btn-outline-light btn-lg rounded-pill px-5">Be a Captain</button>
        </div>
      </div>

      <div className="row mt-5 g-4">
        {['Fastest', 'Safest', 'Cheapest'].map(feature => (
          <div className="col-md-4" key={feature}>
            <div className="glass-card p-4"><h3>{feature}</h3><p className="small text-muted">Uber standard protocols with localized pricing.</p></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="main-wrapper">
      {role === 'landing' && <LandingPage />}
      {role === 'customer' && <CustomerPanel />}
      {role === 'captain' && <div className="container py-5"><div className="glass-card p-5 text-center"><h2>Captain Dashboard</h2><button onClick={()=>setRole('landing')} className="btn btn-warning mt-4">Back</button></div></div>}
      {role === 'admin' && <div className="container py-5"><div className="glass-card p-5 text-center"><h2>Admin Master Control</h2><button onClick={()=>setRole('landing')} className="btn btn-warning mt-4">Back</button></div></div>}
    </div>
  );
}
