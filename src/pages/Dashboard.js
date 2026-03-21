


import React, { useState } from 'react';
// Ensure these files exist in your folder
import Students from './Student'; 
import Attendance from './Attendance'; 
import Library from './Library'; 
import Payments from './Payments';
import Settings from './Settings'; // 1. IMPORT SETTINGS

const dashStyles = `
  :root {
    --dash-bg: #f8fafc;
    --sidebar-bg: #111827;
    --accent-cyan: #00d9cc;
    --accent-purple: #a855f7;
    --accent-orange: #f59e0b;
    --text-main: #1e293b;
    --card-shadow: 0 4px 25px rgba(0, 0, 0, 0.06);
  }
  
  .dashboard-container { display: flex; height: 100vh; background: var(--dash-bg); font-family: 'Inter', sans-serif; color: var(--text-main); overflow: hidden; }
  
  .sidebar { 
    width: 260px; 
    background: var(--sidebar-bg); 
    color: white; 
    display: flex; 
    flex-direction: column; 
    padding: 24px; 
    flex-shrink: 0; 
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 100;
  }
  .sidebar.collapsed { width: 85px; padding: 24px 15px; }
  
  .sidebar-toggle {
    position: absolute; right: -12px; top: 35px;
    background: var(--accent-cyan); color: #111827;
    border-radius: 50%; width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: 2px solid white; z-index: 10;
  }

  .nav-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; color: #9ca3af; text-decoration: none; border-radius: 12px; margin-bottom: 6px; cursor: pointer; transition: 0.2s; font-weight: 500; white-space: nowrap; border: none; background: transparent; width: 100%; text-align: left; }
  .nav-item:hover { color: white; background: rgba(255,255,255,0.05); }
  .nav-item.active { background: rgba(0, 217, 204, 0.1); color: var(--accent-cyan); }
  
  .main-content { flex: 1; overflow-y: auto; padding: 30px 40px; position: relative; }
  .animate-fade-in { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .search-wrapper { position: relative; width: 400px; }
  .search-input { width: 100%; padding: 10px 15px 10px 45px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 0.9rem; }
  .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #94a3b8; }

  .section-card { background: white; padding: 28px; border-radius: 24px; box-shadow: var(--card-shadow); height: 100%; border: 1px solid #f1f5f9; }
  .stat-card { background: white; padding: 26px; border-radius: 24px; box-shadow: var(--card-shadow); display: flex; justify-content: space-between; align-items: center; border: 1px solid #f1f5f9; transition: transform 0.3s ease; height: 100%; }
  .stat-card:hover { transform: translateY(-5px); }
  .stat-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
  
  .progress-bar-bg { height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; margin-top: 8px; }
  .progress-fill { height: 100%; background: var(--accent-purple); border-radius: 10px; transition: width 0.5s ease; }
  
  .action-btn-card { border-radius: 20px; padding: 24px; color: white; display: flex; align-items: center; gap: 20px; cursor: pointer; transition: 0.3s; height: 100%; border: none; width: 100%; text-decoration: none; }
  .action-btn-card:hover { transform: scale(1.02); filter: brightness(1.1); }
  .action-icon-box { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; flex-shrink: 0; }
  
  .gateway-status { font-size: 11px; padding: 4px 12px; border-radius: 20px; background: #ecfdf5; color: #059669; border: 1px solid #10b98133; }
`;

