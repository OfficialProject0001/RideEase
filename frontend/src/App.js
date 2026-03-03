import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// 🚀 Asli Live Server Connection
const SERVER_URL = "https://rideease-4m7a.onrender.com"; 
const socket = io(SERVER_URL);

// ⚠️ APNI RAZORPAY KEY YAHAN DAALEIN ⚠️
const RAZORPAY_KEY_ID = "rzp_test_YOUR_KEY_HERE";

export default function App() {
  const [role, setRole] = useState('landing'); 
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('rideease_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUserData(parsedUser);
      setRole(parsedUser.role);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('rideease_user');
    setUserData(null);
    setRole('landing');
  };

  // --------------------------------------------------------
  // 1. SMART LOGIN PAGE (Fixed Double Click Bug)
  // --------------------------------------------------------
  const LandingPage = () => {
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [selectedRole, setSelectedRole] = useState('customer');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
      e.preventDefault();
      if(phone.length !== 10) return alert("Please enter exactly 10 digits Boss!");
      setIsLoading(true);
      try {
        const res = await axios.post(`${SERVER_URL}/api/login`, { phone });
        if (res.data.isNew) setStep(2);
        else {
          localStorage.setItem('rideease_user', JSON.stringify(res.data.user));
          setUserData(res.data.user);
          setRole(res.data.user.role);
        }
      } catch (err) { alert("Server error! Backend neend mein hai, 30 seconds wait karke try karein."); }
      setIsLoading(false);
    };

    const handleRegister = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      const newUser = { phone, name, city, role: selectedRole };
      try {
        await axios.post(`${SERVER_URL}/api/register`, newUser);
        localStorage.setItem('rideease_user', JSON.stringify(newUser));
        setUserData(newUser);
        setRole(selectedRole);
        setActiveTab(selectedRole === 'captain' ? 'overview' : 'home');
      } catch (err) { alert("Registration failed! Number already exists."); }
      setIsLoading(false);
    };

    return (
      <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 text-center">
         <h1 className="display-1 fw-bold mb-3"><span className="text-warning">Ride</span>Ease</h1>
         <div className="glass-card p-5 mt-4" style={{width: '400px'}}>
            {step === 1 ? (
              <form onSubmit={handleLogin} className="animate__animated animate__fadeIn">
                <h4 className="mb-4">Login / Sign Up</h4>
                <div className="d-flex justify-content-center gap-2 mb-4">
                   <button type="button" onClick={()=>setSelectedRole('customer')} className={`btn btn-sm ${selectedRole === 'customer' ? 'btn-warning' : 'btn-outline-secondary text-white'}`}>Customer</button>
                   <button type="button" onClick={()=>setSelectedRole('captain')} className={`btn btn-sm ${selectedRole === 'captain' ? 'btn-warning' : 'btn-outline-secondary text-white'}`}>Captain</button>
                   <button type="button" onClick={()=>{setRole('admin'); setActiveTab('dash');}} className="btn btn-sm btn-outline-danger">Admin</button>
                </div>
                <div className="mb-3 text-start">
                  <label className="text-white-50 small mb-1 fw-bold">10-Digit Mobile Number</label>
                  <input type="number" className="form-control bg-dark text-white p-3 border-secondary" placeholder="e.g. 9876543210" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                </div>
                <button type="submit" disabled={isLoading} className="btn btn-premium w-100 py-2 fs-5">{isLoading ? 'Connecting...' : 'Continue'}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="text-start animate__animated animate__fadeIn">
                <h4 className="mb-4 text-warning text-center">Welcome New {selectedRole}!</h4>
                <div className="mb-3">
                  <label className="text-white-50 small mb-1 fw-bold">Enter Your Full Name</label>
                  <input type="text" className="form-control bg-dark text-white p-3 border-secondary" placeholder="e.g., Raj Tiwari" value={name} onChange={(e)=>setName(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="text-white-50 small mb-1 fw-bold">Enter Your City</label>
                  <input type="text" className="form-control bg-dark text-white p-3 border-secondary" placeholder="e.g., Virar" value={city} onChange={(e)=>setCity(e.target.value)} required />
                </div>
                <button type="submit" disabled={isLoading} className="btn btn-premium w-100 py-2 fs-5">{isLoading ? 'Saving...' : 'Create Account'}</button>
              </form>
            )}
         </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 2. FULL CUSTOMER PANEL (Sidebar + Razorpay + Sockets)
  // --------------------------------------------------------
  const CustomerPanel = () => {
    const [rideStatus, setRideStatus] = useState('idle');
    const [captainDetails, setCaptainDetails] = useState(null);
    const fareAmount = 150; 

    useEffect(() => {
      socket.on('ride_confirmed', (data) => {
        setCaptainDetails(data);
        setRideStatus('accepted');
      });
      return () => socket.off('ride_confirmed');
    }, []);

    const processPaymentAndBook = async () => {
      try {
        const orderRes = await axios.post(`${SERVER_URL}/api/create-order`, { amount: fareAmount });
        const order = orderRes.data;

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "RideEase Premium",
          description: "Advance Ride Booking",
          order_id: order.id,
          handler: function (response) {
            alert(`Payment Success! ID: ${response.razorpay_payment_id}`);
            setRideStatus('searching');
            socket.emit('request_ride', {
              riderName: userData.name,
              pickup: `${userData.city} Railway Station`,
              drop: "City Center Mall",
              fare: `₹${fareAmount}`,
              phone: userData.phone
            });
          },
          prefill: { name: userData.name, contact: userData.phone },
          theme: { color: "#fbbf24" }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){ alert("Payment Failed: " + response.error.description); });
        rzp.open();
      } catch (error) {
        alert("Failed to connect to payment gateway.");
      }
    };

    return (
      <div className="container-fluid min-vh-100 p-3 position-relative">
        <div className="map-bg"></div>
        <div className="row g-4 position-relative" style={{ zIndex: 10 }}>
          
          {/* Customer Sidebar */}
          <div className="col-md-3">
            <div className="glass-card p-4 h-100">
              <div className="text-center mb-4">
                <img src={`https://ui-avatars.com/api/?name=${userData?.name}&background=fbbf24`} className="rounded-circle mb-2" width="70" alt="profile"/>
                <h5 className="text-warning">{userData?.name}</h5>
                <p className="small text-white-50">{userData?.city}</p>
              </div>
              <button onClick={() => setActiveTab('home')} className={`menu-btn ${activeTab === 'home' ? 'active' : ''}`}>📍 Book a Ride</button>
              <button onClick={() => setActiveTab('history')} className={`menu-btn ${activeTab === 'history' ? 'active' : ''}`}>📜 Ride History</button>
              <button onClick={() => setActiveTab('refer')} className={`menu-btn ${activeTab === 'refer' ? 'active' : ''}`}>🎁 Refer & Earn</button>
              <button onClick={() => setActiveTab('settings')} className={`menu-btn ${activeTab === 'settings' ? 'active' : ''}`}>⚙️ Settings</button>
              <button onClick={logout} className="menu-btn text-danger mt-4">🚪 Logout</button>
            </div>
          </div>

          {/* Customer Main Area */}
          <div className="col-md-9">
            {activeTab === 'home' && (
              <div className="glass-card p-4 animate__animated animate__fadeInUp" style={{maxWidth: '500px', margin: 'auto', marginTop: '5%'}}>
                {rideStatus === 'idle' && (
                  <>
                    <h4 className="fw-bold mb-4">Book a Ride</h4>
                    <input className="form-control bg-dark text-white border-secondary mb-3 p-3" value={`${userData?.city} Station`} readOnly />
                    <input className="form-control bg-dark text-white border-secondary mb-4 p-3" placeholder="Enter Drop Destination" />
                    <button onClick={processPaymentAndBook} className="btn btn-premium w-100 fs-5">Pay ₹{fareAmount} & Book Ride</button>
                  </>
                )}
                {rideStatus === 'searching' && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning mb-3"></div>
                    <h4 className="text-warning">Finding Captains...</h4>
                    <p className="text-white-50">Payment Confirmed. Locating drivers nearby.</p>
                  </div>
                )}
                {rideStatus === 'accepted' && (
                  <div className="text-center py-4 border border-success rounded bg-dark">
                    <h4 className="text-success mb-3">Captain is arriving! 🏍️</h4>
                    <h2 className="fw-bold">{captainDetails?.captainName}</h2>
                    <p className="text-warning fs-5">{captainDetails?.vehicle}</p>
                    <button onClick={() => setRideStatus('idle')} className="btn btn-success px-4 mt-3">Complete Trip</button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'history' && (
              <div className="glass-card p-4 animate__animated animate__fadeIn">
                <h4 className="text-warning mb-4">Past Rides</h4>
                <div className="bg-dark p-3 rounded mb-2 border border-secondary d-flex justify-content-between">
                  <div><p className="mb-0">Station ➔ City Mall</p><small className="text-white-50">Yesterday</small></div>
                  <strong className="text-success">₹150</strong>
                </div>
                <div className="bg-dark p-3 rounded border border-secondary d-flex justify-content-between">
                  <div><p className="mb-0">Home ➔ College</p><small className="text-white-50">Mar 1, 2026</small></div>
                  <strong className="text-success">₹80</strong>
                </div>
              </div>
            )}

            {activeTab === 'refer' && (
              <div className="glass-card p-5 text-center animate__animated animate__fadeIn">
                <h2>Invite Friends, Get <span className="text-warning">₹100</span>!</h2>
                <div className="bg-dark p-3 rounded fs-3 fw-bold letter-spacing-3 my-4 border border-secondary">RIDE-EASE-505</div>
                <button className="btn btn-success px-5">Share via WhatsApp</button>
              </div>
            )}

            {activeTab === 'settings' && (
               <div className="glass-card p-4 animate__animated animate__fadeIn">
                 <h4 className="mb-4">App Settings</h4>
                 <div className="form-check form-switch mb-3"><input className="form-check-input" type="checkbox" defaultChecked /><label className="form-check-label ms-2">Dark Mode</label></div>
                 <div className="form-check form-switch mb-3"><input className="form-check-input" type="checkbox" defaultChecked /><label className="form-check-label ms-2">Push Notifications</label></div>
               </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 3. FULL CAPTAIN PANEL (Sidebar + Live Requests)
  // --------------------------------------------------------
  const CaptainPanel = () => {
    const [incomingRide, setIncomingRide] = useState(null);

    useEffect(() => {
      socket.on('incoming_ride', (data) => setIncomingRide(data));
      return () => socket.off('incoming_ride');
    }, []);

    const acceptRide = () => {
      socket.emit('accept_ride', { ...incomingRide, captainName: userData?.name, vehicle: "MH-15-XY-9999" });
      setIncomingRide(null);
      alert("Ride Accepted! Navigation Started.");
    };

    return (
      <div className="container-fluid min-vh-100 p-3 bg-dark">
        <div className="row g-4">
          
          {/* Captain Sidebar */}
          <div className="col-md-3">
            <div className="glass-card p-4 h-100">
               <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>Captain Hub</h5>
                  <span className="badge bg-success">ONLINE</span>
               </div>
               <button onClick={() => setActiveTab('overview')} className={`menu-btn ${activeTab === 'overview' ? 'active' : ''}`}>📊 Overview & Rides</button>
               <button onClick={() => setActiveTab('wallet')} className={`menu-btn ${activeTab === 'wallet' ? 'active' : ''}`}>💰 Wallet & Payout</button>
               <button onClick={() => setActiveTab('docs')} className={`menu-btn ${activeTab === 'docs' ? 'active' : ''}`}>🏍️ Vehicle & Docs</button>
               <button onClick={logout} className="menu-btn text-danger mt-5">🚪 Duty Off (Logout)</button>
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
                 
                 {!incomingRide ? (
                   <div className="glass-card p-5 text-center opacity-50 mt-4">
                     <div className="spinner-grow text-warning mb-3" style={{width: '3rem', height: '3rem'}}></div>
                     <h3>Waiting for Rides in {userData?.city}...</h3>
                   </div>
                 ) : (
                   <div className="glass-card p-5 border-warning border-3 mt-4 animate__animated animate__tada">
                      <h3 className="text-warning mb-4">🔥 PAID RIDE REQUEST!</h3>
                      <p className="fs-5"><b>Customer:</b> {incomingRide.riderName}</p>
                      <p className="fs-5"><b>Pickup:</b> {incomingRide.pickup}</p>
                      <h2 className="text-success my-4">{incomingRide.fare} (Pre-paid)</h2>
                      <div className="d-flex gap-3">
                        <button onClick={acceptRide} className="btn btn-success btn-lg flex-grow-1 fw-bold">ACCEPT</button>
                        <button onClick={() => setIncomingRide(null)} className="btn btn-outline-danger btn-lg flex-grow-1">REJECT</button>
                      </div>
                   </div>
                 )}
              </div>
            )}
            
            {activeTab === 'docs' && (
              <div className="glass-card p-4 animate__animated animate__fadeIn">
                 <h4 className="text-warning mb-4">Document Verification</h4>
                 <ul className="list-group list-group-flush bg-transparent">
                    <li className="list-group-item bg-transparent text-white d-flex justify-content-between">Aadhaar Card <span className="text-success">Verified ✅</span></li>
                    <li className="list-group-item bg-transparent text-white d-flex justify-content-between">Driving License <span className="text-success">Verified ✅</span></li>
                 </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 4. FULL ADMIN MASTER CONTROL
  // --------------------------------------------------------
  const AdminPanel = () => (
    <div className="container-fluid min-vh-100 p-0 d-flex bg-dark text-white">
      <div className="glass-card m-3 p-4" style={{width: '280px'}}>
        <h4 className="text-warning fw-bold mb-5">Admin Console</h4>
        <button onClick={() => setActiveTab('dash')} className={`menu-btn ${activeTab === 'dash' ? 'active' : ''}`}>📈 System Dashboard</button>
        <button onClick={() => setActiveTab('verify')} className={`menu-btn ${activeTab === 'verify' ? 'active' : ''}`}>✔️ Verify Captains</button>
        <button onClick={() => setActiveTab('fraud')} className={`menu-btn ${activeTab === 'fraud' ? 'active' : ''}`}>🚨 Security Alerts</button>
        <button onClick={logout} className="menu-btn text-danger mt-5">🚪 Logout</button>
      </div>

      <div className="flex-grow-1 p-4">
        {activeTab === 'dash' && (
          <div className="animate__animated animate__fadeIn">
            <h2 className="mb-4">Platform Overview</h2>
            <div className="row g-4">
              <div className="col-4"><div className="glass-card p-4"><h6>Total Revenue</h6><h3 className="text-success">₹12.5L</h3></div></div>
              <div className="col-4"><div className="glass-card p-4"><h6>Active Rides</h6><h3 className="text-primary">42</h3></div></div>
              <div className="col-4"><div className="glass-card p-4 border-danger"><h6>Pending Approvals</h6><h3 className="text-danger">12</h3></div></div>
            </div>
            <div className="glass-card p-4 mt-4 text-center">
               <h4 className="text-white-50">System is Online & Secure</h4>
            </div>
          </div>
        )}
        {activeTab === 'fraud' && (
           <div className="glass-card p-4 border-danger animate__animated animate__fadeIn">
             <h3 className="text-danger fw-bold">⚠️ Security Alerts</h3>
             <div className="bg-dark p-3 rounded mt-3 border border-secondary d-flex justify-content-between">
                <div><h6 className="mb-0">Captain #1042</h6><small className="text-white-50">Unusual location spoofing detected.</small></div>
                <button className="btn btn-sm btn-danger">Suspend</button>
             </div>
           </div>
        )}
      </div>
    </div>
  );

  if (role === 'customer') return <CustomerPanel />;
  if (role === 'captain') return <CaptainPanel />;
  if (role === 'admin') return <AdminPanel />;

  return <LandingPage />;
}
