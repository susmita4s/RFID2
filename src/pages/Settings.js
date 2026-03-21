


import React from 'react';

const Settings = () => {
  return (
    <div className="animate-fade-in pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="fw-bold m-0">Settings</h2>
        <p className="text-muted small">Manage your account and system preferences</p>
      </div>

      <div className="row g-4">
        <div className="col-xl-9 col-lg-11 mx-auto">
          
          {/* Section 1: Profile Settings */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'var(--card-bg)' }}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-info bg-opacity-10 text-info rounded-3 p-3">
                <i className="bi bi-person-fill fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold m-0">Profile Settings</h5>
                <p className="text-muted small m-0">Update your personal information</p>
              </div>
            </div>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold opacity-75">Full Name</label>
                <input type="text" className="form-control border-0 bg-light py-2 px-3 rounded-3" defaultValue="Admin User" />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold opacity-75">Email Address</label>
                <input type="email" className="form-control border-0 bg-light py-2 px-3 rounded-3" defaultValue="admin@eduscan.edu" />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold opacity-75">Phone Number</label>
                <input type="text" className="form-control border-0 bg-light py-2 px-3 rounded-3" defaultValue="+1 555-0100" />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold opacity-75">Role</label>
                <input type="text" className="form-control border-0 bg-secondary bg-opacity-10 py-2 px-3 rounded-3 text-muted" defaultValue="Administrator" disabled />
              </div>
            </div>
          </div>

          {/* Section 2: RFID Configuration */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'var(--card-bg)' }}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-3">
                <i className="bi bi-wifi fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold m-0">RFID Configuration</h5>
                <p className="text-muted small m-0">Configure RFID scanner settings</p>
              </div>
            </div>
            <div className="list-group list-group-flush">
              <ToggleItem title="Auto-scan Mode" sub="Automatically detect RFID cards when in range" checked />
              <ToggleItem title="Sound Notifications" sub="Play sound when card is scanned" checked />
              <ToggleItem title="Scan Cooldown" sub="Prevent duplicate scans within 5 seconds" checked />
            </div>
          </div>

          {/* Section 3: Notifications (From Screenshot 2) */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'var(--card-bg)' }}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-3">
                <i className="bi bi-bell-fill fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold m-0">Notifications</h5>
                <p className="text-muted small m-0">Manage notification preferences</p>
              </div>
            </div>
            <div className="list-group list-group-flush">
              <ToggleItem title="Email Notifications" sub="Receive daily summary reports via email" checked />
              <ToggleItem title="Late Arrival Alerts" sub="Get notified when students arrive late" checked />
              <ToggleItem title="Overdue Book Alerts" sub="Notify when library books are overdue" checked />
              <ToggleItem title="Payment Reminders" sub="Send payment due reminders to parents" />
            </div>
          </div>

          {/* Section 4: Security (From Screenshot 2) */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'var(--card-bg)' }}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-danger bg-opacity-10 text-danger rounded-3 p-3">
                <i className="bi bi-shield-lock-fill fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold m-0">Security</h5>
                <p className="text-muted small m-0">Manage your account security</p>
              </div>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-bold opacity-75">Current Password</label>
                <input type="password" className="form-control border-0 bg-light py-2 px-3 rounded-3" />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold opacity-75">New Password</label>
                <input type="password" className="form-control border-0 bg-light py-2 px-3 rounded-3" />
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
              <div>
                <span className="fw-bold d-block">Two-Factor Authentication</span>
                <span className="text-muted small">Add extra security to your account</span>
              </div>
              <button className="btn btn-white border shadow-sm rounded-pill px-4 btn-sm fw-bold">Enable 2FA</button>
            </div>
          </div>

          {/* Save Button */}
          <div className="text-end">
            <button className="btn btn-info text-white rounded-pill px-5 py-2 fw-bold shadow-sm">
              <i className="bi bi-save me-2"></i>Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

/* Reusable Toggle Row Component */
const ToggleItem = ({ title, sub, checked = false }) => (
  <div className="d-flex justify-content-between align-items-center py-3 border-bottom border-light">
    <div>
      <div className="fw-bold text-dark mb-0">{title}</div>
      <div className="text-muted" style={{ fontSize: '11px' }}>{sub}</div>
    </div>
    <div className="form-check form-switch">
      <input 
        className="form-check-input ms-0" 
        type="checkbox" 
        role="switch" 
        defaultChecked={checked} 
        style={{ width: '2.4em', height: '1.2em', cursor: 'pointer' }}
      />
    </div>
  </div>
);

export default Settings;