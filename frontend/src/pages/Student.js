import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
const Students = () => {
  // --- State Management ---
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  
  // UI State
  const [activeMenu, setActiveMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const [newStudent, setNewStudent] = useState({
    fullName: '', gender: '', rfidTag: '', className: '', email: '', phoneNumber: '', guardianName: '', joinedDate: '', profileImage: null
  });
  const [isOtherGender, setIsOtherGender] = useState(false);

  const [classes, setClasses] = useState(['All']);
  
  // CSV Import State
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  // --- API Calls ---
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (filterClass !== 'All') queryParams.append('class', filterClass);
      if (filterDate) queryParams.append('joinedDate', filterDate);

      const response = await fetch(`http://localhost:5000/api/students?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setStudents(data);
        // Extract unique classes if not filtering by class
        if (filterClass === 'All') {
          const uniqueClasses = ['All', ...new Set(data.map(s => s.className))].sort();
          setClasses(uniqueClasses);
        }
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterClass, filterDate]);

  // Ensure students are fetched directly from backend on page load
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchStudents]);


  const generateRFID = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/students/assign-rfid', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setNewStudent(prev => ({ ...prev, rfidTag: data.rfid }));
      } else {
        alert(data.message || data.error || 'Failed to generate RFID');
      }
    } catch (error) {
      console.error('Error generating RFID:', error);
      alert('Network error while generating RFID');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      Object.keys(newStudent).forEach(key => {
        if (newStudent[key] !== null) {
          formData.append(key, newStudent[key]);
        }
      });

      const response = await fetch('http://localhost:5000/api/students/create', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setNewStudent({ fullName: '', gender: '', rfidTag: '', className: '', email: '', phoneNumber: '', guardianName: '', joinedDate: '', profileImage: null });
        setIsOtherGender(false);
        fetchStudents();
      } else {
        alert(data.message || 'Error registering student');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error occurred.');
    }
  };

  const toggleCardStatus = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = confirmToggle.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`http://localhost:5000/api/students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchStudents();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setConfirmToggle(null);
      setActiveMenu(null);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setConfirmDelete(null);
        setSelectedProfile(null);
        fetchStudents();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,fullName,gender,class,emailAddress,phoneNumber,guardianName,joinedDate,rfidTag,profileImage\n" +
                       "Arjun Sharma,Male,10-A,arjun@edu.com,9876543210,Raj Sharma,2026-05-19,RFID-1001,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      setImportSummary(null);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => {
          let t = h.trim().replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (t.includes('fullname') || (t.includes('name') && !t.includes('guardian') && !t.includes('parent'))) return 'fullName';
          if (t.includes('class') || t.includes('grade')) return 'class';
          if (t.includes('email')) return 'emailAddress';
          if (t.includes('phone') || t.includes('mobile')) return 'phoneNumber';
          if (t.includes('guardian') || t.includes('parent')) return 'guardianName';
          if (t.includes('rfid') || t.includes('tag')) return 'rfidTag';
          if (t.includes('gender')) return 'gender';
          if (t.includes('join') || t.includes('date')) return 'joinedDate';
          if (t.includes('image') || t.includes('profile') || t.includes('photo')) return 'profileImage';
          return h.trim();
        },
        transform: (val) => val.trim(),
        complete: (results) => {
          const rows = results.data;
          // Check if it failed to parse columns correctly
          if (results.meta.fields && results.meta.fields.length === 1 && results.meta.fields[0].includes(',')) {
              alert("Error parsing CSV. Please ensure it is comma-separated.");
              return;
          }
          const preview = rows.map(row => {
            const isValid = !!(row.fullName && row.class && row.emailAddress && row.phoneNumber);
            return {
              ...row,
              isValid,
              error: isValid ? null : 'Missing required fields'
            };
          });
          // Check for duplicate RFIDs in the file
          const rfidCounts = {};
          preview.forEach(r => {
            if (r.rfidTag) rfidCounts[r.rfidTag] = (rfidCounts[r.rfidTag] || 0) + 1;
          });
          preview.forEach(r => {
            if (r.rfidTag && rfidCounts[r.rfidTag] > 1) {
              r.isValid = false;
              r.error = 'Duplicate RFID in file';
            }
          });
          setCsvPreview(preview);
        }
      });
    }
  };

  const handleImportStudents = async () => {
    if (!csvPreview) return;
    const validStudents = csvPreview.filter(r => r.isValid).map(r => ({
      fullName: r.fullName,
      gender: r.gender,
      className: r.class,
      email: r.emailAddress,
      phoneNumber: r.phoneNumber,
      guardianName: r.guardianName,
      joinedDate: r.joinedDate,
      rfidTag: r.rfidTag,
      profileImage: r.profileImage
    }));

    if (validStudents.length === 0) {
      alert("No valid rows to import.");
      return;
    }

    setIsImporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/students/import', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ students: validStudents })
      });
      const data = await response.json();
      if (data.success) {
        setImportSummary(data);
        fetchStudents();
      } else {
        alert(data.message || 'Import failed.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Network error during import.');
    } finally {
      setIsImporting(false);
    }
  };

  const fetchStudentActivities = async (student) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/students/${student.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedActivity({
          name: student.fullName,
          activities: data.activities || []
        });
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="students-container animate-fade-in position-relative">
      
      {/* --- Add Student Modal --- */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-4 shadow-lg p-4 animate-fade-in" style={{ width: '100%', maxWidth: '650px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0 text-dark">Register New Student</h4>
              <button className="btn-close" onClick={() => setShowAddModal(false)}></button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Full Name</label>
                  <input type="text" className="form-control" required placeholder="Arjun Sharma" value={newStudent.fullName} onChange={e => setNewStudent({...newStudent, fullName: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Gender</label>
                  <select 
                    className="form-select" 
                    value={isOtherGender ? 'Other' : newStudent.gender} 
                    onChange={e => {
                      if (e.target.value === 'Other') {
                        setIsOtherGender(true);
                        setNewStudent({...newStudent, gender: ''});
                      } else {
                        setIsOtherGender(false);
                        setNewStudent({...newStudent, gender: e.target.value});
                      }
                    }}
                    required
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {isOtherGender && (
                    <input 
                      type="text" 
                      className="form-control mt-2 animate-fade-in" 
                      placeholder="Specify Gender" 
                      value={newStudent.gender} 
                      onChange={e => setNewStudent({...newStudent, gender: e.target.value})} 
                      required 
                    />
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Class</label>
                  <input type="text" className="form-control" required placeholder="10-A" value={newStudent.className} onChange={e => setNewStudent({...newStudent, className: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Email Address</label>
                  <input type="email" className="form-control" required placeholder="arjun@edu.com" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Phone Number</label>
                  <input type="tel" className="form-control" required placeholder="+91 98765 43210" value={newStudent.phoneNumber} onChange={e => setNewStudent({...newStudent, phoneNumber: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Guardian Name</label>
                  <input type="text" className="form-control" required placeholder="Parent/Guardian Full Name" value={newStudent.guardianName} onChange={e => setNewStudent({...newStudent, guardianName: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Joined Date</label>
                  <input type="date" className="form-control" required value={newStudent.joinedDate} onChange={e => setNewStudent({...newStudent, joinedDate: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold">Profile Image</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*"
                    onChange={e => setNewStudent({...newStudent, profileImage: e.target.files[0]})} 
                  />
                  {newStudent.profileImage && (
                    <div className="mt-2">
                      <img 
                        src={URL.createObjectURL(newStudent.profileImage)} 
                        alt="Preview" 
                        className="rounded border" 
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                      />
                    </div>
                  )}
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold">RFID Assignment</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><i className="bi bi-broadcast"></i></span>
                    <input type="text" className="form-control fw-bold text-primary" value={newStudent.rfidTag} readOnly placeholder="Generate ID" />
                    <button className="btn btn-outline-primary" type="button" onClick={generateRFID}>Assign Tag</button>
                  </div>
                </div>
                <div className="col-12 mt-4 text-center">
                  <button type="submit" className="btn btn-dark px-5 py-2 fw-bold rounded-pill shadow">Complete Registration</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Activity Timeline Modal --- */}
      {selectedActivity && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden animate-fade-in" style={{ width: '95%', maxWidth: '500px' }}>
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light">
              <div>
                <h5 className="fw-bold m-0">{selectedActivity.name}</h5>
                <small className="text-muted">Recent Activity Logs</small>
              </div>
              <button className="btn-close" onClick={() => setSelectedActivity(null)}></button>
            </div>
            <div className="p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="timeline-container ps-2 border-start ms-2">
                {selectedActivity.activities && selectedActivity.activities.length > 0 ? selectedActivity.activities.map((act, idx) => (
                  <div key={idx} className="mb-4 position-relative ps-4">
                    <div className={`position-absolute start-0 top-0 translate-middle-x bg-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm`} 
                         style={{ width: '32px', height: '32px', marginLeft: '-1px' }}>
                      <i className={`bi bi-info-circle text-white small`}></i>
                    </div>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold small">{act.action}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{act.description}</div>
                      </div>
                      <div className="text-end text-muted" style={{ fontSize: '0.7rem' }}>
                        <div>{formatDateTime(act.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-muted text-center py-3">No recent activities found.</p>}
              </div>
            </div>
            <div className="p-3 bg-light text-center">
               <button className="btn btn-dark w-100 rounded-3" onClick={() => setSelectedActivity(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Student Profile Info Modal --- */}
      {selectedProfile && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden animate-fade-in profile-modal-content" style={{ width: '95%', maxWidth: '550px' }}>
            <div className="text-center p-4 text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className={`badge ${selectedProfile.status === 'active' ? 'bg-success' : 'bg-danger'}`}>{selectedProfile.status.toUpperCase()}</span>
                <button className="btn-close btn-close-white" onClick={() => setSelectedProfile(null)}></button>
              </div>
              <img src={selectedProfile.profileImage || `https://ui-avatars.com/api/?name=${selectedProfile.fullName}&background=random`} className="rounded-circle border border-3 mb-2 shadow" style={{ width: 100, height: 100, objectFit: 'cover' }} alt="" />
              <h4 className="m-0 fw-bold">{selectedProfile.fullName}</h4>
              <div className="badge bg-light text-dark mt-1 px-3">{selectedProfile.studentId}</div>
            </div>
            
            <div className="p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-person-badge text-primary"></i> Personal Details
                </h6>
                <div className="row g-4 bg-light rounded-3 p-3 mx-0 border mb-4">
                  <div className="col-6">
                    <small className="text-muted d-block small-text">RFID TAG</small>
                    <span className="fw-bold text-primary">{selectedProfile.rfidTag || 'N/A'}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">CLASS</small>
                    <span className="fw-bold">{selectedProfile.className}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">EMAIL</small>
                    <span className="small text-truncate d-block">{selectedProfile.email}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">PHONE</small>
                    <span className="small">{selectedProfile.phoneNumber}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">GUARDIAN</small>
                    <span className="small">{selectedProfile.guardianName}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">GENDER</small>
                    <span className="small">{selectedProfile.gender}</span>
                  </div>
                </div>
                
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-dark py-2 rounded-3 fw-bold no-print" onClick={() => window.print()}>Print Profile Summary</button>
                  <button className="btn btn-danger py-2 rounded-3 fw-bold no-print" onClick={() => setConfirmDelete(selectedProfile)}>Delete Student</button>
                  <button className="btn btn-dark py-2 rounded-3 fw-bold no-print" onClick={() => setSelectedProfile(null)}>Close</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Confirmation for Delete --- */}
      {confirmDelete && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg text-center border" style={{ maxWidth: '320px' }}>
            <div className="display-6 mb-3 text-danger">
                <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h6 className="fw-bold mb-3">Delete Student</h6>
            <p className="small text-muted mb-4">Are you sure you want to delete <strong>{confirmDelete.fullName}</strong>? This action cannot be undone.</p>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-danger flex-grow-1" onClick={() => handleDeleteStudent(confirmDelete.id)}>Delete</button>
              <button className="btn btn-sm btn-light flex-grow-1 border" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Confirmation for Status Toggle --- */}
      {confirmToggle && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg text-center border" style={{ maxWidth: '320px' }}>
            <div className={`display-6 mb-3 ${confirmToggle.status === 'active' ? 'text-danger' : 'text-success'}`}>
                <i className={`bi bi-${confirmToggle.status === 'active' ? 'shield-slash' : 'shield-check'}`}></i>
            </div>
            <h6 className="fw-bold mb-3">RFID Card Control</h6>
            <p className="small text-muted mb-4">You are about to <strong>{confirmToggle.status === 'active' ? 'Deactivate' : 'Activate'}</strong> {confirmToggle.fullName}'s card.</p>
            <div className="d-flex gap-2">
              <button className={`btn btn-sm ${confirmToggle.status === 'active' ? 'btn-danger' : 'btn-success'} flex-grow-1`} onClick={() => toggleCardStatus(confirmToggle.id)}>Confirm</button>
              <button className="btn btn-sm btn-light flex-grow-1 border" onClick={() => setConfirmToggle(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Header, Search & Main Table --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Student Directory</h2>
          <p className="text-muted small">Real-time RFID access management</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-dark px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => setShowImportDrawer(true)}>
            <i className="bi bi-file-earmark-spreadsheet"></i> Import CSV
          </button>
          <button className="btn btn-dark px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => {
            setNewStudent({ fullName: '', gender: '', rfidTag: '', className: '', email: '', phoneNumber: '', guardianName: '', joinedDate: '' });
            setIsOtherGender(false);
            setShowAddModal(true);
          }}>
            <i className="bi bi-person-plus-fill"></i> Add Student
          </button>
        </div>
      </div>

      <div className="section-card mb-4 py-3 border-0 shadow-sm bg-white rounded-4">
        <div className="row g-3 px-3 align-items-center">
          <div className="col-lg-4">
            <div className="search-wrapper w-100 position-relative">
              <i className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
              <input type="text" className="form-control search-input ps-5" placeholder="Search name or RFID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="col-lg-8 d-flex gap-2 justify-content-lg-end">
            <input type="date" className="form-control border-0 bg-light rounded-3" style={{width: '160px'}} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            <select className="form-select border-0 bg-light rounded-3" style={{width: '130px'}} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="section-card p-0 overflow-hidden shadow-sm border-0 bg-white rounded-4">
        <div className="table-responsive">
          <table className="table table-hover m-0 align-middle">
            <thead>
              <tr className="small text-uppercase text-muted">
                <th className="ps-4 py-3">Student Name</th>
                <th>RFID Tag</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th className="pe-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">No students found.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="ps-4 py-3" data-label="Student">
                      <div className="d-flex align-items-center gap-3">
                        <img src={student.profileImage || `https://ui-avatars.com/api/?name=${student.fullName}&background=random`} className="rounded-circle border" style={{width: 38, height: 38, objectFit: 'cover'}} alt="" />
                        <div>
                          <div className="fw-bold small">{student.fullName}</div>
                          <div className="text-muted" style={{fontSize: '9px'}}>{student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="RFID Tag">
                      {student.rfidTag ? 
                        <code className="bg-primary-subtle text-primary px-2 py-1 rounded small fw-bold">{student.rfidTag}</code> : 
                        <span className="text-muted small">Not Assigned</span>
                      }
                    </td>
                    <td className="small text-muted" data-label="Joined Date">{formatDate(student.joinedDate)}</td>
                    <td data-label="Status">
                      <span className={`badge rounded-pill ${student.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        ● {student.status}
                      </span>
                    </td>
                    <td className="pe-4 text-end position-relative">
                      <button className="btn btn-light btn-sm rounded-circle border shadow-sm" onClick={() => setActiveMenu(activeMenu === student.id ? null : student.id)}>
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      {activeMenu === student.id && (
                        <div className="position-absolute bg-white shadow-lg border rounded-3 py-2 text-start animate-fade-in" 
                             style={{ right: '40px', top: '10px', zIndex: 100, minWidth: '190px' }}>
                          <div className="px-3 py-2 dropdown-item cursor-pointer small d-flex align-items-center gap-2" onClick={() => { setSelectedProfile(student); setActiveMenu(null); }}>
                            <i className="bi bi-info-circle text-primary"></i> View Info
                          </div>
                          <div className="px-3 py-2 dropdown-item cursor-pointer small d-flex align-items-center gap-2" onClick={() => { fetchStudentActivities(student); setActiveMenu(null); }}>
                            <i className="bi bi-clock-history text-warning"></i> Recent Activity
                          </div>
                          <div className={`px-3 py-2 dropdown-item cursor-pointer small d-flex align-items-center gap-2 ${student.status === 'active' ? 'text-danger fw-bold' : 'text-success fw-bold'}`} 
                               onClick={() => setConfirmToggle(student)}>
                            <i className={`bi bi-${student.status === 'active' ? 'shield-slash' : 'shield-check'}`}></i>
                            {student.status === 'active' ? 'Disable Access' : 'Enable Access'}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CSV Import Drawer --- */}
      {showImportDrawer && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100 modal-backdrop show" style={{ zIndex: 1040, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowImportDrawer(false)}></div>
          <div className="position-fixed top-0 end-0 h-100 bg-white shadow-lg animate-slide-in-right" style={{ width: '100%', maxWidth: '600px', zIndex: 1050, overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
              <h5 className="fw-bold m-0"><i className="bi bi-file-earmark-spreadsheet me-2"></i> Import Students from CSV</h5>
              <button className="btn-close btn-close-white" onClick={() => setShowImportDrawer(false)}></button>
            </div>
            
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <p className="text-muted small m-0">Upload a CSV file to bulk import student records.</p>
                <button className="btn btn-sm btn-outline-dark fw-bold" onClick={handleDownloadSampleCsv}>
                  <i className="bi bi-download"></i> Download Sample CSV
                </button>
              </div>

              {!importSummary ? (
                <>
                  <div className="border border-2 border-dashed rounded-4 p-5 text-center bg-light mb-4 position-relative">
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                      onChange={handleCsvFileChange} 
                    />
                    <div className="display-4 text-muted mb-3"><i className="bi bi-cloud-arrow-up"></i></div>
                    <h6 className="fw-bold text-dark">Drag & Drop CSV here</h6>
                    <p className="text-muted small">or click to browse from your computer</p>
                    {csvFile && <div className="mt-3 badge bg-dark px-3 py-2">{csvFile.name}</div>}
                  </div>

                  {csvPreview && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3 d-flex justify-content-between">
                        CSV Preview
                        <span className="badge bg-primary rounded-pill">{csvPreview.length} Rows</span>
                      </h6>
                      <div className="table-responsive rounded-3 border" style={{ maxHeight: '300px' }}>
                        <table className="table table-sm table-hover m-0" style={{ fontSize: '0.8rem' }}>
                          <thead className="table-light position-sticky top-0">
                            <tr>
                              <th>Status</th>
                              <th>Name</th>
                              <th>Class</th>
                              <th>Email</th>
                              <th>RFID</th>
                              <th>Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.slice(0, 50).map((row, idx) => (
                              <tr key={idx} className={!row.isValid ? 'table-danger' : ''}>
                                <td>
                                  {row.isValid ? <i className="bi bi-check-circle-fill text-success"></i> : <i className="bi bi-exclamation-circle-fill text-danger"></i>}
                                </td>
                                <td>{row.fullName}</td>
                                <td>{row.class}</td>
                                <td>{row.emailAddress}</td>
                                <td>{row.rfidTag || '-'}</td>
                                <td className="text-danger">{row.error}</td>
                              </tr>
                            ))}
                            {csvPreview.length > 50 && (
                              <tr><td colSpan="6" className="text-center text-muted py-2">...and {csvPreview.length - 50} more rows</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="d-flex gap-2 mt-4">
                        <button 
                          className="btn btn-dark flex-grow-1 py-2 fw-bold" 
                          onClick={handleImportStudents}
                          disabled={isImporting || !csvPreview.some(r => r.isValid)}
                        >
                          {isImporting ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Importing...</>
                          ) : (
                            <><i className="bi bi-check2-all"></i> Import {csvPreview.filter(r => r.isValid).length} Valid Students</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center animate-fade-in py-5">
                  <div className="display-1 text-success mb-3"><i className="bi bi-check-circle-fill"></i></div>
                  <h4 className="fw-bold text-dark">Import Completed</h4>
                  
                  <div className="row g-3 mt-4 text-start">
                    <div className="col-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <small className="text-muted d-block small-text">TOTAL ROWS</small>
                        <h4 className="m-0 fw-bold">{importSummary.total}</h4>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-success-subtle rounded-3 border border-success">
                        <small className="text-success d-block small-text">SUCCESSFUL</small>
                        <h4 className="m-0 fw-bold text-success">{importSummary.successCount}</h4>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-danger-subtle rounded-3 border border-danger">
                        <small className="text-danger d-block small-text">FAILED</small>
                        <h4 className="m-0 fw-bold text-danger">{importSummary.failedCount}</h4>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-warning-subtle rounded-3 border border-warning" style={{ color: '#b45309' }}>
                        <small className="d-block small-text" style={{ color: '#b45309' }}>DUPLICATES</small>
                        <h4 className="m-0 fw-bold">{importSummary.duplicateCount}</h4>
                      </div>
                    </div>
                  </div>

                  {importSummary.failedRows && importSummary.failedRows.length > 0 && (
                    <div className="mt-4 text-start">
                      <h6 className="fw-bold text-danger mb-2">Failed Rows Details</h6>
                      <div className="bg-light border rounded-3 p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        <ul className="m-0 ps-3 small text-muted">
                          {importSummary.failedRows.map((err, idx) => (
                            <li key={idx}>Row {err.row} ({err.name}): {err.error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <button className="btn btn-dark w-100 mt-4 py-2 fw-bold" onClick={() => {
                    setShowImportDrawer(false);
                    setCsvFile(null);
                    setCsvPreview(null);
                    setImportSummary(null);
                  }}>Done</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .students-container { padding: 0.5rem 0; transition: all 0.3s ease; }
        .btn-dark { background-color: #0f172a !important; border: none; transition: all 0.3s ease; }
        .btn-dark:hover { background-color: #1e293b !important; transform: translateY(-1px); }
        .text-primary { color: var(--accent-cyan) !important; }
        .bg-primary-subtle { background-color: rgba(0, 217, 204, 0.1) !important; color: var(--accent-cyan) !important; }
        
        .table thead th { background-color: var(--border-color); color: var(--text-muted); font-weight: 600; border: none; }
        .table { color: var(--text-main); }
        .table-hover tbody tr:hover { background-color: rgba(0,0,0,0.02); }
        [data-theme='dark'] .table-hover tbody tr:hover { background-color: rgba(255,255,255,0.02); }
        
        .section-card { background: var(--card-bg) !important; border: 1px solid var(--border-color) !important; }
        .bg-success-subtle { background-color: rgba(16, 185, 129, 0.1) !important; color: #10b981 !important; }
        .bg-danger-subtle { background-color: rgba(239, 68, 68, 0.1) !important; color: #ef4444 !important; }
        .bg-warning-subtle { background-color: rgba(245, 158, 11, 0.1) !important; }
        
        .search-input { background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-main); }
        .form-control, .form-select { background-color: var(--input-bg); border-color: var(--input-border); color: var(--text-main); }
        .form-control:focus, .form-select:focus { background-color: var(--input-bg); color: var(--text-main); border-color: var(--accent-cyan); box-shadow: 0 0 0 0.25rem rgba(0, 217, 204, 0.1); }
        
        .modal-content-custom { background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); }
        .dropdown-menu-custom { background: var(--card-bg); border: 1px solid var(--border-color); box-shadow: var(--card-shadow); }
        .small-text { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 2px; }
        .bg-emerald { background-color: #10b981 !important; }
        
        .animate-slide-in-right { animation: slideInRight 0.3s ease forwards; }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .border-dashed { border-style: dashed !important; }
        .cursor-pointer { cursor: pointer; }
        
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          .no-print, .btn-close, .modal-backdrop, [style*="background: rgba(0,0,0,0.6)"] { display: none !important; }
          body * { visibility: hidden; }
          .profile-modal-content, .profile-modal-content * { visibility: visible; }
          .profile-modal-content { 
            visibility: visible;
            position: absolute; 
            left: 50%; 
            top: 20px; 
            transform: translateX(-50%);
            width: 90%; 
            max-width: 800px;
            border: 1px solid #eee !important; 
            box-shadow: none !important;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
};

export default Students;