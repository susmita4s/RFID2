import React, { useState, useEffect } from 'react';

const StaffManagement = ({ theme }) => {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    staffRole: '',
    isActive: true
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

  const fetchStaffAndRoles = async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        fetch('http://localhost:5000/api/staff', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/roles', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const staffData = await staffRes.json();
      const rolesData = await rolesRes.json();

      if (staffData.success) setStaffList(staffData.staff);
      if (rolesData.success) setRoles(rolesData.roles);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndRoles();
  }, []);

  const handleOpenAdd = () => {
    setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', staffRole: '', isActive: true });
    setIsEditing(false);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (staff) => {
    setForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone || '',
      password: '', // Leave blank for edit
      staffRole: staff.staffRole || '',
      isActive: staff.isActive
    });
    setCurrentStaffId(staff.id);
    setIsEditing(true);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const url = isEditing 
        ? `http://localhost:5000/api/staff/${currentStaffId}`
        : 'http://localhost:5000/api/staff';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(`Staff member ${isEditing ? 'updated' : 'created'} successfully.`);
        fetchStaffAndRoles();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setError(data.message || data.error || `Failed: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      setError('Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Staff Management</h4>
        <button className="btn btn-success fw-bold px-4 rounded-pill shadow-sm" onClick={handleOpenAdd}>
          <i className="bi bi-person-plus-fill me-2"></i>Add Staff
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3 text-muted small fw-bold">Name</th>
                  <th className="py-3 text-muted small fw-bold">Email</th>
                  <th className="py-3 text-muted small fw-bold">Role</th>
                  <th className="py-3 text-muted small fw-bold">Status</th>
                  <th className="px-4 py-3 text-muted small fw-bold text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No staff members found.</td></tr>
                ) : (
                  staffList.map(staff => (
                    <tr key={staff.id}>
                      <td className="px-4 py-3 fw-semibold">{staff.firstName} {staff.lastName}</td>
                      <td className="py-3">{staff.email}</td>
                      <td className="py-3"><span className="badge bg-info text-dark rounded-pill px-3">{staff.staffRole || 'None'}</span></td>
                      <td className="py-3">
                        {staff.isActive 
                          ? <span className="badge bg-success bg-opacity-10 text-success px-3 rounded-pill">Active</span>
                          : <span className="badge bg-danger bg-opacity-10 text-danger px-3 rounded-pill">Disabled</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button className="btn btn-sm btn-light rounded-circle shadow-sm" onClick={() => handleOpenEdit(staff)}>
                          <i className="bi bi-pencil-fill text-primary"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 px-4 py-3">
                <h5 className="fw-bold mb-0 text-dark">
                  {isEditing ? 'Edit Staff Member' : 'Add New Staff'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              
              <div className="modal-body px-4 py-4">
                {error && <div className="alert alert-danger py-2 small">{error}</div>}
                {success && <div className="alert alert-success py-2 small">{success}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">First Name *</label>
                      <input type="text" className="form-control bg-light border-0" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Last Name *</label>
                      <input type="text" className="form-control bg-light border-0" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label small fw-bold">Email Address *</label>
                      <input type="email" className="form-control bg-light border-0" required disabled={isEditing} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                      {isEditing && <small className="text-muted" style={{fontSize: '11px'}}>Email cannot be changed.</small>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Phone Number</label>
                      <input type="tel" className="form-control bg-light border-0" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>

                    {!isEditing && (
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Password *</label>
                        <input type="password" className="form-control bg-light border-0" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                      </div>
                    )}

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Assign Role *</label>
                      <select className="form-select bg-light border-0" required value={form.staffRole} onChange={e => setForm({...form, staffRole: e.target.value})}>
                        <option value="">Select Role</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.roleName}>{r.roleName}</option>
                        ))}
                      </select>
                    </div>

                    {isEditing && (
                      <div className="col-md-6 d-flex align-items-center mt-4">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                          <label className="form-check-label fw-semibold ms-2">Account Active</label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Staff'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
