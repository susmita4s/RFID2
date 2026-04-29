
import React, { useState } from 'react';
import Students from './Student'; 
import Attendance from './Attendance'; 
import Library from './Library'; 
import Payments from './Payments';
import Settings from './Settings';
import BusBoarding from './BusBoarding';

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
  
  .sidebar { width: 260px; background: var(--sidebar-bg); color: white; display: flex; flex-direction: column; padding: 24px; flex-shrink: 0; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; z-index: 100; }
  .sidebar.collapsed { width: 85px; padding: 24px 15px; }
  
  .sidebar-toggle { position: absolute; right: -12px; top: 35px; background: var(--accent-cyan); color: #111827; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid white; z-index: 10; }

  .nav-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; color: #9ca3af; text-decoration: none; border-radius: 12px; margin-bottom: 6px; cursor: pointer; transition: 0.2s; font-weight: 500; white-space: nowrap; border: none; background: transparent; width: 100%; text-align: left; }
  .nav-item:hover { color: white; background: rgba(255,255,255,0.05); }
  .nav-item.active { background: rgba(0, 217, 204, 0.1); color: var(--accent-cyan); }
  
  .main-content { flex: 1; overflow-y: auto; padding: 30px 40px; position: relative; }
  .animate-fade-in { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* SEARCH & DATE BAR */
  .search-container { display: flex; gap: 10px; width: 500px; }
  .search-wrapper { position: relative; flex: 1; }
  .search-input { width: 100%; padding: 10px 15px 10px 45px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 0.9rem; }
  .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
  .header-date-input { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 15px; font-size: 0.85rem; outline: none; background: white; width: 150px; }

  /* ADMIN PROFILE */
  .admin-profile-trigger { display: flex; align-items: center; gap: 12px; padding: 6px 12px; border-radius: 15px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
  .admin-profile-trigger:hover { background: white; border-color: #e2e8f0; }
  .admin-dropdown { position: absolute; right: 40px; top: 85px; width: 260px; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); padding: 20px; z-index: 1000; border: 1px solid #f1f5f9; }

  .section-card { background: white; padding: 28px; border-radius: 24px; box-shadow: var(--card-shadow); height: 100%; border: 1px solid #f1f5f9; }
  .stat-card { background: white; padding: 26px; border-radius: 24px; box-shadow: var(--card-shadow); display: flex; justify-content: space-between; align-items: center; border: 1px solid #f1f5f9; transition: transform 0.3s ease; height: 100%; }
  .stat-card:hover { transform: translateY(-5px); }
  .stat-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
  
  .logout-overlay { position: absolute; inset: 0; background: rgba(248, 250, 252, 0.95); z-index: 1100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
  .logout-modal { background: white; padding: 40px; border-radius: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); width: 100%; max-width: 450px; text-align: center; border: 1px solid #f1f5f9; }

  /* ACTION CARDS */
  .action-btn-card { 
    border-radius: 20px; 
    padding: 20px; 
    color: white; 
    display: flex; 
    align-items: center; 
    gap: 15px; 
    cursor: pointer; 
    transition: 0.3s; 
    height: 100%; 
    border: none; 
    width: 100%; 
    text-decoration: none; 
  }
  .action-btn-card:hover { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
  .action-icon-box { 
    width: 48px; height: 48px; 
    background: rgba(255,255,255,0.2); 
    border-radius: 12px; 
    display: flex; align-items: center; justify-content: center; 
    font-size: 1.4rem; flex-shrink: 0; 
  }
`;

const Dashboard = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const adminData = {
    name: "Vikram Singh",
    role: "Senior Administrator",
    id: "EMP-9921",
    email: "vikram.admin@schoolhub.edu",
    lastLogin: "Today, 08:30 AM"
  };

  const renderContent = () => {
    const PageHeader = ({ title }) => (
      <div className="d-flex justify-content-between align-items-center mb-4 animate-fade-in">
        <h3 className="fw-bold m-0">{title}</h3>
      </div>
    );

    switch(activeTab) {
      case 'students': return <Students />;
      case 'attendance': return <><PageHeader title="Attendance Management" /><Attendance date={selectedDate} /></>;
      case 'bus-boarding': return <><PageHeader title="Bus Boarding System" /><BusBoarding date={selectedDate} /></>;
      case 'library': return <><PageHeader title="Library Logs" /><Library date={selectedDate} /></>; 
      case 'payments': return <><PageHeader title="Fee Collection" /><Payments date={selectedDate} /></>;
      case 'settings': return <Settings />;
      default: return (
        <div className="animate-fade-in">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div><h2 className="fw-bold mb-1">Dashboard Overview</h2><p className="text-muted m-0">Quick stats for {selectedDate}</p></div>
            <div className="gateway-status d-none d-md-block"><i className="bi bi-cpu-fill me-2"></i>RFID Gateway: <span className="fw-bold">Connected</span></div>
          </div>

          <div className="row g-4 mb-5">
            <StatCard title="Total Students" value="2,847" trend="+12%" icon="people" bg="#e0fcfb" color="#00d9cc" />
            <StatCard title="Attendance" value="2,651" trend="93.1%" icon="calendar-check" bg="#f3e8ff" color="#a855f7" />
            <StatCard title="Library Today" value="142" trend="12 Pending" icon="book" bg="#fff1f2" color="#ff4d6d" />
            <StatCard title="Bus Load" value="1,102" trend="84%" icon="bus-front" bg="#fff7ed" color="#f59e0b" />
          </div>
          
          <div className="row g-4 mb-5">
            <div className="col-lg-7">
              <div className="section-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold m-0"><i className="bi bi-broadcast text-success me-2"></i>Live RFID Activity</h6>
                  <button onClick={() => setActiveTab('attendance')} className="btn btn-sm btn-outline-primary border-0 fw-bold">View All</button>
                </div>
                <ActivityItem name="Arjun Sharma" id="STU-2024-001" type="Entry" time="08:45 AM" img="https://i.pravatar.cc/150?u=11" isActive={true} />
                <ActivityItem name="Priya Patel" id="STU-2024-042" type="Entry" time="09:12 AM" img="https://i.pravatar.cc/150?u=12" isActive={true} />
                <ActivityItem name="Rahul Kumar" id="STU-2024-089" type="Exit" time="11:30 AM" img="https://i.pravatar.cc/150?u=13" isActive={false} />
              </div>
            </div>
            <div className="col-lg-5">
              <div className="section-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold m-0"><i className="bi bi-journal-bookmark-fill text-danger me-2"></i>Library Logs</h6>
                  <button onClick={() => setActiveTab('library')} className="btn btn-sm btn-outline-danger border-0 fw-bold">Full Log</button>
                </div>
                <ActivityItem name="Saira Banu" id="STU-2024-112" type="Borrowed" time="10:15 AM" img="https://i.pravatar.cc/150?u=21" isActive={true} />
                <ActivityItem name="Kevin Hart" id="STU-2024-901" type="Returned" time="10:45 AM" img="https://i.pravatar.cc/150?u=22" isActive={true} />
              </div>
            </div>
          </div>

          <h6 className="fw-bold mb-3 text-muted">Quick Access Scanners</h6>
          <div className="row g-4 mb-4">
            <ActionCard onClick={() => setActiveTab('attendance')} icon="upc-scan" title="Attendance" sub="Mark Entry/Exit" gradient="linear-gradient(135deg, #00d9cc 0%, #00b4ad 100%)" />
            <ActionCard onClick={() => setActiveTab('bus-boarding')} icon="bus-front" title="Bus Boarding" sub="Track Boarding" gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
            <ActionCard onClick={() => setActiveTab('library')} icon="book" title="Library Logs" sub="Issue/Return" gradient="linear-gradient(135deg, #ff4d6d 0%, #e63946 100%)" />
            <ActionCard onClick={() => setActiveTab('payments')} icon="credit-card" title="Collect Fees" sub="Process Payments" gradient="linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)" />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container" onClick={() => showAdminMenu && setShowAdminMenu(false)}>
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
          <NavItem active={activeTab === 'bus-boarding'} icon="bus-front" label="Bus Boarding" onClick={() => setActiveTab('bus-boarding')} collapsed={isCollapsed} />
          <NavItem active={activeTab === 'library'} icon="book" label="Library" onClick={() => setActiveTab('library')} collapsed={isCollapsed} />
          <NavItem active={activeTab === 'payments'} icon="credit-card" label="Payments" onClick={() => setActiveTab('payments')} collapsed={isCollapsed} />
          <NavItem active={activeTab === 'settings'} icon="gear" label="Settings" onClick={() => setActiveTab('settings')} collapsed={isCollapsed} />
        </nav>

        <div className="nav-item text-danger mt-auto" onClick={() => setIsLoggingOut(true)} style={{cursor: 'pointer'}}>
          <i className="bi bi-box-arrow-left fs-5"></i> 
          {!isCollapsed && <span className="ms-1">Logout</span>}
        </div>
      </aside>

      <main className="main-content">
        {isLoggingOut && (
          <div className="logout-overlay animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal">
                <h4 className="fw-bold">Confirm Logout</h4>
                <p className="text-muted">Are you sure you want to end your session?</p>
                <div className="d-flex flex-column gap-2 mt-4">
                  <button className="btn btn-danger py-2 fw-bold" onClick={onLogout}>Sign Out</button>
                  <button className="btn btn-light py-2" onClick={() => setIsLoggingOut(false)}>Cancel</button>
                </div>
            </div>
          </div>
        )}

        <header className="d-flex justify-content-between align-items-center mb-5">
          <div className="search-container">
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input type="text" className="search-input" placeholder="Search students..." />
            </div>
            <input type="date" className="header-date-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>

          <div className="position-relative">
            <div className="admin-profile-trigger" onClick={(e) => { e.stopPropagation(); setShowAdminMenu(!showAdminMenu); }}>
              <div className="text-end d-none d-sm-block">
                <div className="fw-bold small">{adminData.name}</div>
                <div className="text-muted" style={{fontSize: '10px'}}>{adminData.role}</div>
              </div>
              <img src="https://ui-avatars.com/api/?name=Vikram+Singh&background=00d9cc&color=fff" className="rounded-circle border" style={{width: 40, height: 40}} alt="Admin Avatar" />
            </div>

            {showAdminMenu && (
              <div className="admin-dropdown animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="text-center mb-3">
                    <img src="https://ui-avatars.com/api/?name=Vikram+Singh&background=00d9cc&color=fff" className="rounded-circle mb-2" style={{width: 60, height: 60}} alt="Admin Profile" />
                    <h6 className="fw-bold m-0">{adminData.name}</h6>
                    <small className="text-muted">{adminData.email}</small>
                </div>
                <hr className="my-3 opacity-10" />
                <div className="small mb-3">
                    <div className="d-flex justify-content-between mb-1"><span>ID:</span><span className="fw-bold">{adminData.id}</span></div>
                    <div className="d-flex justify-content-between"><span>Last Login:</span><span className="fw-bold">{adminData.lastLogin}</span></div>
                </div>
                <button className="btn btn-sm btn-light w-100 mb-2 py-2" onClick={() => { setActiveTab('settings'); setShowAdminMenu(false); }}>
                  <i className="bi bi-person-gear me-2"></i>Profile Settings
                </button>
                <button className="btn btn-sm btn-outline-danger w-100 py-2" onClick={() => setIsLoggingOut(true)}>
                  <i className="bi bi-power me-2"></i>Logout
                </button>
              </div>
            )}
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
    <i className={`bi bi-${icon} fs-5`}></i>{!collapsed && <span>{label}</span>}
  </button>
);

const StatCard = ({ title, value, trend, icon, bg, color }) => (
  <div className="col-md-3"><div className="stat-card"><div><div className="text-muted small mb-1">{title}</div><div className="h4 fw-bold m-0">{value}</div><div className="small mt-1" style={{color}}>{trend}</div></div><div className="stat-icon" style={{background: bg, color}}><i className={`bi bi-${icon}`}></i></div></div></div>
);

const ActivityItem = ({ name, id, type, time, img }) => (
  <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
    <div className="d-flex align-items-center gap-3">
      <img src={img} className="rounded-circle border" style={{width: 36, height: 36}} alt={name} />
      <div>
        <div className="fw-bold small">{name}</div>
        <div className="text-muted" style={{fontSize: '10px'}}>{id} • <span className="text-primary fw-bold">{type}</span></div>
      </div>
    </div>
    <div className="text-muted" style={{fontSize: '10px'}}>{time}</div>
  </div>
);

const ActionCard = ({ icon, title, sub, gradient, onClick }) => (
  <div className="col-md-3">
    <button className="action-btn-card shadow-sm" style={{background: gradient}} onClick={onClick}>
        <div className="action-icon-box"><i className={`bi bi-${icon}`}></i></div>
        <div className="text-start">
          <div className="fw-bold" style={{fontSize: '1rem'}}>{title}</div>
          <div className="small opacity-75" style={{fontSize: '0.75rem'}}>{sub}</div>
        </div>
    </button>
  </div>
);

export default Dashboard;