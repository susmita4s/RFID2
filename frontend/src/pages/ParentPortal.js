

import React, { useState, useEffect } from 'react';

const ParentPortal = ({ onLogout, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [notifications, setNotifications] = useState([]);

  // Student Data State
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
    performance: "Grade: A (Excellent)",
    rank: "4th in Class",
    busRoute: "Route 14 - Sector 5",
    lastExam: "Mathematics (92/100)",
    medicalNote: "No Known Allergies"
  });

  const recentActivities = [
    { time: "02:15 PM", action: "Library", desc: "Returned 'Java Programming'", icon: "book-half", color: "#6f42c1" },
    { time: "12:45 PM", action: "Canteen", desc: "Lunch Payment: ₹80", icon: "cart-fill", color: "#fd7e14" },
    { time: "08:10 AM", action: "Campus Entry", desc: "Main Gate - RFID Scanned", icon: "door-open-fill", color: "#198754" },
    { time: "Yesterday", action: "Bus", desc: "Dropped at Sector 5", icon: "bus-front", color: "#0d7c88" }
  ];

  // --- NEW: SIMULATE LIVE NOTIFICATION ---
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification("Bus Arrival", "Route 14 has entered the school premises.");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = (title, msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, msg }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // --- HANDLERS ---
  const handleRecharge = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setStudent(prev => ({ ...prev, wallet: prev.wallet + rechargeAmount }));
      setIsProcessing(false);
      addNotification("Wallet Updated", `₹${rechargeAmount} added successfully.`);
    }, 1500);
  };

  const handleAdminChat = () => {
    alert("Initiating secure chat with School Administrator...");
  };

  const handleOfficeCall = () => {
    window.location.href = "tel:+913222200000"; 
  };

  const handleSupportSubmit = () => {
    if (!supportMessage.trim()) return alert("Please enter a message first.");
    setIsProcessing(true);
    setTimeout(() => {
      addNotification("Ticket Raised", "Support ticket #EDU-9921 created.");
      setSupportMessage("");
      setIsProcessing(false);
    }, 1500);
  };

  const colors = {
    text: isDarkMode ? '#f8f9fa' : '#212529',
    muted: isDarkMode ? '#adb5bd' : '#6c757d',
    card: isDarkMode ? 'rgba(33, 37, 41, 0.7)' : '#ffffff',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    accent: '#085b45'
  };

  const cardStyle = { 
    background: colors.card, 
    backdropFilter: 'blur(12px)', 
    border: `1px solid ${colors.border}`,
    color: colors.text,
    borderRadius: '24px'
  };

  return (
    <div className={`min-vh-100 ${isDarkMode ? 'bg-dark' : 'bg-light'}`} style={{ transition: 'all 0.4s ease', color: colors.text }}>
      
      <style>{`
        .touch-card { transition: all 0.3s ease; }
        .touch-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .nav-pill-custom { background: rgba(0,0,0,0.1); padding: 5px; border-radius: 50px; }
        .wallet-gradient { background: linear-gradient(135deg, #14c1bb 0%, #17ab9a5e 100%); color: white; }
        .scanner-box { position: relative; width: 220px; height: 220px; margin: 0 auto; border: 4px solid ${colors.accent}; border-radius: 30px; overflow: hidden; background: #111; display: flex; align-items: center; justify-content: center; }
        .scanner-line { position: absolute; width: 100%; height: 3px; background: ${colors.accent}; top: 0; box-shadow: 0 0 15px ${colors.accent}; animation: scan 2.5s infinite linear; }
        @keyframes scan { 0% { top: 0% } 100% { top: 100% } }
        .status-dot { width: 10px; height: 10px; background: #198754; border-radius: 50%; display: inline-block; margin-right: 8px; animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        .toast-container { position: fixed; top: 80px; right: 20px; z-index: 9999; }
        .animate-pop { animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
        @keyframes popIn { from { transform: scale(0.8) translateX(50px); opacity: 0; } to { transform: scale(1) translateX(0); opacity: 1; } }
      `}</style>

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {notifications.map(n => (
          <div key={n.id} className="card border-0 shadow-lg p-3 mb-2 animate-pop" style={{...cardStyle, minWidth: '250px', background: isDarkMode ? '#2c3034' : '#fff'}}>
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle-fill text-info me-3 fs-4"></i>
              <div>
                <div className="fw-bold small">{n.title}</div>
                <div className="text-muted small">{n.msg}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* NAVIGATION */}
      <nav className="navbar navbar-dark bg-black px-3 py-3 sticky-top shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <div className="bg-info bg-opacity-10 p-2 rounded-3 me-2">
                <i className="bi bi-shield-check text-info fs-4"></i>
            </div>
            <div>
                <h6 className="m-0 text-white fw-bold">PARENT PORTAL</h6>
                <small className="text-white-50" style={{fontSize: '10px'}}></small>
            </div>
          </div>

          <div className="d-none d-md-flex nav-pill-custom">
            {['dashboard', 'wallet', 'support', 'settings'].map((tab) => (
              <button 
                key={tab}
                className={`btn btn-sm rounded-pill px-3 py-1 border-0 text-uppercase fw-bold ${activeTab === tab ? 'btn-info text-white' : 'text-white-50'}`}
                onClick={() => { setActiveTab(tab); setShowScanner(false); }}
                style={{ fontSize: '0.7rem' }}
              >
                {tab}
              </button>
            ))}
          </div>

          <button onClick={onLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold">
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </nav>

      <div className="container py-4">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="row g-4 animate-slide-up">
            <div className="col-lg-4">
               <div className="card p-4 text-center touch-card shadow-sm" style={cardStyle}>
                 <div className="position-relative d-inline-block mx-auto mb-3">
                    <img src={student.photo} className="rounded-circle border border-4 border-info shadow" style={{width: 110}} alt="Student" />
                    <span className="position-absolute bottom-0 end-0 bg-success border border-white border-2 rounded-circle" style={{width: 20, height: 20}}></span>
                 </div>
                 <h4 className="fw-bold mb-1">{student.name}</h4>
                 <p className="badge bg-info bg-opacity-10 text-info mb-4">{student.id}</p>
                 
                 <div className="text-start bg-light bg-opacity-10 rounded-4 p-3">
                    <DetailRow label="Standard" value={student.class} icon="mortarboard" />
                    <DetailRow label="Teacher" value={student.classTeacher} icon="person-badge" />
                    <DetailRow label="Bus Route" value={student.busRoute} icon="bus-front" />
                    <DetailRow label="Medical" value={student.medicalNote} icon="heart-pulse-fill" />
                 </div>
               </div>
            </div>

            <div className="col-lg-8">
               <div className="row g-3">
                 <ParentStat title="Attendance" value={student.attendance} icon="calendar2-check" color="#19917b" cardStyle={cardStyle} />
                 <ParentStat title="Wallet" value={`₹${student.wallet}`} icon="wallet2" color="#0f4877" cardStyle={cardStyle} />
                 <ParentStat title="Rank" value={student.rank} icon="trophy" color="#5d173d" cardStyle={cardStyle} />
               </div>

               <div className="card mt-4 p-4 touch-card" style={cardStyle}>
                 <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold m-0"><i className="bi bi-clock-history me-2 text-info"></i>Live Activity</h5>
                    <span className="small text-muted"><span className="status-dot"></span>In Campus</span>
                 </div>
                 {recentActivities.map((act, i) => (
                    <LogItem key={i} {...act} />
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="row g-4 animate-slide-up justify-content-center">
            {showScanner ? (
                <div className="col-md-6 text-center py-5">
                    <div className="card p-5 touch-card shadow-sm" style={cardStyle}>
                        <h5 className="fw-bold mb-4">Scan RFID Card</h5>
                        <div className="scanner-box mb-4">
                            <div className="scanner-line"></div>
                            <i className="bi bi-rfid text-white-50 display-1"></i>
                        </div>
                        <p className="text-muted small">Place the student ID card near your phone's camera</p>
                        <button onClick={() => setShowScanner(false)} className="btn btn-outline-secondary rounded-pill px-4 mt-3"><b>Cancel</b></button>
                    </div>
                </div>
            ) : (
                <>
                <div className="col-md-5">
                    <div className="card p-4 wallet-gradient border-0 shadow-lg touch-card mb-4" style={{borderRadius: '24px'}}>
                        <div className="d-flex justify-content-between align-items-start mb-5">
                            <i className="bi bi-cpu-fill fs-2 opacity-50"></i>
                            <span className="fw-bold">Edu-Pay Digital</span>
                        </div>
                        <small className="opacity-75">Current Balance</small>
                        <h1 className="display-4 fw-bold">₹{student.wallet}</h1>
                        <div className="mt-4 d-flex justify-content-between">
                            <span className="text-uppercase small">{student.name}</span>
                            <span className="small opacity-50">Secure Wallet</span>
                        </div>
                    </div>

                    <div className="card p-4 touch-card shadow-sm" style={cardStyle}>
                        <h6 className="fw-bold mb-3">Quick Recharge</h6>
                        <div className="row g-2 mb-4">
                            {[200, 500, 1000].map(amt => (
                                <div className="col-4" key={amt}>
                                    <button onClick={() => setRechargeAmount(amt)} className={`btn w-100 rounded-3 py-2 fw-bold ${rechargeAmount === amt ? 'btn-info text-white' : 'btn-outline-secondary'}`}>₹{amt}</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleRecharge} className="btn btn-info btn-lg w-100 rounded-pill text-white fw-bold shadow mb-3">
                            {isProcessing ? 'Processing...' : `Pay ₹${rechargeAmount}`}
                        </button>
                        <button onClick={() => setShowScanner(true)} className="btn btn-link text-info text-decoration-none w-100 small">
                            <i className="bi bi-qr-code-scan me-2"></i>Use  RFID Scanner
                        </button>
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card p-4 touch-card h-100 shadow-sm" style={cardStyle}>
                        <h6 className="fw-bold mb-4">Transaction History</h6>
                        <div className="list-group list-group-flush">
                            <HistoryItem title="Canteen - Meal" date="Today" amt="-₹80" />
                            <HistoryItem title="Library - Late Fee" date="24 Mar" amt="-₹20" />
                            <HistoryItem title="Wallet Recharge" date="22 Mar" amt="+₹1000" isPlus />
                            <HistoryItem title="Uniform Shop" date="15 Mar" amt="-₹450" />
                            <HistoryItem title="Bus Subscription" date="01 Mar" amt="-₹1200" />
                        </div>
                    </div>
                </div>
                </>
            )}
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="row justify-content-center animate-slide-up">
            <div className="col-md-8">
              <div className="card p-4 touch-card shadow-sm" style={cardStyle}>
                <h4 className="fw-bold mb-4">Help & Support</h4>
                <div className="row g-3 mb-4">
                    <div className="col-6">
                        <button onClick={handleAdminChat} className="btn btn-outline-info w-100 py-3 rounded-4">
                            <i className="bi bi-chat-dots fs-3 d-block mb-2"></i> 
                            Chat with Admin
                        </button>
                    </div>
                    <div className="col-6">
                        <button onClick={handleOfficeCall} className="btn btn-outline-primary w-100 py-3 rounded-4">
                            <i className="bi bi-telephone-outbound fs-3 d-block mb-2"></i> 
                            Call Office
                        </button>
                    </div>
                </div>
                <hr className="my-4 opacity-10" />
                <label className="small fw-bold mb-2">Message Principal / Teacher</label>
                <textarea 
                    className="form-control rounded-4 mb-3 border-0 bg-light bg-opacity-10 p-3" 
                    rows="4" 
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Briefly describe your concern (e.g., leave application, bus route change)..."
                ></textarea>
                <button 
                    onClick={handleSupportSubmit} 
                    disabled={isProcessing}
                    className="btn btn-info text-white fw-bold w-100 rounded-pill py-3 shadow"
                >
                    {isProcessing ? 'Sending...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="row justify-content-center animate-slide-up">
            <div className="col-md-6">
              <div className="card p-4 touch-card shadow-sm" style={cardStyle}>
                <h4 className="fw-bold mb-4">Account Settings</h4>
                <SettingToggle label="App Notifications" desc="Get alerts for gate entry/exit" icon="bell" active={true} />
                <SettingToggle label="Low Balance Alert" desc="Notify if wallet < ₹100" icon="wallet" active={true} />
                <SettingToggle label="SMS Reports" desc="Daily attendance via SMS" icon="chat-left-text" active={false} />
                <SettingToggle label="Face ID Login" desc="Use biometrics to secure portal" icon="shield-lock" active={true} />
                
                <div className="mt-5 pt-4 border-top border-light border-opacity-10">
                    <button onClick={onLogout} className="btn btn-danger w-100 rounded-pill py-3 fw-bold shadow-sm">
                        <i className="bi bi-box-arrow-right me-2"></i>Logout from Device
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* --- MINI COMPONENTS --- */

const DetailRow = ({ label, value, icon }) => (
  <div className="d-flex align-items-center justify-content-between mb-2">
    <span className="small text-muted"><i className={`bi bi-${icon} me-2 text-info`}></i>{label}</span>
    <span className="fw-bold small">{value}</span>
  </div>
);

const ParentStat = ({ title, value, icon, color, cardStyle }) => (
  <div className="col-md-4">
    <div className="card border-0 p-3 shadow-sm h-100" style={cardStyle}>
      <div className="d-flex align-items-center">
        <div className="p-3 rounded-4 me-3" style={{ background: `${color}15`, color: color }}>
            <i className={`bi bi-${icon} fs-4`}></i>
        </div>
        <div>
          <div className="small text-muted fw-bold" style={{ fontSize: '10px' }}>{title}</div>
          <h4 className="fw-bold m-0" style={{ color: color }}>{value}</h4>
        </div>
      </div>
    </div>
  </div>
);

const LogItem = ({ time, action, desc, icon, color }) => (
  <div className="d-flex align-items-center p-3 mb-2 rounded-4 border border-light border-opacity-10">
    <div className="p-2 rounded-3 me-3" style={{ background: `${color}15`, color: color }}><i className={`bi bi-${icon} fs-5`}></i></div>
    <div className="flex-grow-1">
      <div className="fw-bold small">{action}</div>
      <div className="text-muted" style={{fontSize: '11px'}}>{desc}</div>
    </div>
    <div className="text-end small fw-bold text-info">{time}</div>
  </div>
);

const HistoryItem = ({ title, date, amt, isPlus }) => (
    <div className="d-flex justify-content-between py-3 border-bottom border-light border-opacity-10">
        <div>
            <div className="fw-bold small">{title}</div>
            <small className="text-muted">{date}</small>
        </div>
        <div className={`fw-bold ${isPlus ? 'text-success' : ''}`}>{amt}</div>
    </div>
);

const SettingToggle = ({ label, desc, icon, active }) => (
  <div className="d-flex align-items-center justify-content-between mb-4">
    <div className="d-flex align-items-center">
        <div className="p-2 rounded-3 bg-info bg-opacity-10 me-3">
            <i className={`bi bi-${icon} fs-5 text-info`}></i>
        </div>
        <div>
            <div className="fw-bold small">{label}</div>
            <div className="text-muted" style={{fontSize: '11px'}}>{desc}</div>
        </div>
    </div>
    <div className="form-check form-switch">
      <input className="form-check-input" type="checkbox" defaultChecked={active} />
    </div>
  </div>
);

export default ParentPortal;


