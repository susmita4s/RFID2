


import React, { useState } from 'react';

const ParentPortal = ({ onLogout, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [message, setMessage] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [isProcessing, setIsProcessing] = useState(false);

  const [student, setStudent] = useState({
    name: "Arjun Sharma",
    id: "STU-2024-001",
    class: "10-A",
    rollNo: "12",
    house: "Blue House",
    attendance: "94.2%",
    wallet: 1250,
    bloodGroup: "B+",
    emergencyContact: "+91 98765-43210",
    classTeacher: "Ms. Anjali Verma",
    photo: "https://i.pravatar.cc/150?u=1",
    performance: "Grade: A (Excellent)"
  });

  const handleRecharge = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setStudent(prev => ({ ...prev, wallet: prev.wallet + rechargeAmount }));
      setIsProcessing(false);
    }, 1500);
  };

  // Dynamic Color Palettes
  const colors = {
    text: isDarkMode ? '#f8f9fa' : '#212529',
    muted: isDarkMode ? '#adb5bd' : '#6c757d',
    card: isDarkMode ? 'rgba(33, 37, 41, 0.7)' : '#ffffff',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    accent: '#0dcaf0'
  };

  const cardStyle = { 
    background: colors.card, 
    backdropFilter: 'blur(12px)', 
    border: `1px solid ${colors.border}`,
    color: colors.text 
  };

  return (
    <div className={`min-vh-100 ${isDarkMode ? 'bg-dark' : 'bg-light'}`} style={{ transition: 'all 0.4s ease', color: colors.text }}>
      
      <style>{`
        .touch-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .touch-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.2) !important; border-color: ${colors.accent} !important; }
        .touch-card:active { transform: scale(0.98); }
        .btn-interactive { transition: all 0.2s ease; }
        .btn-interactive:active { transform: scale(0.96); }
        .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      {/* NAVBAR */}
      <nav className="navbar navbar-dark bg-black px-4 py-3 sticky-top shadow-lg border-bottom border-secondary border-opacity-25">
        <div className="container-fluid">
          <i className="bi bi-shield-lock-fill text-info fs-3"></i>
          
          <div className="d-flex bg-secondary bg-opacity-25 rounded-pill p-1">
            {['dashboard', 'payments', 'rules', 'support'].map((tab) => (
              <button 
                key={tab}
                className={`btn btn-sm rounded-pill px-3 py-1 border-0 text-uppercase fw-bold ${activeTab === tab ? 'btn-info text-white shadow' : 'text-white-50'}`}
                onClick={() => setActiveTab(tab)}
                style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
              >
                {tab}
              </button>
            ))}
          </div>

          <button onClick={onLogout} className="btn btn-outline-danger btn-sm rounded-circle p-2 border-0 btn-interactive">
            <i className="bi bi-power fs-5"></i>
          </button>
        </div>
      </nav>

      <div className="container py-5">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="row g-4 animate-slide-up">
            <div className="col-lg-4">
              <div className="card rounded-5 p-4 text-center touch-card shadow-sm" style={cardStyle}>
                <div className="mb-4">
                  <img src={student.photo} className="rounded-circle border border-4 border-info shadow" style={{width: 120}} alt="Student" />
                </div>
                <h3 className="fw-bold mb-1" style={{ color: colors.text }}>{student.name}</h3>
                <p className="fw-bold small mb-4" style={{ color: colors.accent }}>{student.id}</p>
                
                <div className="rounded-4 p-3 mb-4 text-start" style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }}>
                  <DetailRow label="Class" value={student.class} icon="mortarboard-fill" colors={colors} />
                  <DetailRow label="Roll No" value={student.rollNo} icon="hash" colors={colors} />
                  <DetailRow label="Teacher" value={student.classTeacher} icon="person-circle" colors={colors} />
                </div>

                <div className="row g-0 border-top pt-3" style={{ borderColor: colors.border }}>
                  <div className="col-6 border-end" style={{ borderColor: colors.border }}>
                    <div className="fw-bold text-danger">{student.bloodGroup}</div>
                    <div className="small text-uppercase fw-bold" style={{ color: colors.muted, fontSize: '10px' }}>Blood Group</div>
                  </div>
                  <div className="col-6">
                    <div className="fw-bold text-primary">{student.house}</div>
                    <div className="small text-uppercase fw-bold" style={{ color: colors.muted, fontSize: '10px' }}>House</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="row g-3">
                <ParentStat title="Attendance" value={student.attendance} icon="calendar-check-fill" color="#0d6efd" colors={colors} />
                <ParentStat title="Wallet" value={`₹${student.wallet}`} icon="wallet2" color="#198754" colors={colors} />
                <ParentStat title="Status" value="Great" icon="stars" color="#ffc107" colors={colors} />
              </div>
              
              <div className="card rounded-5 p-4 mt-4 touch-card" style={cardStyle}>
                <h5 className="fw-bold mb-4"><i className="bi bi-activity me-2 text-info"></i>Recent Activity</h5>
                <LogItem time="08:45 AM" action="Gate Entry" desc="Main Campus Entrance" icon="box-arrow-in-right" color="#198754" colors={colors} />
                <LogItem time="12:30 PM" action="Canteen" desc="Digital Payment: ₹120" icon="cart4" color="#0dcaf0" colors={colors} />
                <LogItem time="04:15 PM" action="Library" desc="Book Checkout" icon="book" color="#ffc107" colors={colors} />
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="row justify-content-center animate-slide-up">
            <div className="col-md-6">
              <div className="card rounded-5 p-5 text-center shadow-lg" style={cardStyle}>
                <span className="text-uppercase fw-bold mb-2" style={{ color: colors.muted, fontSize: '12px', letterSpacing: '2px' }}>Balance</span>
                <h1 className="display-2 fw-bold mb-5" style={{ color: '#198754' }}>₹{student.wallet}</h1>
                
                <div className="p-4 rounded-5" style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }}>
                  <div className="row g-2 mb-4">
                    {[100, 500, 1000].map(amt => (
                      <div className="col-4" key={amt}>
                        <button 
                          onClick={() => setRechargeAmount(amt)}
                          className={`btn w-100 rounded-4 py-2 fw-bold btn-interactive ${rechargeAmount === amt ? 'btn-info text-white' : 'btn-outline-secondary'}`}
                        >₹{amt}</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleRecharge} className="btn btn-info btn-lg w-100 rounded-pill text-white fw-bold shadow-sm py-3 btn-interactive">
                    {isProcessing ? 'Processing...' : `Add ₹${rechargeAmount}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RULES */}
        {activeTab === 'rules' && (
          <div className="row g-4 animate-slide-up">
            {[
              { t: "ID Access", d: "RFID cards must be visible at all times.", i: "person-badge" },
              { t: "Low Balance", d: "Alerts sent when balance drops below ₹100.", i: "exclamation-triangle" },
              { t: "Exit Policy", d: "Guardian permission needed for early exit.", i: "shield-lock" },
              { t: "Reports", d: "Monthly attendance sent every 1st Monday.", i: "file-earmark-bar-graph" }
            ].map((rule, idx) => (
              <div className="col-md-6" key={idx}>
                <div className="card rounded-5 p-4 touch-card h-100" style={cardStyle}>
                  <i className={`bi bi-${rule.i} fs-2 text-info mb-3`}></i>
                  <h5 className="fw-bold">{rule.t}</h5>
                  <p className="mb-0" style={{ color: colors.muted }}>{rule.d}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUPPORT */}
        {activeTab === 'support' && (
          <div className="row justify-content-center animate-slide-up">
            <div className="col-md-8">
              <div className="card rounded-5 p-5 shadow-lg border-0" style={cardStyle}>
                <h4 className="fw-bold mb-4">Contact Admin</h4>
                <textarea 
                  className={`form-control rounded-4 p-4 border-0 mb-4 ${isDarkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`}
                  rows="4"
                  placeholder="How can we help you today?"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
                ></textarea>
                <button className="btn btn-info btn-lg text-white rounded-pill fw-bold w-100 py-3 btn-interactive">Send Message</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* --- CLEAN COMPONENTS --- */

const DetailRow = ({ label, value, icon, colors }) => (
  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2" style={{ borderColor: colors.border }}>
    <span style={{ color: colors.muted, fontSize: '0.85rem' }}>
      <i className={`bi bi-${icon} me-2 text-info`}></i>{label}
    </span>
    <span className="fw-bold" style={{ color: colors.text }}>{value}</span>
  </div>
);

const ParentStat = ({ title, value, icon, color, colors }) => (
  <div className="col-md-4">
    <div className="card border-0 rounded-5 p-4 shadow-sm touch-card h-100" style={{ background: colors.card, color: colors.text, border: `1px solid ${colors.border}` }}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <div className="small fw-bold text-uppercase mb-1" style={{ color: colors.muted, letterSpacing: '1px', fontSize: '10px' }}>{title}</div>
          <h2 className="fw-bold m-0" style={{ color: color }}>{value}</h2>
        </div>
        <i className={`bi bi-${icon} fs-1 opacity-25`}></i>
      </div>
    </div>
  </div>
);

const LogItem = ({ time, action, desc, icon, color, colors }) => (
  <div className="d-flex align-items-center p-3 mb-2 rounded-4" style={{ background: 'rgba(0,0,0,0.02)' }}>
    <div className="rounded-circle p-3 me-3" style={{ background: `${color}20`, color: color }}>
      <i className={`bi bi-${icon} fs-5`}></i>
    </div>
    <div className="flex-grow-1">
      <div className="fw-bold" style={{ color: colors.text }}>{action}</div>
      <div className="small" style={{ color: colors.muted }}>{desc}</div>
    </div>
    <div className="text-end fw-bold small" style={{ color: colors.accent }}>{time}</div>
  </div>
);

export default ParentPortal;