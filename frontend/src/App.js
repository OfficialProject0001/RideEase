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
    const savedUser = sessionStorage.getItem('rideease_user'); 
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
    sessionStorage.removeItem('rideease_user'); 
    setUserData(null); setRole(null); setCurrentView('landing');
    socket.disconnect();
  };

  const navigateTo = (view, newRole = null) => {
    if (newRole) setRole(newRole);
    setCurrentView(view);
  };

  const BackButton = ({ onClick }) => (
    <div className="position-absolute top-0 start-0 m-4">
      <button onClick={onClick} className="btn btn-outline-dark rounded-circle fw-bold" style={{ width: '45px', height: '45px' }}>←</button>
    </div>
  );

  // ==========================================
  // LANDING & AUTH
  // ==========================================
  const LandingPage = () => (
    <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center bg-light text-dark">
      <h1 className="display-3 fw-bold mb-2 text-dark"><span className="text-warning">Ride</span>Ease</h1>
      <p className="text-muted mb-4">Your premium ride, just a tap away.</p>
      <div className="bg-white p-5 d-flex flex-column gap-3 shadow-sm rounded-4 border" style={{ width: '380px' }}>
        <button onClick={() => navigateTo('login', 'customer')} className="btn btn-dark py-3 fw-bold fs-5">Rider Login</button>
        <button onClick={() => navigateTo('login', 'captain')} className="btn btn-outline-dark py-3 fw-bold fs-5">Captain Login</button>
        <hr className="my-3 text-muted"/>
        <button onClick={() => navigateTo('login', 'admin')} className="btn btn-link text-danger text-decoration-none fw-bold w-100">Admin Portal</button>
      </div>
    </div>
  );

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

        if (res.data.isNew && role !== 'admin') { setAuthStep('register'); } 
        else if (!res.data.isNew) { finalizeLogin(res.data.user); } 
        else { alert("Invalid Credentials"); }
      } catch { alert("Server is waking up, retry in 10 seconds!"); }
    };

    const handleRegister = async (e) => {
      e.preventDefault();
      const newUser = { phone, name, city, role };
      await axios.post(`${SERVER_URL}/api/register`, newUser);
      finalizeLogin(newUser);
    };

    const finalizeLogin = (user) => {
      sessionStorage.setItem('rideease_user', JSON.stringify(user)); 
      setUserData(user); socket.connect();
      setActiveTab(role === 'captain' ? 'radar' : role === 'admin' ? 'dash' : 'home');
      setCurrentView('dashboard');
    };

    return (
      <div className="container min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <BackButton onClick={() => navigateTo('landing')} />
        <div className="bg-white p-5 shadow-sm rounded-4 border" style={{ width: '420px' }}>
          <h4 className="mb-4 text-center text-dark fw-bold">{role?.toUpperCase()} LOGIN</h4>

          {authStep === 'phone' ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                <label className="form-label text-dark fw-bold">{role === 'admin' ? "Admin ID" : "Phone Number"}</label>
                {/* FIX: Added text-dark and border to input */}
                <input type="text" className="form-control bg-light text-dark p-3 border" placeholder={role === 'admin' ? "Enter Admin ID" : "Enter 10-digit mobile number"} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              {role === 'admin' && (
                <div className="mb-3 text-start">
                  <label className="form-label text-dark fw-bold">Password</label>
                  {/* FIX: Added text-dark and border to input */}
                  <input type="password" className="form-control bg-light text-dark p-3 border" placeholder="Enter secure password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              )}
              <button type="submit" className="btn btn-warning w-100 py-3 mt-3 fw-bold fs-5 text-dark">Continue</button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <h6 className="text-dark fw-bold mb-4">Welcome! Please provide your details.</h6>
              <div className="mb-3 text-start">
                <label className="form-label text-dark fw-bold">Full Name</label>
                {/* FIX: Added text-dark and border to input */}
                <input type="text" className="form-control bg-light text-dark p-3 border" placeholder="Enter your full name" onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="mb-4 text-start">
                <label className="form-label text-dark fw-bold">City</label>
                {/* FIX: Added text-dark and border to input */}
                <input type="text" className="form-control bg-light text-dark p-3 border" placeholder="Enter your city" onChange={(e) => setCity(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-dark w-100 py-3 fw-bold fs-5">Create Account</button>
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
    const [rideHistory, setRideHistory] = useState([]);
    
    const [pickupLoc, setPickupLoc] = useState(`${userData?.city || 'Mumbai'} Station`);
    const [dropLoc, setDropLoc] = useState('City Center Mall');
    
    const vehicles = [
        { id: 'cab_xl', name: 'Cab XL', icon: '🚙', price: 210, min: 189, max: 231 },
        { id: 'auto', name: 'Auto', icon: '🛺', price: 65, min: 59, max: 72 },
        { id: 'cab_eco', name: 'Cab Economy', icon: '🚕', price: 120, min: 108, max: 132 },
        { id: 'cab_prem', name: 'Cab Premium', icon: '🚘', price: 180, min: 162, max: 198 },
    ];
    const [selectedVehicle, setSelectedVehicle] = useState(vehicles[1]); 
    
    const [paymentMethod, setPaymentMethod] = useState(''); 
    const [paymentStep, setPaymentStep] = useState('options'); 
    const [upiIdInput, setUpiIdInput] = useState('');
    const upiID = "boss@ybl"; 

    useEffect(() => {
      socket.on('ride_accepted_by_captain', (data) => { if (data.riderPhone === userData.phone) { setCurrentRide(data); setRideState('accepted'); } });
      socket.on('ride_started', (data) => { if (data.riderPhone === userData.phone) { setRideState('in_progress'); } });
      socket.on('ride_completed_pay_now', (data) => { if (data.riderPhone === userData.phone) { setRideState('payment_pending'); } });
      socket.on('trip_fully_complete', (data) => {
          if (data.riderPhone === userData.phone) { 
              alert("Payment Successful! Ride Complete.");
              setRideState('idle'); setCurrentRide(null); setPaymentStep('options'); setPaymentMethod('');
          }
      });
      return () => { socket.off('ride_accepted_by_captain'); socket.off('ride_started'); socket.off('ride_completed_pay_now'); socket.off('trip_fully_complete'); }
    }, []);

    useEffect(() => {
      if(activeTab === 'history') {
          axios.get(`${SERVER_URL}/api/rides/${userData.phone}`).then(res => setRideHistory(res.data)).catch(err => console.error(err));
      }
    }, [activeTab]);

    const proceedToPaymentSelection = () => {
        if(!pickupLoc || !dropLoc) return alert("Please enter locations!");
        setRideState('select_payment');
    };

    const confirmAndRequestRide = (method) => {
        setPaymentMethod(method);
        setRideState('searching');
        socket.emit('request_ride', {
            riderName: userData?.name || 'Rider', riderPhone: userData.phone,
            pickup: pickupLoc, drop: dropLoc, fare: selectedVehicle.price,
            vehicle: selectedVehicle.name, paymentPref: method
        });
    };

    const saveRideToDBAndFinish = async (finalMethod) => {
        try {
            await axios.post(`${SERVER_URL}/api/save-ride`, {
                rider: userData.phone, captain: currentRide.captain, pickup: currentRide.pickup, drop: currentRide.drop, amount: currentRide.fare, status: `Completed (${finalMethod})`
            });
            socket.emit('payment_done', { ...currentRide, paymentMethod: finalMethod });
        } catch(err) { console.error("Error saving ride", err); }
    };

    const handleUPIRequest = () => {
        if(!upiIdInput.includes('@')) return alert("Please enter a valid UPI ID (e.g., name@ybl)");
        setPaymentStep('processing_upi');
        setTimeout(() => { saveRideToDBAndFinish('UPI'); }, 4000); 
    };

    const handleOnlinePayment = async () => {
      try {
        const orderRes = await axios.post(`${SERVER_URL}/api/create-order`, { amount: currentRide.fare });
        if(orderRes.data && !orderRes.data.error) {
            const options = {
              key: RAZORPAY_KEY_ID, amount: orderRes.data.amount, currency: "INR", name: "RideEase",
              description: "Ride Fare", order_id: orderRes.data.id, handler: () => saveRideToDBAndFinish('Card/NetBanking'),
              prefill: { name: userData.name, contact: userData.phone }, theme: { color: "#fbbf24" }
            };
            new window.Razorpay(options).open();
        } else { throw new Error("No Keys"); }
      } catch (err) { setPaymentStep('qr_view'); }
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 bg-light text-dark">
          <div className="col-md-3 border-end bg-white p-4 d-flex flex-column h-100 min-vh-100 shadow-sm">
              <div className="text-center mb-4">
                  <h4 className="fw-bold text-dark">RideEase <span className="text-warning">Rider</span></h4>
                  <p className="text-muted">Hello, <span className="fw-bold text-dark">{userData?.name || userData?.phone}</span></p>
              </div>
              <button onClick={() => setActiveTab('home')} className={`btn text-start mb-2 fw-bold ${activeTab==='home'?'btn-dark':'btn-light text-dark border-0'}`}>📍 Book Ride</button>
              <button onClick={() => setActiveTab('history')} className={`btn text-start mb-2 fw-bold ${activeTab==='history'?'btn-dark':'btn-light text-dark border-0'}`}>📜 My History</button>
              <button onClick={() => setActiveTab('wallet')} className={`btn text-start mb-2 fw-bold ${activeTab==='wallet'?'btn-dark':'btn-light text-dark border-0'}`}>💳 Wallet & Cards</button>
              <button onClick={() => setActiveTab('refer')} className={`btn text-start mb-2 fw-bold ${activeTab==='refer'?'btn-dark':'btn-light text-dark border-0'}`}>🎁 Refer & Earn</button>
              <button onClick={() => setActiveTab('profile')} className={`btn text-start mb-5 fw-bold ${activeTab==='profile'?'btn-dark':'btn-light text-dark border-0'}`}>⚙️ Profile Settings</button>
              <button onClick={handleLogout} className="btn btn-outline-danger w-100 mt-auto fw-bold">Logout</button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5">
             {activeTab === 'home' && (
                 <div className="bg-white p-4 rounded-4 shadow-sm mx-auto border" style={{maxWidth:'600px'}}>
                     <div className="mb-4 rounded-4 overflow-hidden shadow-sm border" style={{height: '180px'}}>
                         <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.9%2C73.1%2C19.3&amp;layer=mapnik" style={{border: 'none'}}></iframe>
                     </div>

                     {rideState === 'idle' && (
                        <>
                            <div className="position-relative mb-4 p-3 border rounded-4 bg-white shadow-sm">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-success me-3 fs-5">●</span>
                                    {/* FIX: Explicit text-dark on location inputs */}
                                    <input type="text" className="form-control border-0 p-0 shadow-none fw-semibold text-dark" value={pickupLoc} onChange={(e) => setPickupLoc(e.target.value)} style={{fontSize: '15px'}} />
                                </div>
                                <div className="position-absolute" style={{left: '21px', top: '35px', bottom: '35px', borderLeft: '2px dotted #ccc'}}></div>
                                <hr className="my-2 ms-4 text-muted opacity-25" />
                                <div className="d-flex align-items-center mt-2">
                                    <span className="text-danger me-3 fs-5">○</span>
                                    {/* FIX: Explicit text-dark on location inputs */}
                                    <input type="text" className="form-control border-0 p-0 shadow-none fw-bold text-dark" value={dropLoc} onChange={(e) => setDropLoc(e.target.value)} style={{fontSize: '15px'}} />
                                </div>
                            </div>
                            
                            <h6 className="fw-bold mb-3 text-dark">Select service</h6>
                            <div className="d-flex flex-column gap-2 mb-4" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                {vehicles.map(v => (
                                    <div key={v.id} onClick={() => setSelectedVehicle(v)} 
                                         className={`d-flex justify-content-between align-items-center p-3 rounded-4 border transition-all ${selectedVehicle.id === v.id ? 'border-primary border-2 bg-primary bg-opacity-10' : 'border-light-subtle'}`} 
                                         style={{cursor: 'pointer'}}>
                                        <div className="d-flex align-items-center gap-3">
                                            <span style={{fontSize: '2.5rem', filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.1))'}}>{v.icon}</span>
                                            <span className="fw-bold text-dark fs-5">{v.name}</span>
                                        </div>
                                        <span className="fw-bold fs-6" style={{color: '#444'}}>₹ {v.min} - ₹ {v.max}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="d-flex align-items-center mb-2 ms-2">
                                <span className="text-primary me-2">💵</span>
                                <small className="fw-semibold text-muted">Cash</small>
                            </div>
                            <button onClick={proceedToPaymentSelection} className="btn btn-warning text-dark w-100 py-3 fs-5 fw-bold rounded-4 shadow-sm" style={{backgroundColor: '#FFD12A', border: 'none'}}>Continue Booking</button>
                        </>
                     )}

                     {rideState === 'select_payment' && (
                         <div className="text-center py-4 animate__animated animate__fadeIn">
                             <h4 className="fw-bold mb-4">Confirm Payment Method</h4>
                             <div className="d-flex flex-column gap-3 mb-4">
                                 <button onClick={() => confirmAndRequestRide('Cash')} className="btn btn-light border p-4 rounded-4 text-start d-flex align-items-center gap-3">
                                     <span className="fs-2">💵</span> <div><h5 className="mb-0 fw-bold text-dark">Cash</h5><small className="text-muted">Pay directly to captain</small></div>
                                 </button>
                                 <button onClick={() => confirmAndRequestRide('Online')} className="btn btn-light border p-4 rounded-4 text-start d-flex align-items-center gap-3">
                                     <span className="fs-2">💳</span> <div><h5 className="mb-0 fw-bold text-dark">Online Payment</h5><small className="text-muted">UPI, Cards, NetBanking</small></div>
                                 </button>
                             </div>
                             <button onClick={()=>setRideState('idle')} className="btn btn-link text-dark text-decoration-none fw-bold">← Back to Vehicles</button>
                         </div>
                     )}

                     {rideState === 'searching' && (
                         <div className="text-center py-5">
                             <div className="spinner-border text-dark mb-3"></div>
                             <h4 className="fw-bold">Finding a {selectedVehicle.name}...</h4>
                             <p className="text-muted">Please wait while we connect you to a nearby captain.</p>
                         </div>
                     )}

                     {rideState === 'accepted' && (
                         <div className="text-center py-4">
                            <h3 className="text-success fw-bold mb-3">Captain {currentRide?.captain} is arriving!</h3>
                            <div className="bg-light border rounded-4 p-4 my-4">
                                <p className="text-muted fw-bold mb-1">Your Ride OTP</p>
                                <h1 className="text-dark fw-bold letter-spacing-3">{currentRide?.otp}</h1>
                            </div>
                            <p className="text-muted">Share this OTP with your captain to start the ride.</p>
                         </div>
                     )}

                     {rideState === 'in_progress' && (
                         <div className="text-center py-5"><h2 className="text-primary fw-bold mb-3">Ride is in Progress 🚀</h2><div className="spinner-grow text-primary mt-4"></div></div>
                     )}

                     {rideState === 'payment_pending' && (
                         <div className="text-center py-4 animate__animated animate__bounceIn">
                            <h2 className="fw-bold mb-3">Destination Reached!</h2>
                            <h1 className="text-dark fw-bold mb-4">₹{currentRide?.fare}</h1>

                            {currentRide?.paymentPref === 'Cash' ? (
                                <div>
                                    <h5 className="text-muted mb-4">Please pay cash to Captain {currentRide.captain}</h5>
                                    <button onClick={() => saveRideToDBAndFinish('Cash')} className="btn btn-dark w-100 py-3 fw-bold fs-5 rounded-4">I have Paid Cash ✅</button>
                                </div>
                            ) : (
                                <>
                                    {paymentStep === 'options' && (
                                        <div className="d-flex flex-column gap-3">
                                            <button onClick={() => setPaymentStep('upi_entry')} className="btn btn-dark py-3 fw-bold fs-5 rounded-4">Pay via UPI ID</button>
                                            <a href={`upi://pay?pa=${upiID}&pn=RideEase&am=${currentRide.fare}&cu=INR`} onClick={() => setTimeout(() => saveRideToDBAndFinish('UPI App'), 5000)} className="btn btn-outline-dark py-3 fw-bold fs-5 rounded-4">Open UPI App (GPay/PhonePe)</a>
                                            <button onClick={handleOnlinePayment} className="btn btn-outline-dark py-3 fw-bold fs-5 rounded-4">Pay via Gateway (Card)</button>
                                        </div>
                                    )}
                                    {paymentStep === 'upi_entry' && (
                                        <div className="bg-light p-4 rounded-4 border">
                                            <h5 className="fw-bold mb-3 text-dark">Enter your UPI ID</h5>
                                            {/* FIX: Ensure UPI input text is dark */}
                                            <input type="text" className="form-control bg-white text-dark border p-3 mb-4 text-center fs-5" placeholder="e.g. boss@ybl" value={upiIdInput} onChange={(e) => setUpiIdInput(e.target.value)} />
                                            <div className="d-flex gap-2">
                                                <button onClick={handleUPIRequest} className="btn btn-dark flex-grow-1 py-3 fw-bold rounded-3">Request</button>
                                                <button onClick={() => setPaymentStep('options')} className="btn btn-outline-danger py-3 px-4 fw-bold rounded-3">Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                    {paymentStep === 'processing_upi' && (
                                        <div className="bg-light p-4 rounded-4 border animate__animated animate__pulse animate__infinite">
                                            <div className="spinner-border text-dark mb-3"></div>
                                            <h5 className="fw-bold mb-2">Request sent to {upiIdInput}</h5>
                                            <p className="text-muted mt-3 mb-0 fw-bold">Waiting for confirmation...</p>
                                        </div>
                                    )}
                                    {paymentStep === 'qr_view' && (
                                        <div className="bg-light p-4 rounded-4 border">
                                            <p className="fw-bold mb-3 text-dark">Scan QR to Pay</p>
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=merchant@upi&pn=RideEase&am=${currentRide.fare}`} alt="QR Code" className="mb-4 bg-white p-2 rounded" />
                                            <button onClick={() => saveRideToDBAndFinish('QR Code')} className="btn btn-success w-100 py-3 fw-bold fs-5 rounded-3">I have Paid ✅</button>
                                        </div>
                                    )}
                                </>
                            )}
                         </div>
                     )}
                 </div>
             )}
             
             {activeTab === 'history' && (
                 <div className="bg-white p-4 rounded-4 shadow-sm border">
                     <h4 className="fw-bold mb-4">Real Past Rides</h4>
                     {rideHistory.length > 0 ? rideHistory.map((r, i) => (
                         <div key={i} className="bg-light p-3 rounded-4 mb-3 border d-flex justify-content-between align-items-center">
                            <div><p className="mb-0 fw-bold text-dark">{r[3]} ➔ {r[4]}</p><small className="text-muted">{r[7]} • {r[2]}</small></div>
                            <h5 className="text-dark fw-bold mb-0">₹{r[5]} <span className="fs-6 text-muted d-block text-end">({r[6]})</span></h5>
                         </div>
                     )) : <p className="text-muted">No rides completed yet!</p>}
                 </div>
             )}
             {activeTab === 'wallet' && <div className="bg-white p-4 rounded-4 shadow-sm border"><h4 className="text-dark">Wallet</h4><h2 className="text-dark">₹0.00</h2></div>}
             {activeTab === 'refer' && <div className="bg-white p-4 rounded-4 shadow-sm border text-center"><h4 className="text-dark">Refer Code: RIDE-{userData?.phone?.slice(0,4)}</h4></div>}
             {activeTab === 'profile' && <div className="bg-white p-4 rounded-4 shadow-sm border"><h4 className="text-dark">Profile</h4><p className="fw-bold text-dark">{userData?.name}</p><p className="text-dark">{userData?.phone}</p></div>}
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
    const [otpInput, setOtpInput] = useState('');
    const [rideHistory, setRideHistory] = useState([]);

    useEffect(() => {
      socket.on('incoming_ride', (data) => { if(!activeRide) setIncomingRide(data); });
      socket.on('ride_started', (data) => { if(activeRide && activeRide.id === data.id) { setActiveRide(data); } });
      socket.on('otp_failed', () => alert("Wrong OTP Boss! Try again."));
      socket.on('trip_fully_complete', (data) => {
          if(activeRide && activeRide.id === data.id) {
              alert(`Payment of ₹${data.fare} received via ${data.paymentMethod}!`);
              setActiveRide(null); setOtpInput('');
          }
      });
      return () => { socket.off('incoming_ride'); socket.off('ride_started'); socket.off('otp_failed'); socket.off('trip_fully_complete'); }
    }, [activeRide]);

    useEffect(() => {
      if(activeTab === 'history' || activeTab === 'earnings') {
          axios.get(`${SERVER_URL}/api/rides/${userData.name}`).then(res => setRideHistory(res.data)).catch(err => console.error(err));
      }
    }, [activeTab]);

    const acceptRide = () => {
      socket.emit('accept_ride', { ...incomingRide, captainName: userData?.name || 'Captain' });
      setActiveRide({...incomingRide, status: 'accepted'});
      setIncomingRide(null);
    };

    const verifyOTP = () => {
        if(otpInput.length === 4) socket.emit('verify_otp', { id: activeRide.id, otp: otpInput });
        else alert("Please enter a 4-digit OTP");
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 bg-light text-dark">
          <div className="col-md-3 border-end bg-white p-4 d-flex flex-column h-100 min-vh-100 shadow-sm">
              <div className="text-center mb-4"><h4 className="fw-bold text-dark">RideEase <span className="text-warning">Captain</span></h4><p className="text-muted">Hello, <span className="fw-bold text-dark">{userData?.name || userData?.phone}</span></p><span className="badge bg-success">Online</span></div>
              <button onClick={() => setActiveTab('radar')} className={`btn text-start mb-2 fw-bold ${activeTab==='radar'?'btn-dark':'btn-light text-dark border-0'}`}>📡 Live Radar</button>
              <button onClick={() => setActiveTab('earnings')} className={`btn text-start mb-2 fw-bold ${activeTab==='earnings'?'btn-dark':'btn-light text-dark border-0'}`}>💰 Earnings</button>
              <button onClick={() => setActiveTab('history')} className={`btn text-start mb-2 fw-bold ${activeTab==='history'?'btn-dark':'btn-light text-dark border-0'}`}>📜 Trip History</button>
              <button onClick={() => setActiveTab('vehicle')} className={`btn text-start mb-2 fw-bold ${activeTab==='vehicle'?'btn-dark':'btn-light text-dark border-0'}`}>🏍️ Vehicle Docs</button>
              <button onClick={() => setActiveTab('profile')} className={`btn text-start mb-5 fw-bold ${activeTab==='profile'?'btn-dark':'btn-light text-dark border-0'}`}>⚙️ My Profile</button>
              <button onClick={handleLogout} className="btn btn-outline-danger w-100 mt-auto fw-bold">Go Offline</button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5">
             {activeTab === 'radar' && (
                 <div className="mx-auto" style={{maxWidth:'600px'}}>
                     <div className="mb-4 rounded-4 overflow-hidden shadow-sm border" style={{height: '200px'}}>
                         <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.9%2C73.1%2C19.3&amp;layer=mapnik" style={{border: 'none'}}></iframe>
                     </div>

                     {activeRide ? (
                         <div className="bg-white p-5 rounded-4 shadow-sm border text-center animate__animated animate__fadeIn">
                             <h3 className="text-success fw-bold mb-4">Status: {activeRide.status === 'in_progress' ? 'ON RIDE 🚀' : 'ARRIVED 📍'}</h3>
                             <div className="bg-light p-4 rounded-4 border mb-4 text-start">
                                 <p className="mb-2 text-dark"><strong>Vehicle Req:</strong> {activeRide.vehicle}</p>
                                 <p className="mb-2 text-dark"><strong>Rider:</strong> {activeRide.riderName} ({activeRide.riderPhone})</p>
                                 <p className="mb-2 text-dark"><strong>From:</strong> {activeRide.pickup}</p>
                                 <p className="mb-0 text-dark"><strong>To:</strong> {activeRide.drop}</p>
                             </div>
                             {activeRide.status === 'accepted' ? (
                                 <div className="mt-4 p-4 border rounded-4 bg-light">
                                     <h5 className="fw-bold mb-3 text-dark">Enter OTP to Start</h5>
                                     {/* FIX: Explicit text-dark on OTP input */}
                                     <input type="number" className="form-control bg-white text-dark border p-3 mb-3 text-center fs-4 tracking-widest" placeholder="----" value={otpInput} onChange={(e)=>setOtpInput(e.target.value)} />
                                     <button onClick={verifyOTP} className="btn btn-dark w-100 py-3 fw-bold fs-5 rounded-4">Verify & Start Ride</button>
                                 </div>
                             ) : (
                                 <button onClick={() => socket.emit('finish_ride', activeRide)} className="btn btn-danger w-100 py-3 fs-5 fw-bold mt-4 rounded-4">End Ride & Collect Payment</button>
                             )}
                         </div>
                     ) : incomingRide ? (
                         <div className="bg-white p-5 rounded-4 shadow-lg border border-warning animate__animated animate__pulse">
                             <h3 className="text-warning fw-bold mb-3">🔥 New Request!</h3>
                             <p className="fs-5 mb-1 text-dark">Rider: <strong>{incomingRide.riderName}</strong></p>
                             <p className="fs-5 mb-1 text-dark">Type: <strong>{incomingRide.vehicle}</strong></p>
                             <p className="fs-5 mb-1 text-dark">Pickup: <strong>{incomingRide.pickup}</strong></p>
                             <p className="text-muted">Payment: <strong>{incomingRide.paymentPref}</strong></p>
                             <h1 className="text-dark fw-bold my-4">₹{incomingRide.fare}</h1>
                             <div className="d-flex gap-3">
                                 <button onClick={acceptRide} className="btn btn-dark flex-grow-1 py-3 fw-bold fs-5 rounded-4">Accept</button>
                                 <button onClick={()=>setIncomingRide(null)} className="btn btn-outline-danger flex-grow-1 py-3 fw-bold rounded-4">Reject</button>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center mt-5">
                             <div className="spinner-grow text-dark mb-4" style={{width:'4rem', height:'4rem'}}></div><h3 className="fw-bold text-dark">Radar Active</h3><p className="text-muted">Scanning for nearby riders...</p>
                         </div>
                     )}
                 </div>
             )}
             {activeTab === 'earnings' && <div className="bg-white p-4 rounded-4 shadow-sm border text-center"><h4 className="fw-bold mb-3 text-dark">Total Earnings</h4><h1 className="text-success display-4 fw-bold">₹{rideHistory.reduce((sum, r) => sum + r[5], 0)}</h1></div>}
             {activeTab === 'history' && (
                 <div className="bg-white p-4 rounded-4 shadow-sm border">
                     <h4 className="fw-bold mb-4 text-dark">My Completed Trips</h4>
                     {rideHistory.length > 0 ? rideHistory.map((r, i) => (
                         <div key={i} className="bg-light p-3 rounded-4 mb-3 border d-flex justify-content-between align-items-center">
                            <div><p className="mb-0 fw-bold text-dark">{r[3]} ➔ {r[4]}</p><small className="text-muted">{r[7]} • {r[1]}</small></div>
                            <h5 className="text-dark fw-bold mb-0">+₹{r[5]} <span className="fs-6 text-muted d-block text-end">({r[6]})</span></h5>
                         </div>
                     )) : <p className="text-muted">No trips completed yet!</p>}
                 </div>
             )}
             {activeTab === 'vehicle' && <div className="bg-white p-4 rounded-4 shadow-sm border"><h4 className="text-dark">Docs</h4><p className="text-dark">RC Book: Verified ✅</p></div>}
             {activeTab === 'profile' && <div className="bg-white p-4 rounded-4 shadow-sm border"><h4 className="text-dark">Profile</h4><p className="fw-bold text-dark">{userData?.name}</p></div>}
          </div>
      </div>
    );
  };

  // ==========================================
  // ADMIN PANEL
  // ==========================================
  const AdminPanel = () => {
    const [stats, setStats] = useState({ active: 0, completed: 0 });
    const [dbStats, setDbStats] = useState({ total_rides: 0, total_users: 0 });

    useEffect(() => {
        socket.on('admin_update', (data) => {
            if(data.type === 'new_ride') setStats(prev => ({...prev, active: data.count || data.rides}));
            if(data.type === 'complete_ride') {
                setStats(prev => ({ active: prev.active - 1 > 0 ? prev.active - 1 : 0, completed: prev.completed + 1 }));
                fetchDbStats(); 
            }
        });
        return () => socket.off('admin_update');
    }, []);

    const fetchDbStats = () => axios.get(`${SERVER_URL}/api/admin/stats`).then(res => setDbStats(res.data)).catch(err => console.error(err));
    useEffect(() => { if(activeTab === 'dash') fetchDbStats(); }, [activeTab]);

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 bg-light text-dark">
          <div className="col-md-3 border-end bg-white p-4 d-flex flex-column h-100 min-vh-100 shadow-sm">
              <h4 className="text-danger fw-bold mb-5 mt-2">Admin Control</h4>
              <button onClick={() => setActiveTab('dash')} className={`btn text-start mb-2 fw-bold ${activeTab==='dash'?'btn-danger':'btn-light text-dark border-0'}`}>📈 Live Dashboard</button>
              <button onClick={() => setActiveTab('liverides')} className={`btn text-start mb-2 fw-bold ${activeTab==='liverides'?'btn-danger':'btn-light text-dark border-0'}`}>📍 Active Map</button>
              <button onClick={() => setActiveTab('users')} className={`btn text-start mb-2 fw-bold ${activeTab==='users'?'btn-danger':'btn-light text-dark border-0'}`}>👥 Manage Users</button>
              <button onClick={() => setActiveTab('captains')} className={`btn text-start mb-2 fw-bold ${activeTab==='captains'?'btn-danger':'btn-light text-dark border-0'}`}>🏍️ Verify Captains</button>
              <button onClick={() => setActiveTab('settings')} className={`btn text-start mb-5 fw-bold ${activeTab==='settings'?'btn-danger':'btn-light text-dark border-0'}`}>⚙️ System Settings</button>
              <button onClick={handleLogout} className="btn btn-outline-dark w-100 mt-auto fw-bold">Exit System</button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5">
              {activeTab === 'dash' && (
                  <>
                  <h2 className="fw-bold mb-4 text-dark">System Analytics</h2>
                  <div className="row g-4 mb-4">
                     <div className="col-4"><div className="bg-white p-4 rounded-4 shadow-sm border border-warning"><h6 className="text-muted">Total Users</h6><h1 className="text-dark fw-bold">{dbStats.total_users}</h1></div></div>
                     <div className="col-4"><div className="bg-white p-4 rounded-4 shadow-sm border border-success"><h6 className="text-muted">Total Rides</h6><h1 className="text-dark fw-bold">{dbStats.total_rides}</h1></div></div>
                     <div className="col-4"><div className="bg-white p-4 rounded-4 shadow-sm border border-info"><h6 className="text-muted">Live Active Rides</h6><h1 className="text-dark fw-bold">{stats.active}</h1></div></div>
                  </div>
                  </>
              )}
              {activeTab === 'liverides' && (
                  <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                      <h4 className="fw-bold text-dark">Live Map Tracking ({stats.active} Active Rides)</h4>
                      <div className="mt-4 rounded-4 overflow-hidden border" style={{height: '400px'}}>
                          <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.9%2C73.1%2C19.3&amp;layer=mapnik" style={{border: 'none'}}></iframe>
                      </div>
                  </div>
              )}
              {activeTab === 'users' && <div className="bg-white p-4 rounded-4 shadow-sm border"><h4 className="text-dark">User Database</h4><p className="text-dark">Check "Live Dashboard" for counts.</p></div>}
              {activeTab === 'captains' && <div className="bg-white p-4 rounded-4 shadow-sm border"><h4 className="text-dark">Pending Verifications</h4><p className="text-danger">0 Captains Pending</p></div>}
              {activeTab === 'settings' && <div className="bg-white p-4 rounded-4 shadow-sm border"><h4 className="text-dark">Server Config</h4><p className="text-dark">Theme: White & Black</p></div>}
          </div>
      </div>
    );
  };

  if (currentView === 'login') return <AuthPage />;
  if (currentView === 'dashboard') {
      if (role === 'customer') return <CustomerPanel />;
      if (role === 'captain') return <CaptainPanel />;
      if (role === 'admin') return <AdminPanel />;
  }
  return <LandingPage />;
}
