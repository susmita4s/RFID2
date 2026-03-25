



import React, { useState, useEffect } from 'react';

const busStyles = `
  .bus-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
  .route-card { 
    background: white; 
    border-radius: 20px; 
    padding: 16px; 
    border: 1px solid #f1f5f9; 
    margin-bottom: 12px;
    cursor: pointer;
    transition: 0.2s;
  }
  .route-card:hover { transform: translateX(5px); border-color: var(--accent-cyan); }
  
  .map-container {
    height: 400px;
    background: #f1f5f9;
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  /* Animated Bus Markers */
  .gps-marker {
    position: absolute;
    z-index: 10;
    transition: all 2.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .marker-icon {
    width: 14px;
    height: 14px;
    background: #ef4444;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
  }

  .pulse-ring {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 2px solid rgba(239, 68, 68, 0.4);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: gps-pulse 2s infinite;
  }

  @keyframes gps-pulse {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
  }

  /* Student Detail Modal Styles */
  .student-modal-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000;
  }
  .student-modal {
    background: white;
    width: 400px;
    border-radius: 28px;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .profile-header {
    background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
    padding: 30px;
    color: white;
    text-align: center;
  }

  .detail-row {
    padding: 15px 25px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
  }

  .boarding-list-container {
    max-height: 520px;
    overflow-y: auto;
    padding-right: 8px;
  }
`;

