import React, { useState, useEffect } from 'react';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const Meetings = ({ theme }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ ongoing: true, upcoming: false, past: false });
  const [selectedMeetingDetails, setSelectedMeetingDetails] = useState(null);
  const [detailedParticipants, setDetailedParticipants] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [parents, setParents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    durationMins: 60,
    selectedParents: []
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUserAndStatus();
    fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserAndStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get user
      let res = await fetch(`${BACKEND}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        
        // If admin or teacher, check google status
        if (user.role === 'admin' || user.role === 'teacher' || (user.role === 'user' && user.email.includes('teacher'))) {
          const statusRes = await fetch(`${BACKEND}/api/meetings/google/status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (statusRes.ok) {
            const status = await statusRes.json();
            setGoogleConnected(status.connected);
          }
          fetchParents();
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/api/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMeetings(data.meetings || []);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/api/meetings/parents/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setParents(data.parents || []);
      }
    } catch (err) {
      console.error('Error fetching parents:', err);
    }
  };

  const handleConnectGoogle = () => {
    const token = localStorage.getItem('token');
    window.location.href = `${BACKEND}/api/meetings/google/auth?token=${token}`;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time || formData.selectedParents.length === 0) {
      alert("Please fill all required fields and select at least one parent.");
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      // Combine date and time
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString();
      
      const participants = formData.selectedParents.map(id => {
        const p = parents.find(x => x.id === parseInt(id));
        return { userId: p.id, email: p.email, name: p.name, role: 'parent' };
      });

      const res = await fetch(`${BACKEND}/api/meetings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          scheduledAt,
          durationMins: formData.durationMins,
          participants
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', description: '', date: '', time: '', durationMins: 60, selectedParents: [] });
        fetchMeetings();
      } else {
        alert(data.error || 'Failed to create meeting');
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      alert('An error occurred while creating the meeting.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelMeeting = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this meeting?")) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/api/meetings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMeetings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel meeting');
      }
    } catch (err) {
      console.error('Error cancelling meeting:', err);
    }
  };

  const handleViewDetails = async (meeting) => {
    setSelectedMeetingDetails(meeting);
    setDetailedParticipants([]);
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/api/meetings/${meeting.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDetailedParticipants(data.participants || []);
      }
    } catch (err) {
      console.error('Failed to fetch meeting details', err);
    }
    setLoadingDetails(false);
  };

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    muted: isDark ? '#94a3b8' : '#64748b'
  };

  const isAdminOrTeacher = currentUser?.role === 'admin' || currentUser?.role === 'teacher' || (currentUser?.role === 'user' && currentUser?.email?.includes('teacher'));

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderMeetingCard = (meeting) => {
    const isCancelled = meeting.status === 'cancelled';
    const scheduledAt = new Date(meeting.scheduledAt);
    const endAt = new Date(scheduledAt.getTime() + (meeting.durationMins || 60) * 60000);
    const isPast = meeting.status === 'completed' || endAt < new Date();
    const isOngoing = scheduledAt <= new Date() && endAt >= new Date() && !isCancelled;
    
    return (
      <div key={meeting.id} className="col-md-6 col-lg-4">
        <div className="card h-100 shadow-sm border-0" style={{ background: colors.card, borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-body p-4 position-relative">
            {/* Status Badge */}
            <div className="position-absolute top-0 end-0 mt-3 me-3">
              {isCancelled ? (
                <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded-pill">Cancelled</span>
              ) : isPast ? (
                <span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded-pill">Completed</span>
              ) : isOngoing ? (
                <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill">Ongoing</span>
              ) : (
                <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill">Scheduled</span>
              )}
            </div>

            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: 'rgba(0, 217, 204, 0.1)' }}>
                <i className="bi bi-camera-video-fill fs-4" style={{ color: '#00d9cc' }}></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-truncate" style={{ maxWidth: '200px', color: colors.text }}>{meeting.title}</h5>
                <p className="small mb-0" style={{ color: colors.muted }}>ID: {meeting.meetingUuid.split('-')[0]}</p>
              </div>
            </div>
            
            <p className="small mb-4" style={{ color: colors.muted, minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {meeting.description || 'No description provided.'}
            </p>

            <div className="d-flex flex-column gap-2 mb-4">
              <div className="d-flex align-items-center gap-2 small">
                <i className="bi bi-calendar-event" style={{ color: '#00d9cc' }}></i>
                <span style={{ color: colors.text }}>{scheduledAt.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="d-flex align-items-center gap-2 small">
                <i className="bi bi-clock" style={{ color: '#00d9cc' }}></i>
                <span style={{ color: colors.text }}>{scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({meeting.durationMins} mins)</span>
              </div>
              <div className="d-flex align-items-center gap-2 small">
                <i className="bi bi-people" style={{ color: '#00d9cc' }}></i>
                <span style={{ color: colors.text }}>{meeting.participantCount || 0} Participant(s)</span>
              </div>
            </div>

            <div className="mt-auto d-flex gap-2">
              <a 
                href={meeting.googleMeetUrl} 
                target="_blank" 
                rel="noreferrer"
                className={`btn w-100 fw-bold rounded-3 ${isCancelled ? 'btn-secondary disabled' : 'btn-info text-white'}`}
                style={{ background: !isCancelled ? 'linear-gradient(135deg, #00d9cc, #00b4ad)' : '', border: 'none' }}
              >
                <i className="bi bi-play-fill me-1"></i> Join Meet
              </a>
              <button 
                onClick={() => handleViewDetails(meeting)}
                className="btn btn-outline-info rounded-3"
                title="View Details"
              >
                <i className="bi bi-info-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const now = new Date();
  const ongoingMeetings = [];
  const upcomingMeetings = [];
  const pastMeetings = [];

  meetings.forEach(meeting => {
    if (meeting.status === 'cancelled') {
      pastMeetings.push(meeting);
      return;
    }
    const start = new Date(meeting.scheduledAt);
    const end = new Date(start.getTime() + (meeting.durationMins || 60) * 60000);
    
    if (meeting.status === 'completed' || end < now) {
      pastMeetings.push(meeting);
    } else if (start <= now && end >= now) {
      ongoingMeetings.push(meeting);
    } else {
      upcomingMeetings.push(meeting);
    }
  });

  const renderSectionHeader = (title, count, isExpanded, onToggle) => (
    <div 
      className="d-flex justify-content-between align-items-center p-3 mb-3 rounded-3" 
      style={{ background: colors.card, cursor: 'pointer', userSelect: 'none' }}
      onClick={onToggle}
    >
      <div className="d-flex align-items-center gap-2">
        <h5 className="mb-0 fw-bold">{title}</h5>
        <span className="badge rounded-pill" style={{ background: 'rgba(0, 217, 204, 0.2)', color: '#00d9cc' }}>{count}</span>
      </div>
      <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted`}></i>
    </div>
  );

  return (
    <div className="p-4" style={{ background: colors.bg, minHeight: '100vh', color: colors.text }}>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Meetings & Parent-Teacher Connect</h2>
          <p className="mb-0" style={{ color: colors.muted }}>Schedule and manage video conferences</p>
        </div>
        
        {isAdminOrTeacher && (
          <div className="d-flex gap-2">
            {!googleConnected ? (
              <button onClick={handleConnectGoogle} className="btn btn-outline-danger fw-bold d-flex align-items-center gap-2" style={{ borderRadius: '12px' }}>
                <i className="bi bi-google"></i> Connect Google Calendar
              </button>
            ) : (
              <button className="btn btn-success fw-bold d-flex align-items-center gap-2" disabled style={{ borderRadius: '12px' }}>
                <i className="bi bi-check-circle"></i> Calendar Connected
              </button>
            )}
            <button 
              onClick={() => setShowModal(true)} 
              className="btn fw-bold d-flex align-items-center gap-2 text-white" 
              style={{ background: 'linear-gradient(135deg, #00d9cc, #00b4ad)', borderRadius: '12px', border: 'none' }}
            >
              <i className="bi bi-plus-lg"></i> Schedule Meeting
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-2" style={{ color: colors.muted }}>Loading meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-5">
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '80px', height: '80px', background: isDark ? '#1e293b' : '#e2e8f0' }}>
            <i className="bi bi-calendar-x fs-1" style={{ color: colors.muted }}></i>
          </div>
          <h5 className="fw-bold">No meetings found</h5>
          <p style={{ color: colors.muted }}>There are no scheduled meetings at this time.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {/* Ongoing Meetings */}
          <div>
            {renderSectionHeader('Ongoing Meetings', ongoingMeetings.length, expandedSections.ongoing, () => toggleSection('ongoing'))}
            {expandedSections.ongoing && (
              <div className="row g-4">
                {ongoingMeetings.length > 0 ? ongoingMeetings.map(renderMeetingCard) : (
                  <div className="col-12"><p className="text-muted ps-2">No ongoing meetings right now.</p></div>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Meetings */}
          <div>
            {renderSectionHeader('Upcoming Meetings', upcomingMeetings.length, expandedSections.upcoming, () => toggleSection('upcoming'))}
            {expandedSections.upcoming && (
              <div className="row g-4">
                {upcomingMeetings.length > 0 ? upcomingMeetings.map(renderMeetingCard) : (
                  <div className="col-12"><p className="text-muted ps-2">No upcoming meetings scheduled.</p></div>
                )}
              </div>
            )}
          </div>

          {/* Past Meetings */}
          <div>
            {renderSectionHeader('Past Meetings', pastMeetings.length, expandedSections.past, () => toggleSection('past'))}
            {expandedSections.past && (
              <div className="row g-4">
                {pastMeetings.length > 0 ? pastMeetings.map(renderMeetingCard) : (
                  <div className="col-12"><p className="text-muted ps-2">No past meetings.</p></div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Meeting Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ background: colors.card, color: colors.text, borderRadius: '20px' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">Schedule New Meeting</h5>
                <button type="button" className="btn-close" style={{ filter: isDark ? 'invert(1)' : 'none' }} onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                
                {!googleConnected && (
                  <div className="alert alert-warning border-0 d-flex align-items-center gap-3 mb-4" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
                    <div>
                      <h6 className="fw-bold mb-1">Google Calendar Not Connected</h6>
                      <p className="mb-0 small">You haven't connected your Google Calendar. We will generate a fallback random Meet URL. For true Calendar integration, close this and click "Connect Google Calendar".</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold">Meeting Title *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ background: isDark ? '#0f172a' : '#fff', color: colors.text, borderColor: colors.border, borderRadius: '10px' }}
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        required 
                        placeholder="e.g. Parent-Teacher Monthly Sync"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Date *</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        style={{ background: isDark ? '#0f172a' : '#fff', color: colors.text, borderColor: colors.border, borderRadius: '10px' }}
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Time *</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        style={{ background: isDark ? '#0f172a' : '#fff', color: colors.text, borderColor: colors.border, borderRadius: '10px' }}
                        value={formData.time} 
                        onChange={e => setFormData({...formData, time: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Duration (mins)</label>
                      <select 
                        className="form-select" 
                        style={{ background: isDark ? '#0f172a' : '#fff', color: colors.text, borderColor: colors.border, borderRadius: '10px' }}
                        value={formData.durationMins} 
                        onChange={e => setFormData({...formData, durationMins: parseInt(e.target.value)})}
                      >
                        <option value="15">15 mins</option>
                        <option value="30">30 mins</option>
                        <option value="45">45 mins</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">Select Participants (Parents) *</label>
                      <div className="p-3 border rounded-3" style={{ borderColor: colors.border, maxHeight: '200px', overflowY: 'auto', background: isDark ? '#0f172a' : '#fff' }}>
                        {parents.length === 0 ? (
                          <div className="text-center py-3 small text-muted">No parents found</div>
                        ) : (
                          parents.map(p => (
                            <div key={p.id} className="form-check mb-2">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id={`parent-${p.id}`}
                                checked={formData.selectedParents.includes(p.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({...formData, selectedParents: [...formData.selectedParents, p.id]});
                                  } else {
                                    setFormData({...formData, selectedParents: formData.selectedParents.filter(id => id !== p.id)});
                                  }
                                }}
                              />
                              <label className="form-check-label" htmlFor={`parent-${p.id}`}>
                                {p.name} <span className="text-muted small">({p.email})</span>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">Description (Optional)</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        style={{ background: isDark ? '#0f172a' : '#fff', color: colors.text, borderColor: colors.border, borderRadius: '10px' }}
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Agenda or notes for the meeting..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: colors.border }}>
                    <button type="button" className="btn btn-light fw-bold" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)} disabled={creating}>
                      Cancel
                    </button>
                    <button type="submit" className="btn text-white fw-bold d-flex align-items-center gap-2" style={{ background: 'linear-gradient(135deg, #00d9cc, #00b4ad)', border: 'none', borderRadius: '10px' }} disabled={creating}>
                      {creating ? <div className="spinner-border spinner-border-sm"></div> : <i className="bi bi-calendar-check"></i>}
                      {creating ? 'Scheduling...' : 'Schedule & Invite'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Meeting Details Modal */}
      {selectedMeetingDetails && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ background: colors.card, color: colors.text, borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Meeting Details</h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setSelectedMeetingDetails(null)}></button>
              </div>
              <div className="modal-body pt-3">
                <h4 className="fw-bold mb-3" style={{ color: '#00d9cc' }}>{selectedMeetingDetails.title}</h4>
                <p className="mb-4">{selectedMeetingDetails.description || 'No description provided.'}</p>
                
                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-calendar-event fs-5" style={{ color: '#00d9cc' }}></i>
                    <div>
                      <small className="d-block text-muted">Date</small>
                      <span>{new Date(selectedMeetingDetails.scheduledAt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-clock fs-5" style={{ color: '#00d9cc' }}></i>
                    <div>
                      <small className="d-block text-muted">Time</small>
                      <span>{new Date(selectedMeetingDetails.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({selectedMeetingDetails.durationMins} mins)</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-link-45deg fs-5" style={{ color: '#00d9cc' }}></i>
                    <div>
                      <small className="d-block text-muted">Meeting Link</small>
                      <div>
                        <a href={selectedMeetingDetails.googleMeetUrl} target="_blank" rel="noreferrer" style={{ color: '#00d9cc', wordBreak: 'break-all' }}>{selectedMeetingDetails.googleMeetUrl}</a>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-3 mt-2">
                    <i className="bi bi-people fs-5" style={{ color: '#00d9cc' }}></i>
                    <div className="w-100">
                      <small className="d-block text-muted mb-2">Participants</small>
                      {loadingDetails ? (
                        <div className="spinner-border spinner-border-sm text-info"></div>
                      ) : detailedParticipants.length > 0 ? (
                        <div className="d-flex flex-column gap-2">
                          {detailedParticipants.map(p => (
                            <div key={p.id} className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                  <i className={`bi bi-${p.role === 'admin' ? 'shield-lock' : p.role === 'teacher' ? 'person-workspace' : 'person'}`}></i>
                                </div>
                                <span className="small">{p.name || p.email}</span>
                              </div>
                              <span className="badge" style={{ fontSize: '10px', background: p.role === 'admin' || p.role === 'teacher' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 217, 204, 0.2)', color: p.role === 'admin' || p.role === 'teacher' ? '#10b981' : '#00d9cc' }}>
                                {p.role === 'admin' || p.role === 'teacher' ? 'Organizer' : 'Invited'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="small text-muted">No participants found.</span>
                      )}
                    </div>
                  </div>
                </div>

                {isAdminOrTeacher && selectedMeetingDetails.status !== 'cancelled' && new Date(selectedMeetingDetails.scheduledAt) >= new Date() && (
                  <button 
                    onClick={() => {
                      handleCancelMeeting(selectedMeetingDetails.id);
                      setSelectedMeetingDetails(null);
                    }} 
                    className="btn btn-danger w-100 fw-bold rounded-3 py-2"
                  >
                    <i className="bi bi-trash3 me-2"></i> Cancel / Delete Meeting
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Meetings;
