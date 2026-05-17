import React, { useState, useEffect, createContext, useContext, useReducer, useMemo } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Styles ---
const busStyles = `
  .bus-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
  .route-card { 
    background: white; border-radius: 20px; padding: 16px; border: 1px solid #f1f5f9; 
    margin-bottom: 12px; cursor: pointer; transition: 0.2s;
  }
  .route-card:hover { transform: translateX(5px); border-color: #06b6d4; }
  .map-container { height: 400px; background: #f1f5f9; border-radius: 24px; position: relative; overflow: hidden; border: 1px solid #e2e8f0; }
  .custom-bus-marker { background: transparent; border: none; }
  .boarding-list-container { max-height: 520px; overflow-y: auto; padding-right: 8px; }
  .status-badge { font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: bold; }
  .status-on-route { background: #d1fae5; color: #059669; }
  .status-delayed { background: #fef3c7; color: #d97706; }
  .status-offline { background: #fee2e2; color: #dc2626; }
  .status-arrived { background: #dbeafe; color: #2563eb; }
  .status-maintenance { background: #f3f4f6; color: #4b5563; }
`;

// --- Helpers ---
const createBusIcon = (status) => {
  const color = status === 'On Route' ? '#10b981' : status === 'Delayed' ? '#f59e0b' : status === 'Offline' ? '#ef4444' : status === 'Arrived' ? '#3b82f6' : '#6b7280';
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const getStatusClass = (status) => {
  if (status === 'On Route') return 'status-on-route';
  if (status === 'Delayed') return 'status-delayed';
  if (status === 'Offline') return 'status-offline';
  if (status === 'Arrived') return 'status-arrived';
  return 'status-maintenance';
};

// --- Context & Reducer ---
const BusContext = createContext();

const initialState = {
  buses: [],
  logs: [],
  loading: true,
  selectedBus: null,
};

function busReducer(state, action) {
  switch(action.type) {
    case 'SET_DATA':
      return { ...state, buses: action.payload.buses, logs: action.payload.logs, loading: false };
    case 'UPDATE_LOCATION':
      return {
        ...state,
        buses: state.buses.map(b => b.id === action.payload.busId ? { ...b, currentLatitude: action.payload.lat, currentLongitude: action.payload.lng } : b)
      };
    case 'UPDATE_STATUS':
      return {
        ...state,
        buses: state.buses.map(b => b.id === action.payload.busId ? { ...b, status: action.payload.status } : b)
      };
    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs] };
    case 'REMOVE_LOG':
      return { ...state, logs: state.logs.filter(l => l.id !== action.payload.logId) };
    case 'SET_SELECTED_BUS':
      return { ...state, selectedBus: action.payload };
    default: return state;
  }
}

export const BusProvider = ({ children }) => {
  const [state, dispatch] = useReducer(busReducer, initialState);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [busesRes, logsRes] = await Promise.all([
          fetch('/api/bus', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/bus/boarding-activity', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const busesData = await busesRes.json();
        const logsData = await logsRes.json();
        
        if (busesData.success && logsData.success) {
          dispatch({ type: 'SET_DATA', payload: { buses: busesData.buses, logs: logsData.logs } });
        }
      } catch (error) {
        console.error('Failed to fetch bus data:', error);
      }
    };

    fetchInitialData();

    // Socket Setup
    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('busLocationUpdate', (data) => dispatch({ type: 'UPDATE_LOCATION', payload: data }));
    socket.on('busStatusUpdate', (data) => dispatch({ type: 'UPDATE_STATUS', payload: data }));
    socket.on('newBoarding', (log) => {
      dispatch({ type: 'ADD_LOG', payload: log });
      // Parent Notification Simulation
      console.log(`[NOTIFICATION SENT] Your child ${log.student.fullName} boarded ${log.bus.busNumber} at ${log.locationName}.`);
    });
    socket.on('boardingDeleted', (data) => dispatch({ type: 'REMOVE_LOG', payload: data }));

    return () => socket.disconnect();
  }, []);

  return <BusContext.Provider value={{ state, dispatch }}>{children}</BusContext.Provider>;
};

