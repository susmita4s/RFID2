import React, { useState, useEffect } from 'react';

const Settings = ({ adminData = {} }) => {
  // State for Profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // State for Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // State for RFID Preferences (with LocalStorage)
  const [autoScanMode, setAutoScanMode] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [scanCooldown, setScanCooldown] = useState(true);

  // State for Alerts Preferences (with LocalStorage)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [lateArrivalAlerts, setLateArrivalAlerts] = useState(true);
  const [overdueBookAlerts, setOverdueBookAlerts] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: null, message: '' });

  // Initialize profile fields when adminData updates
  useEffect(() => {
    if (adminData) {
      setFullName(adminData.name || '');
      setEmail(adminData.email || '');
      setPhone(adminData.phone || '');
    }
  }, [adminData]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPref = (key, defaultVal) => {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultVal;
    };

    setAutoScanMode(loadPref('rfid_autoScanMode', true));
    setSoundNotifications(loadPref('rfid_soundNotifications', true));
    setScanCooldown(loadPref('rfid_scanCooldown', true));

    setEmailAlerts(loadPref('alert_emailNotifications', true));
    setLateArrivalAlerts(loadPref('alert_lateArrivalAlerts', true));
    setOverdueBookAlerts(loadPref('alert_overdueBookAlerts', true));
    setPaymentReminders(loadPref('alert_paymentReminders', false));
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveStatus({ success: null, message: '' });

    // 1. Save local preferences to localStorage
    localStorage.setItem('rfid_autoScanMode', JSON.stringify(autoScanMode));
    localStorage.setItem('rfid_soundNotifications', JSON.stringify(soundNotifications));
    localStorage.setItem('rfid_scanCooldown', JSON.stringify(scanCooldown));

    localStorage.setItem('alert_emailNotifications', JSON.stringify(emailAlerts));
    localStorage.setItem('alert_lateArrivalAlerts', JSON.stringify(lateArrivalAlerts));
    localStorage.setItem('alert_overdueBookAlerts', JSON.stringify(overdueBookAlerts));
    localStorage.setItem('alert_paymentReminders', JSON.stringify(paymentReminders));

    // 2. Prep profile request payload
    const token = localStorage.getItem('token');
    
    // Split Full Name into firstName and lastName
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      firstName,
      lastName,
      email: email.trim(),
      phone: phone.trim()
    };

    if (currentPassword && newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    } else if (newPassword && !currentPassword) {
      setSaveStatus({ success: false, message: 'Current password is required to set a new password.' });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveStatus({ success: true, message: 'All changes saved successfully! Syncing profile...' });
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        
        // Reload page to refresh all header states with the new info
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSaveStatus({ success: false, message: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error(err);
      setSaveStatus({ success: false, message: 'Server error. Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

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
                <SettingsInput label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="col-md-6">
                <SettingsInput label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <div className="col-md-6">
                <SettingsInput label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="col-md-6">
                <SettingsInput label="Role" value={adminData.role || "N/A"} disabled />
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
              <ToggleRow title="Auto-scan Mode" sub="Automatically detect RFID cards when in range" checked={autoScanMode} onChange={(e) => setAutoScanMode(e.target.checked)} />
              <ToggleRow title="Sound Notifications" sub="Play a confirmation chime when a card is scanned" checked={soundNotifications} onChange={(e) => setSoundNotifications(e.target.checked)} />
              <ToggleRow title="Scan Cooldown" sub="Prevent accidental duplicate scans within a 5-second window" checked={scanCooldown} onChange={(e) => setScanCooldown(e.target.checked)} />
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
              <ToggleRow title="Email Notifications" sub="Receive daily summary reports via email" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
              <ToggleRow title="Late Arrival Alerts" sub="Get instant notifications for student tardiness" checked={lateArrivalAlerts} onChange={(e) => setLateArrivalAlerts(e.target.checked)} />
              <ToggleRow title="Overdue Book Alerts" sub="Get notified immediately when library items are overdue" checked={overdueBookAlerts} onChange={(e) => setOverdueBookAlerts(e.target.checked)} />
              <ToggleRow title="Payment Reminders" sub="Automate weekly payment due notices to parents" checked={paymentReminders} onChange={(e) => setPaymentReminders(e.target.checked)} />
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
                <SettingsInput label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="col-md-6">
                <SettingsInput label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
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

          {/* Section 5: Role Access & Permissions (Admin Only) */}
          {(adminData.role === "Administrator" || adminData.role === "admin") && <RolePermissionsSection />}

          {/* Save Status Banner */}
          {saveStatus.success !== null && (
            <div className={`alert rounded-4 p-3 mb-4 d-flex align-items-center gap-3 ${saveStatus.success ? 'alert-success border-success bg-success bg-opacity-10 text-success' : 'alert-danger border-danger bg-danger bg-opacity-10 text-danger'}`}>
              <i className={`bi bi-${saveStatus.success ? 'check-circle-fill' : 'exclamation-triangle-fill'} fs-5`}></i>
              <div className="small fw-semibold">{saveStatus.message}</div>
            </div>
          )}

          {/* Action Footer */}
          <div className="d-flex justify-content-end mt-4 mb-5">
            <button 
              onClick={handleSaveAll}
              disabled={saving}
              className="btn btn-info text-white rounded-pill px-5 py-2 fw-bold shadow-sm transition-all d-flex align-items-center gap-2" 
              style={{ background: '#0dcaf0', border: 'none' }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Saving Changes...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill"></i>
                  Save All Changes
                </>
              )}
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

const SettingsInput = ({ label, type = "text", value, onChange, defaultValue, disabled = false, placeholder = "" }) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";

  const inputProps = {
    type: isPassword && showPassword ? "text" : type,
    className: `form-control form-control-sm border-0 bg-light py-2 px-3 rounded-3 shadow-none ${disabled ? 'text-muted opacity-75' : ''}`,
    disabled,
    placeholder,
    style: isPassword ? { paddingRight: '40px' } : {}
  };

  if (value !== undefined) {
    inputProps.value = value;
    inputProps.onChange = onChange;
  } else {
    inputProps.defaultValue = defaultValue;
  }

  return (
    <div className="mb-2">
      <label className="form-label smaller fw-bold text-muted mb-1">{label}</label>
      <div className="position-relative">
        <input {...inputProps} />
        {isPassword && (
          <button
            type="button"
            className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-2"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
            style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
          >
            <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
          </button>
        )}
      </div>
    </div>
  );
};

const ToggleRow = ({ title, sub, checked, onChange, defaultChecked = false }) => {
  const checkboxProps = {};
  if (checked !== undefined) {
    checkboxProps.checked = checked;
    checkboxProps.onChange = onChange;
  } else {
    checkboxProps.defaultChecked = defaultChecked;
  }

  return (
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
          {...checkboxProps}
          style={{ width: '2.4em', height: '1.2em' }}
        />
      </div>
    </div>
  );
};

const RolePermissionsSection = () => {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
  
  // Modal State
  const [newRoleName, setNewRoleName] = useState('');
  const [canAccessDashboard, setCanAccessDashboard] = useState(true);
  const [canAccessLibrary, setCanAccessLibrary] = useState(false);
  const [canAccessPayments, setCanAccessPayments] = useState(false);
  const [canAccessStudents, setCanAccessStudents] = useState(false);
  const [canAccessAttendance, setCanAccessAttendance] = useState(false);
  const [canAccessBus, setCanAccessBus] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setNewRoleName('');
    setCanAccessDashboard(true);
    setCanAccessLibrary(false);
    setCanAccessPayments(false);
    setCanAccessStudents(false);
    setCanAccessAttendance(false);
    setCanAccessBus(false);
    setError('');
    setShowModal(true);
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          roleName: newRoleName.trim(),
          canAccessDashboard,
          canAccessLibrary,
          canAccessPayments,
          canAccessStudents,
          canAccessAttendance,
          canAccessBus
        })
      });
      const data = await res.json();
      if (data.success) {
        setRoles([...roles, data.role]);
        setShowModal(false);
      } else {
        setError(data.message || 'Failed to add role');
      }
    } catch (err) {
      setError('Server error. Failed to add role.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (roleId, field, currentValue) => {
    try {
      const res = await fetch(`http://localhost:5000/api/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: !currentValue })
      });
      const data = await res.json();
      if (data.success) {
        setRoles(roles.map(r => r.id === roleId ? data.role : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this custom role? This will revoke access permissions for all staff members assigned to this role.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoles(roles.filter(r => r.id !== roleId));
      } else {
        alert(data.message || 'Failed to delete role');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete role due to server error.');
    }
  };

  // Helper to resolve currently active permissions inside the modal popup
  const activeRolePermissions = selectedRoleForPermissions 
    ? roles.find(r => r.id === selectedRoleForPermissions.id) || selectedRoleForPermissions
    : null;

  return (
    <SettingsCard 
      title="Role Access & Permissions" 
      sub="Define staff roles and configure their panel permissions" 
      icon="shield-lock-fill" 
      color="success"
    >
      <style>{`
        .custom-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 36, 33, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          animation: modalFadeIn 0.25s ease;
        }
        .custom-modal-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          width: 92%;
          max-width: 480px;
          box-shadow: 0 20px 45px rgba(0,0,0,0.18);
          overflow: hidden;
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        [data-theme='dark'] .custom-modal-content {
          background: rgba(28, 38, 57, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <span className="text-muted small">Configure dynamic permissions assigned to staff roles</span>
        <button 
          onClick={openAddModal} 
          className="btn btn-sm btn-success rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-circle-fill"></i> Add Role
        </button>
      </div>

      <div className="p-3 rounded-4 border bg-light bg-opacity-25 shadow-sm">
        {roles.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No custom roles defined yet. Click "Add Role" above to configure permissions!
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-borderless align-middle m-0">
              <thead>
                <tr className="border-bottom border-light">
                  <th className="text-muted small fw-bold px-3 py-3" style={{ width: '40%' }}>ROLE</th>
                  <th className="text-muted small fw-bold px-3 py-3" style={{ width: '45%' }}>PERMISSIONS</th>
                  <th className="text-muted small fw-bold px-3 py-3 text-end" style={{ width: '15%' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-bottom border-light-subtle">
                    <td className="px-3 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-dark fs-6">{role.roleName}</span>
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2" style={{ fontSize: '10px' }}>Custom Role</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button 
                        onClick={() => setSelectedRoleForPermissions(role)} 
                        className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold text-nowrap d-flex align-items-center gap-1 shadow-sm"
                        style={{ fontSize: '12px' }}
                      >
                        <i className="bi bi-shield-check"></i> Configure ({(
                          (role.canAccessDashboard ? 1 : 0) +
                          (role.canAccessLibrary ? 1 : 0) +
                          (role.canAccessPayments ? 1 : 0) +
                          (role.canAccessStudents ? 1 : 0) +
                          (role.canAccessAttendance ? 1 : 0) +
                          (role.canAccessBus ? 1 : 0)
                        )} / 6)
                      </button>
                    </td>
                    <td className="px-3 py-3 text-end">
                      <button 
                        onClick={() => handleDeleteRole(role.id)} 
                        className="btn btn-sm btn-outline-danger rounded-circle p-2 shadow-none border-0"
                        title="Delete Role"
                      >
                        <i className="bi bi-trash3-fill"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD ROLE MODAL POPUP --- */}
      {showModal && (
        <div className="custom-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="custom-modal-content p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0"><i className="bi bi-shield-plus text-success me-2"></i>Add Custom Role</h5>
              <button className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
            </div>
            
            <form onSubmit={handleAddRole}>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">Role Name</label>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light py-2 px-3 rounded-3 shadow-none text-dark" 
                  placeholder="Enter role name (e.g. Librarian)" 
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  disabled={loading}
                  required
                  style={{ minHeight: '40px' }}
                />
              </div>

              <h6 className="fw-bold mb-3 small text-muted border-bottom pb-2">Set Initial Access Permissions</h6>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <span className="small fw-semibold">Dashboard Access</span>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input shadow-none cursor-pointer" 
                      type="checkbox" 
                      checked={canAccessDashboard} 
                      onChange={(e) => setCanAccessDashboard(e.target.checked)} 
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <span className="small fw-semibold">Library Panel Access</span>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input shadow-none cursor-pointer" 
                      type="checkbox" 
                      checked={canAccessLibrary} 
                      onChange={(e) => setCanAccessLibrary(e.target.checked)} 
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <span className="small fw-semibold">Payments Panel Access</span>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input shadow-none cursor-pointer" 
                      type="checkbox" 
                      checked={canAccessPayments} 
                      onChange={(e) => setCanAccessPayments(e.target.checked)} 
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <span className="small fw-semibold">Students Panel Access</span>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input shadow-none cursor-pointer" 
                      type="checkbox" 
                      checked={canAccessStudents} 
                      onChange={(e) => setCanAccessStudents(e.target.checked)} 
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <span className="small fw-semibold">Attendance Panel Access</span>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input shadow-none cursor-pointer" 
                      type="checkbox" 
                      checked={canAccessAttendance} 
                      onChange={(e) => setCanAccessAttendance(e.target.checked)} 
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-2">
                  <span className="small fw-semibold">Bus Boarding Panel Access</span>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input shadow-none cursor-pointer" 
                      type="checkbox" 
                      checked={canAccessBus} 
                      onChange={(e) => setCanAccessBus(e.target.checked)} 
                    />
                  </div>
                </div>
              </div>

              {error && <div className="text-danger small mb-3">{error}</div>}

              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-sm btn-light rounded-pill px-4" onClick={() => setShowModal(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-success rounded-pill px-4 fw-bold" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / CONFIGURE PERMISSIONS MODAL POPUP --- */}
      {selectedRoleForPermissions && activeRolePermissions && (
        <div className="custom-modal-overlay" onClick={() => setSelectedRoleForPermissions(null)}>
          <div className="custom-modal-content p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold m-0">
                  <i className="bi bi-shield-lock-fill text-success me-2"></i>Configure Permissions
                </h5>
                <span className="text-muted smaller" style={{ fontSize: '11px' }}>
                  Setting panel visibility rules for **{activeRolePermissions.roleName}**
                </span>
              </div>
              <button className="btn-close shadow-none" onClick={() => setSelectedRoleForPermissions(null)}></button>
            </div>

            <div className="mb-4 mt-3">
              <h6 className="fw-bold mb-3 small text-muted border-bottom pb-2">Accessible Panels & Screens</h6>
              
              <RoleToggleRow 
                title="Dashboard Access" 
                checked={activeRolePermissions.canAccessDashboard} 
                onChange={() => handleToggle(activeRolePermissions.id, 'canAccessDashboard', activeRolePermissions.canAccessDashboard)} 
              />
              <RoleToggleRow 
                title="Library Panel Access" 
                checked={activeRolePermissions.canAccessLibrary} 
                onChange={() => handleToggle(activeRolePermissions.id, 'canAccessLibrary', activeRolePermissions.canAccessLibrary)} 
              />
              <RoleToggleRow 
                title="Payments Panel Access" 
                checked={activeRolePermissions.canAccessPayments} 
                onChange={() => handleToggle(activeRolePermissions.id, 'canAccessPayments', activeRolePermissions.canAccessPayments)} 
              />
              <RoleToggleRow 
                title="Students Panel Access" 
                checked={activeRolePermissions.canAccessStudents} 
                onChange={() => handleToggle(activeRolePermissions.id, 'canAccessStudents', activeRolePermissions.canAccessStudents)} 
              />
              <RoleToggleRow 
                title="Attendance Panel Access" 
                checked={activeRolePermissions.canAccessAttendance} 
                onChange={() => handleToggle(activeRolePermissions.id, 'canAccessAttendance', activeRolePermissions.canAccessAttendance)} 
              />
              <RoleToggleRow 
                title="Bus Boarding Panel Access" 
                checked={activeRolePermissions.canAccessBus} 
                onChange={() => handleToggle(activeRolePermissions.id, 'canAccessBus', activeRolePermissions.canAccessBus)} 
              />
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button 
                type="button" 
                className="btn btn-sm btn-success rounded-pill px-4 fw-bold shadow-sm" 
                onClick={() => setSelectedRoleForPermissions(null)}
              >
                Close & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsCard>
  );
};

const RoleToggleRow = ({ title, checked, onChange }) => (
  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light-subtle">
    <span className="small text-muted" style={{ fontSize: '13px' }}>{title}</span>
    <div className="form-check form-switch">
      <input 
        className="form-check-input shadow-none cursor-pointer" 
        type="checkbox" 
        role="switch" 
        checked={checked}
        onChange={onChange}
        style={{ width: '2.0em', height: '1.0em' }}
      />
    </div>
  </div>
);

export default Settings;