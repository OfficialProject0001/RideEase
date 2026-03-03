import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// LIVE SERVER LINK - DO NOT CHANGE THIS!
const SERVER_URL = "https://rideease-4m7a.onrender.com"; 
const socket = io(SERVER_URL, { autoConnect: false });

// ⚠️ YOUR RAZORPAY TEST KEY HERE
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
      if(parsedUser.role === 'admin') {
         setCurrentView('dashboard'); setActiveTab('dash');
      } else {
         setCurrentView('dashboard'); setActiveTab(parsedUser.role === 'captain' ? 'overview' : 'home');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('rideease_user');
    setUserData(null); setRole(null); setCurrentView('landing');
    socket.disconnect();
  };

  const navigateTo = (view, newRole = null) => {
      if(newRole) setRole(newRole);
      setCurrentView(view);
  };

  const BackButton = ({ onClick }) => (
      <div className="position-absolute top-0 start-0 m-4 z-index-100">
          <button onClick={onClick} className="btn btn-dark rounded-circle" style={{width:'45px', height:'45px'}}>←</button>
      </div>
  );

  // --------------------------------------------------------
  // 1. LANDING & LOGIN (Admin Auth Added)
  // --------------------------------------------------------
  const LandingPage = () => (
      <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center">
          <h1 className="display-3 fw-bold mb-2"><span className="text-warning">Ride</span>Ease</h1>
          <div className="glass-card p-4 mt-5 d-flex flex-column gap-3" style={{width: '350px'}}>
             <button onClick={() => navigateTo('login', 'customer')} className="btn btn-premium w-100 py-3">Rider Login</button>
             <button onClick={() => navigateTo('login', 'captain')} className="btn btn-outline-warning w-100 py-3">Captain Login</button>
             <button onClick={() => navigateTo('login', 'admin')} className="btn text-danger mt-3">Admin Panel</button>
          </div>
      </div>
  );

  const AuthPage = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState(''); // Only for admin
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [authStep, setAuthStep] = useState('phone'); 
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = role === 'admin' ? { phone, password } : { phone };
            const res = await axios.post(`${SERVER_URL}/api/login`, payload);
            
            if(res.data.isNew && role !== 'admin') {
                 setAuthStep('register');
            } else if (!res.data.isNew) {
                finalizeLogin(res.data.user);
            } else {
                alert("Invalid Admin Credentials");
            }
        } catch(e) { alert("Server connection failed."); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const newUser = { phone, name, city, role };
        try {
            await axios.post(`${SERVER_URL}/api/register`, newUser);
            finalizeLogin(newUser);
        } catch (err) { alert("Registration failed."); }
    };

    const finalizeLogin = (user) => {
        localStorage.setItem('rideease_user', JSON.stringify(user));
        setUserData(user); socket.connect();
        setActiveTab(role === 'captain' ? 'overview' : role === 'admin' ? 'dash' : 'home');
        setCurrentView('dashboard');
    };

    return (
        <div className="container min-vh-100 d-flex justify-content-center align-items-center">
            <BackButton onClick={() => navigateTo('landing')} />
            <div className="glass-card p-5" style={{width: '400px'}}>
                <h4 className="mb-4 text-center">{role.toUpperCase()} LOGIN</h4>
                {authStep === 'phone' ? (
                    <form onSubmit={handleSubmit}>
                        <input type="text" placeholder={role === 'admin' ? "Admin ID" : "Phone Number"} className="form-control bg-dark text-white p-3 mb-3" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                        {role === 'admin' && (
                             <input type="password" placeholder="Password" className="form-control bg-dark text-white p-3 mb-3" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                        )}
                        <button type="submit" className="btn btn-warning w-100 py-3">Continue</button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <input type="text" placeholder="Full Name" className="form-control bg-dark text-white p-3 mb-3" onChange={(e)=>setName(e.target.value)} required />
                        <input type="text" placeholder="City" className="form-control bg-dark text-white p-3 mb-4" onChange={(e)=>setCity(e.target.value)} required />
                        <button type="submit" className="btn btn-warning w-100 py-3">Create Account</button>
                    </form>
                )}
            </div>
        </div>
    );
  };

  // --------------------------------------------------------
  // 2. CUSTOMER PANEL (Pay First vs Cash Logic)
  // --------------------------------------------------------
  const CustomerPanel = () => {
    const [rideStatus, setRideStatus] = useState('idle');
    const [captainDetails, setCaptainDetails] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('online'); // Cash or Online
    const fareAmount = 150; 

    useEffect(() => {
      socket.on('ride_confirmed', (data) => {
          if (data.riderPhone === userData.phone) {
             setCaptainDetails(data);
             setRideStatus('accepted');
          }
      });
      return () => socket.off('ride_confirmed');
    }, [userData]);

    const bookRide = (payId = "Cash") => {
        setRideStatus('searching');
        socket.emit('request_ride', {
            riderName: userData.name, riderPhone: userData.phone,
            pickup: `${userData.city} Center`, drop: "Mall",
            fare: fareAmount, payment: paymentMethod, payId: payId
        });
    };

    const processPaymentAndBook = async () => {
      if(paymentMethod === 'cash') return bookRide();
      
      try {
        const orderRes = await axios.post(`${SERVER_URL}/api/create-order`, { amount: fareAmount });
        const options = {
          key: RAZORPAY_KEY_ID, amount: orderRes.data.amount, currency: "INR",
          name: "RideEase", description: "Advance Booking", order_id: orderRes.data.id,
          handler: (response) => bookRide(response.razorpay_payment_id),
          theme: { color: "#fbbf24" }
        };
        new window.Razorpay(options).open();
      } catch (error) { alert("Razorpay API error."); }
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 text-white">
          <div className="col-md-3 bg-dark border-end border-secondary p-4">
              <h4 className="text-warning">Rider Dashboard</h4>
              <p>Hi, {userData?.name}</p>
              <button onClick={() => setActiveTab('home')} className="btn btn-dark w-100 text-start mt-3">🏠 New Ride</button>
              <button onClick={() => setActiveTab('history')} className="btn btn-dark w-100 text-start mt-2">📜 History</button>
              <button onClick={handleLogout} className="btn btn-danger w-100 mt-5">Logout</button>
          </div>
          <div className="col-md-9 p-5">
             {activeTab === 'home' && (
                 <div className="glass-card p-5 mx-auto" style={{maxWidth:'500px'}}>
                     {rideStatus === 'idle' && (
                        <>
                            <h3 className="mb-4">Book Trip</h3>
                            <div className="d-flex gap-2 mb-4">
                               <button onClick={()=>setPaymentMethod('online')} className={`btn flex-grow-1 ${paymentMethod==='online'?'btn-warning':'btn-outline-warning'}`}>Online (Razorpay)</button>
                               <button onClick={()=>setPaymentMethod('cash')} className={`btn flex-grow-1 ${paymentMethod==='cash'?'btn-warning':'btn-outline-warning'}`}>Pay Cash</button>
                            </div>
                            <button onClick={processPaymentAndBook} className="btn btn-premium w-100 py-3">Confirm • ₹{fareAmount}</button>
                        </>
                     )}
                     {rideStatus === 'searching' && <h4 className="text-center text-warning">Finding Captains...</h4>}
                     {rideStatus === 'accepted' && (
                         <div className="text-center">
                            <h3 className="text-success mb-3">Captain {captainDetails?.captainName} is arriving!</h3>
                            <button onClick={()=>{ setRideStatus('idle'); socket.emit('complete_ride', {}); }} className="btn btn-outline-success mt-3">End Trip</button>
                         </div>
                     )}
                 </div>
             )}
          </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 3. CAPTAIN PANEL (Realtime incoming ride sync)
  // --------------------------------------------------------
  const CaptainPanel = () => {
    const [incomingRide, setIncomingRide] = useState(null);

    useEffect(() => {
      socket.on('incoming_ride', (data) => setIncomingRide(data));
      return () => socket.off('incoming_ride');
    }, []);

    const acceptRide = () => {
      socket.emit('accept_ride', { ...incomingRide, captainName: userData?.name });
      setIncomingRide(null);
      alert("Accepted! Driving to Rider.");
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 text-white">
          <div className="col-md-3 bg-dark border-end border-secondary p-4">
              <h4 className="text-warning">Captain Hub</h4>
              <p>Hi, {userData?.name}</p>
              <button onClick={handleLogout} className="btn btn-danger w-100 mt-5">Go Offline</button>
          </div>
          <div className="col-md-9 p-5">
              {!incomingRide ? (
                  <h3 className="text-center text-muted mt-5">Scanning for Riders...</h3>
              ) : (
                  <div className="glass-card p-5 mx-auto border-warning" style={{maxWidth:'500px'}}>
                      <h3 className="text-warning">New Ride Alert!</h3>
                      <p>Rider: {incomingRide.riderName}</p>
                      <p>Payment: {incomingRide.payment.toUpperCase()} ({incomingRide.fare})</p>
                      <button onClick={acceptRide} className="btn btn-success w-100 py-3 mt-3">Accept</button>
                  </div>
              )}
          </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 4. ADMIN PANEL (Live metrics sync)
  // --------------------------------------------------------
  const AdminPanel = () => {
    const [stats, setStats] = useState({ rides: 0, completed: 0 });

    useEffect(() => {
        socket.on('admin_update', (data) => {
            if(data.type === 'new_ride') setStats(prev => ({...prev, rides: data.count}));
            if(data.type === 'complete_ride') setStats(prev => ({...prev, completed: prev.completed + 1}));
        });
        return () => socket.off('admin_update');
    }, []);

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 bg-dark text-white">
          <div className="col-md-3 border-end border-danger p-4">
              <h4 className="text-danger">Admin Control</h4>
              <button onClick={handleLogout} className="btn btn-outline-light w-100 mt-5">Exit</button>
          </div>
          <div className="col-md-9 p-5">
              <h2 className="mb-4">Live System Analytics</h2>
              <div className="row g-4">
                 <div className="col-4"><div className="glass-card p-4"><h6>Active Ride Requests</h6><h2 className="text-warning">{stats.rides}</h2></div></div>
                 <div className="col-4"><div className="glass-card p-4"><h6>Completed Rides</h6><h2 className="text-success">{stats.completed}</h2></div></div>
              </div>
          </div>
      </div>
    );
  };

  if(currentView === 'login' || currentView === 'register') return <AuthPage />;
  if(currentView === 'dashboard' && role === 'customer') return <CustomerPanel />;
  if(currentView === 'dashboard' && role === 'captain') return <CaptainPanel />;
  if(currentView === 'dashboard' && role === 'admin') return <AdminPanel />;
  return <LandingPage />;
}
