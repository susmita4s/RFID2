import React from 'react';

const logoutStyles = `
  .logout-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .logout-card {
    background: white;
    padding: 40px;
    border-radius: 32px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    max-width: 500px;
    width: 100%;
    text-align: center;
    border: 1px solid #f1f5f9;
  }

  .admin-avatar-lg {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    margin: 0 auto 20px;
    border: 4px solid #00d9cc;
    padding: 3px;
    background: white;
  }

  .session-pill {
    background: #f8fafc;
    padding: 12px 20px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 25px;
    border: 1px solid #e2e8f0;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 30px;
  }

  .summary-item {
    padding: 15px;
    background: #fdfdfd;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
  }

  .btn-confirm-logout {
    background: #ef4444;
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 14px;
    font-weight: 600;
    width: 100%;
    transition: 0.3s;
    margin-bottom: 12px;
  }

  .btn-confirm-logout:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2);
  }

  .btn-cancel-logout {
    background: transparent;
    color: #64748b;
    border: none;
    padding: 10px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn-cancel-logout:hover { color: #1e293b; text-decoration: underline; }
`;

const Logout = ({ onConfirm, onCancel }) => {
  // Simulated session data
  const sessionStats = {
    duration: "4h 12m",
    scansPerformed: 142,
    paymentsProcessed: 12,
    loginTime: "08:30 AM"
  };

  return (
    <div className="logout-overlay">
      <style>{logoutStyles}</style>
      <div className="logout-card">
        <img 
          src="https://ui-avatars.com/api/?name=Admin+User&background=00d9cc&color=fff" 
          className="admin-avatar-lg" 
          alt="Admin" 
        />
        <h3 className="fw-bold text-dark mb-1">Confirm Logout</h3>
        <p className="text-muted mb-4">You are about to end your administrative session.</p>

        <div className="session-pill">
            <i className="bi bi-clock-history text-primary"></i>
            <span className="small fw-bold text-dark">Active Session: {sessionStats.duration}</span>
        </div>

        <div className="summary-grid">
            <div className="summary-item">
                <div className="text-muted" style={{fontSize: '11px'}}>RFID SCANS</div>
                <div className="fw-bold text-primary">{sessionStats.scansPerformed}</div>
            </div>
            <div className="summary-item">
                <div className="text-muted" style={{fontSize: '11px'}}>PAYMENTS</div>
                <div className="fw-bold text-success">{sessionStats.paymentsProcessed}</div>
            </div>
        </div>

        <div className="alert alert-warning border-0 rounded-4 p-3 mb-4" style={{fontSize: '12px', background: '#fffbeb'}}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Ensure all pending library returns are logged before exiting.
        </div>

        <button className="btn-confirm-logout" onClick={onConfirm}>
            Logout Securely
        </button>
        
        <button className="btn-cancel-logout" onClick={onCancel}>
            Go back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Logout;