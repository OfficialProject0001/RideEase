import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';

// LIVE MAP & PDF IMPORTS
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// 🛠️ BUG FIX: Leaflet Map Default Icons 
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// BOSS: AAPKA ASLI RENDER URL
const SERVER_URL = "https://rideease-4m7a.onrender.com"; 
const socket = io(SERVER_URL, { autoConnect: false });

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  // ==========================================
  // 💎 100x ULTRA-PREMIUM CYBERPUNK CSS 💎
  // ==========================================
  const VIPTheme = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@700;900&display=swap');
      
      :root {
        --vip-purple: #8A2BE2; 
        --vip-dark: #4A00E0;
        --vip-neon: #D500F9;
        --bg-dark: #050508;
      }
      
      body { 
          background-color: var(--bg-dark); 
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(138, 43, 226, 0.15), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(213, 0, 249, 0.1), transparent 25%);
          font-family: 'Outfit', sans-serif; 
          color: #eaeaea;
          overflow-x: hidden;
      }
      
      h1, h2, h3, h4, h5, h6, .fw-bold { 
          font-family: 'Space Grotesk', sans-serif; 
          letter-spacing: -0.5px;
      }

      .text-gradient {
          background: linear-gradient(to right, #b468ff, #D500F9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0px 0px 30px rgba(213, 0, 249, 0.3);
      }
      
      .form-control, .form-control:focus { 
          color: #FFF !important; 
          background: rgba(10, 10, 15, 0.8) !important; 
          border: 1px solid rgba(255, 255, 255, 0.08) !important; 
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5) !important; 
          border-radius: 12px;
          padding: 12px 15px;
          transition: all 0.3s ease;
      }
      
      .form-control::placeholder { 
          color: #666 !important; 
      }
      
      input:focus { 
          border: 1px solid var(--vip-neon) !important; 
          box-shadow: 0 0 15px rgba(213, 0, 249, 0.25), inset 0 2px 4px rgba(0,0,0,0.5) !important; 
      }
      
      .tracking-widest { 
          letter-spacing: 0.5rem; 
      }
      
      .glass-card {
          background: rgba(20, 20, 25, 0.65);
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-left: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(138, 43, 226, 0.05);
          border-radius: 24px;
      }

      .map-glow {
          box-shadow: 0 0 40px rgba(138, 43, 226, 0.15);
          border: 1px solid rgba(138, 43, 226, 0.3);
          border-radius: 20px;
          position: relative;
          z-index: 1;
      }
      
      .map-glow::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 22px;
          background: linear-gradient(45deg, var(--vip-purple), transparent, var(--vip-neon));
          z-index: -1;
          opacity: 0.4;
          animation: mapPulse 3s infinite alternate;
      }

      .text-purple { color: var(--vip-purple) !important; }
      .bg-purple { background-color: var(--vip-purple) !important; color: white !important; }
      
      .vehicle-card {
          cursor: pointer;
          background: rgba(10, 10, 15, 0.6);
          border-radius: 16px !important;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      .vehicle-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 30px rgba(138, 43, 226, 0.2);
          border-color: var(--vip-neon) !important;
          background: rgba(20, 20, 30, 0.9);
      }
      
      .btn-purple { 
          background: linear-gradient(135deg, var(--vip-dark), var(--vip-purple), var(--vip-neon));
          background-size: 200% 200%;
          color: white !important; 
          border: none; 
          border-radius: 14px !important;
          transition: all 0.4s ease; 
          box-shadow: 0 8px 25px rgba(138, 43, 226, 0.4), inset 0 2px 2px rgba(255, 255, 255, 0.2); 
          animation: gradientShift 5s ease infinite;
      }
      
      .btn-purple:hover { 
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(213, 0, 249, 0.6), inset 0 2px 2px rgba(255, 255, 255, 0.3); 
      }
      
      .btn-outline-purple { 
          border: 2px solid var(--vip-purple) !important; 
          color: #fff !important; 
          background: rgba(138, 43, 226, 0.05); 
          backdrop-filter: blur(5px);
          border-radius: 14px !important;
          transition: 0.3s; 
      }
      
      .btn-outline-purple:hover { 
          background-color: var(--vip-purple) !important; 
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.4);
      }
      
      .receipt-line { 
          border-top: 2px dashed rgba(255,255,255,0.2); 
          margin: 15px 0; 
      }
      
      .leaflet-layer, .leaflet-control-zoom-in, .leaflet-control-zoom-out, .leaflet-control-attribution {
        filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
      }
      .leaflet-container { 
          width: 100%; 
          height: 100%; 
          border-radius: 18px; 
          background-color: #050508; 
      }

      @keyframes mapPulse { 
          0% { opacity: 0.2; } 
          100% { opacity: 0.6; box-shadow: 0 0 50px rgba(213, 0, 249, 0.4); } 
      }
      @keyframes gradientShift { 
          0% { background-position: 0% 50%; } 
          50% { background-position: 100% 50%; } 
          100% { background-position: 0% 50%; } 
      }
      @keyframes float { 
          0% { transform: translateY(0px); } 
          50% { transform: translateY(-8px); } 
          100% { transform: translateY(0px); } 
      }
      .floating-element { 
          animation: float 6s ease-in-out infinite; 
      }
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
          <button onClick={onClick} className="btn btn-outline-purple rounded-circle fw-bold" style={{ width: '45px', height: '45px' }}>
              ←
          </button>
      </div>
  );

  // 📄 REUSABLE HISTORY PDF GENERATOR
  const downloadHistoryPDF = (r) => {
      const pdf = new jsPDF('p', 'mm', 'a5');
      pdf.setFillColor(15, 15, 15); 
      pdf.rect(0, 0, 200, 300, 'F');
      
      pdf.setTextColor(138, 43, 226); 
      pdf.setFont("helvetica", "bold"); 
      pdf.setFontSize(24);
      pdf.text("RideEase VIP", 15, 25);
      
      pdf.setTextColor(255, 255, 255); 
      pdf.setFontSize(12); 
      pdf.setFont("helvetica", "normal");
      pdf.text("Past Ride Receipt", 15, 35);
      
      pdf.setDrawColor(138, 43, 226); 
      pdf.line(15, 40, 133, 40);
      
      pdf.text(`Date: ${r[7]}`, 15, 50);
      pdf.text(`Pickup: ${r[3].substring(0,30)}...`, 15, 65);
      pdf.text(`Drop: ${r[4].substring(0,30)}...`, 15, 75);
      
      pdf.setTextColor(40, 167, 69); 
      pdf.setFont("helvetica", "bold"); 
      pdf.text(`Amount: Rs. ${r[5]}`, 15, 90);
      
      pdf.setTextColor(255, 255, 255); 
      pdf.setFont("helvetica", "normal");
      pdf.text(`Status: ${r[6]}`, 15, 100);
      pdf.text(`Captain: ${r[1]}`, 15, 110);
      
      pdf.save(`RideEase_Past_Receipt_${r[0]}.pdf`);
  };

  // ==========================================
  // LANDING
  // ==========================================
  const LandingPage = () => (
    <div className="container-fluid min-vh-100 d-flex flex-column justify-content-center align-items-center text-center text-white position-relative">
      <div className="mb-5 animate__animated animate__fadeInDown floating-element">
          <h1 className="display-2 fw-bold mb-2">
              <span className="text-gradient">Ride</span>Ease
          </h1>
          <p className="text-muted mb-4 fs-5" style={{fontWeight: 300, letterSpacing: '1px'}}>
              Exclusive Mobility. 100x Premium.
          </p>
      </div>
      
      <div className="glass-card p-5 d-flex flex-column gap-3 shadow-lg" style={{ width: '400px' }}>
        <button onClick={() => navigateTo('login', 'customer')} className="btn btn-purple py-3 fw-bold fs-5">
            Rider Login
        </button>
        <button onClick={() => navigateTo('login', 'captain')} className="btn btn-outline-purple py-3 fw-bold fs-5">
            Captain Login
        </button>
        <hr className="my-4 text-purple opacity-25"/>
        <button onClick={() => navigateTo('login', 'admin')} className="btn btn-link text-purple text-decoration-none fw-bold w-100">
            Access Admin Portal
        </button>
      </div>
    </div>
  );

  // ==========================================
  // AUTH PAGE (WITH MASTER BYPASS FOR ADMIN)
  // ==========================================
  const AuthPage = () => {
    const [phone, setPhone] = useState(''); 
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); 
    const [city, setCity] = useState('');
    const [authStep, setAuthStep] = useState('phone'); 
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault(); 
      setIsLoading(true);

      // 🚨 MASTER BYPASS: ADMIN KO DIRECT ENTRY 🚨
      if (role === 'admin') {
          if (phone.trim().toLowerCase() === 'admin' && password.trim() === 'admin123') {
              finalizeLogin({ phone: 'Admin', role: 'admin', name: 'Super Admin' });
              setIsLoading(false);
              return; 
          } else {
              alert("❌ Wrong Admin ID or Password!");
              setIsLoading(false);
              return;
          }
      }

      // Normal Rider & Captain Login
      try {
        const payload = { phone: phone.trim() };
        const res = await axios.post(`${SERVER_URL}/api/login`, payload);
        
        if (res.data.isNew) {
            setAuthStep('register'); 
        } else {
            finalizeLogin(res.data.user); 
        }
      } catch (err) { 
          alert("Server is waking up. Please wait 10 seconds and click Continue again!"); 
          console.log(err);
      } finally { 
          setIsLoading(false); 
      }
    };

    const handleRegister = async (e) => {
      e.preventDefault(); 
      setIsLoading(true);
      try {
          const newUser = { phone: phone.trim(), name, city, role };
          await axios.post(`${SERVER_URL}/api/register`, newUser);
          finalizeLogin(newUser);
      } catch (err) { 
          console.log("Registration Error"); 
      } finally { 
          setIsLoading(false); 
      }
    };

    const finalizeLogin = (user) => {
      const finalUser = { ...user, role: role }; 
      sessionStorage.setItem('rideease_user', JSON.stringify(finalUser)); 
      setUserData(finalUser); 
      socket.connect(); 
      setActiveTab(role === 'captain' ? 'radar' : role === 'admin' ? 'dash' : 'home'); 
      setCurrentView('dashboard');
    };

    return (
      <div className="container min-vh-100 d-flex justify-content-center align-items-center bg-black">
        <BackButton onClick={() => navigateTo('landing')} />
        <div className="glass-card p-5 animate__animated animate__fadeIn shadow-lg" style={{ width: '420px' }}>
          
          <h3 className="mb-4 text-center text-gradient fw-bold tracking-widest">
              {role?.toUpperCase()} LOGIN
          </h3>
          
          {authStep === 'phone' ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                  <label className="form-label text-purple fw-bold">
                      {role === 'admin' ? "Admin ID" : "Phone Number"}
                  </label>
                  <input type="text" className="form-control" placeholder={role === 'admin' ? "Enter Admin ID" : "10-digit number"} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              
              {role === 'admin' && (
                  <div className="mb-3 text-start">
                      <label className="form-label text-purple fw-bold">Password</label>
                      <input type="password" className="form-control" placeholder="Enter secure password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
              )}
              
              <button type="submit" disabled={isLoading} className="btn btn-purple w-100 py-3 mt-4 fw-bold fs-5">
                  {isLoading ? 'Connecting...' : 'Secure Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <h6 className="text-white fw-bold mb-4">Complete your VIP profile.</h6>
              <div className="mb-3 text-start">
                  <label className="form-label text-purple fw-bold">Full Name</label>
                  <input type="text" className="form-control" onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="mb-4 text-start">
                  <label className="form-label text-purple fw-bold">City</label>
                  <input type="text" className="form-control" onChange={(e) => setCity(e.target.value)} required />
              </div>
              <button type="submit" disabled={isLoading} className="btn btn-purple w-100 py-3 mt-2 fw-bold fs-5">
                  {isLoading ? 'Creating...' : 'Create Account'}
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
    const [rideHistory, setRideHistory] = useState([]); 
    const [pickupLoc, setPickupLoc] = useState(`${userData?.city || 'Mumbai'}`);
    const [dropLoc, setDropLoc] = useState(''); 
    const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
    const [routeCoords, setRouteCoords] = useState([]); 
    const [calculatedDistance, setCalculatedDistance] = useState(0);
    const [pickupCoords, setPickupCoords] = useState(null); 
    const [dropCoords, setDropCoords] = useState(null);

    const vehicles = [
        { id: 'bike', name: 'Bike', icon: '🏍️', base: 40, perKm: 8 },
        { id: 'auto', name: 'VIP Auto', icon: '🛺', base: 65, perKm: 12 },
        { id: 'cab_eco', name: 'Cab Economy', icon: '🚕', base: 120, perKm: 15 },
        { id: 'cab_prem', name: 'Cab Premium', icon: '🚘', base: 180, perKm: 20 },
        { id: 'cab_xl', name: 'Cab XL', icon: '🚙', base: 210, perKm: 25 },
        { id: 'demo', name: 'Demo Ride (Admin)', icon: '🚨', base: 1, perKm: 0, isDemo: true },
    ];
    const [selectedVehicle, setSelectedVehicle] = useState(vehicles[1]); 

    useEffect(() => {
      socket.on('captain_location_update', (coords) => setMapCenter([coords.lat, coords.lng]));
      
      socket.on('ride_accepted_by_captain', (data) => { 
          if (data.riderPhone === userData.phone) { 
              setCurrentRide(data); 
              setRideState('accepted'); 
          } 
      });
      
      socket.on('ride_started', (data) => { 
          if (data.riderPhone === userData.phone) {
              setRideState('in_progress'); 
          }
      });
      
      socket.on('ride_completed_pay_now', (data) => { 
          if (data.riderPhone === userData.phone) {
              setRideState('payment_pending'); 
          }
      });
      
      socket.on('trip_fully_complete', (data) => { 
          if (data.riderPhone === userData.phone) {
              setRideState('completed'); 
          }
      });

      return () => { 
          socket.off('ride_accepted_by_captain'); 
          socket.off('ride_started'); 
          socket.off('ride_completed_pay_now'); 
          socket.off('trip_fully_complete'); 
          socket.off('captain_location_update'); 
      }
    }, []);

    useEffect(() => { 
        if(activeTab === 'history') {
            axios.get(`${SERVER_URL}/api/rides/${userData.phone}`)
                 .then(res => setRideHistory(res.data))
                 .catch(err => console.log(err)); 
        }
    }, [activeTab]);

    const handleSearchVehicles = async () => {
        if(!pickupLoc || !dropLoc) return alert("Please enter both Pickup and Drop locations!");
        setRideState('searching'); 
        try {
            const pickRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupLoc)}`);
            const dropRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropLoc)}`);
            
            if(pickRes.data.length > 0 && dropRes.data.length > 0) {
                const pickLat = parseFloat(pickRes.data[0].lat);
                const pickLng = parseFloat(pickRes.data[0].lon);
                const dropLat = parseFloat(dropRes.data[0].lat);
                const dropLng = parseFloat(dropRes.data[0].lon);
                
                setMapCenter([pickLat, pickLng]); 
                setPickupCoords([pickLat, pickLng]); 
                setDropCoords([dropLat, dropLng]);
                
                const routeRes = await axios.get(`https://router.project-osrm.org/route/v1/driving/${pickLng},${pickLat};${dropLng},${dropLat}?overview=full&geometries=geojson`);
                
                if(routeRes.data.routes.length > 0) { 
                    setCalculatedDistance((routeRes.data.routes[0].distance / 1000).toFixed(1)); 
                    setRouteCoords(routeRes.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]])); 
                    setRideState('select_vehicle'); 
                }
            } else { 
                alert("Location not found on map! Try adding city name."); 
                setRideState('idle'); 
            }
        } catch (err) { 
            setRideState('idle'); 
        }
    };

    const handleVehicleSelection = (v) => {
        if(v.isDemo) { 
            const password = window.prompt("🔒 SECURE: Enter Admin Password for ₹1 Demo Ride:"); 
            if(password !== "admin123") return alert("❌ Incorrect Password! Demo ride locked."); 
        }
        setSelectedVehicle(v);
    };

    const getDynamicFare = (v) => {
        return v.isDemo ? 1 : Math.round(v.base + (v.perKm * calculatedDistance));
    };
    
    const requestRideWithPaymentPref = (method) => { 
        setRideState('searching'); 
        socket.emit('request_ride', { 
            riderName: userData?.name || 'Rider', 
            riderPhone: userData.phone, 
            pickup: pickupLoc, 
            drop: dropLoc, 
            fare: getDynamicFare(selectedVehicle), 
            vehicle: selectedVehicle.name, 
            paymentPref: method, 
            isDemo: selectedVehicle.isDemo 
        }); 
    };

    const handleRazorpayPayment = async () => {
        const res = await loadRazorpayScript();
        if (!res) return alert("Razorpay SDK failed to load.");
        try {
            const orderObj = await axios.post(`${SERVER_URL}/api/create-razorpay-order`, { amount: currentRide.fare });
            const options = {
                key: "rzp_live_SOMYlrgNhCBKBC", 
                amount: orderObj.data.amount, 
                currency: "INR", 
                name: "RideEase VIP", 
                description: `Payment for ${currentRide.vehicle}`, 
                order_id: orderObj.data.id,
                handler: function (response) { 
                    saveRideToDBAndFinish('Razorpay Online (UPI/QR)'); 
                },
                prefill: { name: userData.name, contact: userData.phone }, 
                theme: { color: "#a855f7" },
                modal: { 
                    ondismiss: function() { 
                        alert("⚠️ Payment Cancelled. You can try again or pay via Cash."); 
                    } 
                }
            };
            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (err) { 
            alert("Payment gateway error."); 
        }
    };

    const saveRideToDBAndFinish = async (finalMethod) => {
        try {
            await axios.post(`${SERVER_URL}/api/save-ride`, { 
                rider: userData.phone, 
                captain: currentRide.captain, 
                pickup: currentRide.pickup, 
                drop: currentRide.drop, 
                amount: currentRide.fare, 
                status: `Completed (${finalMethod})` 
            });
            socket.emit('payment_done', { ...currentRide, paymentMethod: finalMethod });
        } catch(err) { 
            console.log(err); 
        }
    };

    const downloadPDF = () => {
        const receipt = document.getElementById('receipt-card');
        html2canvas(receipt, { backgroundColor: '#050508', scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png'); 
            const pdf = new jsPDF('p', 'mm', 'a5'); 
            const pdfWidth = pdf.internal.pageSize.getWidth(); 
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight); 
            pdf.save(`RideEase_Receipt_${currentRide?.fare}INR.pdf`);
        });
    };
    
    const resetToHome = () => { 
        setRideState('idle'); 
        setCurrentRide(null); 
        setDropLoc(''); 
        setRouteCoords([]); 
        setPickupCoords(null); 
        setDropCoords(null); 
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 text-white">
          <div className="col-md-3 glass-card border-end-0 border-end border-purple p-4 d-flex flex-column h-100 min-vh-100 rounded-0 z-3" style={{borderRight: '1px solid rgba(255,255,255,0.05)'}}>
              
              <div className="text-center mb-5 animate__animated animate__fadeIn floating-element">
                  <h3 className="fw-bold text-white"><span className="text-gradient">Ride</span>Ease</h3>
                  <div className="badge bg-purple text-white py-2 px-4 rounded-pill mt-2 fw-bold shadow-lg">
                      {userData?.name || userData?.phone}
                  </div>
              </div>
              
              <button onClick={() => setActiveTab('home')} className={`btn text-start mb-3 fw-bold text-white border-0 py-3 px-4 ${activeTab==='home'?'btn-purple':'btn-outline-purple'}`}>
                  📍 Book VIP Ride
              </button>
              
              <button onClick={() => setActiveTab('history')} className={`btn text-start mb-3 fw-bold text-white border-0 py-3 px-4 ${activeTab==='history'?'btn-purple':'btn-outline-purple'}`}>
                  📜 Ride History
              </button>
              
              <button onClick={() => setActiveTab('wallet')} className={`btn text-start mb-3 fw-bold text-white border-0 py-3 px-4 ${activeTab==='wallet'?'btn-purple':'btn-outline-purple'}`}>
                  💼 Digital Wallet
              </button>
              
              <button onClick={() => setActiveTab('refer')} className={`btn text-start mb-3 fw-bold text-white border-0 py-3 px-4 ${activeTab==='refer'?'btn-purple':'btn-outline-purple'}`}>
                  🎁 Refer & Earn
              </button>
              
              <button onClick={() => setActiveTab('profile')} className={`btn text-start mb-5 fw-bold text-white border-0 py-3 px-4 ${activeTab==='profile'?'btn-purple':'btn-outline-purple'}`}>
                  ⚙️ Preferences
              </button>
              
              <button onClick={handleLogout} className="btn btn-outline-danger w-100 mt-auto fw-bold py-3 rounded-pill">
                  Secure Logout
              </button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5">
             {activeTab === 'home' && (
                 <div className="glass-card p-4 p-md-5 mx-auto animate__animated animate__fadeIn" style={{maxWidth:'650px'}}>
                     
                     <div className="mb-5 map-glow" style={{height: '250px'}}>
                         <MapContainer key={pickupCoords ? pickupCoords[0] : 'default'} center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                             
                             {routeCoords.length > 0 && (
                                 <Polyline positions={routeCoords} color="#D500F9" weight={5} />
                             )}
                             
                             {pickupCoords && (
                                 <Marker position={pickupCoords}>
                                     <Popup>🟢 Pickup: {pickupLoc}</Popup>
                                 </Marker>
                             )}
                             
                             {dropCoords && (
                                 <Marker position={dropCoords}>
                                     <Popup>🔴 Drop: {dropLoc}</Popup>
                                 </Marker>
                             )}
                             
                             {(rideState === 'accepted' || rideState === 'in_progress') && (
                                 <Marker position={mapCenter}>
                                     <Popup>🚖 Captain Live GPS</Popup>
                                 </Marker>
                             )}
                         </MapContainer>
                     </div>
                     
                     {rideState === 'idle' && (
                         <div className="animate__animated animate__fadeInUp">
                             <h3 className="fw-bold text-white mb-4">Book Your <span className="text-gradient">VIP Ride</span></h3>
                             
                             <div className="p-4 rounded-4 border border-secondary mb-4" style={{background: 'rgba(0,0,0,0.4)'}}>
                                 <div className="d-flex align-items-center mb-3">
                                     <span className="text-success me-3 fs-5">●</span>
                                     <input type="text" className="form-control bg-transparent border-0 fs-5" placeholder="Pickup Location (e.g. Virar Station)" value={pickupLoc} onChange={(e) => setPickupLoc(e.target.value)} />
                                 </div>
                                 <hr className="my-3 text-purple opacity-25"/>
                                 <div className="d-flex align-items-center">
                                     <span className="text-danger me-3 fs-5">○</span>
                                     <input type="text" className="form-control bg-transparent border-0 fs-5" placeholder="Drop Location (e.g. Viva College)" value={dropLoc} onChange={(e) => setDropLoc(e.target.value)} />
                                 </div>
                             </div>
                             
                             <button onClick={handleSearchVehicles} className="btn btn-purple w-100 py-3 fs-4 fw-bold">
                                 Calculate Route & Fare 🚀
                             </button>
                         </div>
                     )}
                     
                     {rideState === 'select_vehicle' && (
                         <div className="animate__animated animate__fadeInRight">
                             <div className="d-flex justify-content-between align-items-center mb-4">
                                 <h5 className="fw-bold mb-0 text-white">
                                     Select Vehicle <span className="text-purple fs-6">({calculatedDistance} KM)</span>
                                 </h5>
                                 <button onClick={() => { setRideState('idle'); setRouteCoords([]); setPickupCoords(null); setDropCoords(null); }} className="btn btn-sm text-gradient fw-bold">
                                     ✎ Edit Route
                                 </button>
                             </div>
                             
                             <div className="d-flex flex-column gap-3 mb-4 pr-2" style={{maxHeight: '350px', overflowY: 'auto'}}>
                                 {vehicles.map(v => (
                                     <div key={v.id} onClick={() => handleVehicleSelection(v)} className={`vehicle-card d-flex justify-content-between align-items-center p-4 border ${selectedVehicle.id === v.id ? 'border-neon border-2' : 'border-secondary'}`} style={selectedVehicle.id === v.id ? {borderColor: 'var(--vip-neon)'} : {}}>
                                         <div className="d-flex align-items-center gap-4">
                                             <span style={{fontSize: '2.5rem', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))'}}>
                                                 {v.icon}
                                             </span>
                                             <span className="fw-bold text-white fs-4">
                                                 {v.name} {v.isDemo && <span className="badge bg-danger ms-2 fs-6">Admin</span>}
                                             </span>
                                         </div>
                                         <span className={`fw-bold fs-3 ${v.isDemo ? 'text-danger' : 'text-gradient'}`}>
                                             ₹ {getDynamicFare(v)}
                                         </span>
                                     </div>
                                 ))}
                             </div>
                             
                             <div className="d-flex gap-3 mt-4">
                                 <button onClick={()=>requestRideWithPaymentPref('Online')} className="btn btn-purple flex-grow-1 py-3 fs-5 fw-bold">
                                     Pay Online ✨
                                 </button>
                                 <button onClick={()=>requestRideWithPaymentPref('Cash')} className="btn btn-outline-purple flex-grow-1 py-3 fs-5 fw-bold">
                                     Pay Cash 💵
                                 </button>
                             </div>
                         </div>
                     )}
                     
                     {rideState === 'searching' && (
                         <div className="text-center py-5 floating-element">
                             <div className="spinner-border text-neon mb-4" style={{width:'3rem', height:'3rem', color: 'var(--vip-neon)'}}></div>
                             <h3 className="fw-bold text-gradient">Locating Captain...</h3>
                             <p className="text-muted fs-5">Securing the best VIP Captain for you.</p>
                         </div>
                     )}
                     
                     {(rideState === 'accepted' || rideState === 'in_progress') && (
                         <div className="text-center py-4 animate__animated animate__zoomIn">
                             <h2 className="text-gradient fw-bold mb-4">
                                 {rideState === 'accepted' ? 'Ride Confirmed! 🤩' : 'Cruising in Luxury 🚀'}
                             </h2>
                             
                             <div className="glass-card border border-purple p-4 text-start mb-4 mx-auto" style={{maxWidth: '450px'}}>
                                 <h6 className="text-muted text-uppercase letter-spacing-1 mb-3">Driver Details</h6>
                                 <div className="d-flex align-items-center mb-3">
                                     <div className="bg-purple text-white rounded-circle d-flex justify-content-center align-items-center me-4 shadow-lg" style={{width: '60px', height: '60px', fontSize: '2rem'}}>
                                         👨‍✈️
                                     </div>
                                     <div>
                                         <h4 className="fw-bold text-white mb-1">{currentRide?.captain}</h4>
                                         <p className="text-neon mb-0 fw-bold fs-5" style={{color: 'var(--vip-neon)'}}>📞 {currentRide?.captainPhone}</p>
                                     </div>
                                 </div>
                                 <hr className="border-secondary"/>
                                 <p className="text-muted mb-0 fs-5">Vehicle: <strong className="text-white">{currentRide?.vehicle}</strong></p>
                             </div>
                             
                             {rideState === 'accepted' && (
                                 <div className="glass-card border-neon p-4 d-inline-block" style={{borderColor: 'var(--vip-neon)'}}>
                                     <p className="fw-bold mb-1 fs-5 text-muted">Your Secure OTP</p>
                                     <h1 className="fw-bold tracking-widest display-3 mb-0 text-white">{currentRide?.otp}</h1>
                                 </div>
                             )}
                         </div>
                     )}
                     
                     {rideState === 'payment_pending' && (
                         <div className="text-center py-4 animate__animated animate__zoomIn">
                             <h2 className="fw-bold mb-3 text-white">Destination Reached!</h2>
                             <h1 className="fw-bold mb-4 display-1 text-gradient">₹{currentRide?.fare}</h1>
                             
                             {currentRide?.paymentPref === 'Cash' ? (
                                 <div>
                                     <h4 className="text-white mb-4">
                                         Please pay <strong className="text-neon" style={{color: 'var(--vip-neon)'}}>₹{currentRide?.fare} Cash</strong> to {currentRide.captain}.
                                     </h4>
                                     <button onClick={() => saveRideToDBAndFinish('Cash')} className="btn btn-purple w-100 py-3 fw-bold fs-4">
                                         Confirm Cash Payment
                                     </button>
                                 </div>
                             ) : (
                                 <div className="d-flex flex-column gap-3">
                                     <button onClick={handleRazorpayPayment} className="btn btn-purple py-3 fw-bold fs-4">
                                         Secure Pay via Razorpay ✨
                                     </button>
                                 </div>
                             )}
                         </div>
                     )}
                     
                     {rideState === 'completed' && (
                         <div className="text-center py-4 animate__animated animate__zoomIn">
                             <div id="receipt-card" className="glass-card border-success p-5 text-start mx-auto" style={{maxWidth: '400px'}}>
                                 <h2 className="fw-bold text-center mb-1 text-gradient">RideEase</h2>
                                 <h5 className="text-success fw-bold text-center mb-2">✅ Payment Successful</h5>
                                 <p className="text-center text-muted mb-4">Official VIP Receipt</p>
                                 
                                 <div className="d-flex justify-content-between mb-3">
                                     <span className="text-muted fs-5">Amount Paid:</span>
                                     <strong className="text-white fs-4">₹{currentRide?.fare}</strong>
                                 </div>
                                 
                                 <div className="d-flex justify-content-between mb-2">
                                     <span className="text-muted">Paid via:</span>
                                     <strong className="text-success">{currentRide?.paymentMethod || 'Online'}</strong>
                                 </div>
                                 
                                 <div className="receipt-line"></div>
                                 
                                 <div className="d-flex justify-content-between mb-3">
                                     <span className="text-muted">Route:</span>
                                     <strong className="text-white text-end" style={{fontSize:'0.9rem', maxWidth:'180px'}}>
                                         {currentRide?.pickup.substring(0,20)}... to {currentRide?.drop.substring(0,20)}...
                                     </strong>
                                 </div>
                                 
                                 <div className="d-flex justify-content-between mb-2">
                                     <span className="text-muted">Captain:</span>
                                     <strong className="text-white">{currentRide?.captain}</strong>
                                 </div>
                                 
                                 <div className="d-flex justify-content-between">
                                     <span className="text-muted">Vehicle:</span>
                                     <strong className="text-white">{currentRide?.vehicle}</strong>
                                 </div>
                             </div>
                             
                             <div className="mt-5 d-flex gap-3 justify-content-center">
                                 <button onClick={downloadPDF} className="btn btn-outline-purple fw-bold px-4 py-2 fs-5">
                                     ⬇️ Download PDF
                                 </button>
                                 <button onClick={resetToHome} className="btn btn-purple fw-bold px-5 py-2 fs-5">
                                     Home
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
             )}
             
             {activeTab === 'history' && (
                 <div className="glass-card p-5 animate__animated animate__fadeIn">
                     <h3 className="fw-bold text-gradient mb-5">My VIP History</h3>
                     {rideHistory.length > 0 ? rideHistory.map((r, i) => (
                         <div key={i} className="bg-black p-4 rounded-4 mb-4 border border-secondary d-flex flex-column shadow">
                             <div className="d-flex justify-content-between align-items-center">
                                 <div>
                                     <p className="mb-1 fw-bold text-white fs-5">
                                         {r[3].substring(0,20)}.. ➔ {r[4].substring(0,20)}..
                                     </p>
                                     <small className="text-muted fs-6">{r[7]} • {r[2]}</small>
                                 </div>
                                 <h4 className="text-gradient fw-bold mb-0">
                                     ₹{r[5]} <span className="fs-6 text-muted d-block text-end" style={{color:'#fff!important'}}>({r[6]})</span>
                                 </h4>
                             </div>
                             <button onClick={() => downloadHistoryPDF(r)} className="btn btn-outline-purple align-self-end mt-3 fw-bold px-4">
                                 ⬇️ Get PDF Receipt
                             </button>
                         </div>
                     )) : <p className="text-muted fs-5">No VIP rides completed yet!</p>}
                 </div>
             )}

             {activeTab === 'wallet' && (
                 <div className="glass-card p-5 text-white animate__animated animate__fadeIn">
                     <h3 className="text-gradient">Wallet Balance</h3>
                     <h1 className="fw-bold mt-3 display-3">₹0.00</h1>
                     <button className="btn btn-purple mt-4 px-5 py-3 fw-bold fs-5">Add Funds</button>
                 </div>
             )}

             {activeTab === 'refer' && (
                 <div className="glass-card p-5 text-center text-white animate__animated animate__fadeIn">
                     <h3 className="text-gradient">Refer & Earn</h3>
                     <h1 className="fw-bold tracking-widest mt-4 display-4">RIDE-{userData?.phone?.slice(0,4)}</h1>
                     <p className="text-muted mt-3 fs-5">Share this code with friends and earn VIP credits!</p>
                 </div>
             )}

             {activeTab === 'profile' && (
                 <div className="glass-card p-5 text-white animate__animated animate__fadeIn">
                     <h3 className="text-gradient mb-4">My Profile</h3>
                     <h2 className="fw-bold text-white">{userData?.name}</h2>
                     <p className="text-muted fs-4">{userData?.phone} • {userData?.city}</p>
                     <span className="badge bg-purple py-2 px-4 rounded-pill mt-3 fs-6">VIP Rider Activated</span>
                 </div>
             )}
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
      const watchId = navigator.geolocation.watchPosition(
          (position) => {
              socket.emit('update_location', { lat: position.coords.latitude, lng: position.coords.longitude });
          }, 
          (err) => console.log("GPS Error"), 
          { enableHighAccuracy: true }
      );

      socket.on('incoming_ride', (data) => { 
          if(!activeRide) {
              setIncomingRide(data); 
          }
      });

      socket.on('ride_started', (data) => { 
          if(activeRide && activeRide.id === data.id) { 
              setActiveRide(data); 
          } 
      });

      socket.on('otp_failed', () => {
          alert("Wrong OTP Boss! Check again.");
      });
      
      socket.on('ride_completed_pay_now', (data) => { 
          if (activeRide && activeRide.id === data.id) {
              setActiveRide({...activeRide, status: 'payment_pending'}); 
          }
      });

      socket.on('trip_fully_complete', (data) => { 
          setActiveRide(prev => { 
              if (prev && prev.id === data.id) {
                  return {...prev, status: 'completed', paymentMethod: data.paymentMethod}; 
              }
              return prev; 
          }); 
          setTimeout(() => { 
              setActiveRide(null); 
              setOtpInput(''); 
          }, 8000); 
      });

      socket.on('ride_accepted_by_captain', (data) => { 
          if (data.captainPhone === userData?.phone) { 
              setActiveRide(data); 
              setIncomingRide(null); 
          } else { 
              setIncomingRide(prev => { 
                  if (prev && prev.id === data.id) return null; 
                  return prev; 
              }); 
              setActiveRide(prev => { 
                  if (prev && prev.id === data.id && prev.status === 'confirming') { 
                      alert("Another captain accepted this ride!"); 
                      return null; 
                  } 
                  return prev; 
              }); 
          } 
      });

      return () => { 
          navigator.geolocation.clearWatch(watchId); 
          socket.off('incoming_ride'); 
          socket.off('ride_started'); 
          socket.off('otp_failed'); 
          socket.off('trip_fully_complete'); 
          socket.off('ride_accepted_by_captain'); 
          socket.off('ride_completed_pay_now'); 
      }
    }, [activeRide, userData]);

    useEffect(() => { 
        if(activeTab === 'history' || activeTab === 'earnings') {
            axios.get(`${SERVER_URL}/api/rides/${userData.name}`)
                 .then(res => setRideHistory(res.data))
                 .catch(err=>console.log(err)); 
        }
    }, [activeTab]);

    const acceptRide = () => { 
        const rideToAccept = incomingRide; 
        setIncomingRide(null); 
        setActiveRide({...rideToAccept, status: 'confirming'}); 
        socket.emit('accept_ride', { 
            ...rideToAccept, 
            captainName: userData?.name || 'Captain', 
            captainPhone: userData?.phone 
        }); 
    };

    const verifyOTP = () => { 
        if(otpInput.length === 4) {
            socket.emit('verify_otp', { id: activeRide.id, otp: otpInput }); 
        } else {
            alert("Enter 4-digit OTP."); 
        }
    };

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 text-white">
          <div className="col-md-3 glass-card border-end-0 border-end border-purple p-4 d-flex flex-column h-100 min-vh-100 rounded-0 z-3" style={{borderRight: '1px solid rgba(255,255,255,0.05)'}}>
              
              <div className="text-center mb-5 animate__animated animate__fadeIn floating-element">
                  <h3 className="fw-bold text-white"><span className="text-gradient">Ride</span>Ease Captain</h3>
                  <div className="badge bg-success py-2 px-4 rounded-pill mt-2 fw-bold shadow-lg">
                      {userData?.name || userData?.phone}
                  </div>
              </div>
              
              <button onClick={() => setActiveTab('radar')} className={`btn text-start mb-3 fw-bold text-white border-0 py-3 px-4 ${activeTab==='radar'?'btn-purple':'btn-outline-purple'}`}>
                  📡 Live Radar
              </button>
              
              <button onClick={() => setActiveTab('earnings')} className={`btn text-start mb-3 fw-bold text-white border-0 py-3 px-4 ${activeTab==='earnings'?'btn-purple':'btn-outline-purple'}`}>
                  💰 Earnings
              </button>
              
              <button onClick={() => setActiveTab('history')} className={`btn text-start mb-3 fw-bold text-white border-0 py-3 px-4 ${activeTab==='history'?'btn-purple':'btn-outline-purple'}`}>
                  📜 Trip History
              </button>
              
              <button onClick={() => setActiveTab('vehicle')} className={`btn text-start mb-3 fw-bold text-white border-0 py-3 px-4 ${activeTab==='vehicle'?'btn-purple':'btn-outline-purple'}`}>
                  🏍️ Vehicle Docs
              </button>
              
              <button onClick={() => setActiveTab('profile')} className={`btn text-start mb-5 fw-bold text-white border-0 py-3 px-4 ${activeTab==='profile'?'btn-purple':'btn-outline-purple'}`}>
                  ⚙️ My Profile
              </button>
              
              <button onClick={handleLogout} className="btn btn-outline-danger w-100 mt-auto fw-bold py-3 rounded-pill">
                  Go Offline
              </button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5">
             {activeTab === 'radar' && (
                 <div className="mx-auto animate__animated animate__fadeIn" style={{maxWidth:'650px'}}>
                     
                     <div className="mb-5 map-glow" style={{height: '250px'}}>
                         <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src="https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.9%2C73.1%2C19.3&amp;layer=mapnik" style={{border: 'none', borderRadius: '18px', filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'}}></iframe>
                     </div>
                     
                     {activeRide ? (
                         <div className="glass-card p-5 text-center animate__animated animate__fadeIn">
                             {activeRide.status === 'completed' ? (
                                 <div className="animate__animated animate__zoomIn">
                                     <h2 className="text-success fw-bold mt-2">✅ Trip Completed!</h2>
                                     <p className="text-white fs-5 mb-5">Paid via {activeRide.paymentMethod}</p>
                                     
                                     <div className="bg-black border border-purple p-4 rounded-4 text-start mx-auto shadow-lg" style={{maxWidth: '400px'}}>
                                         <h4 className="text-gradient fw-bold mb-4 text-center">Earnings Receipt</h4>
                                         <div className="d-flex justify-content-between mb-3">
                                             <span className="text-muted fs-5">Total Fare Collected:</span>
                                             <strong className="text-white fs-4">₹{activeRide.fare}</strong>
                                         </div>
                                         <div className="receipt-line"></div>
                                         <div className="d-flex justify-content-between mb-3">
                                             <span className="text-success fs-5">Your Payout (90%):</span>
                                             <strong className="text-success fs-3">₹{(activeRide.fare * 0.9).toFixed(2)}</strong>
                                         </div>
                                         <div className="d-flex justify-content-between">
                                             <span className="text-danger fs-6">Platform Fee (10%):</span>
                                             <strong className="text-danger fs-5">₹{(activeRide.fare * 0.1).toFixed(2)}</strong>
                                         </div>
                                     </div>
                                     
                                     <div className="spinner-border text-purple mt-5" style={{width: '2rem', height: '2rem'}}></div>
                                     <p className="text-muted mt-3 fs-5">Returning to Live Radar...</p>
                                 </div>
                             ) : activeRide.status === 'confirming' ? (
                                 <>
                                     <div className="spinner-border text-neon mb-4" style={{width:'3rem', height:'3rem', color:'var(--vip-neon)'}}></div>
                                     <h3 className="fw-bold text-gradient tracking-widest">CONFIRMING...</h3>
                                     <p className="text-muted fs-5">Checking with server if you got the ride!</p>
                                 </>
                             ) : (
                                 <>
                                     <h3 className="text-success fw-bold mb-4 tracking-wider">
                                         STATUS: {activeRide.status === 'in_progress' ? 'ACTIVE TRIP 🚀' : activeRide.status === 'payment_pending' ? 'PAYMENT 💸' : 'ARRIVED 📍'}
                                     </h3>
                                     
                                     <div className="bg-black border border-secondary p-4 rounded-4 text-start mb-4 shadow">
                                         <div className="d-flex justify-content-between align-items-center mb-3">
                                             <h5 className="text-white fw-bold m-0"><strong className="text-purple">Rider:</strong> {activeRide.riderName}</h5>
                                             <span className="badge bg-dark border fs-6">📞 {activeRide.riderPhone}</span>
                                         </div>
                                         {activeRide.isDemo && (
                                             <div className="alert alert-danger fw-bold text-center p-2 mb-3">🚨 DEMO RIDE ALERT 🚨</div>
                                         )}
                                         <p className="mb-2 text-white fs-5"><strong className="text-purple">Pickup:</strong> {activeRide.pickup}</p>
                                         <p className="mb-3 text-white fs-5"><strong className="text-purple">Drop:</strong> {activeRide.drop}</p>
                                         <hr/>
                                         <p className="mt-3 text-muted fw-bold fs-6">Vehicle: {activeRide.vehicle} | Mode: {activeRide.paymentPref}</p>
                                     </div>
                                     
                                     {activeRide.status === 'payment_pending' ? (
                                         <div className="mt-4 p-4 border rounded-4 bg-black border-purple shadow">
                                             {activeRide.paymentPref === 'Cash' ? (
                                                 <>
                                                     <h3 className="fw-bold text-success mb-3">💵 Collect ₹{activeRide.fare} Cash</h3>
                                                     <p className="text-muted fs-5">Wait for the rider to confirm payment on their app.</p>
                                                 </>
                                             ) : (
                                                 <>
                                                     <div className="spinner-grow text-neon mb-3" style={{color:'var(--vip-neon)'}}></div>
                                                     <h4 className="fw-bold text-white">Waiting for Online Payment...</h4>
                                                     <p className="text-muted fs-5">Rider is completing Razorpay Checkout.</p>
                                                 </>
                                             )}
                                         </div>
                                     ) : activeRide.status === 'accepted' ? (
                                         <div className="mt-4 p-4 border rounded-4 bg-black border-purple animate__animated animate__fadeInUp">
                                             <h4 className="fw-bold mb-4 text-gradient">Verify OTP from Rider</h4>
                                             <input type="number" className="form-control text-center display-4 py-3 tracking-widest border border-purple" placeholder="----" value={otpInput} onChange={(e)=>setOtpInput(e.target.value)} />
                                             <button onClick={verifyOTP} className="btn btn-purple w-100 py-3 fw-bold fs-4 mt-4">Start VIP Ride 🔒</button>
                                         </div>
                                     ) : (
                                         <button onClick={() => socket.emit('finish_ride', activeRide)} className="btn btn-danger w-100 py-4 fs-4 fw-bold mt-4 shadow-lg rounded-4">
                                             End Ride & Request ₹{activeRide.fare} Payment
                                         </button>
                                     )}
                                 </>
                             )}
                         </div>
                     ) : incomingRide ? (
                         <div className="glass-card p-5 text-center border-2" style={{borderColor: 'var(--vip-neon)', boxShadow: '0 0 40px rgba(213,0,249,0.2)'}}>
                             <h2 className="text-gradient fw-bold mb-3 animate__animated animate__pulse animate__infinite">🔥 VIP Request!</h2>
                             {incomingRide.isDemo && <h4 className="text-danger fw-bold animate__animated animate__flash animate__infinite mb-3">🚨 ₹1 DEMO RIDE 🚨</h4>}
                             
                             <div className="bg-black p-4 rounded-4 my-4 text-start">
                                 <p className="fs-4 text-white mb-2"><span className="text-muted fs-5">Rider:</span> <strong>{incomingRide.riderName}</strong></p>
                                 <p className="fs-5 text-white mb-2"><span className="text-muted fs-6">Pickup:</span> <strong>{incomingRide.pickup}</strong></p>
                                 <p className="fs-6 text-muted mt-3 pt-3 border-top border-secondary">Vehicle: {incomingRide.vehicle} | Pay: {incomingRide.paymentPref}</p>
                             </div>
                             
                             <h1 className="text-gradient fw-bold my-4 display-2">₹{incomingRide.fare}</h1>
                             
                             <div className="d-flex gap-4 mt-4">
                                 <button onClick={acceptRide} className="btn btn-purple flex-grow-1 py-3 fw-bold fs-4 shadow-lg">ACCEPT</button>
                                 <button onClick={()=>setIncomingRide(null)} className="btn btn-outline-danger flex-grow-1 py-3 fw-bold fs-5">REJECT</button>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center mt-5 floating-element">
                             <div className="spinner-grow mb-4" style={{width:'4rem', height:'4rem', color:'var(--vip-neon)'}}></div>
                             <h2 className="fw-bold text-gradient tracking-wide">Radar Active</h2>
                             <p className="text-muted fs-5">Scanning the city and broadcasting Live GPS...</p>
                         </div>
                     )}
                 </div>
             )}
             
             {activeTab === 'earnings' && (
                 <div className="glass-card p-5 text-center animate__animated animate__fadeIn">
                     <h3 className="fw-bold text-gradient mb-4">Your Lifetime Earnings 💰</h3>
                     <h1 className="text-success display-1 fw-bold">₹{rideHistory.reduce((sum, r) => sum + r[5], 0)}</h1>
                     <p className="text-muted mt-3 fs-5">Paid out to your linked account.</p>
                 </div>
             )}
             
             {activeTab === 'history' && (
                 <div className="glass-card p-5">
                     <h3 className="fw-bold text-gradient mb-5">Your Past Trip History</h3>
                     {rideHistory.length > 0 ? rideHistory.map((r, i) => (
                         <div key={i} className="bg-black p-4 rounded-4 mb-4 border border-secondary d-flex flex-column shadow">
                             <div className="d-flex justify-content-between align-items-center">
                                 <div>
                                     <p className="mb-1 fw-bold text-white fs-5">{r[3].substring(0,20)}.. ➔ {r[4].substring(0,20)}..</p>
                                     <small className="text-muted fs-6">{r[7]} • {r[1]}</small>
                                 </div>
                                 <h4 className="text-success fw-bold mb-0">
                                     +₹{r[5]} <span className="fs-6 text-muted d-block text-end" style={{color:'#fff!important'}}>({r[6]})</span>
                                 </h4>
                             </div>
                             <button onClick={() => downloadHistoryPDF(r)} className="btn btn-outline-purple align-self-end mt-3 fw-bold px-4">
                                 ⬇️ Get PDF Receipt
                             </button>
                         </div>
                     )) : <p className="text-muted fs-5">No VIP rides completed yet!</p>}
                 </div>
             )}
             
             {activeTab === 'vehicle' && (
                 <div className="glass-card p-5 text-white animate__animated animate__fadeIn">
                     <h3 className="text-gradient fw-bold mb-5">Vehicle Documents</h3>
                     <ul className="list-group list-group-flush bg-transparent">
                         <li className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between py-4 fs-5">
                             <span>Driving License</span> <span className="text-success fw-bold">Verified ✅</span>
                         </li>
                         <li className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between py-4 fs-5">
                             <span>RC Book / Registration</span> <span className="text-success fw-bold">Verified ✅</span>
                         </li>
                         <li className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between py-4 fs-5">
                             <span>Insurance Paper</span> <span className="text-success fw-bold">Verified ✅</span>
                         </li>
                     </ul>
                 </div>
             )}
             
             {activeTab === 'profile' && (
                 <div className="glass-card p-5 text-white animate__animated animate__fadeIn">
                     <h3 className="text-gradient mb-4">Captain Profile</h3>
                     <h2 className="fw-bold text-white">{userData?.name}</h2>
                     <p className="text-muted fs-4">{userData?.phone} • Account Active 🟢</p>
                 </div>
             )}
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
            if(data.type === 'new_ride') {
                setStats(prev => ({...prev, active: data.count || data.rides})); 
            }
            if(data.type === 'complete_ride') { 
                setStats(prev => ({ active: prev.active - 1 > 0 ? prev.active - 1 : 0, completed: prev.completed + 1 })); 
                fetchDbStats(); 
            } 
        }); 
        return () => socket.off('admin_update'); 
    }, []);

    const fetchDbStats = () => {
        axios.get(`${SERVER_URL}/api/admin/stats`)
             .then(res => setDbStats(res.data))
             .catch(err => console.log(err));
    };

    useEffect(() => { 
        if(activeTab === 'dash') {
            fetchDbStats(); 
        }
    }, [activeTab]);

    return (
      <div className="container-fluid min-vh-100 p-0 row m-0 text-white">
          <div className="col-md-3 glass-card border-end-0 border-end border-danger p-4 d-flex flex-column h-100 min-vh-100 rounded-0 z-3" style={{borderRight: '1px solid rgba(255,255,255,0.05)'}}>
              
              <div className="text-center mb-5 mt-3 floating-element">
                  <h3 className="text-danger fw-bold tracking-widest text-shadow">ADMIN</h3>
              </div>
              
              <button onClick={() => setActiveTab('dash')} className={`btn text-start mb-3 fw-bold py-3 px-4 ${activeTab==='dash'?'btn-danger text-black':'btn-outline-danger text-white'}`}>
                  📈 Analytics Dashboard
              </button>
              
              <button onClick={() => setActiveTab('liverides')} className={`btn text-start mb-3 fw-bold py-3 px-4 ${activeTab==='liverides'?'btn-danger text-black':'btn-outline-danger text-white'}`}>
                  📍 Live Global Map
              </button>
              
              <button onClick={handleLogout} className="btn btn-outline-secondary w-100 mt-auto fw-bold py-3 rounded-pill text-white">
                  System Logout
              </button>
          </div>
          
          <div className="col-md-9 p-4 p-md-5">
              {activeTab === 'dash' && (
                  <div className="animate__animated animate__fadeIn">
                      <h2 className="fw-bold mb-5 text-white">Platform <span className="text-gradient">Analytics</span></h2>
                      
                      <div className="row g-4 mb-5">
                          <div className="col-6 col-lg-3">
                              <div className="glass-card p-4 border-success text-center hover-lift">
                                  <h6 className="text-success fw-bold mb-3">Admin Commission (10%)</h6>
                                  <h2 className="text-success fw-bold m-0">₹{dbStats.commission || 0}</h2>
                              </div>
                          </div>
                          <div className="col-6 col-lg-3">
                              <div className="glass-card p-4 border-purple text-center hover-lift">
                                  <h6 className="text-muted fw-bold mb-3">Total Users</h6>
                                  <h2 className="text-gradient fw-bold m-0">{dbStats.total_users}</h2>
                              </div>
                          </div>
                          <div className="col-6 col-lg-3">
                              <div className="glass-card p-4 border-white text-center hover-lift">
                                  <h6 className="text-muted fw-bold mb-3">Rides Locked</h6>
                                  <h2 className="text-white fw-bold m-0">{dbStats.total_rides}</h2>
                              </div>
                          </div>
                          <div className="col-6 col-lg-3">
                              <div className="glass-card p-4 text-center hover-lift" style={{borderColor:'var(--vip-neon)'}}>
                                  <h6 className="text-muted fw-bold mb-3">Live Requests</h6>
                                  <h2 className="fw-bold m-0" style={{color:'var(--vip-neon)'}}>{stats.active}</h2>
                              </div>
                          </div>
                      </div>

                      <div className="glass-card p-5 border-danger text-center w-50">
                          <h5 className="text-muted fw-bold mb-3">System Status</h5>
                          <h2 className="text-success fw-bold m-0">SOCKET LIVE <span className="text-white fw-light fs-4 ms-2">✅ {io().connected?'Online':'Connecting...'}</span></h2>
                      </div>
                  </div>
              )}
              
              {activeTab === 'liverides' && (
                  <div className="glass-card p-5 animate__animated animate__fadeIn">
                      <h3 className="fw-bold text-gradient mb-5">Live Platform Tracking</h3>
                      <div className="overflow-hidden shadow-lg map-glow" style={{height: '500px', borderRadius:'24px'}}>
                          <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src="https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.9%2C73.1%2C19.3&amp;layer=mapnik" style={{border: 'none', filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'}}></iframe>
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
      {currentView === 'login' ? (
          <AuthPage />
      ) : currentView === 'dashboard' ? (
          role === 'customer' ? <CustomerPanel /> : 
          role === 'captain' ? <CaptainPanel /> : 
          <AdminPanel />
      ) : (
          <LandingPage />
      )}
    </>
  );
}
