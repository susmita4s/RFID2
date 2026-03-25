

import React, { useState } from 'react';

const Students = () => {
  // --- State Management ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  
  const [studentData, setStudentData] = useState([
    { id: "STU-2024-001", name: "Arjun Sharma", gender: "Male", rfid: "RFID-A1B2", class: "10-A", email: "arjun@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/male/1.jpg", joinedDate: "2024-03-20", phone: "+91 98765 43210", guardian: "Rajesh Sharma" },
    { id: "STU-2024-042", name: "Priya Patel", gender: "Female", rfid: "RFID-E5F6", class: "10-B", email: "priya@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/female/2.jpg", joinedDate: "2024-03-22", phone: "+91 98765 43211", guardian: "Suresh Patel" },
    { id: "STU-2024-089", name: "Rahul Kumar", gender: "Male", rfid: "RFID-R9T0", class: "9-A", email: "rahul@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/male/5.jpg", joinedDate: "2024-03-25", phone: "+91 98765 43212", guardian: "Vijay Kumar" },
    { id: "STU-2024-102", name: "Ananya Iyer", gender: "Female", rfid: "RFID-B7D2", class: "11-A", email: "ananya@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/female/8.jpg", joinedDate: "2024-01-15", phone: "+91 98765 43215", guardian: "Laxmi Iyer" },
    { id: "STU-2024-215", name: "Vikram Singh", gender: "Male", rfid: "RFID-C4G9", class: "12-B", email: "vikram@edu.com", status: "inactive", img: "https://xsgames.co/randomusers/assets/avatars/male/12.jpg", joinedDate: "2023-11-05", phone: "+91 98765 43218", guardian: "Karan Singh" },
    { id: "STU-2024-334", name: "Sanya Mirza", gender: "Female", rfid: "RFID-K1L0", class: "10-A", email: "sanya@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/female/15.jpg", joinedDate: "2024-02-10", phone: "+91 98765 43220", guardian: "Imran Mirza" },
    { id: "STU-2024-411", name: "Rohan Das", gender: "Male", rfid: "RFID-Q8W3", class: "9-B", email: "rohan@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/male/18.jpg", joinedDate: "2024-03-01", phone: "+91 98765 43222", guardian: "Alok Das" },
    { id: "STU-2024-505", name: "Meera Reddy", gender: "Female", rfid: "RFID-P2M5", class: "11-B", email: "meera@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/female/22.jpg", joinedDate: "2024-01-20", phone: "+91 98765 43225", guardian: "Venkat Reddy" },
    { id: "STU-2024-612", name: "Kabir Khan", gender: "Male", rfid: "RFID-X9V4", class: "12-A", email: "kabir@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/male/25.jpg", joinedDate: "2023-12-12", phone: "+91 98765 43228", guardian: "Zubair Khan" },
    { id: "STU-2024-703", name: "Ishita Paul", gender: "Female", rfid: "RFID-Z3Y7", class: "9-A", email: "ishita@edu.com", status: "inactive", img: "https://xsgames.co/randomusers/assets/avatars/female/30.jpg", joinedDate: "2024-03-10", phone: "+91 98765 43230", guardian: "Joy Paul" },
    { id: "STU-2024-818", name: "Zoya Akhtar", gender: "Female", rfid: "RFID-H6N2", class: "10-B", email: "zoya@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/female/35.jpg", joinedDate: "2024-02-28", phone: "+91 98765 43233", guardian: "Javed Akhtar" },
    { id: "STU-2024-925", name: "Aditya Verma", gender: "Male", rfid: "RFID-J5S1", class: "11-A", email: "aditya@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/male/38.jpg", joinedDate: "2024-01-05", phone: "+91 98765 43235", guardian: "Nitin Verma" },
  ]);

  const [newStudent, setNewStudent] = useState({
    name: '', gender: 'Male', rfid: '', class: '', email: '', status: 'active', phone: '', guardian: ''
  });

  const mockActivities = [
    { type: 'Attendance', detail: 'Entry at Main Gate', time: '08:15 AM', date: 'Today', icon: 'door-open', color: 'success' },
    { type: 'Bus', detail: 'Boarded Route 42B', time: '07:30 AM', date: 'Today', icon: 'bus-front', color: 'warning' },
    { type: 'Library', detail: 'Borrowed "Advanced Physics"', time: '11:20 AM', date: 'Yesterday', icon: 'book', color: 'info' },
    { type: 'Payment', detail: 'Monthly Fee Received', time: '02:00 PM', date: '2 days ago', icon: 'credit-card', color: 'primary' },
  ];

  // --- Logic ---
  const classes = ['All', ...new Set(studentData.map(s => s.class))].sort();

  const generateRFID = () => {
    const randomHex = Math.random().toString(16).toUpperCase().substring(2, 6);
    setNewStudent({ ...newStudent, rfid: `RFID-${randomHex}` });
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    const id = `STU-2024-${Math.floor(100 + Math.random() * 900)}`;
    const img = `https://xsgames.co/randomusers/assets/avatars/${newStudent.gender.toLowerCase()}/${Math.floor(Math.random() * 50)}.jpg`;
    const joinedDate = new Date().toISOString().split('T')[0];
    
    setStudentData([ { ...newStudent, id, img, joinedDate }, ...studentData]);
    setShowAddModal(false);
    setNewStudent({ name: '', gender: 'Male', rfid: '', class: '', email: '', status: 'active', phone: '', guardian: '' });
  };

  const toggleCardStatus = (studentId) => {
    setStudentData(studentData.map(s => 
      s.id === studentId ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
    ));
    setConfirmToggle(null);
    setActiveMenu(null);
  };

  const filteredStudents = studentData
    .filter(student => {
      const matchesSearch = student.rfid.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = filterGender === 'All' || student.gender === filterGender;
      const matchesClass = filterClass === 'All' || student.class === filterClass;
      const matchesDate = !filterDate || student.joinedDate === filterDate;
      return matchesSearch && matchesGender && matchesClass && matchesDate;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="students-container animate-fade-in position-relative">
      
      {/* --- Add Student Modal (Restored) --- */}
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
                  <input type="text" className="form-control" required placeholder="Arjun Sharma" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Gender</label>
                  <select className="form-select" value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Class</label>
                  <input type="text" className="form-control" required placeholder="10-A" value={newStudent.class} onChange={e => setNewStudent({...newStudent, class: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Email Address</label>
                  <input type="email" className="form-control" placeholder="arjun@edu.com" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Phone Number</label>
                  <input type="tel" className="form-control" placeholder="+91 98765 43210" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold">Guardian Name</label>
                  <input type="text" className="form-control" placeholder="Parent/Guardian Full Name" value={newStudent.guardian} onChange={e => setNewStudent({...newStudent, guardian: e.target.value})} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold">RFID Assignment</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><i className="bi bi-broadcast"></i></span>
                    <input type="text" className="form-control fw-bold text-primary" value={newStudent.rfid} readOnly placeholder="Generate ID" />
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
                {mockActivities.map((act, idx) => (
                  <div key={idx} className="mb-4 position-relative ps-4">
                    <div className={`position-absolute start-0 top-0 translate-middle-x bg-${act.color} rounded-circle d-flex align-items-center justify-content-center shadow-sm`} 
                         style={{ width: '32px', height: '32px', marginLeft: '-1px' }}>
                      <i className={`bi bi-${act.icon} text-white small`}></i>
                    </div>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold small">{act.type}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{act.detail}</div>
                      </div>
                      <div className="text-end text-muted" style={{ fontSize: '0.7rem' }}>
                        <div>{act.time}</div>
                        <div>{act.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
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
          <div className="bg-white rounded-4 shadow-lg overflow-hidden animate-fade-in" style={{ width: '95%', maxWidth: '550px' }}>
            <div className="text-center p-4 text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className={`badge ${selectedProfile.status === 'active' ? 'bg-success' : 'bg-danger'}`}>{selectedProfile.status.toUpperCase()}</span>
                <button className="btn-close btn-close-white" onClick={() => setSelectedProfile(null)}></button>
              </div>
              <img src={selectedProfile.img} className="rounded-circle border border-3 mb-2 shadow" style={{ width: 100, height: 100, objectFit: 'cover' }} alt="" />
              <h4 className="m-0 fw-bold">{selectedProfile.name}</h4>
              <div className="badge bg-light text-dark mt-1 px-3">{selectedProfile.id}</div>
            </div>
            
            <div className="p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-person-badge text-primary"></i> Personal Details
                </h6>
                <div className="row g-4 bg-light rounded-3 p-3 mx-0 border mb-4">
                  <div className="col-6">
                    <small className="text-muted d-block small-text">RFID TAG</small>
                    <span className="fw-bold text-primary">{selectedProfile.rfid}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">CLASS</small>
                    <span className="fw-bold">{selectedProfile.class}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">EMAIL</small>
                    <span className="small text-truncate d-block">{selectedProfile.email}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">PHONE</small>
                    <span className="small">{selectedProfile.phone}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">GUARDIAN</small>
                    <span className="small">{selectedProfile.guardian}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block small-text">GENDER</small>
                    <span className="small">{selectedProfile.gender}</span>
                  </div>
                </div>
                
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-dark py-2 rounded-3 fw-bold" onClick={() => window.print()}>Print Profile Summary</button>
                  <button className="btn btn-dark py-2 rounded-3 fw-bold" onClick={() => setSelectedProfile(null)}>Close</button>
                </div>
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
            <p className="small text-muted mb-4">You are about to <strong>{confirmToggle.status === 'active' ? 'Deactivate' : 'Activate'}</strong> {confirmToggle.name}'s card.</p>
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
        <button className="btn btn-dark px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-person-plus-fill"></i> Add Student
        </button>
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
              <option value="All">All Classes</option>
              {classes.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
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
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="ps-4 py-3">
                    <div className="d-flex align-items-center gap-3">
                      <img src={student.img} className="rounded-circle border" style={{width: 38, height: 38, objectFit: 'cover'}} alt="" />
                      <div>
                        <div className="fw-bold small">{student.name}</div>
                        <div className="text-muted" style={{fontSize: '9px'}}>{student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><code className="bg-primary-subtle text-primary px-2 py-1 rounded small fw-bold">{student.rfid}</code></td>
                  <td className="small text-muted">{student.joinedDate}</td>
                  <td>
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
                        <div className="px-3 py-2 dropdown-item cursor-pointer small d-flex align-items-center gap-2" onClick={() => { setSelectedActivity(student); setActiveMenu(null); }}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .students-container { background-color: #f8fafc; min-height: 100vh; padding: 2rem; }
        .btn-dark { background-color: #0f172a !important; border: none; transition: all 0.3s ease; }
        .btn-dark:hover { background-color: #1e293b !important; transform: translateY(-1px); }
        .text-primary { color: #10b981 !important; }
        .bg-primary-subtle { background-color: #ecfdf5 !important; color: #059669 !important; }
        .table thead th { background-color: #f1f5f9; color: #64748b; font-weight: 600; }
        .section-card { border: 1px solid #e2e8f0 !important; }
        .bg-success { background-color: #10b981 !important; }
        .bg-success-subtle { background-color: #d1fae5 !important; color: #065f46 !important; }
        .bg-danger-subtle { background-color: #fee2e2 !important; color: #991b1b !important; }
        .search-input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 1rem 0.5rem 2.5rem; }
        .dropdown-item:hover { background-color: #f8fafc; cursor: pointer; }
        .small-text { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 2px; }
        .bg-emerald { background-color: #10b981 !important; }
      `}</style>
    </div>
  );
};

export default Students;