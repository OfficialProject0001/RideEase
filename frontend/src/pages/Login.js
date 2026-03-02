import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('rider');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = (e) => {
    e.preventDefault();
    if(phone.length === 10) setStep(2);
    else alert("Please enter a valid 10-digit number");
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if(otp === '1234') { // Demo static OTP
      navigate(role === 'rider' ? '/book' : '/driver');
    } else {
      alert("Demo OTP is 1234");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="glass-card p-5" style={{ width: '450px', animation: 'fadeIn 1s ease-in-out' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold" style={{ color: '#fbbf24' }}>Ride<span className="text-white">Ease</span></h1>
          <p className="text-light opacity-75">Premium Ride Experience</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="d-flex justify-content-center gap-4 mb-4">
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="role" checked={role === 'rider'} onChange={() => setRole('rider')} />
                <label className="form-check-label text-light">Customer</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="role" checked={role === 'captain'} onChange={() => setRole('captain')} />
                <label className="form-check-label text-light">Captain</label>
              </div>
            </div>
            <div className="mb-4">
              <input type="number" className="form-control premium-input p-3" placeholder="Enter Phone Number" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-premium w-100 fs-5">Get OTP</button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="alert bg-success text-white text-center border-0 rounded-3 mb-4">
              Demo SMS: Your RideEase OTP is <strong>1234</strong>
            </div>
            <div className="mb-4">
              <input type="number" className="form-control premium-input p-3 text-center fs-3 letter-spacing-3" placeholder="----" value={otp} onChange={(e)=>setOtp(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-premium w-100 fs-5">Verify & Login</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
