



import React, { useState, useEffect, useMemo } from 'react';

const Attendance = () => {
  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const [activeMenu, setActiveMenu] = useState(null); 
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, activeTags: 0 });
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  const fetchAttendanceAndStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const query = new URLSearchParams({ date: selectedDate, class: selectedClass, search: searchTerm }).toString();
      
      const [attRes, statsRes] = await Promise.all([
        fetch(`/api/attendance?${query}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/attendance/stats?date=${selectedDate}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const attData = await attRes.json();
      const statsData = await statsRes.json();
      
      if (attData.success) setAttendanceData(attData.data);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAttendanceAndStats();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedClass, selectedDate]);

  // --- Logic ---
  const toggleScanMode = async (studentDbId, currentStatus) => {
    try {
      // Optimistic UI update
      setAttendanceData(prev => prev.map(s => s.dbId === studentDbId ? { ...s, rfidEnabled: !currentStatus } : s));
      
      const token = localStorage.getItem('token');
      await fetch(`/api/attendance/rfid-toggle/${studentDbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: selectedDate, enabled: !currentStatus })
      });
      fetchAttendanceAndStats(); // Refresh stats
    } catch (error) {
      console.error('Toggle failed', error);
      fetchAttendanceAndStats(); // Revert on failure
    }
  };

  const handleDeleteEntry = async (attendanceId) => {
    if (!attendanceId) return;
    if (!window.confirm('Are you sure you want to delete this attendance entry?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/attendance/${attendanceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAttendanceAndStats();
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleManualCheckIn = async (studentDbId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentDbId, date: selectedDate })
      });
      fetchAttendanceAndStats();
    } catch (error) {
      console.error('Manual Check-in failed', error);
    }
  };

  const handleManualAbsent = async (studentDbId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/attendance/mark-absent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentDbId, date: selectedDate })
      });
      fetchAttendanceAndStats();
    } catch (error) {
      console.error('Manual Absent failed', error);
    }
  };

  return (
    <div className="animate-fade-in p-3" onClick={() => setActiveMenu(null)}>
      
      {/* --- Header Section --- */}
      <div className="mb-4">
        <h4 className="fw-bold m-0 text-dark">Attendance Management</h4>
        <p className="text-muted small">Real-time RFID monitoring and reporting</p>
      </div>

      {/* --- Summary Cards --- */}
      <div className="row g-4 mb-4">
        <StatusCard title="Present" value={stats.present} subtext="Tracked today" color="success" />
        <StatusCard title="Absent" value={stats.absent} subtext="No scan recorded" color="danger" />
        <StatusCard title="Late" value={stats.late} subtext="After 9:00 AM" color="warning" />
        <StatusCard title="Active Tags" value={stats.activeTags} subtext="RFID Enabled" color="primary" />
      </div>

      <div className="row g-4 mb-4">
        {/* --- Main Student List --- */}
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm rounded-4 overflow-visible">
            {/* Filter Bar */}
            <div className="p-3 bg-white border-bottom d-flex flex-wrap gap-3 align-items-center justify-content-between">
              <div className="d-flex gap-2 flex-grow-1">
                <div className="input-group input-group-sm" style={{maxWidth: '220px'}}>
                  <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                  <input type="text" className="form-control bg-light border-0" placeholder="Search student..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="form-select form-select-sm bg-light border-0 w-auto" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option>All Classes</option><option>10-A</option><option>10-B</option><option>9-A</option><option>9-B</option>
                </select>
                <div className="input-group input-group-sm w-auto">
                   <span className="input-group-text bg-light border-0"><i className="bi bi-calendar3 text-muted"></i></span>
                   <input type="date" className="form-control bg-light border-0" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
              </div>
              <span className="badge bg-light text-dark fw-normal border px-3 py-2">{attendanceData.length} Students Listed</span>
            </div>

            {/* List Headings */}
            <div className="px-4 py-2 bg-light d-none d-md-flex align-items-center text-muted fw-bold border-bottom" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              <div style={{ flex: '2.5' }}>STUDENT DETAILS</div>
              <div style={{ flex: '1' }} className="text-center">RFID SCAN</div>
              <div style={{ flex: '1.5' }} className="text-center">CHECK IN / OUT</div>
              <div style={{ flex: '1' }} className="text-center">STATUS</div>
              <div style={{ flex: '0.5' }} className="text-end pe-2">ACTION</div>
            </div>

            <div className="list-group list-group-flush position-relative">
              {loading && (
                <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75 z-index-1">
                  <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
              )}
              {attendanceData.length === 0 && !loading && (
                <div className="text-center py-5 text-muted">No students found for this filter.</div>
              )}
              {attendanceData.map((student) => (
                <div key={student.dbId} className="list-group-item border-bottom px-4 py-3 d-flex align-items-center hover-row">
                  {/* Student Info */}
                  <div className="d-flex align-items-center gap-3" style={{ flex: '2.5' }} data-label="Student">
                    <div className="position-relative">
                        <img src={`https://i.pravatar.cc/150?u=${student.dbId}`} className="rounded-circle border" style={{ width: '42px', height: '42px', objectFit: 'cover' }} alt="" />
                        <div className={`position-absolute bottom-0 end-0 rounded-circle border border-white ${student.rfidEnabled ? 'bg-success' : 'bg-secondary'}`} style={{width: '12px', height: '12px'}}></div>
                    </div>
                    <div>
                      <div className="fw-bold small text-dark">{student.name}</div>
                      <div className="text-muted font-monospace" style={{ fontSize: '10px' }}>{student.id}</div>
                    </div>
                  </div>
                  
                  {/* Scan Toggle */}
                  <div style={{ flex: '1' }} className="d-flex justify-content-center" data-label="RFID Scan">
                    <div className="form-check form-switch custom-switch">
                      <input 
                        className="form-check-input shadow-none" 
                        type="checkbox" 
                        role="switch"
                        checked={student.rfidEnabled} 
                        onChange={() => toggleScanMode(student.dbId, student.rfidEnabled)}
                      />
                    </div>
                  </div>

                  {/* Times */}
                  <div style={{ flex: '1.5' }} className="text-center" data-label="Check In/Out">
                    <div className="small fw-semibold text-secondary">
                        {student.checkIn} <span className="text-muted px-1">•</span> {student.checkOut}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ flex: '1' }} className="text-center" data-label="Status">
                    <StatusBadge status={student.status} />
                  </div>
                  
                  {/* Actions Area */}
                  <div style={{ flex: '0.5' }} className="position-relative text-end" data-label="Action">
                    <button 
                      className={`btn btn-sm rounded-3 border-0 transition-all ${activeMenu === student.dbId ? 'btn-secondary text-white' : 'btn-light text-muted'}`}
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === student.dbId ? null : student.dbId); }}
                    >
                      <i className={`bi ${activeMenu === student.dbId ? 'bi-x-lg' : 'bi-three-dots'}`}></i>
                    </button>

                    
                    {activeMenu === student.dbId && (
                      <div className="position-absolute end-0 mt-2 py-2 bg-white shadow-lg rounded-3 border" style={{ zIndex: 1000, minWidth: '180px' }}>
                        <div className="px-3 py-1 mb-1 border-bottom"><small className="text-muted fw-bold">QUICK ACTIONS</small></div>
                        <button className="dropdown-item small py-2 text-success d-flex align-items-center gap-2" onClick={() => { setActiveMenu(null); handleManualCheckIn(student.dbId); }}>
                            <i className="bi bi-check-circle-fill"></i> Mark Present
                        </button>
                        <button className="dropdown-item small py-2 text-warning d-flex align-items-center gap-2" onClick={() => { setActiveMenu(null); handleManualAbsent(student.dbId); }}>
                            <i className="bi bi-x-circle-fill"></i> Mark Absent
                        </button>
                        <button className="dropdown-item small py-2 d-flex align-items-center gap-2" onClick={() => window.print()}>
                            <i className="bi bi-printer-fill text-primary"></i> Print Slip
                        </button>
                        <button className="dropdown-item small py-2 d-flex align-items-center gap-2" onClick={() => alert(`SMS to ${student.phone}`)}>
                            <i className="bi bi-chat-left-text-fill text-success"></i> Message Parent
                        </button>
                        <div className="dropdown-divider"></div>
                        <button className="dropdown-item small py-2 text-danger d-flex align-items-center gap-2" onClick={() => { setActiveMenu(null); handleDeleteEntry(student.attendanceId); }} disabled={!student.attendanceId}>
                            <i className="bi bi-trash3-fill"></i> {student.attendanceId ? 'Delete Entry' : 'No Entry to Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Trend & Health Sections --- */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-4">Weekly Attendance Trend</h6>
            <div className="d-flex align-items-end justify-content-between h-100 px-2 mt-2" style={{ minHeight: '140px' }}>
              {[65, 80, 45, 90, 85, 30, 75].map((h, i) => (
                <div key={i} className="bg-primary bg-opacity-10 rounded-top" style={{ height: '100%', width: '10%', position: 'relative' }}>
                  <div className="bg-primary rounded-top transition-all" style={{ height: `${h}%`, width: '100%', position: 'absolute', bottom: 0, opacity: 0.8 }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-light bg-opacity-50">
            <h6 className="fw-bold mb-3 text-dark"><i className="bi bi-activity me-2 text-success"></i>Network & System Status</h6>
            <div className="d-flex flex-column gap-2">
              <HealthItem label="RFID Gateway Node #1" status="Online" color="success" />
              <HealthItem label="Parent SMS Service" status="Ready" color="primary" />
              <HealthItem label="Cloud Sync Storage" status="Syncing" color="warning" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hover-row:hover { background-color: #fcfcfd; }
        .transition-all { transition: all 0.2s ease-in-out; }
        .custom-switch .form-check-input:checked { background-color: #6f42c1; border-color: #6f42c1; }
        .dropdown-item { transition: background 0.1s; cursor: pointer; }
        .dropdown-item:hover { background-color: #f8f9fa; }
      `}</style>
    </div>
  );
};

// --- Sub-components ---

const StatusCard = ({ title, value, subtext, color }) => (
  <div className="col-md-3">
    <div className={`card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-${color}`}>
      <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>{title}</small>
      <h3 className="fw-bold my-1">{value}</h3>
      <div className={`small text-${color} fw-bold`} style={{fontSize: '11px'}}>{subtext}</div>
    </div>
  </div>
);

const HealthItem = ({ label, status, color }) => (
    <div className="bg-white p-2 rounded-3 border-start border-4 border-success d-flex justify-content-between align-items-center shadow-sm" style={{borderColor: `var(--bs-${color}) !important`}}>
        <span className="small fw-semibold text-secondary">{label}</span>
        <span className={`badge bg-${color}-subtle text-${color} border border-${color} border-opacity-25`}>{status}</span>
    </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    present: { class: 'bg-success-subtle text-success border-success', label: 'Present' },
    absent: { class: 'bg-danger-subtle text-danger border-danger', label: 'Absent' },
    late: { class: 'bg-warning-subtle text-warning border-warning', label: 'Late' },
    'half-day': { class: 'bg-info-subtle text-info border-info', label: 'Half Day' }
  };
  const { class: className, label } = config[status];
  return <span className={`badge ${className} rounded-pill px-3 py-2 fw-semibold border border-opacity-10`} style={{minWidth: '85px'}}>{label}</span>;
};

export default Attendance;