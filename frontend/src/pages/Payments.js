

import React, { useState, useMemo } from 'react';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedTxn, setSelectedTxn] = useState(null); // Active Function: Store selected transaction

  const [transactions] = useState([
    { id: "TXN-001", student: "Arjun Sharma", stuId: "STU-2024-001", type: "Canteen", date: "2024-01-15", amount: "₹150", status: "Completed", method: "RFID Card", balance: "₹1,240" },
    { id: "TXN-002", student: "Priya Patel", stuId: "STU-2024-042", type: "Library Fine", date: "2024-01-15", amount: "₹20", status: "Completed", method: "RFID Card", balance: "₹450" },
    { id: "TXN-003", student: "Michael Chen", stuId: "STU-2024-003", type: "Tuition Fee", date: "2024-01-14", amount: "₹12,500", status: "Pending", method: "Bank Transfer", balance: "N/A" },
    { id: "TXN-004", student: "Sarah Williams", stuId: "STU-2024-002", type: "Bus Fee", date: "2024-01-14", amount: "₹2,400", status: "Completed", method: "RFID Card", balance: "₹890" },
  ]);

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

  return (
    <div className="animate-fade-in">
      {/* CSS for Printing - Hides UI elements during print */}
      <style>{`
        @media print {
          .btn, .sidebar, .search-wrapper, .card-filter, header, .nav-item { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .card { box-shadow: none !important; border: 1px solid #eee !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
        <div>
          <h2 className="fw-bold m-0">Payment Records</h2>
          <p className="text-muted small">Manage student fees and RFID wallet transactions</p>
        </div>
        <button className="btn text-white rounded-pill px-4 shadow-sm" style={{ background: '#f59e0b' }} onClick={handlePrint}>
          <i className="bi bi-printer me-2"></i>Print Statement
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-4 mb-4 d-print-none">
        <PaymentStat title="Total Collection" value="₹4,85,230" icon="cash-stack" color="#10b981" />
        <PaymentStat title="Pending Dues" value="₹1,24,580" icon="exclamation-circle" color="#ef4444" />
        <PaymentStat title="RFID Refills" value="₹45,000" icon="credit-card" color="#3b82f6" />
        <PaymentStat title="Total Transactions" value="1,842" icon="list-check" color="#8b5cf6" />
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
              <th className="border-0 text-end pe-4 d-print-none">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((txn, i) => (
              <tr key={i} className="border-bottom">
                <td className="ps-4 py-3">
                  <div className="fw-bold small">{txn.student}</div>
                  <div className="text-muted small" style={{fontSize: '11px'}}>{txn.stuId}</div>
                </td>
                <td>
                  <div className="small">{txn.type}</div>
                  <div className="text-muted small" style={{fontSize: '11px'}}>{txn.date}</div>
                </td>
                <td className="fw-bold small text-dark">{txn.amount}</td>
                <td>
                  <span className={`badge rounded-pill px-3 ${
                    txn.status === 'Completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                  }`}>
                    {txn.status}
                  </span>
                </td>
                <td className="text-end pe-4 d-print-none">
                  <button className="btn btn-sm btn-light rounded-circle shadow-sm" onClick={() => handleViewDetails(txn)}>
                    <i className="bi bi-eye text-primary"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal (Overlay) */}
      {selectedTxn && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card border-0 rounded-4 shadow-lg p-4 animate-fade-in" style={{ width: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">Transaction Details</h5>
              <button className="btn-close" onClick={() => setSelectedTxn(null)}></button>
            </div>
            
            <div className="text-center mb-4 py-3 bg-light rounded-4">
                <div className="text-muted small mb-1">Total Paid</div>
                <h2 className="fw-bold text-success">{selectedTxn.amount}</h2>
                <span className="badge bg-success-subtle text-success">{selectedTxn.status}</span>
            </div>

            <div className="small">
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

            <button className="btn btn-dark w-100 rounded-pill mt-4" onClick={() => setSelectedTxn(null)}>Close Receipt</button>
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