import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const SERVER_URL = "https://rideease-4m7a.onrender.com"; 
const socket = io(SERVER_URL, { autoConnect: false });
const RAZORPAY_KEY_ID = "rzp_test_YOUR_KEY_HERE";

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

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
      socket.connect();
      setCurrentView('dashboard');
      setActiveTab(parsedUser.role === 'captain' ? 'radar' : parsedUser.role === 'admin' ? 'dash' : 'home');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('rideease_user');
    setUserData(null);
    setRole(null);
    setCurrentView('landing');
    socket.disconnect();
  };

  const navigateTo = (view, newRole = null) => {
    if (newRole) setRole(newRole);
    setCurrentView(view);
  };

  const BackButton = ({ onClick }) => (
    <div className="position-absolute top-0 start-0 m-4">
      <button onClick={onClick} className="btn btn-dark rounded-circle" style={{ width: '45px', height: '45px' }}>←</button>
    </div>
  );

  // ---------------- LANDING ----------------
  const LandingPage = () => (
    <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center">
      <h1 className="display-3 fw-bold mb-2"><span className="text-warning">Ride</span>Ease</h1>
      <div className="glass-card p-4 mt-5 d-flex flex-column gap-3 shadow-lg" style={{ width: '350px' }}>
        <button onClick={() => navigateTo('login', 'customer')} className="btn btn-warning py-3 fw-bold fs-5">Rider Login</button>
        <button onClick={() => navigateTo('login', 'captain')} className="btn btn-outline-warning py-3 fw-bold fs-5">Captain Login</button>
        <hr className="border-secondary my-3"/>
        <button onClick={() => navigateTo('login', 'admin')} className="btn btn-dark text-danger border border-danger w-100">Admin Panel</button>
      </div>
    </div>
  );

  // ---------------- AUTH PAGE (Aapka Labels Wala Code) ----------------
  const AuthPage = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [authStep, setAuthStep] = useState('phone');

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const payload = role === 'admin' ? { phone, password } : { phone };
        const res = await axios.post(`${SERVER_URL}/api/login`, payload);

        if (res.data.isNew && role !== 'admin') {
          setAuthStep('register');
        } else if (!res.data.isNew) {
          finalizeLogin(res.data.user);
        } else {
          alert("Invalid Credentials");
        }
      } catch {
        alert("Server is waking up, retry in 10 seconds!");
      }
    };

    const handleRegister = async (e) => {
      e.preventDefault();
      const newUser = { phone, name, city, role };
      await axios.post(`${SERVER_URL}/api/register`, newUser);
      finalizeLogin(newUser);
    };

    const finalizeLogin = (user) => {
      localStorage.setItem('rideease_user', JSON.stringify(user));
      setUserData(user);
      socket.connect();
      setActiveTab(role === 'captain' ? 'radar' : role === 'admin' ? 'dash' : 'home');
      setCurrentView('dashboard');
    };

    return (
      <div className="container min-vh-100 d-flex justify-content-center align-items-center">
        <BackButton onClick={() => navigateTo('landing')} />
        <div className="glass-card p-5" style={{ width: '420px' }}>
          <h4 className="mb-4 text-center text-warning fw-bold">{role?.toUpperCase()} LOGIN</h4>

          {authStep === 'phone' ? (
            <form onSubmit={handleSubmit}>

              <div className="mb-3 text-start">
                <label className="form-label text-warning fw-semibold">
                  {role === 'admin' ? "Admin ID" : "Phone Number"}
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white p-3 border-secondary"
                  placeholder={role === 'admin' ? "Enter Admin ID" : "Enter 10-digit mobile number"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <small className="text-white-50">
                  {role === 'admin'
                    ? "Use official admin credentials"
                    : "Must be registered number"}
                </small>
              </div>

              {role === 'admin' && (
                <div className="mb-3 text-start">
                  <label className="form-label text-warning fw-semibold">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control bg-dark text-white p-3 border-secondary"
                    placeholder="Enter secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <small className="text-white-50">Password is case-sensitive</small>
                </div>
              )}

              <button type="submit" className="btn btn-warning w-100 py-3 mt-3 fw-bold">
                Continue
              </button>

            </form>
          ) : (
            <form onSubmit={handleRegister}>

              <div className="mb-3 text-start">
                <label className="form-label text-warning fw-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white p-3 border-secondary"
                  placeholder="Enter your full name"
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4 text-start">
                <label className="form-label text-warning fw-semibold">
                  City
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white p-3 border-secondary"
                  placeholder="Enter your city"
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <small className="text-white-50">
                  This helps us find nearby captains
                </small>
              </div>

              <button type="submit" className="btn btn-warning w-100 py-3 fw-bold">
                Create Account
              </button>

            </form>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // CUSTOMER PANEL
  // ==========================================
  const CustomerPanel = () => {
    const [rideState, setRideState] = useState('idle'); 
    const [currentRide, setCurrentRide] = useState(null);
    const fareAmount = 150; 

    useEffect(() => {
      socket.on('ride_accepted_by_captain', (data) => {
          if (data.riderPhone === userData.phone) {
             setCurrentRide(data); setRideState('accepted');
          }
      });
      socket.on('ride_completed_pay_now', (data) => {
          if (data.riderPhone === userData.phone) { setRideState('payment_pending'); }
      });
      socket.on('trip_fully_complete', (data) => {
          if (data.riderPhone === userData.phone) { 
              alert("Payment Successful! Ride Complete.");
              setRideState('idle'); setCurrentRide(null); 
          }
      });
      return () => { socket.off('ride_accepted_by_captain'); socket.off('ride_completed_pay_now'); socket.off('trip_fully_complete'); }
    }, []);

    const bookRide = () => {
        setRideState('searching');
        socket.emit('request_ride', {
            riderName: userData.name, riderPhone: userData.phone,
            pickup: `${userData.city} Station`, drop: "City Center Mall", fare: fareAmount
        });
    };

    const handleCashPayment = () => {
        socket.emit('payment_done', { ...currentRide, paymentMethod: 'Cash' });
    };

    const handleOnlinePayment = async () => {
      try {
        const orderRes = await axios.post(`${SERVER_URL}/api/create-order`, { amount: fareAmount });
        const options = {
          key: RAZORPAY_KEY_ID, amount: orderRes.data.amount, currency: "INR",
          name: "RideEase", description: "Ride Fare", order_id: orderRes.data.id,
          handler: (res) => socket.emit('payment_done', { ...currentRide, paymentMethod: 'Online', payId: res.razorpay_payment_id }),
          prefill: { name: userData.name, contact: userData.phone }, theme: { color: "#fbbf24" }
        };
        new window.Razorpay(options).open();
      } catch (err) { alert("Razorpay API Error. Trying Cash Instead."); }
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 text-white bg-dark">
          <div className="col-md-3 border-end border-secondary p-4 d-flex flex-column h-100 min-vh-100">
              <div className="text-center mb-4">
                  <h4 className="text-warning fw-bold">Customer Hub</h4>
                  <p className="text-white-50">Hello, {userData?.name}</p>
              </div>
              <button onClick={() => setActiveTab('home')} className={`btn text-start mb-2 ${activeTab==='home'?'btn-warning':'btn-outline-secondary text-white'}`}>📍 Book Ride</button>
              <button onClick={() => setActiveTab('history')} className={`btn text-start mb-2 ${activeTab==='history'?'btn-warning':'btn-outline-secondary text-white'}`}>📜 My History</button>
              <button onClick={() => setActiveTab('wallet')} className={`btn text-start mb-2 ${activeTab==='wallet'?'btn-warning':'btn-outline-secondary text-white'}`}>💳 Wallet & Cards</button>
              <button onClick={() => setActiveTab('refer')} className={`btn text-start mb-2 ${activeTab==='refer'?'btn-warning':'btn-outline-secondary text-white'}`}>🎁 Refer & Earn</button>
              <button onClick={() => setActiveTab('profile')} className={`btn text-start mb-5 ${activeTab==='profile'?'btn-warning':'btn-outline-secondary text-white'}`}>⚙️ Profile Settings</button>
              <button onClick={handleLogout} className="btn btn-danger w-100 mt-auto">Logout</button>
          </div>
          
          <div className="col-md-9 p-5">
             {activeTab === 'home' && (
                 <div className="glass-card p-5 mx-auto animate__animated animate__fadeIn" style={{maxWidth:'550px'}}>
                     {rideState === 'idle' && (
                        <>
                            <h3 className="mb-4 fw-bold">Where to today?</h3>
                            <input className="form-control bg-dark text-white p-3 mb-3 border-secondary" value={`${userData?.city} Station`} readOnly />
                            <input className="form-control bg-dark text-white p-3 mb-4 border-secondary" value="City Center Mall" readOnly />
                            <button onClick={bookRide} className="btn btn-warning w-100 py-3 fs-5 fw-bold">Find Captain (₹{fareAmount})</button>
                        </>
                     )}
                     {rideState === 'searching' && (
                         <div className="text-center py-5">
                             <div className="spinner-border text-warning mb-3"></div>
                             <h4 className="text-warning">Searching for Captains...</h4>
                             <p className="text-white-50">Live broadcasting to nearby riders.</p>
                         </div>
                     )}
                     {rideState === 'accepted' && (
                         <div className="text-center py-4">
                            <h3 className="text-success fw-bold mb-3">Captain {currentRide?.captain} is arriving! 🏍️</h3>
                            <p className="text-white-50">Enjoy your ride. You will pay after reaching.</p>
                            <div className="spinner-grow text-success mt-4"></div>
                         </div>
                     )}
                     {rideState === 'payment_pending' && (
                         <div className="text-center py-4 animate__animated animate__bounceIn">
                            <h2 className="text-warning fw-bold mb-3">Destination Reached!</h2>
                            <h1 className="text-white mb-4">₹{fareAmount}</h1>
                            <p className="text-white-50 mb-4">How would you like to pay Captain {currentRide?.captain}?</p>
                            <div className="d-flex flex-column gap-3">
                                <button onClick={handleOnlinePayment} className="btn btn-success py-3 fw-bold fs-5">Pay Online (Razorpay)</button>
                                <button onClick={handleCashPayment} className="btn btn-outline-light py-3 fw-bold fs-5">I will Pay Cash</button>
                            </div>
                         </div>
                     )}
                 </div>
             )}
             {activeTab === 'history' && <div className="glass-card p-4"><h4>Past Rides</h4><p className="text-success">Station to Mall - ₹150 (Completed)</p></div>}
             {activeTab === 'wallet' && <div className="glass-card p-4"><h4>Wallet</h4><h2>₹0.00</h2><button className="btn btn-warning mt-3">Add Money</button></div>}
             {activeTab === 'refer' && <div className="glass-card p-4 text-center"><h4>Refer Code: RIDE-{userData?.phone.slice(0,4)}</h4><p>Share to get ₹50 off!</p></div>}
             {activeTab === 'profile' && <div className="glass-card p-4"><h4>Profile</h4><p>Name: {userData?.name}</p><p>Phone: {userData?.phone}</p></div>}
          </div>
      </div>
    );
  };

  // ==========================================
  // CAPTAIN PANEL
  // ==========================================
  const CaptainPanel = () => {
    const [incomingRide, setIncomingRide] = useState(null);
    const [activeRide, setActiveRide] = useState(null);

    useEffect(() => {
      socket.on('incoming_ride', (data) => { if(!activeRide) setIncomingRide(data); });
      socket.on('trip_fully_complete', (data) => {
          if(activeRide && activeRide.id === data.id) {
              alert(`Payment of ₹${data.fare} received via ${data.paymentMethod}!`);
              setActiveRide(null);
          }
      });
      return () => { socket.off('incoming_ride'); socket.off('trip_fully_complete'); }
    }, [activeRide]);

    const acceptRide = () => {
      socket.emit('accept_ride', { ...incomingRide, captainName: userData?.name });
      setActiveRide(incomingRide);
      setIncomingRide(null);
    };

    const markRideComplete = () => {
        socket.emit('finish_ride', activeRide);
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 text-white bg-dark">
          <div className="col-md-3 border-end border-secondary p-4 d-flex flex-column h-100 min-vh-100">
              <div className="text-center mb-4">
                  <h4 className="text-warning fw-bold">Captain Hub</h4>
                  <span className="badge bg-success">Online</span>
              </div>
              <button onClick={() => setActiveTab('radar')} className={`btn text-start mb-2 ${activeTab==='radar'?'btn-warning':'btn-outline-secondary text-white'}`}>📡 Live Radar</button>
              <button onClick={() => setActiveTab('earnings')} className={`btn text-start mb-2 ${activeTab==='earnings'?'btn-warning':'btn-outline-secondary text-white'}`}>💰 Earnings</button>
              <button onClick={() => setActiveTab('history')} className={`btn text-start mb-2 ${activeTab==='history'?'btn-warning':'btn-outline-secondary text-white'}`}>📜 Trip History</button>
              <button onClick={() => setActiveTab('vehicle')} className={`btn text-start mb-2 ${activeTab==='vehicle'?'btn-warning':'btn-outline-secondary text-white'}`}>🏍️ Vehicle Docs</button>
              <button onClick={() => setActiveTab('profile')} className={`btn text-start mb-5 ${activeTab==='profile'?'btn-warning':'btn-outline-secondary text-white'}`}>⚙️ My Profile</button>
              <button onClick={handleLogout} className="btn btn-danger w-100 mt-auto">Go Offline (Logout)</button>
          </div>
          
          <div className="col-md-9 p-5">
             {activeTab === 'radar' && (
                 <div className="mx-auto" style={{maxWidth:'600px'}}>
                     {activeRide ? (
                         <div className="glass-card p-5 border-success text-center animate__animated animate__fadeIn">
                             <h2 className="text-success fw-bold mb-4">Current Ride: ACTIVE</h2>
                             <div className="bg-dark p-3 rounded mb-4 text-start">
                                 <p><strong>Rider:</strong> {activeRide.riderName} ({activeRide.riderPhone})</p>
                                 <p><strong>From:</strong> {activeRide.pickup}</p>
                                 <p><strong>To:</strong> {activeRide.drop}</p>
                             </div>
                             <button onClick={markRideComplete} className="btn btn-danger w-100 py-3 fs-5 fw-bold">End Ride & Request Payment</button>
                             <p className="mt-3 text-white-50 small">Clicking this will send a payment popup to the customer.</p>
                         </div>
                     ) : incomingRide ? (
                         <div className="glass-card p-5 border-warning animate__animated animate__tada">
                             <h3 className="text-warning fw-bold mb-3">🔥 New Request!</h3>
                             <p className="fs-5">Rider: <strong>{incomingRide.riderName}</strong></p>
                             <p className="fs-5">Pickup: <strong>{incomingRide.pickup}</strong></p>
                             <h2 className="text-success my-4">₹{incomingRide.fare}</h2>
                             <div className="d-flex gap-3">
                                 <button onClick={acceptRide} className="btn btn-success flex-grow-1 py-3 fw-bold fs-5">Accept</button>
                                 <button onClick={()=>setIncomingRide(null)} className="btn btn-outline-danger flex-grow-1 py-3 fw-bold">Reject</button>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center mt-5 opacity-50">
                             <div className="spinner-grow text-warning mb-4" style={{width:'4rem', height:'4rem'}}></div>
                             <h2>Radar Active</h2>
                             <p>Scanning for nearby riders in {userData?.city}...</p>
                         </div>
                     )}
                 </div>
             )}
             {activeTab === 'earnings' && <div className="glass-card p-4"><h4>Today's Earnings</h4><h1 className="text-success">₹850</h1><p>6 Trips Completed</p></div>}
             {activeTab === 'history' && <div className="glass-card p-4"><h4>Past Trips</h4><p>Station to Mall - ₹150</p></div>}
             {activeTab === 'vehicle' && <div className="glass-card p-4"><h4>Docs</h4><p>RC Book: Verified ✅</p><p>License: Verified ✅</p></div>}
             {activeTab === 'profile' && <div className="glass-card p-4"><h4>Captain Profile</h4><p>Name: {userData?.name}</p><p>Vehicle: MH-04-AB-1234</p></div>}
          </div>
      </div>
    );
  };

  // ==========================================
  // ADMIN PANEL
  // ==========================================
  const AdminPanel = () => {
    const [stats, setStats] = useState({ active: 0, completed: 0 });

    useEffect(() => {
        socket.on('admin_update', (data) => {
            if(data.type === 'new_ride') setStats(prev => ({...prev, active: data.count || data.rides}));
            if(data.type === 'complete_ride') setStats(prev => ({ active: prev.active - 1 > 0 ? prev.active - 1 : 0, completed: prev.completed + 1 }));
        });
        return () => socket.off('admin_update');
    }, []);

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 bg-dark text-white">
          <div className="col-md-3 border-end border-danger p-4 d-flex flex-column h-100 min-vh-100">
              <h4 className="text-danger fw-bold mb-5 mt-2">Admin Control</h4>
              <button onClick={() => setActiveTab('dash')} className={`btn text-start mb-2 ${activeTab==='dash'?'btn-danger':'btn-outline-secondary text-white'}`}>📈 Live Dashboard</button>
              <button onClick={() => setActiveTab('liverides')} className={`btn text-start mb-2 ${activeTab==='liverides'?'btn-danger':'btn-outline-secondary text-white'}`}>📍 Active Map</button>
              <button onClick={() => setActiveTab('users')} className={`btn text-start mb-2 ${activeTab==='users'?'btn-danger':'btn-outline-secondary text-white'}`}>👥 Manage Users</button>
              <button onClick={() => setActiveTab('captains')} className={`btn text-start mb-2 ${activeTab==='captains'?'btn-danger':'btn-outline-secondary text-white'}`}>🏍️ Verify Captains</button>
              <button onClick={() => setActiveTab('settings')} className={`btn text-start mb-5 ${activeTab==='settings'?'btn-danger':'btn-outline-secondary text-white'}`}>⚙️ System Settings</button>
              <button onClick={handleLogout} className="btn btn-outline-light w-100 mt-auto">Exit System</button>
          </div>
          
          <div className="col-md-9 p-5">
              {activeTab === 'dash' && (
                  <>
                  <h2 className="mb-4 fw-bold">Live System Analytics</h2>
                  <div className="row g-4 mb-4">
                     <div className="col-4"><div className="glass-card p-4 border-warning"><h6>Active Rides Now</h6><h1 className="text-warning">{stats.active}</h1></div></div>
                     <div className="col-4"><div className="glass-card p-4 border-success"><h6>Rides Completed</h6><h1 className="text-success">{stats.completed}</h1></div></div>
                     <div className="col-4"><div className="glass-card p-4 border-info"><h6>Total Revenue</h6><h1 className="text-info">₹{stats.completed * 150}</h1></div></div>
                  </div>
                  <div className="glass-card p-4 text-center mt-5 opacity-75">
                      <h4 className="text-success">System Operational</h4>
                      <p className="mb-0">Socket servers are actively syncing data across all tabs.</p>
                  </div>
                  </>
              )}
              {activeTab === 'liverides' && <div className="glass-card p-4"><h4>Live Map Tracking</h4><p>Tracking {stats.active} vehicles on map...</p></div>}
              {activeTab === 'users' && <div className="glass-card p-4"><h4>User Database</h4><p>Total Registered Customers: 142</p></div>}
              {activeTab === 'captains' && <div className="glass-card p-4"><h4>Pending Verifications</h4><p className="text-danger">0 Captains Pending</p></div>}
              {activeTab === 'settings' && <div className="glass-card p-4"><h4>Server Config</h4><p>Base Fare: ₹150</p><p>Surge Multiplier: 1.0x</p></div>}
          </div>
      </div>
    );
  };

  // ==========================================
  // ROUTER
  // ==========================================
  if (currentView === 'login') return <AuthPage />;
  if (currentView === 'dashboard') {
      if (role === 'customer') return <CustomerPanel />;
      if (role === 'captain') return <CaptainPanel />;
      if (role === 'admin') return <AdminPanel />;
  }
  return <LandingPage />;
}
