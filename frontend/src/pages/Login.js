import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [step, setStep] = useState(1); // Step 1: Phone, Step 2: OTP
  const [role, setRole] = useState('rider'); // 'rider' ya 'captain'
  
  const navigate = useNavigate();

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      alert("Boss, please enter a valid 10-digit number!");
      return;
    }
    // 4-digit random OTP generate karna
    const randomOtp = Math.floor(1000 + Math.random() * 9000);
    setGeneratedOtp(randomOtp);
    setStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp === generatedOtp.toString()) {
      // OTP sahi hai, ab role ke hisaab se page par bhejo
      if (role === 'rider') {
        navigate('/book');
      } else {
        navigate('/driver');
      }
    } else {
      alert("Galat OTP! Dhyan se dekhiye aur wapas type kijiye.");
    }
  };

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center bg-dark" style={{ background: 'radial-gradient(circle, #2a2a2a, #000000)' }}>
      <div className="card bg-black p-4 shadow-lg" style={{ width: '400px', borderTop: '5px solid red', borderRadius: '15px' }}>
        
        <div className="text-center mb-4">
          <h2 className="text-danger fw-bold">Ride<span className="text-white">Ease</span></h2>
          <p className="text-muted">Login to start your journey</p>
        </div>

        {/* --- STEP 1: ENTER PHONE NUMBER --- */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-3 d-flex justify-content-center gap-3">
              <div className="form-check">
                <input className="form-check-input bg-dark border-danger" type="radio" name="role" id="rider" checked={role === 'rider'} onChange={() => setRole('rider')} />
                <label className="form-check-label text-light" htmlFor="rider">Rider</label>
              </div>
              <div className="form-check">
                <input className="form-check-input bg-dark border-danger" type="radio" name="role" id="captain" checked={role === 'captain'} onChange={() => setRole('captain')} />
                <label className="form-check-label text-light" htmlFor="captain">Captain</label>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-light mb-1"><small>Phone Number</small></label>
              <div className="input-group">
                <span className="input-group-text bg-dark text-white border-secondary">+91</span>
                <input type="number" className="form-control bg-dark text-white border-secondary" placeholder="9999999999" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-danger w-100 fw-bold mt-2">Get OTP</button>
          </form>
        )}

        {/* --- STEP 2: VERIFY OTP --- */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            {/* Website par hi OTP dikhane wala Magic Box */}
            <div className="alert alert-success text-center fw-bold p-2 mb-4 border-success">
              <small className="d-block text-dark">Demo SMS Received!</small>
              Your RideEase OTP is: {generatedOtp}
            </div>

            <div className="mb-4">
              <label className="text-light mb-1"><small>Enter 4-digit OTP</small></label>
              <input type="number" className="form-control bg-dark text-white border-danger text-center fs-4 letter-spacing-3" placeholder="----" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-danger w-100 fw-bold">Verify & Login</button>
            <button type="button" className="btn btn-link text-muted w-100 mt-2 text-decoration-none" onClick={() => setStep(1)}><small>Change Phone Number</small></button>
          </form>
        )}

      </div>
    </div>
  );
}

export default Login;
