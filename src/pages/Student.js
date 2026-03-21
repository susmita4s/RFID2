




import React, { useState } from 'react';

const Students = () => {
  // --- State Management ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [activeMenu, setActiveMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null); 
  
  const [studentData, setStudentData] = useState([
    { id: "STU-2024-001", name: "Arjun Sharma", gender: "Male", rfid: "RFID-A1B2", class: "10-A", email: "arjun@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/male/1.jpg", joinedDate: "Aug 12, 2023", phone: "+91 98765 43210" },
    { id: "STU-2024-042", name: "Priya Patel", gender: "Female", rfid: "RFID-E5F6", class: "10-B", email: "priya@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/female/2.jpg", joinedDate: "Sept 05, 2023", phone: "+91 98765 43211" },
    { id: "STU-2024-089", name: "Rahul Kumar", gender: "Male", rfid: "RFID-R9T0", class: "9-A", email: "rahul@edu.com", status: "active", img: "https://xsgames.co/randomusers/assets/avatars/male/5.jpg", joinedDate: "July 20, 2023", phone: "+91 98765 43212" },
    { id: "STU-2024-156", name: "Sneha Gupta", gender: "Female", rfid: "RFID-M3N4", class: "9-B", email: "sneha@edu.com", status: "inactive", img: "https://xsgames.co/randomusers/assets/avatars/female/8.jpg", joinedDate: "Oct 15, 2023", phone: "+91 98765 43213" },
  ]);

  const [newStudent, setNewStudent] = useState({
    name: '', gender: 'Male', rfid: '', class: '', email: '', status: 'active', phone: ''
  });

  // --- Logic ---
  const classes = ['All', ...new Set(studentData.map(s => s.class))];

  const handleAddStudent = (e) => {
    e.preventDefault();
    const id = `STU-2024-${Math.floor(100 + Math.random() * 900)}`;
    const img = `https://xsgames.co/randomusers/assets/avatars/${newStudent.gender.toLowerCase()}/${Math.floor(Math.random() * 50)}.jpg`;
    const joinedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    setStudentData([ { ...newStudent, id, img, joinedDate }, ...studentData]);
    setShowAddModal(false);
    setNewStudent({ name: '', gender: 'Male', rfid: '', class: '', email: '', status: 'active', phone: '' });
  };

  const filteredStudents = studentData.filter(student => {
    const matchesSearch = student.rfid.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = filterGender === 'All' || student.gender === filterGender;
    const matchesClass = filterClass === 'All' || student.class === filterClass;
    return matchesSearch && matchesGender && matchesClass;
  });

  return (
    <div className="students-container animate-fade-in position-relative">
      
      {/* --- View Profile Modal with Library Activity --- */}
      {selectedProfile && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden animate-fade-in" style={{ width: '95%', maxWidth: '500px' }}>
            <div className="text-center p-5 position-relative" style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', color: 'white' }}>
              <button className="btn-close btn-close-white position-absolute end-0 top-0 m-3" onClick={() => setSelectedProfile(null)}></button>
              <img src={selectedProfile.img} className="rounded-circle border border-4 border-white shadow mb-3" style={{ width: 100, height: 100, objectFit: 'cover' }} alt="Profile" />
              <h4 className="fw-bold m-0">{selectedProfile.name}</h4>
              <span className="badge bg-info text-dark mt-2">{selectedProfile.id}</span>
            </div>
            
            <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <h6 className="fw-bold text-uppercase small text-muted mb-3">General Information</h6>
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <small className="text-muted d-block text-uppercase fw-bold" style={{fontSize: '10px'}}>RFID Tag</small>
                    <span className="fw-semibold text-primary">{selectedProfile.rfid}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block text-uppercase fw-bold" style={{fontSize: '10px'}}>Class</small>
                    <span className="fw-semibold">{selectedProfile.class}</span>
                  </div>
                  <div className="col-12 border-top pt-2">
                    <small className="text-muted d-block text-uppercase fw-bold" style={{fontSize: '10px'}}>Email Address</small>
                    <span className="fw-semibold">{selectedProfile.email}</span>
                  </div>
                </div>

                {/* --- Added Library Activity Section --- */}
                <h6 className="fw-bold text-uppercase small text-muted mb-3 d-flex align-items-center">
                  <i className="bi bi-book me-2 text-danger"></i> Recent Library Activity
                </h6>
                <div className="bg-light rounded-3 p-3 mb-4">
                   <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-secondary-subtle">
                      <div>
                        <div className="fw-bold small">Physics for Class 10</div>
                        <div className="text-muted" style={{fontSize: '11px'}}>Issued: 2024-01-10</div>
                      </div>
                      <span className="badge bg-primary-subtle text-primary rounded-pill">Issued</span>
                   </div>
                   <div className="d-flex align-items-center justify-content-between py-2">
                      <div>
                        <div className="fw-bold small">Advanced Mathematics</div>
                        <div className="text-muted" style={{fontSize: '11px'}}>Returned: 2023-12-15</div>
                      </div>
                      <span className="badge bg-success-subtle text-success rounded-pill">Returned</span>
                   </div>
                </div>

                <button className="btn btn-dark w-100 py-2 rounded-3 fw-bold" onClick={() => setSelectedProfile(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Add Student Modal --- */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-4 shadow-lg p-4 animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0 text-dark">Register New Student</h4>
              <button className="btn-close" onClick={() => setShowAddModal(false)}></button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold">Full Name</label>
                  <input type="text" className="form-control shadow-sm" required placeholder="Ex: Arjun Sharma" onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">RFID Tag ID</label>
                  <input type="text" className="form-control shadow-sm" required placeholder="RFID-XXXX" onChange={e => setNewStudent({...newStudent, rfid: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Class</label>
                  <input type="text" className="form-control shadow-sm" required placeholder="10-A" onChange={e => setNewStudent({...newStudent, class: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Gender</label>
                  <select className="form-select shadow-sm" onChange={e => setNewStudent({...newStudent, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Status</label>
                  <select className="form-select shadow-sm" onChange={e => setNewStudent({...newStudent, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-12 mt-4">
                  <button type="submit" className="btn btn-dark w-100 py-2 fw-bold rounded-3 shadow">Save Student Record</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Student Directory</h2>
          <p className="text-muted small">Manage and view student records via RFID</p>
        </div>
        <button className="btn btn-dark px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-person-plus-fill"></i> Add Student
        </button>
      </div>

      {/* --- Filter Section --- */}
      <div className="section-card mb-4 py-3 border-0 shadow-sm bg-white rounded-4">
        <div className="row g-3 px-3 align-items-center">
          <div className="col-lg-4">
            <div className="search-wrapper w-100">
              <i className="bi bi-upc-scan search-icon"></i>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search RFID or Name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-8 d-flex gap-3 justify-content-lg-end">
            <select className="form-select border-0 bg-light rounded-3" style={{width: '140px'}} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="All">All Classes</option>
              {classes.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select border-0 bg-light rounded-3" style={{width: '140px'}} onChange={(e) => setFilterGender(e.target.value)}>
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="section-card p-0 overflow-hidden shadow-sm border-0 bg-white rounded-4">
        <div className="table-responsive">
          <table className="table table-hover m-0 align-middle">
            <thead className="bg-light">
              <tr className="small text-uppercase text-muted">
                <th className="ps-4 py-3">Student Details</th>
                <th>RFID Tag</th>
                <th>Class</th>
                <th>Status</th>
                <th className="pe-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="ps-4 py-3">
                    <div className="d-flex align-items-center gap-3">
                      <img src={student.img} className="rounded-circle border shadow-sm" style={{width: 42, height: 42, objectFit: 'cover'}} alt="" />
                      <div>
                        <div className="fw-bold text-dark">{student.name}</div>
                        <div className="text-muted" style={{fontSize: '10px'}}>{student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><code className="bg-primary-subtle text-primary px-2 py-1 rounded small fw-bold">{student.rfid}</code></td>
                  <td><span className="badge bg-light text-dark border px-3 fw-normal">{student.class}</span></td>
                  <td>
                    <span className={`badge rounded-pill ${student.status === 'active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                      ● {student.status}
                    </span>
                  </td>
                  <td className="pe-4 text-end position-relative">
                    <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => setActiveMenu(activeMenu === student.id ? null : student.id)}>
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    {activeMenu === student.id && (
                      <div className="position-absolute bg-white shadow-lg border rounded-3 py-2 text-start animate-fade-in" 
                           style={{ right: '40px', top: '10px', zIndex: 100, minWidth: '160px' }}>
                        <div className="px-3 py-2 dropdown-item cursor-pointer small d-flex align-items-center gap-2" onClick={() => { setSelectedProfile(student); setActiveMenu(null); }}>
                          <i className="bi bi-eye text-primary"></i> View Profile & Activity
                        </div>
                        <div className="px-3 py-2 dropdown-item cursor-pointer small text-danger d-flex align-items-center gap-2" onClick={() => {
                          setStudentData(studentData.filter(s => s.id !== student.id));
                          setActiveMenu(null);
                        }}>
                          <i className="bi bi-trash"></i> Delete Record
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
    </div>
  );
};

export default Students;