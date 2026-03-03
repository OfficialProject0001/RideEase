import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// 🚀 Asli Server Connection (Render live link ya localhost daalein)
const SERVER_URL = "http://localhost:5000"; 
const SERVER_URL = "https://rideease-4m7a.onrender.com";

// ⚠️ APNI RAZORPAY KEY YAHAN BHI DAALEIN ⚠️
const RAZORPAY_KEY_ID = "rzp_test_YOUR_KEY_HERE";

export default function App() {
  const [role, setRole] = useState('landing'); 
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);

  // Load Razorpay Script Automatically
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
  // 1. SMART LOGIN PAGE
  // --------------------------------------------------------
  const LandingPage = () => {
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [selectedRole, setSelectedRole] = useState('customer');

    const handleLogin = async (e) => {
      e.preventDefault();
      if(phone.length !== 10) return alert("Please enter 10 digits");
      try {
        const res = await axios.post(`${SERVER_URL}/api/login`, { phone });
        if (res.data.isNew) setStep(2);
        else {
          localStorage.setItem('rideease_user', JSON.stringify(res.data.user));
          setUserData(res.data.user);
          setRole(res.data.user.role);
        }
      } catch (err) { alert("Server error!"); }
    };

    const handleRegister = async (e) => {
      e.preventDefault();
      const newUser = { phone, name, city, role: selectedRole };
      try {
        await axios.post(`${SERVER_URL}/api/register`, newUser);
        localStorage.setItem('rideease_user', JSON.stringify(newUser));
        setUserData(newUser);
        setRole(selectedRole);
      } catch (err) { alert("Registration failed!"); }
    };

    return (
      <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 text-center">
         <h1 className="display-1 fw-bold mb-3"><span className="text-warning">Ride</span>Ease</h1>
         <div className="glass-card p-5 mt-4" style={{width: '400px'}}>
            {step === 1 ? (
              <form onSubmit={handleLogin}>
                <h4 className="mb-4">Login / Sign Up</h4>
                <div className="d-flex justify-content-center gap-2 mb-4">
                   <button type="button" onClick={()=>setSelectedRole('customer')} className={`btn btn-sm ${selectedRole === 'customer' ? 'btn-warning' : 'btn-outline-secondary text-white'}`}>Customer</button>
                   <button type="button" onClick={()=>setSelectedRole('captain')} className={`btn btn-sm ${selectedRole === 'captain' ? 'btn-warning' : 'btn-outline-secondary text-white'}`}>Captain</button>
                   <button type="button" onClick={()=>setRole('admin')} className="btn btn-sm btn-outline-danger">Admin</button>
                </div>
                <input type="number" className="form-control bg-dark text-white p-3 mb-3" placeholder="Phone Number" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                <button type="submit" className="btn btn-premium w-100 py-2">Continue</button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <h4 className="mb-4 text-warning">Welcome New {selectedRole}!</h4>
                <input type="text" className="form-control bg-dark text-white p-3 mb-3" placeholder="Full Name" value={name} onChange={(e)=>setName(e.target.value)} required />
                <input type="text" className="form-control bg-dark text-white p-3 mb-4" placeholder="City (e.g., Virar)" value={city} onChange={(e)=>setCity(e.target.value)} required />
                <button type="submit" className="btn btn-premium w-100 py-2">Create Account</button>
              </form>
            )}
         </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 2. CUSTOMER PANEL (WITH RAZORPAY)
  // --------------------------------------------------------
  const CustomerPanel = () => {
    const [rideStatus, setRideStatus] = useState('idle');
    const [captainDetails, setCaptainDetails] = useState(null);
    const fareAmount = 150; // Demo Fare

    useEffect(() => {
      socket.on('ride_confirmed', (data) => {
        setCaptainDetails(data);
        setRideStatus('accepted');
      });
      return () => socket.off('ride_confirmed');
    }, []);

    const processPaymentAndBook = async () => {
      try {
        // 1. Create Order in Backend
        const orderRes = await axios.post(`${SERVER_URL}/api/create-order`, { amount: fareAmount });
        const order = orderRes.data;

        // 2. Open Razorpay Window
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "RideEase Premium",
          description: "Advance Ride Booking",
          order_id: order.id,
          handler: function (response) {
            alert(`Payment Success! ID: ${response.razorpay_payment_id}`);
            // 3. Emit Socket to find Drivers AFTER payment
            setRideStatus('searching');
            socket.emit('request_ride', {
              riderName: userData.name,
              pickup: `${userData.city} Railway Station`,
              drop: "Destination XYZ",
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
        console.error("Payment Init Error:", error);
        alert("Failed to connect to payment gateway.");
      }
    };

    return (
      <div className="container-fluid min-vh-100 p-3 position-relative">
        <div className="map-bg"></div>
        <div className="row g-4 position-relative" style={{ zIndex: 10 }}>
          <div className="col-md-3">
            <div className="glass-card p-4 h-100 text-center">
              <img src={`https://ui-avatars.com/api/?name=${userData?.name}&background=fbbf24`} className="rounded-circle mb-3" width="70" alt="profile"/>
              <h5 className="text-warning">{userData?.name}</h5>
              <p className="small text-white-50">{userData?.city}, Maharashtra</p>
              <button onClick={logout} className="btn btn-outline-danger w-100 mt-5">🚪 Logout</button>
            </div>
          </div>
          
          <div className="col-md-9">
            <div className="glass-card p-4 mx-auto mt-5 animate__animated animate__fadeInUp" style={{maxWidth: '500px'}}>
              {rideStatus === 'idle' && (
                <>
                  <h4 className="fw-bold mb-4">Book a Ride</h4>
                  <input className="form-control bg-dark text-white mb-3 p-3" value={`${userData?.city} Station`} readOnly />
                  <input className="form-control bg-dark text-white mb-4 p-3" placeholder="Enter Drop Destination" />
                  <button onClick={processPaymentAndBook} className="btn btn-premium w-100 fs-5">Pay ₹{fareAmount} & Book Ride</button>
                </>
              )}

              {rideStatus === 'searching' && (
                <div className="text-center py-4">
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
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 3. CAPTAIN & ADMIN PANELS
  // --------------------------------------------------------
  const CaptainPanel = () => {
    const [incomingRide, setIncomingRide] = useState(null);

    useEffect(() => {
      socket.on('incoming_ride', (data) => setIncomingRide(data));
      return () => socket.off('incoming_ride');
    }, []);

    const acceptRide = () => {
      socket.emit('accept_ride', { ...incomingRide, captainName: userData.name, vehicle: "MH-15-XY-9999" });
      setIncomingRide(null);
      alert("Ride Accepted! Navigation Started.");
    };

    return (
      <div className="container-fluid min-vh-100 p-4 bg-dark">
        <div className="d-flex justify-content-between align-items-center mb-4 glass-card p-3">
          <h4 className="text-warning mb-0">Duty Status: ONLINE</h4>
          <button onClick={logout} className="btn btn-danger">Duty Off</button>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-6">
            {!incomingRide ? (
              <div className="glass-card p-5 text-center opacity-50 mt-5">
                <div className="spinner-grow text-warning mb-3" style={{width: '3rem', height: '3rem'}}></div>
                <h3>Waiting for Rides in {userData?.city}...</h3>
              </div>
            ) : (
              <div className="glass-card p-5 border-warning border-3 mt-5 animate__animated animate__tada">
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
        </div>
      </div>
    );
  };

  if (role === 'customer') return <CustomerPanel />;
  if (role === 'captain') return <CaptainPanel />;
  if (role === 'admin') return <div className="text-center mt-5 text-white"><h1>Admin Console</h1><button onClick={logout} className="btn btn-danger">Back</button></div>;

  return <LandingPage />;
}
