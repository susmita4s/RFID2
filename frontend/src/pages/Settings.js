

import React from 'react';

const Settings = () => {
  return (
    <div className="p-3 bg-light min-vh-100 animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Settings</h2>
        <p className="text-muted small">Manage your account and system preferences</p>
      </div>

      <div className="row g-4 justify-content-center">
        <div className="col-xl-9 col-lg-11">
          
          {/* Section 1: Profile Settings */}
          <SettingsCard 
            title="Profile Settings" 
            sub="Update your personal information" 
            icon="person-bounding-box" 
            color="info"
          >
            <div className="row g-3">
              <div className="col-md-6">
                <SettingsInput label="Full Name" defaultValue="Vikram Singh" />
              </div>
              <div className="col-md-6">
                <SettingsInput label="Email Address" defaultValue="admin@eduscan.edu" type="email" />
              </div>
              <div className="col-md-6">
                <SettingsInput label="Phone Number" defaultValue="+1 555-0100" />
              </div>
              <div className="col-md-6">
                <SettingsInput label="Role" defaultValue="Senior Administrator" disabled />
              </div>
            </div>
          </SettingsCard>

          {/* Section 2: RFID Configuration */}
          <SettingsCard 
            title="RFID Configuration" 
            sub="Configure RFID scanner and reader hardware" 
            icon="rss" 
            color="primary"
          >
            <div className="list-group list-group-flush border-top-0">
              <ToggleRow title="Auto-scan Mode" sub="Automatically detect RFID cards when in range" checked />
              <ToggleRow title="Sound Notifications" sub="Play a confirmation chime when a card is scanned" checked />
              <ToggleRow title="Scan Cooldown" sub="Prevent accidental duplicate scans within a 5-second window" checked />
            </div>
          </SettingsCard>

          {/* Section 3: Notifications */}
          <SettingsCard 
            title="Notifications" 
            sub="Manage how you receive alerts and reports" 
            icon="bell-fill" 
            color="warning"
          >
            <div className="list-group list-group-flush border-top-0">
              <ToggleRow title="Email Notifications" sub="Receive daily summary reports via email" checked />
              <ToggleRow title="Late Arrival Alerts" sub="Get instant notifications for student tardiness" checked />
              <ToggleRow title="Overdue Book Alerts" sub="Get notified immediately when library items are overdue" checked />
              <ToggleRow title="Payment Reminders" sub="Automate weekly payment due notices to parents" />
            </div>
          </SettingsCard>

          {/* Section 4: Security */}
          <SettingsCard 
            title="Security" 
            sub="Protect your account and enable advanced safety" 
            icon="shield-lock-fill" 
            color="danger"
          >
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <SettingsInput label="Current Password" type="password" placeholder="••••••••" />
              </div>
              <div className="col-md-6">
                <SettingsInput label="New Password" type="password" placeholder="Min. 8 characters" />
              </div>
            </div>
            <div className="p-3 rounded-4 border d-flex justify-content-between align-items-center bg-light bg-opacity-50">
              <div>
                <div className="fw-bold small">Two-Factor Authentication</div>
                <div className="text-muted smaller">Add an extra layer of security via mobile app or SMS.</div>
              </div>
              <button className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-bold">Enable 2FA</button>
            </div>
          </SettingsCard>

          {/* Action Footer */}
          <div className="d-flex justify-content-end mt-4 mb-5">
            <button className="btn btn-info text-white rounded-pill px-5 py-2 fw-bold shadow-sm transition-all" style={{ background: '#0dcaf0', border: 'none' }}>
              <i className="bi bi-check-circle-fill me-2"></i>Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- REUSABLE UI COMPONENTS --- */

const SettingsCard = ({ title, sub, icon, color, children }) => (
  <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
    <div className="d-flex align-items-center gap-3 mb-4">
      <div className={`bg-${color} bg-opacity-10 text-${color} rounded-4 d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
        <i className={`bi bi-${icon} fs-5`}></i>
      </div>
      <div>
        <h5 className="fw-bold m-0 text-dark">{title}</h5>
        <p className="text-muted small m-0">{sub}</p>
      </div>
    </div>
    {children}
  </div>
);

const SettingsInput = ({ label, type = "text", defaultValue = "", disabled = false, placeholder = "" }) => (
  <div className="mb-2">
    <label className="form-label smaller fw-bold text-muted mb-1">{label}</label>
    <input 
      type={type} 
      className={`form-control form-control-sm border-0 bg-light py-2 px-3 rounded-3 shadow-none ${disabled ? 'text-muted opacity-75' : ''}`}
      defaultValue={defaultValue} 
      disabled={disabled}
      placeholder={placeholder}
    />
  </div>
);

const ToggleRow = ({ title, sub, checked = false }) => (
  <div className="d-flex justify-content-between align-items-center py-3 border-bottom border-light last-child-border-0">
    <div className="pe-3">
      <div className="fw-bold small text-dark">{title}</div>
      <div className="text-muted smaller" style={{ fontSize: '11px' }}>{sub}</div>
    </div>
    <div className="form-check form-switch">
      <input 
        className="form-check-input shadow-none cursor-pointer" 
        type="checkbox" 
        role="switch" 
        defaultChecked={checked} 
        style={{ width: '2.4em', height: '1.2em' }}
      />
    </div>
  </div>
);

export default Settings;