const BusBoarding = ({ date }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [busPositions, setBusPositions] = useState([
    { id: 'BUS-01', top: 40, left: 30, color: '#ef4444' },
    { id: 'BUS-02', top: 65, left: 75, color: '#a855f7' }
  ]);

  useEffect(() => {
    const moveBuses = setInterval(() => {
      setBusPositions(prev => prev.map(bus => ({
        ...bus,
        top: Math.max(15, Math.min(85, bus.top + (Math.random() - 0.5) * 8)),
        left: Math.max(15, Math.min(85, bus.left + (Math.random() - 0.5) * 8)),
      })));
    }, 3000);
    return () => clearInterval(moveBuses);
  }, []);

  const routes = [
    { id: 'BUS-01', driver: 'Suresh Kumar', route: 'North Sector Loop', capacity: '45/50', status: 'On Route' },
    { id: 'BUS-02', driver: 'Amit Singh', route: 'South Avenue Express', capacity: '32/50', status: 'On Route' },
    { id: 'BUS-03', driver: 'Vikram J.', route: 'East Gate Shuttle', capacity: '0/50', status: 'Idle' },
  ];

  const logs = [
    { name: 'Karan Mehra', id: 'STU-992', stop: 'Sector 14', time: '07:45 AM', bus: 'BUS-01', parent: 'Mr. Rajesh Mehra', phone: '+91 98765-43210', address: 'B-42, Blue Apartments' },
    { name: 'Ishita Rai', id: 'STU-441', stop: 'Main Square', time: '08:10 AM', bus: 'BUS-01', parent: 'Mrs. Sunita Rai', phone: '+91 98221-10044', address: 'Villa 7, Green View' },
    { name: 'Arnav Vats', id: 'STU-112', stop: 'Lake View', time: '08:22 AM', bus: 'BUS-02', parent: 'Mr. Anil Vats', phone: '+91 91122-33445', address: 'Flat 201, Lake Residency' },
    { name: 'Sana Khan', id: 'STU-201', stop: 'Park Street', time: '08:35 AM', bus: 'BUS-01', parent: 'Mr. Yusuf Khan', phone: '+91 70012-34567', address: 'House 11, Park Lane' },
    { name: 'Rahul Dev', id: 'STU-882', stop: 'Green Park', time: '08:42 AM', bus: 'BUS-02', parent: 'Mr. Mahesh Dev', phone: '+91 88001-12233', address: 'Sector 5, Gate 2' },
  ];

  return (
    <div className="animate-fade-in">
      <style>{busStyles}</style>
      
      {/* STUDENT PROFILE MODAL */}
      {selectedStudent && (
        <div className="student-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="student-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-header">
              <img src={`https://i.pravatar.cc/150?u=${selectedStudent.id}`} className="rounded-circle border border-4 border-white mb-3" style={{width: 80, height: 80}} alt="" />
              <h4 className="m-0 fw-bold">{selectedStudent.name}</h4>
              <div className="opacity-75 small">{selectedStudent.id}</div>
            </div>
            <div className="p-2">
              <div className="detail-row">
                <span className="text-muted small">Assigned Stoppage</span>
                <span className="fw-bold">{selectedStudent.stop}</span>
              </div>
              <div className="detail-row">
                <span className="text-muted small">Parent/Guardian</span>
                <span className="fw-bold">{selectedStudent.parent}</span>
              </div>
              <div className="detail-row">
                <span className="text-muted small">Contact Number</span>
                <span className="fw-bold text-primary">{selectedStudent.phone}</span>
              </div>
              <div className="detail-row">
                <span className="text-muted small">Home Address</span>
                <span className="fw-bold text-end" style={{maxWidth: '150px'}}>{selectedStudent.address}</span>
              </div>
            </div>
            <div className="p-4 d-flex gap-2">
              <button className="btn btn-primary w-100 rounded-pill py-2" onClick={() => window.open(`tel:${selectedStudent.phone}`)}>
                <i className="bi bi-telephone-fill me-2"></i>Call Parent
              </button>
              <button className="btn btn-light w-100 rounded-pill py-2" onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="bus-grid">
        <div className="d-flex flex-column gap-4">
          <div className="section-card p-0 overflow-hidden shadow-sm border-0">
            <div className="p-4 d-flex justify-content-between align-items-center bg-white">
              <h6 className="fw-bold m-0 text-dark"><i className="bi bi-geo-alt-fill text-danger me-2"></i>Live Fleet Map</h6>
              <span className="badge bg-info-subtle text-info border-0 px-3 py-2" style={{borderRadius: '10px'}}>2 Buses Tracking</span>
            </div>
            <div className="map-container">
              <svg width="100%" height="100%" className="position-absolute">
                <path d="M 0 150 Q 300 180 600 150 T 1200 150" fill="none" stroke="#e2e8f0" strokeWidth="30" />
                <path d="M 40% 0 L 40% 100%" fill="none" stroke="#e2e8f0" strokeWidth="25" />
              </svg>
              {busPositions.map(bus => (
                <div key={bus.id} className="gps-marker" style={{ top: `${bus.top}%`, left: `${bus.left}%` }}>
                  <div className="pulse-ring" style={{ borderColor: bus.color }}></div>
                  <div className="marker-icon" style={{ backgroundColor: bus.color }}></div>
                  <div className="position-absolute top-100 start-50 translate-middle-x mt-2">
                    <span className="badge bg-dark px-2">{bus.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h6 className="fw-bold mb-3 text-secondary" style={{fontSize: '0.9rem', letterSpacing: '0.5px'}}>ACTIVE VEHICLE STATUS</h6>
            <div className="row g-3">
              {routes.map(route => (
                <div key={route.id} className="col-md-6">
                  <div className="route-card border-0 shadow-sm">
                    <div className="d-flex justify-content-between mb-3">
                      <div className="stat-icon" style={{background: '#f1f5f9', color: '#334155', width: 40, height: 40}}><i className="bi bi-bus-front"></i></div>
                      <span className={`bus-badge ${route.status === 'Idle' ? 'status-off' : 'status-on'}`}>{route.status}</span>
                    </div>
                    <div className="fw-bold text-dark">{route.id} — {route.driver}</div>
                    <div className="text-muted small mb-3">{route.route}</div>
                    <div className="progress-bar-bg" style={{height: '6px'}}><div className="progress-fill" style={{width: '75%', background: 'var(--accent-cyan)'}}></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section-card border-0 shadow-sm h-100">
          <h6 className="fw-bold mb-4 d-flex align-items-center text-dark">
            <i className="bi bi-clock-history text-primary me-2"></i>Boarding Activity
          </h6>
          <div className="search-mini mb-4 border-0 bg-light p-3 d-flex align-items-center rounded-3">
            <i className="bi bi-search me-2 text-muted"></i>
            <input 
              type="text" 
              placeholder="Filter by student..." 
              className="bg-transparent border-0 w-100 outline-none" 
              style={{fontSize: '0.85rem', outline: 'none'}}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />
          </div>

          <div className="boarding-list-container">
            {logs.filter(p => p.name.toLowerCase().includes(searchTerm)).map((p, idx) => (
              <div key={idx} 
                   className="p-3 mb-3 rounded-4 bg-white border border-light shadow-sm" 
                   style={{cursor: 'pointer'}} 
                   onClick={() => setSelectedStudent(p)}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <img src={`https://i.pravatar.cc/150?u=${p.id}`} className="rounded-circle" style={{width: 32, height: 32}} alt="" />
                    <div>
                      <div className="fw-bold small text-dark">{p.name}</div>
                      <div className="text-muted" style={{fontSize: '10px'}}>{p.id}</div>
                    </div>
                  </div>
                  <span className="badge bg-light text-dark border-0">{p.bus}</span>
                </div>
                <div className="d-flex justify-content-between mt-3 text-muted" style={{fontSize: '11px'}}>
                  <span><i className="bi bi-pin-map-fill me-1 text-primary"></i>{p.stop}</span>
                  <span>{p.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusBoarding;