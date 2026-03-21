
import React, { useState, useMemo } from 'react';

const Library = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activeTab, setActiveTab] = useState("Issued Books"); // Now used for filtering
  
  // --- States for Functionality ---
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanType, setScanType] = useState(""); 
  const [scannedData, setScannedData] = useState({ studentId: '', bookId: '' });

  const [booksData, setBooksData] = useState([
    { id: "BK-PHY-101", title: "Physics for Class 10", student: "Arjun Sharma", stuId: "STU-2024-001", issuedDate: "2024-01-10", dueDate: "2024-01-24", status: "issued" },
    { id: "BK-MAT-205", title: "Advanced Mathematics", student: "Priya Patel", stuId: "STU-2024-042", issuedDate: "2024-01-05", dueDate: "2024-01-19", status: "overdue" },
    { id: "BK-ENG-150", title: "English Literature", student: "Rahul Kumar", stuId: "STU-2024-089", issuedDate: "2024-01-12", dueDate: "2024-01-26", status: "issued" },
    { id: "BK-CHF-089", title: "Chemistry Experiments", student: "Sneha Gupta", stuId: "STU-2024-156", issuedDate: "2024-01-08", dueDate: "2024-01-15", status: "returned" },
  ]);

  // --- Handlers ---
  const handleOpenScan = (type) => {
    setScanType(type);
    setShowScanModal(true);
  };

  const processScan = (value) => {
    if (scanType === "student") {
      setScannedData({ ...scannedData, studentId: value });
    } else {
      setScannedData({ ...scannedData, bookId: value });
    }
    setShowScanModal(false);
  };

  const handleIssueBook = () => {
    if (!scannedData.studentId || !scannedData.bookId) {
      alert("Please scan both Student Tag and Book ID first!");
      return;
    }

    const newIssue = {
      id: scannedData.bookId,
      title: "New Scanned Book", 
      student: "Recognized Student", 
      stuId: scannedData.studentId,
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 12096e5).toISOString().split('T')[0], 
      status: "issued"
    };

    setBooksData([newIssue, ...booksData]);
    setScannedData({ studentId: '', bookId: '' });
    alert("Book Issued Successfully!");
  };

  const filteredBooks = useMemo(() => {
    return booksData.filter(book => {
      // 1. Filter by Search
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || book.stuId.includes(searchTerm);
      
      // 2. Filter by Status Dropdown
      const matchesStatus = statusFilter === "All Status" || book.status === statusFilter.toLowerCase();
      
      // 3. Filter by Active Tab
      let matchesTab = true;
      if (activeTab === "Issued Books") matchesTab = book.status === 'issued' || book.status === 'overdue';
      if (activeTab === "History") matchesTab = book.status === 'returned';
      // "Book Catalog" shows all for this mock
      
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [searchTerm, statusFilter, activeTab, booksData]);

  return (
    <div className="animate-fade-in p-1 position-relative">
      
      {/* Scanner Simulation Modal */}
      {showScanModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
          <div className="bg-white p-5 rounded-4 text-center shadow-lg animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="spinner-grow text-danger mb-4" role="status"></div>
            <h4 className="fw-bold">Scanning {scanType === 'student' ? 'Student RFID' : 'Book Barcode'}...</h4>
            <p className="text-muted small">Listening for hardware reader signal...</p>
            <input 
              autoFocus 
              className="form-control text-center border-danger mt-3 shadow-none" 
              placeholder="Enter ID and press Enter"
              onKeyDown={(e) => e.key === 'Enter' && processScan(e.target.value)}
            />
            <button className="btn btn-light mt-4 w-100" onClick={() => setShowScanModal(false)}>Cancel Scan</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Library</h2>
          <p className="text-muted small">Manage book issues, returns, and library access via RFID</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light border rounded-pill px-3 shadow-sm" onClick={() => handleOpenScan('book')}>
            <i className="bi bi-hdd-stack me-2"></i>Scan Book
          </button>
          <button 
            className="btn text-white rounded-pill px-4 shadow-sm" 
            style={{ background: 'linear-gradient(90deg, #ff4d6d, #ff758c)', border: 'none' }}
            onClick={handleIssueBook}
          >
            <i className="bi bi-plus-lg me-2"></i>Confirm Issue
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="row g-4 mb-4">
        <MetricCard title="Total Books" value="12,456" icon="book" color="#ff4d6d" bg="#fff1f2" />
        <MetricCard title="Currently Issued" value={booksData.filter(b => b.status !== 'returned').length} icon="journal-bookmark" color="#a855f7" bg="#f3e8ff" />
        <MetricCard title="Overdue" value="89" icon="exclamation-triangle" color="#f97316" bg="#fff7ed" />
        <MetricCard title="Returns Today" value="45" icon="check-circle" color="#00d9cc" bg="#e0fcfb" />
      </div>

      {/* Sub-Navigation (Resolved Unused activeTab) */}
      <div className="d-flex gap-3 mb-4 border-bottom pb-2">
        {["Issued Books", "Book Catalog", "History"].map(tab => (
          <span 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`fw-bold small cursor-pointer pb-2 position-relative ${activeTab === tab ? 'text-dark' : 'text-muted'}`}
            style={{ cursor: 'pointer', transition: '0.3s' }}
          >
            {tab}
            {activeTab === tab && (
              <div className="position-absolute bottom-0 start-0 w-100 bg-dark" style={{ height: '2px' }}></div>
            )}
          </span>
        ))}
      </div>

      <div className="row g-4">
        {/* Left Column: Table & Rules */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
            <div className="p-3 d-flex gap-3">
              <div className="position-relative flex-grow-1">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light ps-5 rounded-3 shadow-none" 
                  placeholder="Search by book, student, or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="form-select border-0 bg-light w-auto rounded-3 shadow-none" onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All Status</option>
                <option>Issued</option>
                <option>Overdue</option>
                <option>Returned</option>
              </select>
            </div>

            <table className="table mb-0 align-middle">
              <thead className="bg-light">
                <tr className="small text-muted">
                  <th className="ps-4 border-0">Book Details</th>
                  <th className="border-0">Student</th>
                  <th className="border-0">Dates</th>
                  <th className="border-0">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length > 0 ? filteredBooks.map((book, idx) => (
                  <tr key={idx} className="border-bottom">
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-3 bg-danger bg-opacity-10 text-danger"><i className="bi bi-book"></i></div>
                        <div>
                          <div className="fw-bold small">{book.title}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{book.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img src={`https://i.pravatar.cc/150?u=${book.stuId}`} className="rounded-circle" width="30" alt="" />
                        <div>
                          <div className="fw-semibold small">{book.student}</div>
                          <div className="text-muted" style={{ fontSize: '10px' }}>{book.stuId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="small text-muted" style={{ fontSize: '11px' }}>
                      <div><i className="bi bi-calendar-event me-1"></i> Issued: {book.issuedDate}</div>
                      <div className={book.status === 'overdue' ? 'text-danger fw-bold' : ''}>
                        <i className="bi bi-clock-history me-1"></i> Due: {book.dueDate}
                      </div>
                    </td>
                    <td><LibraryStatusBadge status={book.status} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted small">No books found in this category</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Rules Section */}
          <div className="card border-0 shadow-sm rounded-4 p-4 text-white" 
               style={{ background: 'linear-gradient(135deg, #ff4d6d 0%, #a855f7 100%)' }}>
            <h5 className="fw-bold mb-3"><i className="bi bi-shield-check me-2"></i>Library Rules & Regulations</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <RuleItem icon="card-checklist" text="RFID card mandatory for all transactions." light />
                <RuleItem icon="clock-history" text="14-day issue period; renew before expiry." light />
              </div>
              <div className="col-md-6">
                <RuleItem icon="cash-stack" text="Fine: $1.00/day after 2-day grace period." light />
                <RuleItem icon="volume-mute" text="Silence must be maintained at all times." light />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 text-white p-4 text-center mb-4" 
               style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}>
            <div className="mx-auto bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-upc-scan fs-3"></i>
            </div>
            <h5 className="fw-bold">Ready to Issue</h5>
            <div className="bg-white bg-opacity-10 p-3 rounded-3 mt-3 text-start small">
                <div className="mb-2">Student ID: <b className="text-info">{scannedData.studentId || 'Not Scanned'}</b></div>
                <div>Book ID: <b className="text-warning">{scannedData.bookId || 'Not Scanned'}</b></div>
            </div>
            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-light w-100 rounded-pill fw-bold shadow-sm" onClick={() => handleOpenScan('student')}>Scan Student</button>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h6 className="fw-bold mb-4 text-dark"><i className="bi bi-clock-history me-2 text-danger"></i>Recent Activity</h6>
            <ActivityItem type="Book Issued" detail="Physics Vol. 1" user="Arjun S." time="Just Now" color="primary" />
            <ActivityItem type="Book Returned" detail="History of India" user="Priya P." time="10:15 AM" color="success" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const MetricCard = ({ title, value, icon, color, bg }) => (
  <div className="col-md-3">
    <div className="card border-0 shadow-sm rounded-4 p-3 h-100 d-flex flex-row justify-content-between align-items-center bg-white">
      <div>
        <div className="text-muted small mb-1">{title}</div>
        <h3 className="fw-bold m-0 text-dark">{value}</h3>
      </div>
      <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', background: bg, color }}>
        <i className={`bi bi-${icon} fs-5`}></i>
      </div>
    </div>
  </div>
);

const LibraryStatusBadge = ({ status }) => {
  const styles = {
    issued: "bg-primary-subtle text-primary",
    overdue: "bg-danger-subtle text-danger",
    returned: "bg-success-subtle text-success"
  };
  return <span className={`badge ${styles[status]} rounded-pill px-3 py-2 fw-normal text-capitalize`}>{status}</span>;
};

const ActivityItem = ({ type, detail, user, time, color }) => (
  <div className="mb-3 pb-3 border-bottom last-child-border-0">
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <div className={`fw-bold small text-${color}`}>{type}</div>
        <div className="small fw-semibold text-dark">{detail}</div>
        <div className="text-muted" style={{ fontSize: '10px' }}>by {user}</div>
      </div>
      <div className="text-muted small" style={{ fontSize: '10px' }}>{time}</div>
    </div>
  </div>
);

const RuleItem = ({ icon, text, light }) => (
  <div className="d-flex align-items-start gap-2 mb-2">
    <i className={`bi bi-${icon} ${light ? 'text-white' : 'text-muted'} mt-1`}></i>
    <span className={`${light ? 'text-white' : 'text-muted'}`} style={{ fontSize: '13px', fontWeight: '500' }}>{text}</span>
  </div>
);

export default Library;