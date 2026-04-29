


import React, { useState, useMemo } from 'react';

const Library = () => {
  // ... (Keep all your existing state and handler logic exactly the same)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activeTab, setActiveTab] = useState("Issued Books");
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanType, setScanType] = useState(""); 
  const [issueDetails, setIssueDetails] = useState({
    studentId: '', bookId: '', studentClass: '10-A',
    issueDate: new Date().toISOString().split('T')[0], librarianName: ''
  });
  const [booksData, setBooksData] = useState([
    { id: "BK-PHY-101", title: "Physics for Class 10", student: "Arjun Sharma", stuId: "STU-2024-001", issuedDate: "2024-01-10", dueDate: "2024-01-24", status: "issued" },
    { id: "BK-MAT-205", title: "Advanced Mathematics", student: "Priya Patel", stuId: "STU-2024-042", issuedDate: "2024-01-05", dueDate: "2024-01-19", status: "overdue" },
    { id: "BK-ENG-150", title: "English Literature", student: "Rahul Kumar", stuId: "STU-2024-089", issuedDate: "2024-01-12", dueDate: "2024-01-26", status: "issued" },
    { id: "BK-CHF-089", title: "Chemistry Experiments", student: "Sneha Gupta", stuId: "STU-2024-156", issuedDate: "2024-01-08", dueDate: "2024-01-15", status: "returned" },
  ]);

  const handleOpenScan = (type) => { setScanType(type); setShowScanModal(true); };
  const processScan = (value) => {
    if (scanType === "student") setIssueDetails({ ...issueDetails, studentId: value });
    else setIssueDetails({ ...issueDetails, bookId: value });
    setShowScanModal(false);
  };

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    if (!issueDetails.studentId || !issueDetails.bookId || !issueDetails.librarianName) {
      alert("Please ensure Student ID, Book ID, and Librarian Name are provided!");
      return;
    }
    const newIssue = {
      id: issueDetails.bookId, title: "New Issued Book", student: "Recognized Student", 
      stuId: issueDetails.studentId, issuedDate: issueDetails.issueDate,
      dueDate: new Date(new Date(issueDetails.issueDate).getTime() + 12096e5).toISOString().split('T')[0], 
      status: "issued"
    };
    setBooksData([newIssue, ...booksData]);
    setIssueDetails({ ...issueDetails, studentId: '', bookId: '' }); 
    alert(`Book Issued Successfully by ${issueDetails.librarianName}!`);
  };

  const filteredBooks = useMemo(() => {
    return booksData.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || book.stuId.includes(searchTerm);
      const matchesStatus = statusFilter === "All Status" || book.status === statusFilter.toLowerCase();
      let matchesTab = true;
      if (activeTab === "Issued Books") matchesTab = book.status === 'issued' || book.status === 'overdue';
      if (activeTab === "History") matchesTab = book.status === 'returned';
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [searchTerm, statusFilter, activeTab, booksData]);

  return (
    <div className="p-3 bg-light min-vh-100">
      {/* Scanner Modal omitted for brevity, keep yours here */}
      {showScanModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white p-4 rounded-4 text-center shadow-lg border" style={{ maxWidth: '380px', width: '90%' }}>
            <div className="spinner-border text-danger mb-3" role="status"></div>
            <h5 className="fw-bold mb-1">Scanning {scanType === 'student' ? 'Student RFID' : 'Book Barcode'}</h5>
            <p className="text-muted small mb-4">Place the tag near the reader...</p>
            <input autoFocus className="form-control text-center border-2 mb-3" placeholder="Waiting for input..." onKeyDown={(e) => e.key === 'Enter' && processScan(e.target.value)} />
            <button className="btn btn-outline-secondary btn-sm w-100 rounded-pill" onClick={() => setShowScanModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Library Management</h2>
        <p className="text-muted small">Circulation, Inventory, and Digital Records</p>
      </div>

      <div className="row g-3 mb-4">
        <MetricCard title="Total Inventory" value="12,456" icon="book" color="#ff4d6d" bg="#fff1f2" />
        <MetricCard title="Active Issues" value={booksData.filter(b => b.status !== 'returned').length} icon="journal-check" color="#8b5cf6" bg="#f5f3ff" />
        <MetricCard title="Overdue Items" value="89" icon="exclamation-circle" color="#f59e0b" bg="#fffbeb" />
        <MetricCard title="Processed Today" value="45" icon="arrow-repeat" color="#10b981" bg="#ecfdf5" />
      </div>

      <div className="row g-4">
        {/* Main Content Area */}
        <div className="col-xl-8 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-3 px-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div className="d-flex gap-4">
                  {["Issued Books", "Book Catalog", "History"].map(tab => (
                    <div key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 cursor-pointer small fw-bold transition-all ${activeTab === tab ? 'text-primary border-bottom border-2 border-primary' : 'text-muted'}`} style={{ cursor: 'pointer' }}>{tab}</div>
                  ))}
                </div>
                <div className="d-flex gap-2 flex-grow-1 flex-md-grow-0">
                  <div className="position-relative flex-grow-1">
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input type="text" className="form-control form-control-sm border-light ps-5 rounded-pill bg-light shadow-none" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <select className="form-select form-select-sm border-light rounded-pill bg-light w-auto shadow-none" onChange={(e) => setStatusFilter(e.target.value)}>
                    <option>All Status</option><option>Issued</option><option>Overdue</option><option>Returned</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted" style={{ fontSize: '12px' }}>
                    <th className="ps-4">BOOK INFO</th><th>STUDENT</th><th>TIMELINE</th><th className="pe-4 text-end">STATUS</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {filteredBooks.map((book, idx) => (
                    <tr key={idx}>
                      <td className="ps-4"><div className="fw-bold small text-dark">{book.title}</div><div className="text-muted smaller" style={{ fontSize: '11px' }}>{book.id}</div></td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img src={`https://i.pravatar.cc/150?u=${book.stuId}`} className="rounded-circle border" width="28" alt="" />
                          <div><div className="fw-semibold small">{book.student}</div><div className="text-muted smaller" style={{ fontSize: '10px' }}>{book.stuId}</div></div>
                        </div>
                      </td>
                      <td className="smaller text-muted" style={{ fontSize: '11px' }}>
                        <div><i className="bi bi-calendar3 me-1"></i> {book.issuedDate}</div>
                        <div className={book.status === 'overdue' ? 'text-danger fw-bold' : ''}><i className="bi bi-clock-history me-1"></i> Due {book.dueDate}</div>
                      </td>
                      <td className="pe-4 text-end"><LibraryStatusBadge status={book.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rules Section */}
          <div className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
            <div className="position-relative z-1">
              <h6 className="fw-bold mb-3"><i className="bi bi-shield-lock me-2"></i>Library Compliance & Rules</h6>
              <div className="row g-3">
                <div className="col-md-6"><RuleItem icon="card-checklist" text="RFID verification required for checkout." light /></div>
                <div className="col-md-6"><RuleItem icon="currency-dollar" text="Late returns incur $1.50/day penalty." light /></div>
                <div className="col-md-6"><RuleItem icon="clock" text="Standard issue period: 14 business days." light /></div>
                <div className="col-md-6"><RuleItem icon="volume-mute" text="Maintain silence in the reading zone." light /></div>
              </div>
            </div>
            <i className="bi bi-book-half position-absolute end-0 bottom-0 mb-n4 me-n4 opacity-25" style={{ fontSize: '120px' }}></i>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-xl-4 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
               <h5 className="fw-bold m-0 text-dark">Issue Desk</h5>
               <div className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 small">New Issue</div>
            </div>
            <form onSubmit={handleIssueSubmit}>
              <div className="mb-3">
                <label className="form-label smaller fw-bold text-muted">Librarian on Duty</label>
                <input type="text" className="form-control form-control-sm bg-light border-0 py-2 shadow-none" placeholder="Enter name" value={issueDetails.librarianName} onChange={(e) => setIssueDetails({...issueDetails, librarianName: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="form-label smaller fw-bold text-muted d-flex justify-content-between">Book Identifier
                    <button type="button" className="btn btn-link p-0 text-primary text-decoration-none smaller" onClick={() => handleOpenScan('book')} style={{fontSize: '11px'}}><i className="bi bi-upc-scan me-1"></i>Scan</button>
                </label>
                <input type="text" className="form-control form-control-sm bg-light border-0 py-2 shadow-none" placeholder="BK-000" value={issueDetails.bookId} onChange={(e) => setIssueDetails({...issueDetails, bookId: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="form-label smaller fw-bold text-muted d-flex justify-content-between">Student RFID
                    <button type="button" className="btn btn-link p-0 text-primary text-decoration-none smaller" onClick={() => handleOpenScan('student')} style={{fontSize: '11px'}}><i className="bi bi-upc-scan me-1"></i>Scan</button>
                </label>
                <input type="text" className="form-control form-control-sm bg-light border-0 py-2 shadow-none" placeholder="STU-000" value={issueDetails.studentId} onChange={(e) => setIssueDetails({...issueDetails, studentId: e.target.value})} required />
              </div>
              <div className="row g-2 mb-4">
                <div className="col-6">
                  <label className="form-label smaller fw-bold text-muted">Class</label>
                  <select className="form-select form-select-sm bg-light border-0 shadow-none" value={issueDetails.studentClass} onChange={(e) => setIssueDetails({...issueDetails, studentClass: e.target.value})}>
                    <option>9-A</option><option>10-A</option><option>11-B</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label smaller fw-bold text-muted">Issue Date</label>
                  <input type="date" className="form-control form-control-sm bg-light border-0 shadow-none" value={issueDetails.issueDate} onChange={(e) => setIssueDetails({...issueDetails, issueDate: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm" style={{ background: '#4f46e5', border: 'none' }}>Confirm Dispatch</button>
            </form>
          </div>
        </div>

        {/* --- FULL WIDTH LIVE ACTIVITY SECTION --- */}
        <div className="col-12 mt-2">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold m-0 text-dark">Live Activity Feed</h6>
              <div className="d-flex align-items-center gap-2">
                <span className="smaller text-muted" style={{fontSize: '11px'}}>Real-time updates</span>
                <i className="bi bi-broadcast text-danger animate-pulse"></i>
              </div>
            </div>
            
            <div className="d-flex gap-3 overflow-auto pb-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
               <HorizontalActivityItem type="Issued" detail="Organic Chemistry" user="Rahul K." time="2m ago" color="primary" />
               <HorizontalActivityItem type="Returned" detail="World History" user="Sara T." time="15m ago" color="success" />
               <HorizontalActivityItem type="Overdue" detail="Python 101" user="Aman J." time="1h ago" color="warning" />
               <HorizontalActivityItem type="Issued" detail="Quantum Physics" user="Vikram S." time="3h ago" color="primary" />
               <HorizontalActivityItem type="Returned" detail="Macbeth" user="Anjali M." time="5h ago" color="success" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... (Keep MetricCard, LibraryStatusBadge, RuleItem components)

const HorizontalActivityItem = ({ type, detail, user, time, color }) => (
  <div className={`bg-${color} bg-opacity-10 border border-${color} border-opacity-10 rounded-4 p-3 flex-grow-1 flex-shrink-0`} style={{ minWidth: '220px' }}>
    <div className="d-flex justify-content-between align-items-center mb-2">
      <span className={`badge bg-${color} rounded-pill small`} style={{fontSize: '9px'}}>{type}</span>
      <span className="text-muted" style={{ fontSize: '10px' }}>{time}</span>
    </div>
    <div className="fw-bold small text-dark text-truncate mb-1" title={detail}>{detail}</div>
    <div className="text-muted text-truncate" style={{ fontSize: '10px' }}><i className="bi bi-person me-1"></i>{user}</div>
  </div>
);

// (Other helper components here)
const MetricCard = ({ title, value, icon, color, bg }) => (
    <div className="col-xl-3 col-md-6">
      <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px', background: bg, color }}>
            <i className={`bi bi-${icon} fs-5`}></i>
          </div>
          <div>
            <div className="text-muted smaller fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>{title}</div>
            <h4 className="fw-bold m-0 text-dark">{value}</h4>
          </div>
        </div>
      </div>
    </div>
  );
  
  const LibraryStatusBadge = ({ status }) => {
    const styles = {
      issued: "bg-primary-subtle text-primary border-primary border-opacity-10",
      overdue: "bg-danger-subtle text-danger border-danger border-opacity-10",
      returned: "bg-success-subtle text-success border-success border-opacity-10"
    };
    return <span className={`badge ${styles[status]} border rounded-pill px-2 py-1 fw-semibold text-capitalize`} style={{ fontSize: '10px' }}>{status}</span>;
  };
  
  const RuleItem = ({ icon, text, light }) => (
    <div className="d-flex align-items-center gap-2">
      <div className={`${light ? 'bg-white bg-opacity-20' : 'bg-light'} rounded p-1 d-flex align-items-center justify-content-center`} style={{ width: '24px', height: '24px' }}>
          <i className={`bi bi-${icon} ${light ? 'text-white' : 'text-primary'}`} style={{ fontSize: '12px' }}></i>
      </div>
      <span className={`${light ? 'text-white text-opacity-90' : 'text-muted'}`} style={{ fontSize: '12px' }}>{text}</span>
    </div>
  );

export default Library;