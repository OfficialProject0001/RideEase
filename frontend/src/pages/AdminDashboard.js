import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="container-fluid py-4">
      <h1 className="text-warning fw-bold mb-4">Admin Master Console</h1>
      
      <div className="row g-4 mb-5">
        <div className="col-md-3"><div className="glass-card p-4 text-center"><h5>Total Users</h5><h3>1,450</h3></div></div>
        <div className="col-md-3"><div className="glass-card p-4 text-center"><h5>Active Captains</h5><h3>320</h3></div></div>
        <div className="col-md-3"><div className="glass-card p-4 text-center"><h5>Live Rides</h5><h3 className="text-success">24</h3></div></div>
        <div className="col-md-3"><div className="glass-card p-4 text-center"><h5>Revenue</h5><h3 className="text-warning">₹8.4L</h3></div></div>
      </div>

      <div className="glass-card p-4">
        <h4 className="mb-4">Recent Captain Registrations</h4>
        <table className="table table-dark table-hover border-secondary">
          <thead>
            <tr><th>Name</th><th>Vehicle</th><th>License Number</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr><td>Rahul Sharma</td><td>Activa 6G</td><td>MH-15-2023-XXXX</td><td><span className="badge bg-warning">Pending</span></td><td><button className="btn btn-sm btn-success">Approve</button></td></tr>
            <tr><td>Vikram Singh</td><td>Royal Enfield</td><td>MH-12-2022-XXXX</td><td><span className="badge bg-success">Approved</span></td><td><button className="btn btn-sm btn-danger">Block</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
