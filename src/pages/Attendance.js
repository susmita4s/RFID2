import React, { useState, useMemo } from 'react';

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedDate, setSelectedDate] = useState("2024-01-15");
  const [activeMenu, setActiveMenu] = useState(null); 

  const [attendanceData] = useState([
    { id: "STU-2024-001", name: "Arjun Sharma", class: "10-A", checkIn: "08:45 AM", checkOut: "03:30 PM", status: "present" },
    { id: "STU-2024-042", name: "Priya Patel", class: "10-A", checkIn: "08:52 AM", checkOut: "03:30 PM", status: "present" },
    { id: "STU-2024-089", name: "Rahul Kumar", class: "9-B", checkIn: "09:15 AM", checkOut: "03:30 PM", status: "late" },
    { id: "STU-2024-156", name: "Sneha Gupta", class: "9-A", checkIn: "--:--", checkOut: "--:--", status: "absent" },
    { id: "STU-2024-023", name: "Vikram Singh", class: "10-B", checkIn: "08:30 AM", checkOut: "01:00 PM", status: "half-day" },
  ]);

  const filteredData = useMemo(() => {
    return attendanceData.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.id.includes(searchTerm);
      const matchesClass = selectedClass === "All Classes" || student.class === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [searchTerm, selectedClass, attendanceData]);

  return (
    <div className="animate-fade-in p-3" onClick={() => setActiveMenu(null)}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold m-0 text-dark">Attendance Management</h3>
          <p className="text-muted small">Real-time RFID monitoring and reporting</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary shadow-sm rounded-3"><i className="bi bi-download me-2"></i>Export</button>
          <button className="btn btn-primary shadow-sm rounded-3 px-4" style={{ backgroundColor: '#6f42c1', border: 'none' }}><i className="bi bi-broadcast me-2"></i>Scan Mode</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        <StatusCard title="Present" value="2,451" subtext="86% total" color="success" />
        <StatusCard title="Absent" value="198" subtext="7% total" color="danger" />
        <StatusCard title="Late" value="142" subtext="5% total" color="warning" />
        <StatusCard title="Half Day" value="56" subtext="2% total" color="info" />
      </div>

      <div className="row g-4 mb-4">
        {/* Main List */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-visible">
            <div className="p-3 bg-white border-bottom d-flex gap-3 align-items-center">
              <input type="text" className="form-control bg-light border-0 form-control-sm" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{maxWidth: '200px'}} />
              <select className="form-select form-select-sm bg-light border-0 w-auto" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option>All Classes</option><option>10-A</option><option>10-B</option><option>9-A</option><option>9-B</option>
              </select>
            </div>

            <div className="list-group list-group-flush">
              {filteredData.map((student) => (
                <div key={student.id} className="list-group-item border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <img src={`https://i.pravatar.cc/150?u=${student.id}`} className="rounded-circle" style={{ width: '40px' }} alt="" />
                    <div>
                      <div className="fw-bold small">{student.name}</div>
                      <div className="text-muted" style={{ fontSize: '10px' }}>{student.id}</div>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center gap-4">
                    <div className="text-center d-none d-md-block">
                      <div className="text-muted" style={{ fontSize: '10px' }}>Check In/Out</div>
                      <div className="small fw-semibold">{student.checkIn} / {student.checkOut}</div>
                    </div>
                    <StatusBadge status={student.status} />
                    
                    {/* Three Dots Menu with dropdown */}
                    <div className="position-relative">
                      <button 
                        className="btn btn-link text-muted p-0" 
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === student.id ? null : student.id); }}
                      >
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      
                      {activeMenu === student.id && (
                        <div className="position-absolute end-0 mt-2 py-2 bg-white shadow-lg rounded-3 border" style={{ zIndex: 1000, minWidth: '160px' }}>
                          <button className="dropdown-item small py-2" onClick={() => alert('Editing '+student.name)}><i className="bi bi-pencil me-2"></i> Edit Record</button>
                          <button className="dropdown-item small py-2" onClick={() => alert('Messaging Parents')}><i className="bi bi-chat-left-text me-2"></i> Message Parent</button>
                          <button className="dropdown-item small py-2 text-primary" onClick={() => alert('Viewing Profile')}><i className="bi bi-person-badge me-2"></i> View Profile</button>
                          <div className="dropdown-divider"></div>
                          <button className="dropdown-item small py-2 text-danger" onClick={() => alert('Deleting')}><i className="bi bi-trash me-2"></i> Delete Log</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h6 className="fw-bold mb-4"><i className="bi bi-people me-2 text-primary"></i>Class Summary</h6>
            <SummaryProgress label="10-A" val="42/45" percent={93} />
            <SummaryProgress label="10-B" val="38/44" percent={86} />
            <SummaryProgress label="9-A" val="40/42" percent={95} />
            <SummaryProgress label="9-B" val="35/40" percent={88} />
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3"><i className="bi bi-clock-history me-2 text-info"></i>Live Scans</h6>
            <div className="d-flex flex-column gap-3 mt-2">
              <RecentItem name="Arjun S." time="08:45 AM" type="Entry" color="success" />
              <RecentItem name="Priya P." time="08:52 AM" type="Entry" color="success" />
              <RecentItem name="Vikram S." time="01:00 PM" type="Exit" color="warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Trend & Quick Stats */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-4">Weekly Attendance Trend</h6>
            <div className="d-flex align-items-end justify-content-between h-100 px-2 mt-2" style={{ minHeight: '120px' }}>
              {[65, 80, 45, 90, 85, 30, 75].map((h, i) => (
                <div key={i} className="bg-primary bg-opacity-25 rounded-top" style={{ height: '100px', width: '10%', position: 'relative' }}>
                  <div className="bg-primary rounded-top" style={{ height: `${h}%`, width: '100%', position: 'absolute', bottom: 0 }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NEW COMPONENT: System Notifications Area */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-light bg-opacity-50">
            <h6 className="fw-bold mb-3"><i className="bi bi-shield-check me-2 text-success"></i>System Health</h6>
            <div className="d-flex flex-column gap-2">
              <div className="bg-white p-2 rounded-3 border-start border-4 border-success d-flex justify-content-between align-items-center">
                <span className="small">RFID Reader Node #01</span>
                <span className="badge bg-success-subtle text-success">Online</span>
              </div>
              <div className="bg-white p-2 rounded-3 border-start border-4 border-primary d-flex justify-content-between align-items-center">
                <span className="small">SMS Gateway Status</span>
                <span className="badge bg-primary-subtle text-primary">Active</span>
              </div>
              <div className="bg-white p-2 rounded-3 border-start border-4 border-warning d-flex justify-content-between align-items-center">
                <span className="small">Database Backup</span>
                <span className="text-muted" style={{fontSize: '10px'}}>2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const StatusCard = ({ title, value, subtext, color }) => (
  <div className="col-md-3">
    <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
      <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '9px' }}>{title}</small>
      <h3 className="fw-bold my-1">{value}</h3>
      <div className={`small text-${color} fw-bold`} style={{fontSize: '11px'}}>{subtext}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    present: { class: 'bg-success-subtle text-success', label: 'Present' },
    absent: { class: 'bg-danger-subtle text-danger', label: 'Absent' },
    late: { class: 'bg-warning-subtle text-warning', label: 'Late' },
    'half-day': { class: 'bg-info-subtle text-info', label: 'Half Day' }
  };
  const { class: className, label } = config[status];
  return <span className={`badge ${className} rounded-pill px-3 py-2 fw-normal`}>{label}</span>;
};

const SummaryProgress = ({ label, val, percent }) => (
  <div className="mb-3">
    <div className="d-flex justify-content-between small mb-1">
      <span className="fw-bold" style={{fontSize: '12px'}}>{label}</span>
      <span className="text-muted">{val}</span>
    </div>
    <div className="progress" style={{ height: '5px' }}>
      <div className="progress-bar" style={{ width: `${percent}%`, backgroundColor: '#6f42c1' }}></div>
    </div>
  </div>
);

const RecentItem = ({ name, time, type, color }) => (
  <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded-3">
    <span className="small fw-bold" style={{fontSize: '11px'}}>{name}</span>
    <div className="d-flex gap-2">
      <span className={`badge bg-${color}-subtle text-${color}`} style={{ fontSize: '9px' }}>{type}</span>
      <span className="text-muted" style={{ fontSize: '9px' }}>{time}</span>
    </div>
  </div>
);

export default Attendance;