const Dashboard = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch(activeTab) {
      case 'students': return <Students />;
      case 'attendance': return <Attendance />;
      case 'library': return <Library />; 
      case 'payments': return <Payments />;
      case 'settings': return <Settings />; // 2. SETTINGS CASE ADDED
      default: return (
        <div className="animate-fade-in">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h2 className="fw-bold mb-1">Dashboard</h2>
              <p className="text-muted m-0">System Overview & Activity</p>
            </div>
            <div className="gateway-status d-none d-md-block">
              <i className="bi bi-cpu-fill me-2"></i>RFID Gateway: <span className="fw-bold">Connected</span>
            </div>
          </div>

          <div className="row g-4 mb-5">
            <StatCard title="Total Students" value="2,847" trend="+12%" icon="people" bg="#e0fcfb" color="#00d9cc" />
            <StatCard title="Today's Attendance" value="2,651" trend="93.1%" icon="calendar-check" bg="#f3e8ff" color="#a855f7" />
            <StatCard title="Total Collection" value="₹4,85,230" trend="+12.5%" icon="currency-rupee" bg="#ecfdf5" color="#10b981" />
            <StatCard title="Books Issued" value="1,234" trend="89 overdue" icon="book" bg="#fff1f2" color="#ff4d6d" />
          </div>
          
          <div className="row g-4 mb-5">
            <div className="col-lg-8">
              <div className="section-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold m-0"><i className="bi bi-broadcast text-success me-2"></i>Live RFID Activity</h6>
                  <span className="badge bg-success-subtle text-success border border-success px-3">● Live Updates</span>
                </div>
                <ActivityItem name="Arjun Sharma" id="STU-2024-001" type="Entry" time="08:45 AM" img="https://i.pravatar.cc/150?u=1" />
                <ActivityItem name="Priya Patel" id="STU-2024-042" type="Library" time="09:12 AM" img="https://i.pravatar.cc/150?u=2" />
                <ActivityItem name="Rahul Kumar" id="STU-2024-089" type="Canteen" time="09:30 AM" img="https://i.pravatar.cc/150?u=3" />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="section-card">
                <h6 className="fw-bold mb-4"><i className="bi bi-calendar3 text-primary me-2"></i>Attendance by Class</h6>
                <ClassProgress label="Class 10-A" val="95%" sub="42/45" color="#00d9cc" />
                <ClassProgress label="Class 10-B" val="86%" sub="38/44" color="#a855f7" />
                <ClassProgress label="Class 9-A" val="95%" sub="40/42" color="#f59e0b" />
              </div>
            </div>
          </div>

          <div className="row g-4">
            <ActionCard onClick={() => setActiveTab('attendance')} icon="upc-scan" title="Scan RFID" sub="Mark attendance" gradient="linear-gradient(135deg, #00d9cc 0%, #00b4ad 100%)" />
            <ActionCard onClick={() => setActiveTab('payments')} icon="credit-card" title="Collect Fees" sub="Process Payments" gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
            <ActionCard onClick={() => setActiveTab('library')} icon="journal-plus" title="Library Logs" sub="Issue/Return" gradient="linear-gradient(135deg, #ff4d6d 0%, #e11d48 100%)" />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      <style>{dashStyles}</style>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
      
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
          <i className={`bi bi-chevron-${isCollapsed ? 'right' : 'left'} small`}></i>
        </div>
        
        <div className="fw-bold mb-5 d-flex align-items-center gap-2 fs-5 overflow-hidden">
          <i className="bi bi-broadcast text-info flex-shrink-0"></i> 
          {!isCollapsed && <span className="white-space-nowrap">RFID SchoolHub</span>}
        </div>

        <nav className="flex-grow-1">
          <NavItem active={activeTab === 'dashboard'} icon="grid-fill" label="Dashboard" onClick={() => setActiveTab('dashboard')} collapsed={isCollapsed} />
          <NavItem active={activeTab === 'students'} icon="people" label="Students" onClick={() => setActiveTab('students')} collapsed={isCollapsed} />
          <NavItem active={activeTab === 'attendance'} icon="calendar-check" label="Attendance" onClick={() => setActiveTab('attendance')} collapsed={isCollapsed} />
          <NavItem active={activeTab === 'library'} icon="book" label="Library" onClick={() => setActiveTab('library')} collapsed={isCollapsed} />
          <NavItem active={activeTab === 'payments'} icon="credit-card" label="Payments" onClick={() => setActiveTab('payments')} collapsed={isCollapsed} />
          <NavItem active={activeTab === 'settings'} icon="gear" label="Settings" onClick={() => setActiveTab('settings')} collapsed={isCollapsed} />
        </nav>

        <div className="nav-item text-danger mt-auto" onClick={onLogout} style={{cursor: 'pointer'}}>
          <i className="bi bi-box-arrow-left fs-5"></i> 
          {!isCollapsed && <span className="ms-1">Logout</span>}
        </div>
      </aside>

      <main className="main-content">
        <header className="d-flex justify-content-between align-items-center mb-5">
          <div className="search-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input type="text" className="search-input" placeholder="Search students or records..." />
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <div className="fw-bold">Admin User</div>
              <div className="text-muted small">Administrator</div>
            </div>
            <img 
              src="https://ui-avatars.com/api/?name=Admin+User&background=00d9cc&color=fff" 
              className="rounded-circle border" 
              style={{width: 44, height: 44}} 
              alt="Admin" 
            />
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

/* --- Sub-Components --- */

const NavItem = ({ icon, label, active, onClick, collapsed }) => (
  <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    <i className={`bi bi-${icon} fs-5`}></i>
    {!collapsed && <span>{label}</span>}
  </button>
);

const StatCard = ({ title, value, trend, icon, bg, color }) => (
  <div className="col-md-3">
    <div className="stat-card">
      <div>
        <div className="text-muted small mb-1">{title}</div>
        <div className="h3 fw-bold m-0">{value}</div>
        <div className="small mt-2" style={{color}}><i className="bi bi-graph-up me-1"></i>{trend}</div>
      </div>
      <div className="stat-icon" style={{background: bg, color}}><i className={`bi bi-${icon}`}></i></div>
    </div>
  </div>
);

const ActivityItem = ({ name, id, type, time, img }) => (
  <div className="d-flex align-items-center justify-content-between py-3 border-bottom">
    <div className="d-flex align-items-center gap-3">
      <img src={img} className="rounded-circle border" style={{width: 40, height: 40}} alt={name} />
      <div>
        <div className="fw-bold small">{name}</div>
        <div className="text-muted" style={{fontSize: '11px'}}>{id} • <span className="text-primary">{type}</span></div>
      </div>
    </div>
    <div className="text-muted small"><i className="bi bi-clock me-1"></i>{time}</div>
  </div>
);

const ClassProgress = ({ label, val, sub, color }) => (
  <div className="mb-4">
    <div className="d-flex justify-content-between align-items-end mb-1">
        <span className="fw-semibold small">{label}</span>
        <span className="text-muted" style={{fontSize: '11px'}}>{sub} <span className="text-dark fw-bold ms-1">{val}</span></span>
    </div>
    <div className="progress-bar-bg"><div className="progress-fill" style={{width: val, background: color}}></div></div>
  </div>
);

const ActionCard = ({ icon, title, sub, gradient, onClick }) => (
  <div className="col-md-4">
    <button className="action-btn-card shadow-sm" style={{background: gradient}} onClick={onClick}>
        <div className="action-icon-box"><i className={`bi bi-${icon}`}></i></div>
        <div className="text-start">
          <div className="fw-bold fs-5">{title}</div>
          <div className="small opacity-75">{sub}</div>
        </div>
    </button>
  </div>
);

export default Dashboard;