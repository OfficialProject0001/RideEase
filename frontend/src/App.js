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
      setActiveTab(parsedUser.role === 'captain' ? 'overview' : parsedUser.role === 'admin' ? 'dash' : 'home');
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
      <div className="glass-card p-4 mt-5 d-flex flex-column gap-3" style={{ width: '350px' }}>
        <button onClick={() => navigateTo('login', 'customer')} className="btn btn-warning py-3">Rider Login</button>
        <button onClick={() => navigateTo('login', 'captain')} className="btn btn-outline-warning py-3">Captain Login</button>
        <button onClick={() => navigateTo('login', 'admin')} className="btn text-danger mt-3">Admin Panel</button>
      </div>
    </div>
  );

  // ---------------- AUTH PAGE ----------------
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
        alert("Server error");
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
      setCurrentView('dashboard');
    };

    return (
      <div className="container min-vh-100 d-flex justify-content-center align-items-center">
        <BackButton onClick={() => navigateTo('landing')} />
        <div className="glass-card p-5" style={{ width: '420px' }}>
          <h4 className="mb-4 text-center">{role?.toUpperCase()} LOGIN</h4>

          {authStep === 'phone' ? (
            <form onSubmit={handleSubmit}>

              <div className="mb-3 text-start">
                <label className="form-label text-warning fw-semibold">
                  {role === 'admin' ? "Admin ID" : "Phone Number"}
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white p-3"
                  placeholder={role === 'admin' ? "Enter Admin ID" : "Enter 10-digit mobile number"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <small className="text-muted">
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
                    className="form-control bg-dark text-white p-3"
                    placeholder="Enter secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <small className="text-muted">Password is case-sensitive</small>
                </div>
              )}

              <button type="submit" className="btn btn-warning w-100 py-3 mt-3">
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
                  className="form-control bg-dark text-white p-3"
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
                  className="form-control bg-dark text-white p-3"
                  placeholder="Enter your city"
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <small className="text-muted">
                  This helps us find nearby captains
                </small>
              </div>

              <button type="submit" className="btn btn-warning w-100 py-3">
                Create Account
              </button>

            </form>
          )}
        </div>
      </div>
    );
  };

  if (currentView === 'login') return <AuthPage />;
  if (currentView === 'dashboard') return <div className="text-center mt-5 text-white">Dashboard Loaded</div>;
  return <LandingPage />;
}
