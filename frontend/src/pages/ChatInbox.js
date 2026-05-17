import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const ChatInbox = ({ theme }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [userRole, setUserRole] = useState('admin');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedContactRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Keep ref in sync for use inside socket callbacks
  useEffect(() => { selectedContactRef.current = selectedContact; }, [selectedContact]);

  // ── Fetch current user ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          const role = (data.role === 'teacher' || (data.role === 'user' && data.email?.includes('teacher')))
            ? 'teacher' : 'admin';
          setUserRole(role);
          setCurrentUser(data);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  // ── Socket.IO setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(BACKEND, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('newChatMessage', (msg) => {
      const contact = selectedContactRef.current;
      // Add to messages if it belongs to the currently open chat thread
      if (contact) {
        const isThisThread =
          (msg.chatType === contact.chatType) &&
          (msg.senderId === contact.id || msg.receiverId === contact.id);
        if (isThisThread) {
          setMessages(prev => {
            // Deduplicate by id
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      }
      // Refresh contacts list to update unseen counts and lastMessage
      fetchContacts();
    });

    socket.on('newNotification', (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    });

    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch Contacts ──────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/api/chat/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setContacts(data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 8000);
    return () => clearInterval(interval);
  }, [fetchContacts]);

  // ── Fetch Notifications ─────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/api/chat/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Fetch Messages for selected contact ────────────────────────────────────
  useEffect(() => {
    let interval;
    if (selectedContact) {
      setLoadingMessages(true);
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          const teacherParam = selectedContact.teacherId ? `&teacherId=${selectedContact.teacherId}` : '';
          const res = await fetch(
            `${BACKEND}/api/chat/messages?chatType=${selectedContact.chatType}&otherUserId=${selectedContact.id}${teacherParam}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          if (res.ok) {
            setMessages(data);
            setLoadingMessages(false);
          }
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };

      fetchMessages();
      interval = setInterval(fetchMessages, 5000);

      // Mark as seen
      const markSeen = async () => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${BACKEND}/api/chat/mark-seen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ chatType: selectedContact.chatType, senderId: selectedContact.id })
          });
        } catch (err) {
          console.error('Error marking seen:', err);
        }
      };
      markSeen();
    } else {
      setMessages([]);
    }
    return () => clearInterval(interval);
  }, [selectedContact]);

  // ── Send Message ────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedContact || sending) return;
    const textToSend = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          chatType: selectedContact.chatType,
          message: textToSend
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Mark all notifications read ─────────────────────────────────────────────
  const markAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND}/api/chat/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    hover: isDark ? '#334155' : '#f1f5f9',
    sidebar: isDark ? '#0f172a' : '#f8fafc',
    active: isDark ? '#334155' : '#e2e8f0',
    input: isDark ? '#0f172a' : '#f8fafc',
  };

  const totalUnseen = contacts.reduce((acc, c) => acc + (c.unseenCount || 0), 0);

  return (
    <div className="d-flex flex-column" style={{ height: 'calc(100vh - 130px)' }}>

      {/* ── Inbox Header with Notification Bell ── */}
      <div className="d-flex align-items-center justify-content-between px-4 py-3 mb-3"
        style={{ background: colors.bg, borderRadius: '20px', border: `1px solid ${colors.border}` }}>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #00d9cc, #0099ff)' }}>
            <i className="bi bi-chat-square-dots-fill text-white fs-5"></i>
          </div>
          <div>
            <h5 className="fw-bold mb-0" style={{ color: colors.text }}>Secure Messages</h5>
            <span className="small text-muted">{totalUnseen > 0 ? `${totalUnseen} unread` : 'All caught up'}</span>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="position-relative" ref={notifDropdownRef}>
          <button
            className="btn position-relative d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 44, height: 44, background: isDark ? '#334155' : '#f1f5f9', border: `1px solid ${colors.border}`, color: colors.text }}
            onClick={() => { setShowNotifDropdown(v => !v); if (!showNotifDropdown) markAllNotificationsRead(); }}
          >
            <i className="bi bi-bell-fill fs-5"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="position-absolute end-0 mt-2 shadow-lg animate-fade-in"
              style={{ width: 340, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '16px', zIndex: 1000 }}>
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: colors.border }}>
                <span className="fw-bold small" style={{ color: colors.text }}>Notifications</span>
                <button className="btn btn-sm btn-link text-muted p-0 text-decoration-none" onClick={markAllNotificationsRead}>
                  Mark all read
                </button>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No notifications yet</div>
                ) : notifications.map((n, i) => (
                  <div key={i} className="px-3 py-2 border-bottom d-flex gap-3 align-items-start"
                    style={{ borderColor: colors.border, background: !n.isRead ? (isDark ? 'rgba(0,217,204,0.05)' : 'rgba(0,217,204,0.06)') : 'transparent' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 34, height: 34, background: !n.isRead ? '#00d9cc22' : (isDark ? '#334155' : '#f1f5f9') }}>
                      <i className="bi bi-chat-fill" style={{ color: '#00d9cc', fontSize: '0.8rem' }}></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold small" style={{ color: colors.text }}>{n.title}</div>
                      <div className="text-muted small text-truncate">{n.message}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(n.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    {!n.isRead && <span className="bg-info rounded-circle flex-shrink-0 mt-1" style={{ width: 8, height: 8, display: 'block', background: '#00d9cc' }}></span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Layout ── */}
      <div className="card overflow-hidden shadow-lg border-0 flex-grow-1" style={{ borderRadius: '24px', background: colors.bg }}>
        <div className="row g-0 h-100">

          {/* LEFT: Contacts Sidebar */}
          <div className="col-md-4 border-end d-flex flex-column" style={{ borderColor: colors.border, background: colors.sidebar }}>
            <div className="p-3 border-bottom" style={{ borderColor: colors.border, background: colors.bg }}>
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="fw-bold mb-0" style={{ color: colors.text }}>Conversations</h6>
                {totalUnseen > 0 && (
                  <span className="badge rounded-pill" style={{ background: '#00d9cc', color: '#111' }}>
                    {totalUnseen} new
                  </span>
                )}
              </div>
            </div>

            <div className="flex-grow-1 overflow-auto p-2">
              {loadingContacts ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-info spinner-border-sm" role="status"></div>
                  <p className="small text-muted mt-2">Loading threads...</p>
                </div>
              ) : contacts.length > 0 ? (
                contacts.map((c) => {
                  const isActive = selectedContact?.id === c.id && selectedContact?.chatType === c.chatType;
                  return (
                    <div
                      key={`${c.id}-${c.chatType}`}
                      onClick={() => setSelectedContact(c)}
                      className="p-3 rounded-4 mb-2 d-flex gap-3 align-items-center"
                      style={{
                        background: isActive ? colors.active : 'transparent',
                        border: `1px solid ${isActive ? colors.border : 'transparent'}`,
                        cursor: 'pointer', transition: '0.2s'
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = colors.hover; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                        style={{ width: 44, height: 44, background: c.chatType === 'admin_chat' ? '#00d9cc' : '#10b981' }}>
                        <i className={`bi bi-${c.chatType === 'admin_chat' ? 'shield-lock-fill' : 'person-workspace'}`}></i>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold mb-0 text-truncate" style={{ color: colors.text, fontSize: '0.9rem' }}>{c.name}</h6>
                          {c.lastMessageTime && (
                            <span className="small text-muted ms-1 flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                              {new Date(c.lastMessageTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          )}
                        </div>
                        <p className="mb-0 text-muted small text-truncate mt-1" style={{ fontSize: '0.8rem' }}>
                          {c.lastMessage}
                        </p>
                      </div>
                      {c.unseenCount > 0 && (
                        <span className="badge rounded-pill bg-danger flex-shrink-0">{c.unseenCount}</span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-5 opacity-50">
                  <i className="bi bi-chat-dots-fill fs-2 mb-2 d-block"></i>
                  <p className="small mb-0">No active conversations yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Active Chat Panel */}
          <div className="col-md-8 d-flex flex-column h-100" style={{ background: colors.bg }}>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: colors.border }}>
                  <div className="d-flex align-items-center gap-3">
                    <button 
                      onClick={() => setSelectedContact(null)} 
                      className="btn btn-sm btn-link text-decoration-none p-0 d-flex align-items-center justify-content-center"
                      style={{ color: colors.muted, width: '32px', height: '32px' }}
                      title="Back to Messaging Center"
                    >
                      <i className="bi bi-arrow-left fs-5"></i>
                    </button>
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                      style={{ width: 44, height: 44, background: selectedContact.chatType === 'admin_chat' ? '#00d9cc' : '#10b981' }}>
                      <i className={`bi bi-${selectedContact.chatType === 'admin_chat' ? 'shield-lock-fill' : 'person-workspace'}`}></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0" style={{ color: colors.text }}>{selectedContact.name}</h6>
                      <span className="small d-flex align-items-center gap-1" style={{ color: '#00d9cc', fontSize: '0.78rem' }}>
                        <span className="rounded-circle" style={{ width: 6, height: 6, background: '#00d9cc', display: 'inline-block' }}></span>
                        Active Channel
                      </span>
                    </div>
                  </div>
                  <span className="badge" style={{ background: selectedContact.chatType === 'admin_chat' ? '#00d9cc22' : '#10b98122', color: selectedContact.chatType === 'admin_chat' ? '#00d9cc' : '#10b981', padding: '6px 12px', borderRadius: 20 }}>
                    {selectedContact.chatType === 'admin_chat' ? 'Admin Chat' : 'Teacher Chat'}
                  </span>
                </div>

                {/* Messages Area */}
                <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3"
                  style={{ background: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(241,245,249,0.4)' }}>
                  {loadingMessages ? (
                    <div className="text-center py-5 opacity-50">
                      <div className="spinner-border spinner-border-sm text-info mb-2"></div>
                      <p className="small mb-0">Loading messages...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((m) => {
                      // "isMe" means the logged-in admin/teacher sent it
                      const isMe = currentUser && m.senderId === currentUser.id;
                      return (
                        <div key={m.id} className={`d-flex flex-column ${isMe ? 'align-self-end' : 'align-self-start'}`} style={{ maxWidth: '75%' }}>
                          <div className="py-2 px-3 shadow-sm"
                            style={{
                              background: isMe ? 'linear-gradient(135deg, #00d9cc, #00b4ad)' : (isDark ? '#334155' : '#f1f5f9'),
                              color: isMe ? '#111827' : colors.text,
                              borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                              border: isMe ? 'none' : `1px solid ${colors.border}`
                            }}>
                            <p className="mb-1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.94rem' }}>{m.message}</p>
                            <div className="d-flex align-items-center justify-content-end gap-1 opacity-75" style={{ fontSize: '0.7rem' }}>
                              <span>{new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                              {isMe && <i className={`bi bi-check2-all ${m.isSeen ? 'text-primary' : ''}`}></i>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center my-auto opacity-40">
                      <i className="bi bi-chat-square-text fs-1 mb-2 d-block" style={{ color: '#00d9cc' }}></i>
                      <p className="small mb-0">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Footer */}
                <div className="p-3 border-top" style={{ borderColor: colors.border }}>
                  <div className="input-group shadow-sm" style={{ borderRadius: '30px', overflow: 'hidden' }}>
                    <input
                      type="text"
                      className="form-control border-0 px-4 py-3"
                      style={{ color: colors.text, background: colors.input, fontSize: '0.94rem' }}
                      placeholder="Type your reply..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !inputMessage.trim()}
                      className="btn px-4 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#00d9cc,#00b4ad)', border: 'none', color: '#111827', fontWeight: 'bold', minWidth: 80 }}
                    >
                      {sending ? <div className="spinner-border spinner-border-sm"></div> : <i className="bi bi-send-fill fs-5"></i>}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 opacity-50">
                <i className="bi bi-chat-square-dots-fill fs-1 mb-3" style={{ color: '#00d9cc' }}></i>
                <h5 className="fw-bold mb-1" style={{ color: colors.text }}>EduScan Messaging Center</h5>
                <p className="small mb-0 text-muted">Select a conversation from the left to read or reply</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInbox;
