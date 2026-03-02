import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

function BookRide() {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [fare, setFare] = useState(null);
  const position = [19.9975, 73.7898]; 

  const handlePayment = (fareAmount) => {
    const options = {
      key: "rzp_test_YOUR_TEST_KEY", 
      amount: fareAmount * 100, 
      currency: "INR",
      name: "RideEase",
      description: "Ride Fare",
      handler: function (response) { alert("Payment Successful! ID: " + response.razorpay_payment_id); },
      theme: { color: "#dc3545" } // Red Theme
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div className="row g-0" style={{ height: 'calc(100vh - 76px)' }}>
      <div className="col-md-4 p-4 bg-black text-white" style={{ borderRight: '2px solid red' }}>
        <h3 className="text-danger fw-bold mb-4">Book Your Ride</h3>
        <input type="text" className="form-control bg-dark text-white mb-3 border-secondary" placeholder="Pickup Location" onChange={(e)=>setPickup(e.target.value)} />
        <input type="text" className="form-control bg-dark text-white mb-3 border-secondary" placeholder="Drop Location" onChange={(e)=>setDrop(e.target.value)} />
        <button onClick={() => setFare(150)} className="btn btn-danger w-100 fw-bold fs-5 mb-3">Get Fare</button>
        
        {fare && (
          <div className="p-3 border border-danger rounded bg-dark text-center">
            <h4 className="text-success mb-3">Fare: ₹{fare}</h4>
            <button onClick={() => handlePayment(fare)} className="btn btn-danger w-100 fw-bold">Pay & Confirm Ride</button>
          </div>
        )}
      </div>
      <div className="col-md-8">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position}><Popup>Pickup Here</Popup></Marker>
        </MapContainer>
      </div>
    </div>
  );
}
export default BookRide;