// --- Main Component ---
const BusBoardingInner = () => {
  const { state, dispatch } = useContext(BusContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return state.logs;
    const lower = searchTerm.toLowerCase();
    return state.logs.filter(log => 
      log.student.fullName.toLowerCase().includes(lower) || 
      log.student.studentId?.toLowerCase().includes(lower) ||
      log.bus.busNumber.toLowerCase().includes(lower)
    );
  }, [state.logs, searchTerm]);

  if (state.loading) {
    return <div className="p-5 text-center text-muted"><div className="spinner-border text-primary mb-3"></div><br/>Loading fleet data...</div>;
  }

  // Default center if no buses have locations (e.g. India center)
  const defaultCenter = [28.6139, 77.2090];
  const centerBus = state.buses.find(b => b.currentLatitude && b.currentLongitude);
  const mapCenter = centerBus ? [centerBus.currentLatitude, centerBus.currentLongitude] : defaultCenter;

  return (
    <div className="animate-fade-in p-3">
      <style>{busStyles}</style>
      
      {/* STUDENT PROFILE MODAL */}
      {selectedStudent && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000}} onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-4 overflow-hidden shadow-lg" style={{width: '400px', animation: 'slideUp 0.3s ease-out'}} onClick={e => e.stopPropagation()}>
            <div className="p-4 text-center text-white" style={{background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)'}}>
              <img src={selectedStudent.student.profileImage || `https://ui-avatars.com/api/?name=${selectedStudent.student.fullName || 'Student'}&background=random`} className="rounded-circle border border-4 border-white mb-3" style={{width: 80, height: 80, objectFit: 'cover'}} alt="" />
              <h4 className="m-0 fw-bold">{selectedStudent.student.fullName}</h4>
              <div className="opacity-75 small">{selectedStudent.student.studentId || selectedStudent.student.rollNumber}</div>
            </div>
            <div className="p-3">
              <div className="d-flex justify-content-between p-2 border-bottom">
                <span className="text-muted small">Boarding Location</span>
                <span className="fw-bold">{selectedStudent.locationName}</span>
              </div>
              <div className="d-flex justify-content-between p-2 border-bottom">
                <span className="text-muted small">Time</span>
                <span className="fw-bold">{new Date(selectedStudent.boardedAt).toLocaleTimeString()}</span>
              </div>
              <div className="d-flex justify-content-between p-2 border-bottom">
                <span className="text-muted small">Assigned Bus</span>
                <span className="badge bg-primary">{selectedStudent.bus.busNumber}</span>
              </div>
              <div className="d-flex justify-content-between p-2">
                <span className="text-muted small">Contact Number</span>
                <span className="fw-bold text-primary">{selectedStudent.student.phoneNumber || 'N/A'}</span>
              </div>
            </div>
            <div className="p-3 bg-light d-flex gap-2">
              <button className="btn btn-primary w-100 rounded-pill" onClick={() => window.open(`tel:${selectedStudent.student.phoneNumber}`)}>
                <i className="bi bi-telephone-fill me-2"></i>Call Parent
              </button>
              <button className="btn btn-outline-secondary w-100 rounded-pill" onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h4 className="fw-bold m-0 text-dark">Fleet Management</h4>
        <p className="text-muted small">Real-time bus tracking and boarding logs</p>
      </div>

      <div className="bus-grid">
        <div className="d-flex flex-column gap-4">
          <div className="card p-0 overflow-hidden shadow-sm border-0 rounded-4">
            <div className="p-3 d-flex justify-content-between align-items-center bg-white border-bottom">
              <h6 className="fw-bold m-0 text-dark"><i className="bi bi-geo-alt-fill text-danger me-2"></i>Live Fleet Map</h6>
              <span className="badge bg-info-subtle text-info border-0 px-3 py-2 rounded-pill">{state.buses.filter(b => b.currentLatitude).length} Tracking</span>
            </div>
            <div className="map-container rounded-0">
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
                {state.buses.map(bus => bus.currentLatitude && bus.currentLongitude && (
                  <Marker key={bus.id} position={[bus.currentLatitude, bus.currentLongitude]} icon={createBusIcon(bus.status)}>
                    <Popup>
                      <strong>{bus.busNumber}</strong><br/>
                      Driver: {bus.driverName}<br/>
                      Route: {bus.routeName}<br/>
                      Status: <span className={getStatusClass(bus.status)}>{bus.status}</span>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div>
            <h6 className="fw-bold mb-3 text-secondary" style={{fontSize: '0.85rem', letterSpacing: '0.5px'}}>ACTIVE VEHICLE STATUS</h6>
            <div className="row g-3">
              {state.buses.map(bus => (
                <div key={bus.id} className="col-md-6">
                  <div className={`route-card border-0 shadow-sm ${state.selectedBus === bus.id ? 'border-primary' : ''}`} onClick={() => dispatch({type: 'SET_SELECTED_BUS', payload: bus.id})}>
                    <div className="d-flex justify-content-between mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle" style={{background: '#f1f5f9', color: '#334155', width: 40, height: 40}}>
                        <i className="bi bi-bus-front"></i>
                      </div>
                      <span className={`status-badge ${getStatusClass(bus.status)}`}>{bus.status}</span>
                    </div>
                    <div className="fw-bold text-dark">{bus.busNumber} — {bus.driverName}</div>
                    <div className="text-muted small mb-3">{bus.routeName}</div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-muted">Boarded</span>
                      <span className="small fw-bold">{bus.activeStudents || 0}</span>
                    </div>
                    <div className="progress bg-light" style={{height: '6px'}}>
                      <div className="progress-bar bg-success" style={{width: `${Math.min(((bus.activeStudents||0)/50)*100, 100)}%`}}></div>
                    </div>
                  </div>
                </div>
              ))}
              {state.buses.length === 0 && <div className="text-muted">No buses registered in the system.</div>}
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 h-100 p-0">
          <div className="p-4 border-bottom">
            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark m-0">
              <i className="bi bi-clock-history text-primary me-2"></i>Boarding Activity
            </h6>
            <div className="search-mini border-0 bg-light p-2 px-3 d-flex align-items-center rounded-3">
              <i className="bi bi-search me-2 text-muted"></i>
              <input 
                type="text" 
                placeholder="Filter by student or bus..." 
                className="bg-transparent border-0 w-100 outline-none shadow-none" 
                style={{fontSize: '0.85rem', outline: 'none'}}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="boarding-list-container p-3 pt-0 mt-3">
            {filteredLogs.length === 0 && <div className="text-center text-muted small mt-4">No recent boarding activity.</div>}
            {filteredLogs.map((log) => (
              <div key={log.id} 
                   className="p-3 mb-2 rounded-4 bg-white border border-light shadow-sm" 
                   style={{cursor: 'pointer', transition: '0.2s'}} 
                   onClick={() => setSelectedStudent(log)}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <img src={log.student.profileImage || `https://ui-avatars.com/api/?name=${log.student.fullName || 'Student'}&background=random`} className="rounded-circle" style={{width: 32, height: 32, objectFit: 'cover'}} alt="" />
                    <div>
                      <div className="fw-bold small text-dark">{log.student.fullName}</div>
                      <div className="text-muted" style={{fontSize: '10px'}}>{log.student.studentId || log.student.rollNumber}</div>
                    </div>
                  </div>
                  <span className="badge bg-light text-dark border-0">{log.bus.busNumber}</span>
                </div>
                <div className="d-flex justify-content-between mt-3 text-muted" style={{fontSize: '11px'}}>
                  <span><i className="bi bi-pin-map-fill me-1 text-primary"></i>{log.locationName}</span>
                  <span>{new Date(log.boardedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BusBoarding() {
  return (
    <BusProvider>
      <BusBoardingInner />
    </BusProvider>
  );
}