

import React, { useState, useMemo, useEffect } from 'react';
import RFIDScanner from '../components/RFIDScanner';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedTxn, setSelectedTxn] = useState(null); // Active Function: Store selected transaction

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalCollection: 0,
    pendingDues: 0,
    rfidRefills: 0,
    totalTransactions: 0
  });

  // Profile Scanner State
  const [showProfileScanner, setShowProfileScanner] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isScanningProfile, setIsScanningProfile] = useState(false);


  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      
      const statsRes = await fetch('/api/fees/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      }

      const txnsRes = await fetch('/api/fees/transactions', { headers });
      if (txnsRes.ok) {
        const txnsData = await txnsRes.json();
        if (txnsData.success) setTransactions(txnsData.data);
      }
    } catch (error) {
      console.error("Error fetching fees data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const filtered = useMemo(() => {
    return transactions.filter(txn => {
      const matchesSearch = txn.student.toLowerCase().includes(searchTerm.toLowerCase()) || txn.stuId.includes(searchTerm);
      const matchesStatus = statusFilter === "All Status" || txn.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, transactions]);

  // ACTIVE FUNCTION: Print Statement
  const handlePrint = () => {
    window.print();
  };

  // ACTIVE FUNCTION: View Transaction Details
  const handleViewDetails = (txn) => {
    setSelectedTxn(txn);
  };

  const handleScanProfile = async (uid) => {
    if (isScanningProfile) return;
    setIsScanningProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payments/rfid-scan', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rfid_uid: uid })
      });
      const data = await response.json();
      if (data.success) {
        setStudentProfile(data);
      } else {
        alert(data.error || 'Student not found');
      }
    } catch (error) {
      console.error('Scan Profile error:', error);
      alert('Network Error');
    } finally {
      setIsScanningProfile(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* CSS for Printing - Hides UI elements during print */}
      <style>{`
        @media print {
          .sidebar, .search-wrapper, .card-filter, header, .nav-item { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .card { box-shadow: none !important; border: 1px solid #eee !important; }
          body { background: white !important; }
          .modal-overlay { background: transparent !important; position: absolute !important; }
          .btn-close, .d-print-none { display: none !important; }
        }
      `}</style>

      <div className={selectedTxn ? "d-print-none" : ""}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold m-0">Payment Records</h2>
            <p className="text-muted small">Manage student fees and RFID wallet transactions</p>
          </div>
          <button className="btn btn-primary px-4 py-2 fw-bold shadow-sm rounded-3 d-flex align-items-center gap-2 d-print-none" onClick={() => setShowProfileScanner(true)}>
            <i className="bi bi-wallet2"></i> Open Student Payment Profile
          </button>
        </div>

        {/* --- Student Profile Scanner Modal --- */}
        {showProfileScanner && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
            <div className="bg-white p-4 rounded-4 shadow-lg border position-relative" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
              <button className="btn-close position-absolute top-0 end-0 m-3" onClick={() => { setShowProfileScanner(false); setStudentProfile(null); }}></button>
              
              {!studentProfile ? (
                <div className="text-center p-5">
                  <div className="display-1 text-primary mb-4">
                    {isScanningProfile ? <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div> : <i className="bi bi-broadcast"></i>}
                  </div>
                  <h4 className="fw-bold mb-3">{isScanningProfile ? 'Fetching Profile...' : 'Scan Student RFID'}</h4>
                  <p className="text-muted">Place card on reader to view payment profile</p>
                  <RFIDScanner active={showProfileScanner && !isScanningProfile} onScan={handleScanProfile} />
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3 border">
                    <img src={studentProfile.student.photo || `https://ui-avatars.com/api/?name=${studentProfile.student.name}&background=random`} className="rounded-circle border" style={{width: 60, height: 60, objectFit: 'cover'}} alt="" />
                    <div>
                      <h5 className="fw-bold m-0">{studentProfile.student.name}</h5>
                      <div className="text-muted small">{studentProfile.student.className}</div>
                    </div>
                  </div>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <div className="p-3 border rounded-3 bg-danger-subtle text-danger text-center">
                        <h3 className="fw-bold m-0">₹{studentProfile.profile.outstandingFees}</h3>
                        <div className="small fw-bold text-uppercase" style={{fontSize: '10px'}}>Outstanding Fees</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 border rounded-3 bg-warning-subtle text-warning text-center">
                        <h3 className="fw-bold m-0">₹{studentProfile.profile.pendingBalance}</h3>
                        <div className="small fw-bold text-uppercase" style={{fontSize: '10px'}}>Pending Balance</div>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 border-bottom pb-2">Recent Payment History</h6>
                  {studentProfile.profile.paymentHistory.length === 0 ? (
                    <p className="text-muted small text-center py-3">No payment records found.</p>
                  ) : (
                    <div className="list-group list-group-flush border mb-4 rounded-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                      {studentProfile.profile.paymentHistory.map((txn, idx) => (
                        <div key={idx} className="list-group-item d-flex justify-content-between align-items-center p-3">
                          <div>
                            <div className="fw-bold small text-dark">{txn.type || txn.description || 'Transaction'}</div>
                            <div className="text-muted" style={{fontSize: '11px'}}>{new Date(txn.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold small">₹{txn.amount}</div>
                            <span className={`badge rounded-pill ${txn.status === 'paid' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`} style={{fontSize: '10px'}}>
                              {txn.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="d-grid">
                    <button className="btn btn-outline-dark fw-bold rounded-pill" onClick={() => setStudentProfile(null)}>Scan Another</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="row g-4 mb-4 d-print-none">
          <PaymentStat title="Total Collection" value={`₹${stats.totalCollection.toLocaleString('en-IN')}`} icon="cash-stack" color="#10b981" />
          <PaymentStat title="Pending Dues" value={`₹${stats.pendingDues.toLocaleString('en-IN')}`} icon="exclamation-circle" color="#ef4444" />
          <PaymentStat title="RFID Refills" value={`₹${stats.rfidRefills.toLocaleString('en-IN')}`} icon="credit-card" color="#3b82f6" />
          <PaymentStat title="Total Transactions" value={stats.totalTransactions.toLocaleString('en-IN')} icon="list-check" color="#8b5cf6" />
        </div>

        {/* Filter Section */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white card-filter d-print-none">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input 
                  className="form-control border-0 bg-light ps-5 rounded-3" 
                  placeholder="Search by student name or ID..." 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select border-0 bg-light rounded-3" onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All Status</option>
                <option>Completed</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="p-3 bg-light border-bottom d-none d-print-block">
              <h4 className="fw-bold m-0 text-center">RFID SchoolHub - Payment Statement</h4>
              <p className="text-center small text-muted m-0">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
          <table className="table align-middle mb-0 table-hover">
            <thead className="bg-light">
              <tr className="small text-muted text-uppercase">
                <th className="ps-4 py-3 border-0">Student Info</th>
                <th className="border-0">Description</th>
                <th className="border-0">Amount</th>
                <th className="border-0">Status</th>
                <th className="border-0 text-end pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((txn, i) => (
                <tr key={i} className="border-bottom">
                  <td className="ps-4 py-3" data-label="Student">
                    <div className="fw-bold small">{txn.student}</div>
                    <div className="text-muted small" style={{fontSize: '11px'}}>{txn.stuId}</div>
                  </td>
                  <td data-label="Description">
                    <div className="small">{txn.type}</div>
                    <div className="text-muted small" style={{fontSize: '11px'}}>{txn.date}</div>
                  </td>
                  <td className="fw-bold small text-dark" data-label="Amount">{txn.amount}</td>
                  <td data-label="Status">
                    <span className={`badge rounded-pill px-3 ${
                      txn.status === 'Completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="text-end pe-4" data-label="Action">
                    <button className="btn btn-sm btn-light rounded-circle shadow-sm" onClick={() => handleViewDetails(txn)}>
                      <i className="bi bi-eye text-primary"></i>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted small">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal (Overlay) */}
      {selectedTxn && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3 modal-overlay" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card border-0 rounded-4 shadow-lg p-4 animate-fade-in" style={{ width: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">Transaction Details</h5>
              <button className="btn-close d-print-none" onClick={() => setSelectedTxn(null)}></button>
            </div>
            
            <div className="text-center mb-4 py-3 bg-light rounded-4">
                <div className="text-muted small mb-1">Total Paid</div>
                <h2 className="fw-bold text-success">{selectedTxn.amount}</h2>
                <span className="badge bg-success-subtle text-success">{selectedTxn.status}</span>
            </div>

            <div className="small mb-4">
                <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Student Name</span>
                    <span className="fw-bold">{selectedTxn.student}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Transaction ID</span>
                    <span className="fw-bold">{selectedTxn.id}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Payment Type</span>
                    <span className="fw-bold">{selectedTxn.type}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Date & Time</span>
                    <span className="fw-bold">{selectedTxn.date}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Wallet Balance</span>
                    <span className="fw-bold text-primary">{selectedTxn.balance}</span>
                </div>
            </div>

            <button className="btn text-white w-100 rounded-pill mb-2 d-print-none" style={{ background: '#f59e0b' }} onClick={handlePrint}>
              <i className="bi bi-printer me-2"></i>Print Receipt
            </button>
            <button className="btn btn-dark w-100 rounded-pill d-print-none" onClick={() => setSelectedTxn(null)}>Close Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentStat = ({ title, value, icon, color }) => (
  <div className="col-md-3">
    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 h-100" style={{ borderColor: color + ' !important' }}>
      <div className="d-flex align-items-center gap-3">
        <div className="rounded-circle p-3" style={{ background: color + '15', color: color }}>
          <i className={`bi bi-${icon} fs-4`}></i>
        </div>
        <div>
          <div className="text-muted small fw-medium">{title}</div>
          <h4 className="fw-bold m-0">{value}</h4>
        </div>
      </div>
    </div>
  </div>
);

export default Payments;