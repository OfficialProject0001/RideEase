import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// 🚀 Asli Server Connection
const SERVER_URL = "http://localhost:5000"; 
const socket = io(SERVER_URL);

export default function App() {
  const [role, setRole] = useState('landing'); 
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);

  // Jab App load ho, check karo kya user pehle se logged in hai?
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
  // 1. SMART LOGIN & REGISTRATION SYSTEM
  // --------------------------------------------------------
  const LandingPage = () => {
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [selectedRole, setSelectedRole] = useState('customer'); // customer or captain

    const handleLogin = async (e) => {
      e.preventDefault();
      if(phone.length !== 10) return alert("10 digit number daaliye Boss!");
      
      try {
        // DB me check karo
        const res = await axios.post(`${SERVER_URL}/api/login`, { phone });
        if (res.data.isNew) {
          setStep(2); // Naya user -> Form dikhao
        } else {
          // Purana user -> Seedha Login
          localStorage.setItem('rideease_user', JSON.stringify(res.data.user));
          setUserData(res.data.user);
          setRole(res.data.user.role);
        }
      } catch (err) { console.error(err); alert("Server error!"); }
    };

    const handleRegister = async (e) => {
      e.preventDefault();
      const newUser = { phone, name, city, role: selectedRole };
      try {
        await axios.post(`${SERVER_URL}/api/register`, newUser);
        localStorage.setItem('rideease_user', JSON.stringify(newUser));
        setUserData(newUser);
        setRole(selectedRole);
      } catch (err) { console.error(err); alert("Registration failed!"); }
    };

    return (
      <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 text-center">
         <h1 className="display-1 fw-bold mb-3"><span className="text-warning">Ride</span>Ease</h1>
         
         <div className="glass-card p-5 mt-4" style={{width: '400px'}}>
            {step === 1 ? (
              <form onSubmit={handleLogin} className="animate__animated animate__fadeIn">
                <h4 className="mb-4">Login / Sign Up</h4>
                <div className="d-flex justify-content-center gap-2 mb-4">
                   <button type="button" onClick={()=>setSelectedRole('customer')} className={`btn btn-sm ${selectedRole === 'customer' ? 'btn-warning' : 'btn-outline-secondary'}`}>Customer</button>
                   <button type="button" onClick={()=>setSelectedRole('captain')} className={`btn btn-sm ${selectedRole === 'captain' ? 'btn-warning' : 'btn-outline-secondary'}`}>Captain</button>
                   <button type="button" onClick={()=>setRole('admin')} className="btn btn-sm btn-outline-danger">Admin</button>
                </div>
                <input type="number" className="form-control bg-dark text-white p-3 mb-3" placeholder="Phone Number" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                <button type="submit" className="btn btn-premium w-100 py-2">Continue</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="animate__animated animate__fadeIn">
                <h4 className="mb-4 text-warning">Welcome New {selectedRole}!</h4>
                <input type="text" className="form-control bg-dark text-white p-3 mb-3" placeholder="Full Name" value={name} onChange={(e)=>setName(e.target.value)} required />
                <input type="text" className="form-control bg-dark text-white p-3 mb-4" placeholder="City" value={city} onChange={(e)=>setCity(e.target.value)} required />
                <button type="submit" className="btn btn-premium w-100 py-2">Create Account</button>
              </form>
            )}
         </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 2. REAL-TIME CUSTOMER PANEL
  // --------------------------------------------------------
  const CustomerPanel = () => {
    const [rideStatus, setRideStatus] = useState('idle'); // idle, searching, accepted
    const [captainDetails, setCaptainDetails] = useState(null);

    // Jab Captain accept karega toh ye chalega!
    useEffect(() => {
      socket.on('ride_confirmed', (data) => {
        setCaptainDetails(data);
        setRideStatus('accepted');
      });
      return () => socket.off('ride_confirmed');
    }, []);

    const bookRealRide = () => {
      setRideStatus('searching');
      const rideDetails = {
        riderName: userData.name,
        pickup: "Current Location",
        drop: "City Center",
        fare: "₹150",
        phone: userData.phone
      };
      socket.emit('request_ride', rideDetails); // Server ko request bhej di!
    };

    return (
      <div className="container-fluid min-vh-100 p-3 position-relative">
        <div className="map-bg"></div>
        <div className="row g-4 position-relative" style={{ zIndex: 10 }}>
          <div className="col-md-3">
            <div className="glass-card p-4 h-100 text-center">
              <img src={`https://ui-avatars.com/api/?name=${userData?.name}&background=fbbf24`} className="rounded-circle mb-3" width="70" alt="profile"/>
              <h5 className="text-warning">{userData?.name}</h5>
              <p className="small text-white-50">{userData?.city}</p>
              <button onClick={logout} className="btn btn-outline-danger w-100 mt-5">🚪 Logout</button>
            </div>
          </div>
          
          <div className="col-md-9">
            <div className="glass-card p-4 mx-auto mt-5 animate__animated animate__fadeInUp" style={{maxWidth: '500px'}}>
              {rideStatus === 'idle' && (
                <>
                  <h4 className="fw-bold mb-4">Book a Ride</h4>
                  <input className="form-control bg-dark text-white mb-3 p-3" value="Current Location" readOnly />
                  <input className="form-control bg-dark text-white mb-4 p-3" placeholder="Enter Drop Destination" />
                  <button onClick={bookRealRide} className="btn btn-premium w-100 fs-5">Confirm RideEase</button>
                </>
              )}

              {rideStatus === 'searching' && (
                <div className="text-center py-4">
                  <div className="spinner-border text-warning mb-3"></div>
                  <h4 className="text-warning">Finding Captains...</h4>
                  <p className="text-white-50">Request sent to nearby drivers.</p>
                </div>
              )}

              {rideStatus === 'accepted' && (
                <div className="text-center py-4 border border-success rounded bg-dark">
                  <h4 className="text-success mb-3">Captain is on the way! 🏍️</h4>
                  <h2 className="fw-bold">{captainDetails?.captainName}</h2>
                  <p className="text-warning fs-5">{captainDetails?.vehicle}</p>
                  <p>Fare: {captainDetails?.fare}</p>
                  <button onClick={() => setRideStatus('idle')} className="btn btn-success px-4 mt-2">Complete Ride</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // 3. REAL-TIME CAPTAIN PANEL
  // --------------------------------------------------------
  const CaptainPanel = () => {
    const [incomingRide, setIncomingRide] = useState(null);

    // Live Ride Request aayegi toh ye chalega!
    useEffect(() => {
      socket.on('incoming_ride', (data) => {
        setIncomingRide(data);
      });
      return () => socket.off('incoming_ride');
    }, []);

    const acceptRide = () => {
      socket.emit('accept_ride', { ...incomingRide, captainName: userData.name, vehicle: "MH-15-AB-1234" });
      setIncomingRide(null);
      alert("Ride Accepted! Navigation Started.");
    };

    return (
      <div className="container-fluid min-vh-100 p-4 bg-dark">
        <div className="d-flex justify-content-between align-items-center mb-4 glass-card p-3">
          <h4 className="text-warning mb-0">Welcome Captain {userData?.name}!</h4>
          <button onClick={logout} className="btn btn-danger">Duty Off (Logout)</button>
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
                 <h3 className="text-warning mb-4">🔥 NEW RIDE REQUEST!</h3>
                 <p className="fs-5"><b>Customer:</b> {incomingRide.riderName}</p>
                 <p className="fs-5"><b>Pickup:</b> {incomingRide.pickup}</p>
                 <p className="fs-5"><b>Drop:</b> {incomingRide.drop}</p>
                 <h2 className="text-success my-4">{incomingRide.fare}</h2>
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

  // --------------------------------------------------------
  // APP ROUTER
  // --------------------------------------------------------
  if (role === 'customer') return <CustomerPanel />;
  if (role === 'captain') return <CaptainPanel />;
  if (role === 'admin') return <div className="text-center mt-5"><h1>Admin Setup Next...</h1><button onClick={logout} className="btn btn-danger">Back</button></div>;

  return <LandingPage />;
}
