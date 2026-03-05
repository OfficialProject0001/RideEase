import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';

const SERVER_URL = "https://rideease-4m7a.onrender.com"; 
const socket = io(SERVER_URL, { autoConnect: false });

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  // ==========================================
  // ULTRA-PREMIUM VIP CSS 🟣 + GOOGLE FONTS
  // ==========================================
  const VIPTheme = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Poppins:wght@300;400;600&display=swap');
      
      :root {
        --vip-purple: #8A2BE2; 
        --vip-dark: #6200EA;
      }
      body { 
          background-color: #050505; 
          font-family: 'Poppins', sans-serif; /* Soft font for reading */
          color: #eaeaea;
      }
      h1, h2, h3, h4, h5, h6, .fw-bold { 
          font-family: 'Montserrat', sans-serif; /* Bold, sharp font for headings */
      }
      .form-control, .form-control:focus { 
          color: #FFF !important; 
          background-color: #121212 !important; 
          border-color: #333 !important; 
          box-shadow: none !important; 
          font-family: 'Poppins', sans-serif;
      }
      .form-control::placeholder { color: #666 !important; }
      input:focus { border: 2px solid var(--vip-purple) !important; }
      .tracking-widest { letter-spacing: 0.5rem; }
      
      /* Glassmorphism - Premium Glass Effect */
      .glass-card {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(138, 43, 226, 0.2);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
      }
      
      /* VIP Custom Classes */
      .text-purple { color: var(--vip-purple) !important; }
      .bg-purple { background-color: var(--vip-purple) !important; color: white !important; }
      .border-purple { border-color: var(--vip-purple) !important; }
      .btn-purple { background-color: var(--vip-purple) !important; color: white !important; border: none; transition: 0.3s; box-shadow: 0 4px 15px rgba(138, 43, 226, 0.4); }
      .btn-purple:hover { background-color: var(--vip-dark) !important; color: white !important; box-shadow: 0 6px 20px rgba(138, 43, 226, 0.6); }
      .btn-outline-purple { border: 2px solid var(--vip-purple) !important; color: var(--vip-purple) !important; background: transparent; transition: 0.3s; }
      .btn-outline-purple:hover { background-color: var(--vip-purple) !important; color: white !important; }
      
      /* Receipt dotted line */
      .receipt-line { border-top: 2px dashed rgba(255,255,255,0.2); margin: 15px 0; }
    `}</style>
  );

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
      <button onClick={onClick} className="btn btn-outline-purple rounded-circle fw-bold" style={{ width: '45px', height: '45px' }}>←</button>
    </div>
  );

  // ==========================================
  // LANDING & AUTH
  // ==========================================
  const LandingPage = () => (
    <div className="container-fluid min-vh-100 d-flex flex-column justify-content-center align-items-center text-center bg-black text-white">
      <div className="mb-4 animate__animated animate__fadeInDown">
          <h1 className="display-3 fw-bold mb-2 text-white"><span className="text-purple">Ride</span>Ease</h1>
          <p className="text-muted mb-5 fs-5" style={{fontWeight: 300}}>Exclusive Mobility, VIP Standard Service.</p>
      </div>
      <div className="glass-card p-5 d-flex flex-column gap-3 rounded-4" style={{ width: '380px' }}>
        <button onClick={() => navigateTo('login', 'customer')} className="btn btn-purple py-3 fw-bold fs-5 rounded-pill">Rider Login</button>
        <button onClick={() => navigateTo('login', 'captain')} className="btn btn-outline-purple py-3 fw-bold fs-5 rounded-pill">Captain Login</button>
        <hr className="my-4 text-purple opacity-25"/>
        <button onClick={() => navigateTo('login', 'admin')} className="btn btn-link text-purple text-decoration-none fw-bold w-100">Admin Portal</button>
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
      <div className="container min-vh-100 d-flex justify-content-center align-items-center bg-black">
        <BackButton onClick={() => navigateTo('landing')} />
        <div className="glass-card p-5 rounded-4 animate__animated animate__fadeIn" style={{ width: '420px' }}>
          <h4 className="mb-4 text-center text-purple fw-bold letter-spacing-1">{role?.toUpperCase()} LOGIN</h4>

          {authStep === 'phone' ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                <label className="form-label text-purple fw-bold">{role === 'admin' ? "Admin ID" : "Phone Number"}</label>
                <input type="text" className="form-control text-white" placeholder={role === 'admin' ? "Enter Admin ID" : "10-digit mobile number"} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              {role === 'admin' && (
                <div className="mb-3 text-start">
                  <label className="form-label text-purple fw-bold">Password</label>
                  <input type="password" className="form-control text-white" placeholder="Enter secure password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              )}
              <button type="submit" className="btn btn-purple w-100 py-3 mt-3 fw-bold fs-5 rounded-pill">Continue</button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <h6 className="text-white fw-bold mb-4">Welcome! Complete your VIP profile.</h6>
              <div className="mb-3 text-start">
                <label className="form-label text-purple fw-bold">Full Name</label>
                <input type="text" className="form-control text-white" placeholder="John Doe" onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="mb-4 text-start">
                <label className="form-label text-purple fw-bold">City</label>
                <input type="text" className="form-control text-white" placeholder="Mumbai" onChange={(e) => setCity(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-purple w-100 py-3 fw-bold fs-5 rounded-pill">Create Account</button>
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
    
    const [pickupLoc, setPickupLoc] = useState(`${userData?.city || 'Mumbai'}`);
    const [dropLoc, setDropLoc] = useState('');
    const [mapCoords, setMapCoords] = useState({ lat: 19.0760, lon: 72.8777 });

    const vehicles = [
        { id: 'bike', name: 'Bike', icon: '🏍️', price: 40, min: 35, max: 45 },
        { id: 'auto', name: 'Auto', icon: '🛺', price: 65, min: 59, max: 72 },
        { id: 'cab_eco', name: 'Cab Economy', icon: '🚕', price: 120, min: 108, max: 132 },
        { id: 'cab_prem', name: 'Cab Premium', icon: '🚘', price: 180, min: 162, max: 198 },
        { id: 'cab_xl', name: 'Cab XL', icon: '🚙', price: 210, min: 189, max: 231 },
    ];
    const [selectedVehicle, setSelectedVehicle] = useState(vehicles[1]); 
    const [paymentStep, setPaymentStep] = useState('options'); 
    const [upiIdInput, setUpiIdInput] = useState('');

    const fetchMapLocation = async (address) => {
        if (!address) return;
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            if (response.data && response.data.length > 0) {
                setMapCoords({ lat: parseFloat(response.data[0].lat), lon: parseFloat(response.data[0].lon) });
            }
        } catch (error) { console.error("Map search error:", error); }
    };

    useEffect(() => { if(pickupLoc) fetchMapLocation(pickupLoc); }, []);

    useEffect(() => {
      socket.on('ride_accepted_by_captain', (data) => { if (data.riderPhone === userData.phone) { setCurrentRide(data); setRideState('accepted'); } });
      socket.on('ride_started', (data) => { if (data.riderPhone === userData.phone) { setRideState('in_progress'); } });
      socket.on('ride_completed_pay_now', (data) => { if (data.riderPhone === userData.phone) { setRideState('payment_pending'); } });
      
      socket.on('trip_fully_complete', (data) => {
          if (data.riderPhone === userData.phone) { 
              setRideState('completed'); 
              setTimeout(() => {
                  setRideState('idle'); setCurrentRide(null); setPaymentStep('options'); setDropLoc('');
              }, 6000); // Wait 6 seconds so user can read the receipt
          }
      });
      return () => { socket.off('ride_accepted_by_captain'); socket.off('ride_started'); socket.off('ride_completed_pay_now'); socket.off('trip_fully_complete'); }
    }, []);

    useEffect(() => {
        let timer;
        if (rideState === 'payment_pending' && (paymentStep === 'processing_upi' || paymentStep === 'qr_view')) {
            timer = setTimeout(() => { saveRideToDBAndFinish('Online (Auto-Verified)'); }, 5000);
        }
        return () => clearTimeout(timer);
    }, [paymentStep, rideState]);

    useEffect(() => {
      if(activeTab === 'history') { axios.get(`${SERVER_URL}/api/rides/${userData.phone}`).then(res => setRideHistory(res.data)).catch(err => console.error(err)); }
    }, [activeTab]);

    const handleSearchVehicles = () => {
        if(!pickupLoc || !dropLoc) return alert("Please enter both Pickup and Drop locations!");
        setRideState('select_vehicle');
    };

    const requestRideWithPaymentPref = (method) => {
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

    const mapOffset = 0.03; 
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lon - mapOffset}%2C${mapCoords.lat - mapOffset}%2C${mapCoords.lon + mapOffset}%2C${mapCoords.lat + mapOffset}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lon}`;

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 bg-black text-white">
          <div className="col-md-3 bg-dark border-end border-purple p-4 d-flex flex-column h-100 min-vh-100 shadow-lg">
              <div className="text-center mb-5 animate__animated animate__fadeIn">
                  <h4 className="fw-bold text-white"><span className="text-purple">Ride</span>Ease Rider</h4>
                  <div className="badge bg-purple text-white py-2 px-3 rounded-pill mt-2 fw-bold">{userData?.name || userData?.phone}</div>
              </div>
              <button onClick={() => setActiveTab('home')} className={`btn text-start mb-2 fw-bold text-white border-0 ${activeTab==='home'?'bg-purple':'btn-dark'}`}>📍 Book Ride</button>
              <button onClick={() => setActiveTab('history')} className={`btn text-start mb-2 fw-bold text-white border-0 ${activeTab==='history'?'bg-purple':'btn-dark'}`}>📜 My History</button>
              <button onClick={() => setActiveTab('refer')} className={`btn text-start mb-2 fw-bold text-white border-0 ${activeTab==='refer'?'bg-purple':'btn-dark'}`}>🎁 Refer & Earn</button>
              <button onClick={() => setActiveTab('profile')} className={`btn text-start mb-5 fw-bold text-white border-0 ${activeTab==='profile'?'bg-purple':'btn-dark'}`}>⚙️ Profile Settings</button>
              <button onClick={handleLogout} className="btn btn-outline-danger w-100 mt-auto fw-bold rounded-pill">Logout</button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5 bg-black">
             {activeTab === 'home' && (
                 <div className="glass-card p-4 rounded-4 mx-auto" style={{maxWidth:'600px'}}>
                     <div className="mb-4 rounded-4 overflow-hidden shadow border border-purple" style={{height: '180px'}}>
                         <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={mapUrl} style={{border: 'none'}}></iframe>
                     </div>

                     {rideState === 'idle' && (
                        <div className="animate__animated animate__fadeIn">
                            <h4 className="fw-bold text-white mb-4">Book Your VIP Ride</h4>
                            <div className="bg-dark p-3 rounded-4 border border-purple mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-success me-3 fs-5">●</span>
                                    <input type="text" className="form-control bg-transparent" placeholder="Pickup Location" value={pickupLoc} onChange={(e) => setPickupLoc(e.target.value)} onBlur={() => fetchMapLocation(pickupLoc)} />
                                </div>
                                <hr className="my-2 text-purple opacity-50"/>
                                <div className="d-flex align-items-center">
                                    <span className="text-danger me-3 fs-5">○</span>
                                    <input type="text" className="form-control bg-transparent" placeholder="Drop Location" value={dropLoc} onChange={(e) => setDropLoc(e.target.value)} onBlur={() => fetchMapLocation(dropLoc || pickupLoc)} />
                                </div>
                            </div>
                            <button onClick={handleSearchVehicles} className="btn btn-purple w-100 py-3 fs-5 fw-bold rounded-4 shadow-sm">Search Vehicles</button>
                        </div>
                     )}

                     {rideState === 'select_vehicle' && (
                        <div className="animate__animated animate__fadeInRight">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0 text-white">Select VIP Vehicle</h6>
                                <button onClick={()=>setRideState('idle')} className="btn btn-sm btn-link text-purple text-decoration-none fw-bold">✎ Edit Route</button>
                            </div>
                            <div className="d-flex flex-column gap-2 mb-4" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                {vehicles.map(v => (
                                    <div key={v.id} onClick={() => setSelectedVehicle(v)} 
                                         className={`d-flex justify-content-between align-items-center p-3 rounded-4 border transition-all ${selectedVehicle.id === v.id ? 'border-purple border-2 bg-black' : 'border-secondary bg-dark'}`} 
                                         style={{cursor: 'pointer'}}>
                                        <div className="d-flex align-items-center gap-3">
                                            <span style={{fontSize: '2.5rem', filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.1))'}}>{v.icon}</span>
                                            <span className="fw-bold text-white fs-5">{v.name}</span>
                                        </div>
                                        <span className="fw-bold fs-6 text-purple">₹ {v.min} - ₹ {v.max}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="d-flex gap-2">
                                <button onClick={()=>requestRideWithPaymentPref('Online')} className="btn btn-purple flex-grow-1 py-3 fs-5 fw-bold rounded-pill">Pay Online ✨</button>
                                <button onClick={()=>requestRideWithPaymentPref('Cash')} className="btn btn-outline-purple flex-grow-1 py-3 fs-5 fw-bold rounded-pill">Pay Cash 💵</button>
                            </div>
                        </div>
                     )}

                     {rideState === 'searching' && (
                         <div className="text-center py-5">
                             <div className="spinner-border text-purple mb-3"></div>
                             <h4 className="fw-bold text-purple">Locating a VIP Captain...</h4>
                             <p className="text-muted">Securing the best {selectedVehicle.name} for you.</p>
                         </div>
                     )}

                     {/* THE FIX: CAPTAIN DETAILS SHOWN TO CUSTOMER */}
                     {(rideState === 'accepted' || rideState === 'in_progress') && (
                         <div className="text-center py-4 animate__animated animate__zoomIn">
                            <h2 className="text-purple fw-bold mb-3">{rideState === 'accepted' ? 'Ride Confirmed! 🤩' : 'Cruising in Luxury 🚀'}</h2>
                            
                            <div className="bg-dark border border-purple rounded-4 p-4 text-start mb-4 shadow-lg mx-auto" style={{maxWidth: '400px'}}>
                                <h6 className="text-muted text-uppercase letter-spacing-1 mb-3">Driver Details</h6>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-purple text-white rounded-circle d-flex justify-content-center align-items-center me-3" style={{width: '50px', height: '50px', fontSize: '1.5rem'}}>👨‍✈️</div>
                                    <div>
                                        <h5 className="fw-bold text-white mb-0">{currentRide?.captain}</h5>
                                        <p className="text-purple mb-0 fw-bold">📞 {currentRide?.captainPhone || 'Verified Captain'}</p>
                                    </div>
                                </div>
                                <hr className="border-secondary"/>
                                <p className="text-muted mb-0">Vehicle Requested: <strong className="text-white">{currentRide?.vehicle}</strong></p>
                            </div>

                            {rideState === 'accepted' && (
                                <div className="bg-purple text-white border border-secondary rounded-4 p-4 d-inline-block shadow-lg">
                                    <p className="fw-bold mb-1 fs-5">Your Secure OTP</p>
                                    <h1 className="fw-bold tracking-widest display-4 mb-0">{currentRide?.otp}</h1>
                                </div>
                            )}
                         </div>
                     )}

                     {rideState === 'payment_pending' && (
                         <div className="text-center py-4 animate__animated animate__zoomIn">
                            <h2 className="fw-bold mb-3 text-purple">Destination Reached!</h2>
                            <h1 className="text-white fw-bold mb-4 display-3">₹{currentRide?.fare}</h1>

                            {currentRide?.paymentPref === 'Cash' ? (
                                <div>
                                    <h5 className="text-white mb-4">Please pay <strong className="text-purple">₹{currentRide?.fare} Cash</strong> to Captain {currentRide.captain}.</h5>
                                    <button onClick={() => saveRideToDBAndFinish('Cash')} className="btn btn-purple w-100 py-3 fw-bold fs-5 rounded-pill">Confirm Cash Payment</button>
                                </div>
                            ) : (
                                <>
                                    {paymentStep === 'options' && (
                                        <div className="d-flex flex-column gap-3">
                                            <button onClick={() => setPaymentStep('upi_entry')} className="btn btn-purple py-3 fw-bold fs-5 rounded-pill">Pay via UPI ID</button>
                                            <button onClick={() => setPaymentStep('qr_view')} className="btn btn-outline-purple py-3 fw-bold fs-5 rounded-pill">Show QR Code</button>
                                        </div>
                                    )}
                                    {paymentStep === 'upi_entry' && (
                                        <div className="bg-black p-4 rounded-4 border border-purple animate__animated animate__fadeIn">
                                            <h5 className="fw-bold mb-3 text-purple">Enter your UPI ID</h5>
                                            <input type="text" className="form-control text-center fs-5" placeholder="boss@ybl" value={upiIdInput} onChange={(e) => setUpiIdInput(e.target.value)} />
                                            <div className="d-flex gap-2 mt-4">
                                                <button onClick={() => {if(upiIdInput) setPaymentStep('processing_upi'); else alert('Enter UPI');}} className="btn btn-purple flex-grow-1 py-3 fw-bold rounded-pill">Request Payment</button>
                                                <button onClick={() => setPaymentStep('options')} className="btn btn-outline-danger py-3 px-4 fw-bold rounded-pill">Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                    {paymentStep === 'processing_upi' && (
                                        <div className="text-center animate__animated animate__pulse animate__infinite mt-4">
                                            <div className="spinner-border text-purple mb-3"></div>
                                            <h5 className="text-purple fw-bold">Request Sent to {upiIdInput}</h5>
                                            <p className="text-muted">Check your UPI app to complete payment. We'll lock the trip once confirmed.</p>
                                        </div>
                                    )}
                                    {paymentStep === 'qr_view' && (
                                        <div className="text-center p-3 animate__animated animate__fadeIn">
                                            <p className="fw-bold mb-3 text-purple">Scan QR to Pay ₹{currentRide?.fare}</p>
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=merchant@upi&pn=RideEase&am=${currentRide.fare}`} alt="QR Code" className="mb-4 bg-white p-2 rounded shadow-lg" />
                                            <div className="spinner-border text-success mb-2 d-block mx-auto" style={{width: '1.5rem', height:'1.5rem'}}></div>
                                            <p className="text-success fw-bold">Auto-verifying payment in 5 seconds...</p>
                                        </div>
                                    )}
                                </>
                            )}
                         </div>
                     )}

                     {rideState === 'completed' && (
                         <div className="text-center py-4 animate__animated animate__zoomIn">
                             <div className="bg-dark border border-purple p-4 rounded-4 text-start mx-auto shadow-lg" style={{maxWidth: '350px'}}>
                                 <h4 className="text-success fw-bold text-center mb-1">✅ Payment Successful</h4>
                                 <p className="text-center text-muted mb-4">Your digital receipt</p>
                                 <div className="d-flex justify-content-between mb-2">
                                     <span className="text-white">Amount Paid:</span>
                                     <strong className="text-purple fs-5">₹{currentRide?.fare}</strong>
                                 </div>
                                 <div className="d-flex justify-content-between mb-2">
                                     <span className="text-white">Paid via:</span>
                                     <strong className="text-white">{currentRide?.paymentMethod || 'Online'}</strong>
                                 </div>
                                 <div className="receipt-line"></div>
                                 <div className="d-flex justify-content-between mb-2">
                                     <span className="text-white">Captain:</span>
                                     <strong className="text-white">{currentRide?.captain}</strong>
                                 </div>
                                 <div className="d-flex justify-content-between">
                                     <span className="text-white">Vehicle:</span>
                                     <strong className="text-white">{currentRide?.vehicle}</strong>
                                 </div>
                             </div>
                             <div className="spinner-border text-purple mt-4" style={{width: '1.5rem', height: '1.5rem'}}></div>
                             <p className="text-muted mt-2">Returning to home screen...</p>
                         </div>
                     )}
                 </div>
             )}
             
             {activeTab === 'history' && (
                 <div className="glass-card p-4 rounded-4">
                     <h4 className="fw-bold text-purple mb-4">My VIP History</h4>
                     {rideHistory.length > 0 ? rideHistory.map((r, i) => (
                         <div key={i} className="bg-black p-3 rounded-4 mb-3 border border-secondary d-flex justify-content-between align-items-center shadow-sm">
                            <div><p className="mb-0 fw-bold text-white">{r[3]} ➔ {r[4]}</p><small className="text-muted">{r[7]} • {r[2]}</small></div>
                            <h5 className="text-purple fw-bold mb-0">₹{r[5]} <span className="fs-6 text-muted d-block text-end">({r[6]})</span></h5>
                         </div>
                     )) : <p className="text-muted">No VIP rides completed yet!</p>}
                 </div>
             )}
             {activeTab === 'wallet' && <div className="glass-card p-4 rounded-4 text-white"><h4 className="text-purple">Wallet</h4><h2 className="fw-bold">₹0.00</h2></div>}
             {activeTab === 'refer' && <div className="glass-card p-4 rounded-4 text-center text-white"><h4 className="text-purple">Refer Code</h4><h2 className="fw-bold tracking-widest mt-2">RIDE-{userData?.phone?.slice(0,4)}</h2></div>}
             {activeTab === 'profile' && <div className="glass-card p-4 rounded-4 text-white animate__animated animate__fadeIn"><h4 className="text-purple">My Profile</h4><h3 className="fw-bold">{userData?.name}</h3><p className="text-muted fs-5">{userData?.phone} • {userData?.city}</p></div>}
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
      socket.on('otp_failed', () => alert("Wrong OTP Boss! Check again."));
      socket.on('ride_completed_pay_now', (data) => { if (activeRide && activeRide.id === data.id) { setActiveRide({...activeRide, status: 'payment_pending'}); } });
      
      socket.on('trip_fully_complete', (data) => {
          setActiveRide(prev => {
              if (prev && prev.id === data.id) { return {...prev, status: 'completed', paymentMethod: data.paymentMethod}; }
              return prev;
          });
          setTimeout(() => { setActiveRide(null); setOtpInput(''); }, 8000); // 8 seconds to see receipt
      });

      socket.on('ride_accepted_by_captain', (data) => {
          if (data.captainPhone === userData?.phone) { setActiveRide(data); setIncomingRide(null); } 
          else {
              setIncomingRide(prev => { if (prev && prev.id === data.id) return null; return prev; });
              setActiveRide(prev => { if (prev && prev.id === data.id && prev.status === 'confirming') { alert("Another captain accepted this ride!"); return null; } return prev; });
          }
      });
      return () => { socket.off('incoming_ride'); socket.off('ride_started'); socket.off('otp_failed'); socket.off('trip_fully_complete'); socket.off('ride_accepted_by_captain'); socket.off('ride_completed_pay_now'); }
    }, [activeRide, userData]);

    useEffect(() => {
      if(activeTab === 'history' || activeTab === 'earnings') {
          axios.get(`${SERVER_URL}/api/rides/${userData.name}`).then(res => setRideHistory(res.data)).catch(err => console.error(err));
      }
    }, [activeTab]);

    const acceptRide = () => {
      const rideToAccept = incomingRide; setIncomingRide(null);
      setActiveRide({...rideToAccept, status: 'confirming'});
      socket.emit('accept_ride', { ...rideToAccept, captainName: userData?.name || 'Captain', captainPhone: userData?.phone });
    };

    const verifyOTP = () => {
        if(otpInput.length === 4) socket.emit('verify_otp', { id: activeRide.id, otp: otpInput });
        else alert("Enter 4-digit OTP.");
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 bg-black text-white">
          <div className="col-md-3 bg-dark border-end border-purple p-4 d-flex flex-column h-100 min-vh-100 shadow-lg">
              <div className="text-center mb-5 animate__animated animate__fadeIn">
                  <h4 className="fw-bold text-white"><span className="text-purple">Ride</span>Ease Captain</h4>
                  <div className="badge bg-success py-2 px-3 rounded-pill mt-2 fw-bold">{userData?.name || userData?.phone}</div>
              </div>
              <button onClick={() => setActiveTab('radar')} className={`btn text-start mb-2 fw-bold text-white border-0 ${activeTab==='radar'?'bg-purple':'btn-dark'}`}>📡 Live Radar</button>
              <button onClick={() => setActiveTab('earnings')} className={`btn text-start mb-2 fw-bold text-white border-0 ${activeTab==='earnings'?'bg-purple':'btn-dark'}`}>💰 Earnings</button>
              <button onClick={() => setActiveTab('history')} className={`btn text-start mb-2 fw-bold text-white border-0 ${activeTab==='history'?'bg-purple':'btn-dark'}`}>📜 Trip History</button>
              <button onClick={() => setActiveTab('vehicle')} className={`btn text-start mb-2 fw-bold text-white border-0 ${activeTab==='vehicle'?'bg-purple':'btn-dark'}`}>🏍️ Vehicle Docs</button>
              <button onClick={() => setActiveTab('profile')} className={`btn text-start mb-5 fw-bold text-white border-0 ${activeTab==='profile'?'bg-purple':'btn-dark'}`}>⚙️ My Profile</button>
              <button onClick={handleLogout} className="btn btn-outline-danger w-100 mt-auto fw-bold rounded-pill">Go Offline</button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5 bg-black">
             {activeTab === 'radar' && (
                 <div className="mx-auto" style={{maxWidth:'600px'}}>
                     <div className="mb-4 rounded-4 overflow-hidden shadow-lg border border-purple" style={{height: '200px'}}>
                         <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.9%2C73.1%2C19.3&amp;layer=mapnik" style={{border: 'none'}}></iframe>
                     </div>

                     {activeRide ? (
                         <div className="glass-card p-5 rounded-4 text-center animate__animated animate__fadeIn">
                             
                             {/* THE FIX: VIP EARNINGS RECEIPT FOR CAPTAIN */}
                             {activeRide.status === 'completed' ? (
                                 <div className="animate__animated animate__zoomIn">
                                     <h3 className="text-success fw-bold mt-2">✅ Trip Completed!</h3>
                                     <p className="text-white fs-6 mb-4">Paid via {activeRide.paymentMethod}</p>
                                     
                                     <div className="bg-black border border-purple p-4 rounded-4 text-start mx-auto" style={{maxWidth: '350px'}}>
                                         <h5 className="text-purple fw-bold mb-3 text-center">Earnings Receipt</h5>
                                         <div className="d-flex justify-content-between mb-2">
                                             <span className="text-white">Total Fare Collected:</span>
                                             <strong className="text-white fs-5">₹{activeRide.fare}</strong>
                                         </div>
                                         <div className="receipt-line"></div>
                                         <div className="d-flex justify-content-between mb-2">
                                             <span className="text-success">Your Payout (90%):</span>
                                             <strong className="text-success fs-4">₹{(activeRide.fare * 0.9).toFixed(2)}</strong>
                                         </div>
                                         <div className="d-flex justify-content-between">
                                             <span className="text-danger">Platform Fee (10%):</span>
                                             <strong className="text-danger">₹{(activeRide.fare * 0.1).toFixed(2)}</strong>
                                         </div>
                                     </div>

                                     <div className="spinner-border text-purple mt-4" style={{width: '1.5rem', height: '1.5rem'}}></div>
                                     <p className="text-muted mt-2">Returning to Live Radar...</p>
                                 </div>
                             ) : activeRide.status === 'confirming' ? (
                                 <><div className="spinner-border text-purple mb-3"></div><h3 className="fw-bold text-purple tracking-widest">CONFIRMING...</h3><p className="text-muted">Checking with server if you got the ride!</p></>
                             ) : (
                                 <>
                                     <h3 className="text-success fw-bold mb-4 tracking-wider">STATUS: {activeRide.status === 'in_progress' ? 'ACTIVE TRIP 🚀' : activeRide.status === 'payment_pending' ? 'PAYMENT 💸' : 'ARRIVED 📍'}</h3>
                                     <div className="bg-black border border-secondary p-4 rounded-4 text-start mb-4 shadow-sm">
                                         <p className="mb-2 text-white"><strong className="text-purple">Rider:</strong> {activeRide.riderName} ({activeRide.riderPhone})</p>
                                         <p className="mb-2 text-white"><strong className="text-purple">Pickup:</strong> {activeRide.pickup}</p>
                                         <p className="mb-0 text-white"><strong className="text-purple">Drop:</strong> {activeRide.drop}</p>
                                         <p className="mt-2 text-muted fw-bold">Vehicle: {activeRide.vehicle} | Pay: {activeRide.paymentPref}</p>
                                     </div>
                                     
                                     {activeRide.status === 'payment_pending' ? (
                                         <div className="mt-4 p-4 border rounded-4 bg-black border-purple">
                                             {activeRide.paymentPref === 'Cash' ? (
                                                 <><h4 className="fw-bold text-success mb-2">💵 Collect ₹{activeRide.fare} Cash</h4><p className="text-muted">Wait for the rider to confirm payment on their app.</p></>
                                             ) : (
                                                 <><div className="spinner-grow text-purple mb-3"></div><h5 className="fw-bold text-white">Waiting for Online Payment...</h5><p className="text-muted">Rider is scanning QR or entering UPI.</p></>
                                             )}
                                         </div>
                                     ) : activeRide.status === 'accepted' ? (
                                         <div className="mt-4 p-4 border rounded-4 bg-black border-purple animate__animated animate__fadeInUp">
                                             <h5 className="fw-bold mb-3 text-purple">Verify OTP from Rider</h5>
                                             <input type="number" className="form-control text-center fs-3 tracking-widest border border-purple" placeholder="----" value={otpInput} onChange={(e)=>setOtpInput(e.target.value)} />
                                             <button onClick={verifyOTP} className="btn btn-purple w-100 py-3 fw-bold fs-5 rounded-pill mt-3">Start VIP Ride 🔒</button>
                                         </div>
                                     ) : (
                                         <button onClick={() => socket.emit('finish_ride', activeRide)} className="btn btn-danger w-100 py-3 fs-5 fw-bold mt-4 rounded-pill shadow-lg">End Ride & Request ₹{activeRide.fare} Payment</button>
                                     )}
                                 </>
                             )}
                         </div>
                     ) : incomingRide ? (
                         <div className="glass-card p-5 rounded-4 border-4 border-purple animate__animated animate__pulse animate__infinite">
                             <h3 className="text-purple fw-bold mb-3 animate__animated animate__flash animate__infinite">🔥 VIP Request!</h3>
                             <p className="fs-5 text-white">Rider: <strong>{incomingRide.riderName}</strong></p>
                             <p className="fs-5 text-white">Pickup: <strong>{incomingRide.pickup}</strong></p>
                             <p className="fs-6 text-muted">Vehicle: {incomingRide.vehicle} | Payment: {incomingRide.paymentPref}</p>
                             <h1 className="text-purple fw-bold my-4 display-3">₹{incomingRide.fare}</h1>
                             <div className="d-flex gap-3">
                                 <button onClick={acceptRide} className="btn btn-purple flex-grow-1 py-3 fw-bold fs-5 rounded-pill">ACCEPT</button>
                                 <button onClick={()=>setIncomingRide(null)} className="btn btn-outline-danger flex-grow-1 py-3 fw-bold rounded-pill">REJECT</button>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center mt-5">
                             <div className="spinner-grow text-purple mb-4" style={{width:'4rem', height:'4rem'}}></div>
                             <h3 className="fw-bold text-purple tracking-wide">Radar Active</h3>
                             <p className="text-muted fs-5">Scanning the city for VIP requests...</p>
                         </div>
                     )}
                 </div>
             )}
             {activeTab === 'earnings' && <div className="glass-card p-4 rounded-4 text-center animate__animated animate__fadeIn"><h4 className="fw-bold text-purple mb-3">Your Lifetime Earnings 💰</h4><h1 className="text-success display-2 fw-bold">₹{rideHistory.reduce((sum, r) => sum + r[5], 0)}</h1><p className="text-muted mt-2">Paid out to your linked account.</p></div>}
             {activeTab === 'history' && (
                 <div className="glass-card p-4 rounded-4">
                     <h4 className="fw-bold text-purple mb-4">Your Past Trip History</h4>
                     {rideHistory.length > 0 ? rideHistory.map((r, i) => (
                         <div key={i} className="bg-black p-3 rounded-4 mb-3 border border-secondary d-flex justify-content-between align-items-center shadow-sm">
                            <div><p className="mb-0 fw-bold text-white">{r[3]} ➔ {r[4]}</p><small className="text-muted">{r[7]} • {r[1]}</small></div>
                            <h5 className="text-success fw-bold mb-0">+₹{r[5]} <span className="fs-6 text-muted d-block text-end">({r[6]})</span></h5>
                         </div>
                     )) : <p className="text-muted">No VIP rides completed yet!</p>}
                 </div>
             )}
              {activeTab === 'profile' && <div className="glass-card p-4 rounded-4 text-white animate__animated animate__fadeIn"><h4 className="text-purple">Captain Profile</h4><h3 className="fw-bold">{userData?.name}</h3><p className="text-muted fs-5">{userData?.phone} • Vehicle Docs Verified ✅</p></div>}
          </div>
      </div>
    );
  };

  // ==========================================
  // ADMIN PANEL
  // ==========================================
  const AdminPanel = () => {
    const [stats, setStats] = useState({ active: 0, completed: 0 });
    const [dbStats, setDbStats] = useState({ total_rides: 0, total_users: 0, commission: 0 }); 

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
      <div className="container-fluid min-vh-100 p-0 row m-0 bg-black text-white">
          <div className="col-md-3 bg-dark border-end border-danger p-4 d-flex flex-column h-100 min-vh-100 shadow-lg">
              <h4 className="text-danger fw-bold mb-5 mt-2 animate__animated animate__shakeX">ADMIN PORTAL</h4>
              <button onClick={() => setActiveTab('dash')} className={`btn text-start mb-2 fw-bold ${activeTab==='dash'?'btn-danger text-black':'btn-dark'}`}>📈 Dashboard</button>
              <button onClick={() => setActiveTab('liverides')} className={`btn text-start mb-2 fw-bold ${activeTab==='liverides'?'btn-danger text-black':'btn-dark'}`}>📍 Active Map</button>
              <button onClick={handleLogout} className="btn btn-outline-dark w-100 mt-auto fw-bold text-danger border-danger rounded-pill">Logout</button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5">
              {activeTab === 'dash' && (
                  <div className="animate__animated animate__fadeIn">
                  <h2 className="fw-bold mb-4 text-white">Platform Analytics</h2>
                  <div className="row g-4 mb-4">
                     <div className="col-3"><div className="glass-card p-4 rounded-4 border-success"><h6 className="text-success fw-bold">Admin Commission (10%)</h6><h1 className="text-success fw-bold">₹{dbStats.commission || 0}</h1></div></div>
                     <div className="col-3"><div className="glass-card p-4 rounded-4 border-purple"><h6 className="text-muted">Total Users</h6><h2 className="text-purple fw-bold">{dbStats.total_users}</h2></div></div>
                     <div className="col-3"><div className="glass-card p-4 rounded-4 border-white"><h6 className="text-muted">Rides Locked</h6><h2 className="text-white fw-bold">{dbStats.total_rides}</h2></div></div>
                     <div className="col-3"><div className="glass-card p-4 rounded-4 border-info"><h6 className="text-muted">Live Active Requests</h6><h2 className="text-info fw-bold">{stats.active}</h2></div></div>
                  </div>
                  <div className="glass-card p-4 rounded-4 border-danger"><h5 className="text-danger fw-bold mb-2">System Status</h5><h3 className="text-success fw-bold">SOCKET LIVE <span className="text-white fw-light fs-6">✅ {io().connected?'connected':'waiting'}</span></h3></div>
                  </div>
              )}
              {activeTab === 'liverides' && (
                  <div className="glass-card p-4 rounded-4 border-info animate__animated animate__fadeIn">
                      <h4 className="fw-bold text-white mb-4">Live Platform Tracking</h4>
                      <div className="rounded-4 overflow-hidden shadow-lg border border-purple" style={{height: '400px'}}>
                          <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.9%2C73.1%2C19.3&amp;layer=mapnik" style={{border: 'none'}}></iframe>
                      </div>
                  </div>
              )}
          </div>
      </div>
    );
  };

  return (
    <>
      <VIPTheme />
      {currentView === 'login' ? <AuthPage /> : currentView === 'dashboard' ? (role === 'customer' ? <CustomerPanel /> : role === 'captain' ? <CaptainPanel /> : <AdminPanel />) : <LandingPage />}
    </>
  );
}
