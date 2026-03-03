import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

export default function App() {
  const [role, setRole] = useState('landing'); // landing, customer, captain, admin
  const [activeTab, setActiveTab] = useState('home');

  // --------------------------------------------------------
  // 1. CUSTOMER DASHBOARD
  // --------------------------------------------------------
  const CustomerPanel = () => (
    <div className="container-fluid min-vh-100 p-3 position-relative">
      <div className="map-bg"></div>
      <div className="row g-4 position-relative" style={{ zIndex: 10 }}>
        
        {/* Customer Sidebar */}
        <div className="col-md-3">
          <div className="glass-card p-4 h-100">
            <div className="text-center mb-4">
              <img src="https://ui-avatars.com/api/?name=Rider&background=fbbf24" className="rounded-circle mb-2" width="70" alt="profile"/>
              <h5>Rider Menu</h5>
              <div className="badge bg-success">Wallet: ₹450</div>
            </div>
            <button onClick={() => setActiveTab('home')} className={`menu-btn ${activeTab === 'home' ? 'active' : ''}`}>📍 Book a Ride</button>
            <button onClick={() => setActiveTab('history')} className={`menu-btn ${activeTab === 'history' ? 'active' : ''}`}>📜 Ride History</button>
            <button onClick={() => setActiveTab('refer')} className={`menu-btn ${activeTab === 'refer' ? 'active' : ''}`}>🎁 Refer & Earn</button>
            <button onClick={() => setActiveTab('support')} className={`menu-btn ${activeTab === 'support' ? 'active' : ''}`}>🎧 Help & Support</button>
            <button onClick={() => setActiveTab('settings')} className={`menu-btn ${activeTab === 'settings' ? 'active' : ''}`}>⚙️ Settings</button>
            <button onClick={() => setRole('landing')} className="menu-btn text-danger mt-4">🚪 Logout</button>
          </div>
        </div>

        {/* Customer Main Area */}
        <div className="col-md-9">
          {activeTab === 'home' && (
            <div className="glass-card p-4 animate__animated animate__fadeInUp" style={{maxWidth: '500px', margin: 'auto', marginTop: '10%'}}>
              <h4 className="text-warning fw-bold mb-4">Where are you going?</h4>
              <input className="form-control bg-dark text-white border-secondary mb-3 p-3" placeholder="Pickup: Current Location" readOnly />
              <input className="form-control bg-dark text-white border-secondary mb-4 p-3" placeholder="Enter Drop Destination" />
              <div className="d-flex justify-content-between mb-4">
                <div className="text-center p-2 border border-warning rounded text-warning" style={{cursor:'pointer'}}>🏍️ Bike<br/>₹120</div>
                <div className="text-center p-2 border border-secondary rounded" style={{cursor:'pointer'}}>🛺 Auto<br/>₹180</div>
                <div className="text-center p-2 border border-secondary rounded" style={{cursor:'pointer'}}>🚗 Car<br/>₹290</div>
              </div>
              <button className="btn btn-premium w-100 fs-5">Confirm RideEase</button>
            </div>
          )}
          
          {activeTab === 'refer' && (
            <div className="glass-card p-5 text-center animate__animated animate__fadeIn">
              <h2>Invite Friends, Get <span className="text-warning">₹100</span>!</h2>
              <p className="text-white-50 mt-3">Share your code with friends. When they take their first ride, you both get ₹100 in your wallet.</p>
              <div className="bg-dark p-3 rounded fs-3 fw-bold letter-spacing-3 my-4 border border-secondary">RIDE-EASE-505</div>
              <button className="btn btn-success px-5">Share via WhatsApp</button>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="glass-card p-4 animate__animated animate__fadeIn">
               <h4 className="text-warning mb-4">24/7 Help Center</h4>
               <div className="bg-dark p-4 rounded mb-3 border border-secondary">
                 <h6>Chat with Us</h6>
                 <p className="small text-white-50">Instant resolution for ride or payment issues.</p>
                 <button className="btn btn-sm btn-outline-warning">Start Live Chat</button>
               </div>
               <div className="bg-dark p-4 rounded border border-danger">
                 <h6 className="text-danger">🚨 SOS Emergency</h6>
                 <p className="small text-white-50">Trigger immediate police and admin response.</p>
                 <button className="btn btn-sm btn-danger">Slide to SOS</button>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="glass-card p-4 animate__animated animate__fadeIn">
               <h4 className="mb-4">App Settings</h4>
               <div className="form-check form-switch mb-3"><input className="form-check-input" type="checkbox" defaultChecked /><label className="form-check-label ms-2">Dark Mode</label></div>
               <div className="form-check form-switch mb-3"><input className="form-check-input" type="checkbox" defaultChecked /><label className="form-check-label ms-2">Push Notifications</label></div>
               <label className="mt-3">Language</label>
               <select className="form-select bg-dark text-white border-secondary mt-1"><option>English</option><option>Hindi</option></select>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------
  // 2. CAPTAIN (DRIVER) DASHBOARD
  // --------------------------------------------------------
  const CaptainPanel = () => (
    <div className="container-fluid min-vh-100 p-3 bg-dark">
      <div className="row g-4">
        {/* Captain Sidebar */}
        <div className="col-md-3">
          <div className="glass-card p-4 h-100">
             <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Captain Hub</h5>
                <span className="badge bg-success">ONLINE</span>
             </div>
             <button onClick={() => setActiveTab('overview')} className={`menu-btn ${activeTab === 'overview' ? 'active' : ''}`}>📊 Overview & Heatmap</button>
             <button onClick={() => setActiveTab('wallet')} className={`menu-btn ${activeTab === 'wallet' ? 'active' : ''}`}>💰 Wallet & Payout</button>
             <button onClick={() => setActiveTab('docs')} className={`menu-btn ${activeTab === 'docs' ? 'active' : ''}`}>🏍️ Vehicle & Docs</button>
             <button onClick={() => setActiveTab('support')} className={`menu-btn ${activeTab === 'support' ? 'active' : ''}`}>🎧 Help & Support</button>
             <button onClick={() => setRole('landing')} className="menu-btn text-danger mt-5">🚪 Shift End (Logout)</button>
          </div>
        </div>

        {/* Captain Main Area */}
        <div className="col-md-9">
          {activeTab === 'overview' && (
            <div className="animate__animated animate__fadeIn">
               <div className="row g-3 mb-4">
                 <div className="col-4"><div className="glass-card p-4 text-center border-bottom border-success border-4"><h6>Today's Earnings</h6><h4>₹850</h4></div></div>
                 <div className="col-4"><div className="glass-card p-4 text-center border-bottom border-warning border-4"><h6>Trips</h6><h4>06</h4></div></div>
                 <div className="col-4"><div className="glass-card p-4 text-center border-bottom border-info border-4"><h6>Rating</h6><h4>4.9 ⭐</h4></div></div>
               </div>
               <div className="glass-card p-4 mt-4 text-center border-warning">
                 <h4 className="text-warning">🔥 New Ride Request!</h4>
                 <p className="fs-5">College Road ➔ City Center Mall</p>
                 <h3 className="text-success mb-4">Fare: ₹185</h3>
                 <button className="btn btn-success btn-lg px-5 me-3 fw-bold">ACCEPT</button>
                 <button className="btn btn-outline-danger btn-lg px-5">REJECT</button>
               </div>
            </div>
          )}
          
          {activeTab === 'docs' && (
            <div className="glass-card p-4 animate__animated animate__fadeIn">
               <h4 className="text-warning mb-4">Document Verification</h4>
               <ul className="list-group list-group-flush bg-transparent">
                  <li className="list-group-item bg-transparent text-white d-flex justify-content-between">Aadhaar Card <span className="text-success">Verified ✅</span></li>
                  <li className="list-group-item bg-transparent text-white d-flex justify-content-between">Driving License <span className="text-success">Verified ✅</span></li>
                  <li className="list-group-item bg-transparent text-white d-flex justify-content-between">Vehicle RC <span className="text-warning">Pending ⏳</span></li>
               </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------
  // 3. ADMIN MASTER CONTROL
  // --------------------------------------------------------
  const AdminPanel = () => (
    <div className="container-fluid min-vh-100 p-0 d-flex bg-dark text-white">
      {/* Admin Sidebar */}
      <div className="glass-card m-3 p-4" style={{width: '280px'}}>
        <h4 className="text-warning fw-bold mb-5">Admin Console</h4>
        <button onClick={() => setActiveTab('dash')} className={`menu-btn ${activeTab === 'dash' ? 'active' : ''}`}>📈 System Dashboard</button>
        <button onClick={() => setActiveTab('verify')} className={`menu-btn ${activeTab === 'verify' ? 'active' : ''}`}>✔️ Verify Captains</button>
        <button onClick={() => setActiveTab('fraud')} className={`menu-btn ${activeTab === 'fraud' ? 'active' : ''}`}>🚨 Fraud & Security</button>
        <button onClick={() => setActiveTab('settings')} className={`menu-btn ${activeTab === 'settings' ? 'active' : ''}`}>⚙️ Global Settings</button>
        <button onClick={() => setRole('landing')} className="menu-btn text-danger mt-5">🚪 Logout</button>
      </div>

      {/* Admin Main Area */}
      <div className="flex-grow-1 p-4">
        {activeTab === 'dash' && (
          <div className="animate__animated animate__fadeIn">
            <h2 className="mb-4">Platform Overview</h2>
            <div className="row g-4">
              <div className="col-3"><div className="glass-card p-4"><h6>Total Revenue</h6><h3 className="text-success">₹12.5L</h3></div></div>
              <div className="col-3"><div className="glass-card p-4"><h6>Active Rides</h6><h3 className="text-primary">42</h3></div></div>
              <div className="col-3"><div className="glass-card p-4"><h6>Registered Captains</h6><h3 className="text-warning">842</h3></div></div>
              <div className="col-3"><div className="glass-card p-4 border-danger"><h6>Pending Approvals</h6><h3 className="text-danger">12</h3></div></div>
            </div>
            <div className="glass-card p-4 mt-4 text-center">
               <h4 className="text-white-50">Live Map Simulation Active</h4>
               <p>Monitoring 42 riders across Nashik and Mumbai regions.</p>
            </div>
          </div>
        )}

        {activeTab === 'fraud' && (
           <div className="glass-card p-4 border-danger animate__animated animate__fadeIn">
             <h3 className="text-danger fw-bold">⚠️ Security Alerts</h3>
             <div className="bg-dark p-3 rounded mt-3 border border-secondary">
                <div className="d-flex justify-content-between align-items-center">
                   <div>
                     <h6 className="mb-0">Captain #1042 (Ramesh)</h6>
                     <small className="text-white-50">Unusual location spoofing detected.</small>
                   </div>
                   <button className="btn btn-sm btn-danger">Suspend Account</button>
                </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );

  // --------------------------------------------------------
  // MAIN ROUTER (LANDING PAGE)
  // --------------------------------------------------------
  if (role === 'customer') return <CustomerPanel />;
  if (role === 'captain') return <CaptainPanel />;
  if (role === 'admin') return <AdminPanel />;

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 text-center">
       <h1 className="display-1 fw-bold mb-3"><span className="text-warning">Ride</span>Ease</h1>
       <p className="lead text-white-50 mb-5">The A-to-Z Mobility Startup Platform.</p>
       <div className="glass-card p-5 d-flex gap-4">
          <button onClick={() => {setRole('customer'); setActiveTab('home');}} className="btn btn-premium btn-lg">Login as Customer</button>
          <button onClick={() => {setRole('captain'); setActiveTab('overview');}} className="btn btn-outline-warning btn-lg">Login as Captain</button>
          <button onClick={() => {setRole('admin'); setActiveTab('dash');}} className="btn btn-outline-light btn-lg">Admin Access</button>
       </div>
    </div>
  );
}
