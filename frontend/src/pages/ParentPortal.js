import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import Meetings from './Meetings';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';



const ParentPortal = ({ onLogout, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [notifications, setNotifications] = useState([]);

  // --- NEW: RAZORPAY & WALLET STATE ---
  const [transactions, setTransactions] = useState([]);

  // --- NEW: RFID SCANNER STATE ---
  const [rfidInput, setRfidInput] = useState("");
  const [scanningRfid, setScanningRfid] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scanError, setScanError] = useState("");

  // Student Data State
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [errorStudent, setErrorStudent] = useState('');

  // --- CHAT + REAL-TIME STATE ---
  const [activeChat, setActiveChat] = useState(null); // 'admin_chat' | 'teacher_chat' | null
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [teacherContactId, setTeacherContactId] = useState(null);
  const [adminContactId, setAdminContactId] = useState(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const socketRef = useRef(null);

  // --- NOTIFICATION STATE ---
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatNotifications, setChatNotifications] = useState([]);
  const [showNotifBell, setShowNotifBell] = useState(false);
  const notifBellRef = useRef(null);

  // Keep activeChatRef in sync for socket callbacks
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Socket.IO setup for parent
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(BACKEND, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('newChatMessage', (msg) => {
      const currentChat = activeChatRef.current;
      if (currentChat && msg.chatType === currentChat) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    socket.on('newNotification', (notif) => {
      addNotification(notif.title, notif.message);
      setChatNotifications(prev => [notif, ...prev].slice(0, 20));
      setChatUnreadCount(prev => prev + 1);
    });

    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close notification bell on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifBellRef.current && !notifBellRef.current.contains(e.target)) {
        setShowNotifBell(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch teacher and admin contact IDs on mount
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND}/api/chat/contacts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          const admin = data.find(c => c.chatType === 'admin_chat');
          const teacher = data.find(c => c.chatType === 'teacher_chat');
          if (admin) setAdminContactId(admin.id);
          if (teacher) setTeacherContactId(teacher.id);
          // Sum unread
          const total = data.reduce((acc, c) => acc + (c.unseenCount || 0), 0);
          setChatUnreadCount(total);
        }
      } catch (e) {
        console.error('Error fetching chat contacts:', e);
      }
    };
    fetchContacts();
  }, []);

  // Fetch persistent notifications from backend
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND}/api/chat/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setChatNotifications(data.notifications || []);
          setChatUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  // Polling Chat Messages (fallback alongside Socket.IO)
  useEffect(() => {
    let interval;
    if (activeChat) {
      const fetchChatMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          const otherId = activeChat === 'admin_chat' ? adminContactId : teacherContactId;
          const otherParam = otherId ? `&otherUserId=${otherId}` : '';
          const res = await fetch(`${BACKEND}/api/chat/messages?chatType=${activeChat}${otherParam}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) setChatMessages(data);
        } catch (e) {
          console.error('Error polling chat:', e);
        }
      };
      fetchChatMessages();
      interval = setInterval(fetchChatMessages, 5000);
    }
    return () => clearInterval(interval);
  }, [activeChat, adminContactId, teacherContactId]);

  const addNotification = useCallback((title, msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, msg }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const fetchTransactions = useCallback(async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/wallet/transactions?studentId=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  }, []);

  const handleScanRfid = useCallback(async (tagOverride = null) => {
    const tag = tagOverride || rfidInput.trim();
    if (!tag) {
      setScanError("Please enter an RFID tag");
      return;
    }
    
    setScanningRfid(true);
    setScanError("");
    setScannedStudent(null);
    
    try {
      const res = await fetch("http://localhost:5000/api/rfid/scan-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfid_tag: tag })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setScannedStudent(data.student);
      } else {
        setScanError(data.message || "Invalid RFID tag");
      }
    } catch (err) {
      setScanError("Scanner connection failed.");
      console.error(err);
    } finally {
      setScanningRfid(false);
    }
  }, [rfidInput]);

  // Fetch real student data and transactions from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/parents/student-details', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok && data.student) {
          const dbStudent = data.student;
          const totalAtt = dbStudent.attendances ? dbStudent.attendances.length : 0;
          const presentAtt = dbStudent.attendances ? dbStudent.attendances.filter(att => att.status === 'present' || att.status === 'late').length : 0;
          const attPercentage = totalAtt > 0 ? `${((presentAtt / totalAtt) * 100).toFixed(1)}%` : "100.0%";

          setStudent({
            name: dbStudent.fullName || "N/A",
            id: dbStudent.id,
            studentId: dbStudent.studentId || "N/A",
            class: dbStudent.className || "N/A",
            rollNo: dbStudent.rollNumber || "N/A",
            house: "Blue House",
            attendance: attPercentage,
            wallet: dbStudent.rfidWallet ? dbStudent.rfidWallet.balance : 0,
            bloodGroup: "B+",
            emergencyContact: dbStudent.phoneNumber || "N/A",
            classTeacher: "Ms. Anjali Verma",
            photo: dbStudent.profileImage || `https://ui-avatars.com/api/?name=${dbStudent.fullName || 'Student'}&background=random`,
            performance: "Grade: A (Excellent)",
            isActive: dbStudent.isActive,
            busRoute: "Route 14 - Sector 5",
            lastExam: "Mathematics (92/100)",
            medicalNote: "No Known Allergies",
            rfid: dbStudent.rfidTag || "N/A",
            rawDbStudent: dbStudent
          });

          // Fetch Transactions
          fetchTransactions(dbStudent.id);
        } else {
          setErrorStudent(data.error || 'Failed to load student data.');
        }
      } catch (err) {
        setErrorStudent('Network error loading student data.');
        console.error(err);
      } finally {
        setLoadingStudent(false);
      }
    };
    
    fetchData();
  }, [fetchTransactions]);





  const recentActivities = useMemo(() => {
    if (!student || !student.rawDbStudent) {
      return [
        { time: "02:15 PM", action: "Library", desc: "Returned 'Java Programming'", icon: "book-half", color: "#6f42c1" },
        { time: "12:45 PM", action: "Canteen", desc: "Lunch Payment: ₹80", icon: "cart-fill", color: "#fd7e14" },
        { time: "08:10 AM", action: "Campus Entry", desc: "Main Gate - RFID Scanned", icon: "door-open-fill", color: "#198754" },
        { time: "Yesterday", action: "Bus", desc: "Dropped at Sector 5", icon: "bus-front", color: "#0d7c88" }
      ];
    }

    const formatActivityTime = (dateString) => {
      if (!dateString) return "";
      const d = new Date(dateString);
      const now = new Date();
      
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();
      
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return timeStr;
      if (isYesterday) return `Yesterday, ${timeStr}`;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    };

    const list = [];
    const dbStudent = student.rawDbStudent;

    // 1. Add StudentActivity logs
    if (dbStudent.activities) {
      dbStudent.activities.forEach(act => {
        let icon = "info-circle";
        let color = "#0d6efd";
        if (act.action === "CREATED") {
          icon = "person-check-fill";
          color = "#0d6efd";
        } else if (act.action === "RFID_ASSIGNED") {
          icon = "broadcast";
          color = "#fd7e14";
        } else if (act.action === "UPDATED") {
          icon = "pencil-square";
          color = "#6c757d";
        }
        list.push({
          timestamp: new Date(act.createdAt).getTime(),
          time: formatActivityTime(act.createdAt),
          action: act.action === "CREATED" ? "Registration" : act.action === "RFID_ASSIGNED" ? "RFID Assignment" : act.action,
          desc: act.description,
          icon,
          color
        });
      });
    }

    // 2. Add Attendance logs
    if (dbStudent.attendances) {
      dbStudent.attendances.forEach(att => {
        if (att.checkIn) {
          list.push({
            timestamp: new Date(att.checkIn).getTime(),
            time: formatActivityTime(att.checkIn),
            action: "Campus Entry",
            desc: `Main Gate - Scanned (Status: ${att.status})`,
            icon: "door-open-fill",
            color: "#198754"
          });
        }
        if (att.checkOut) {
          list.push({
            timestamp: new Date(att.checkOut).getTime(),
            time: formatActivityTime(att.checkOut),
            action: "Campus Exit",
            desc: "Main Gate - Scanned Out",
            icon: "door-closed-fill",
            color: "#dc3545"
          });
        }
      });
    }

    // 3. Add Boarding logs (Bus)
    if (dbStudent.boardingLogs) {
      dbStudent.boardingLogs.forEach(log => {
        list.push({
          timestamp: new Date(log.boardedAt).getTime(),
          time: formatActivityTime(log.boardedAt),
          action: "Bus Boarding",
          desc: `Boarded Bus ${log.bus?.busNumber || ""} at ${log.locationName}`,
          icon: "bus-front",
          color: "#0d7c88"
        });
      });
    }

    // 4. Add Wallet Transactions (Recharges/Payments)
    if (transactions) {
      transactions.forEach(tx => {
        const isRecharge = tx.source === "RECHARGE";
        list.push({
          timestamp: new Date(tx.createdAt).getTime(),
          time: formatActivityTime(tx.createdAt),
          action: isRecharge ? "Wallet Recharge" : "Canteen Payment",
          desc: isRecharge ? `Recharged ₹${tx.amount}` : `Lunch Payment: ₹${tx.amount}`,
          icon: isRecharge ? "wallet2" : "cart-fill",
          color: isRecharge ? "#198754" : "#fd7e14"
        });
      });
    }

    // Sort chronologically (newest first)
    list.sort((a, b) => b.timestamp - a.timestamp);

    // Return compiled list or fallback if empty
    if (list.length > 0) {
      return list.slice(0, 6);
    }

    return [
      { time: "Just Now", action: "Status", desc: "No recent transactions or activity logs found.", icon: "info-circle", color: "#6c757d" }
    ];
  }, [student, transactions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification("Bus Arrival", "Route 14 has entered the school premises.");
    }, 5000);
    return () => clearTimeout(timer);
  }, [addNotification]);



  // --- HANDLERS ---
  const handleRecharge = async () => {
    if (!student && !scannedStudent) {
      addNotification("Error", "Please select or scan a student first.");
      return;
    }

    const targetStudentId = scannedStudent ? scannedStudent.id : student.id;
    const targetAmount = rechargeAmount;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      
      // 1. Create Order
      const orderRes = await fetch("http://localhost:5000/api/payment/create-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount: targetAmount, studentId: targetStudentId })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to create order");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.key || process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "EduScan School Management",
        description: `Wallet Recharge for ${scannedStudent ? scannedStudent.name : student.name}`,
        order_id: orderData.order.id,
        prefill: {
          contact: student ? student.emergencyContact : "",
          email: JSON.parse(localStorage.getItem('user') || '{}').email || "parent@example.com",
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },
        handler: async (response) => {
          // 3. Verify Payment
          const verifyRes = await fetch("http://localhost:5000/api/payment/verify", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              ...response,
              amount: targetAmount,
              studentId: targetStudentId
            })
          });
          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            // Update local state
            if (scannedStudent) {
              setScannedStudent(prev => ({ ...prev, wallet_balance: verifyData.wallet.balance }));
            }
            if (student && student.id === targetStudentId) {
              setStudent(prev => ({ ...prev, wallet: verifyData.wallet.balance }));
            }
            
            addNotification("Payment Success", `₹${targetAmount} added to wallet.`);
            fetchTransactions(targetStudentId);
          } else {
            addNotification("Payment Failed", verifyData.message || "Verification failed");
          }
        },
        theme: { color: "#0dcaf0" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error("Recharge Error:", err);
      addNotification("Error", err.message || "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };



  const handleAdminChat = () => {
    setActiveChat('admin_chat');
    setChatMessages([]);
    if (adminContactId) markChatSeen('admin_chat', adminContactId);
  };

  const handleTeacherChat = () => {
    setActiveChat('teacher_chat');
    setChatMessages([]);
    if (teacherContactId) markChatSeen('teacher_chat', teacherContactId);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatSending) return;
    const msgText = chatInput.trim();
    setChatInput('');
    setChatSending(true);
    try {
      const token = localStorage.getItem('token');
      const receiverId = activeChat === 'admin_chat' ? adminContactId : teacherContactId;
      const res = await fetch(`${BACKEND}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chatType: activeChat, message: msgText, receiverId })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    } catch (err) {
      console.error('Error sending chat:', err);
      addNotification('Error', 'Failed to send message.');
    } finally {
      setChatSending(false);
    }
  };

  // Mark chat messages as seen when opening a chat
  const markChatSeen = async (chatType, senderId) => {
    if (!senderId) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND}/api/chat/mark-seen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chatType, senderId })
      });
    } catch (e) {}
  };

  // Mark all chat notifications read
  const markAllChatNotifsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND}/api/chat/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      setChatNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setChatUnreadCount(0);
    } catch (e) {}
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

  // Define theme-based colors
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    accent: '#085b45'
  };

  const cardStyle = {
    backgroundColor: colors.card,
    color: colors.text,
    borderColor: colors.border,
    borderRadius: '24px',
    border: '1px solid',
    transition: 'all 0.3s ease'
  };

  if (loadingStudent) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
        <div className="spinner-border text-info" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (errorStudent || !student) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center flex-column ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
        <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
        <h4 className="mt-3">{errorStudent || 'No linked student found.'}</h4>
        <button onClick={onLogout} className="btn btn-outline-danger mt-4 rounded-pill px-4">Logout</button>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`} style={{ transition: 'all 0.4s ease', color: colors.text }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
      
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

        /* THEME TOGGLE SWITCH */
        .theme-toggle-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-right: 15px;
          cursor: pointer;
          transition: 0.3s;
          color: white;
        }
        .theme-toggle-wrapper:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .theme-switch {
          width: 36px;
          height: 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          position: relative;
          transition: 0.3s;
        }
        .theme-switch.active {
          background: #0dcaf0; /* info color */
        }
        .theme-switch::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .theme-switch.active::after {
          left: 18px;
        }
      `}</style>

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {notifications.map(n => (
          <div key={n.id} className="card border-0 shadow-lg p-3 mb-2 animate-pop" style={{...cardStyle, minWidth: '250px', background: theme === 'dark' ? '#2c3034' : '#fff'}}>
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
            {['dashboard', 'wallet', 'support', 'meetings', 'settings'].map((tab) => (
              <button
                key={tab}
                className={`btn btn-sm rounded-pill px-3 py-1 border-0 text-uppercase fw-bold position-relative ${activeTab === tab ? 'btn-info text-white' : 'text-white-50'}`}
                onClick={() => { setActiveTab(tab); setShowScanner(false); }}
                style={{ fontSize: '0.7rem' }}
              >
                {tab}
                {tab === 'support' && chatUnreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.55rem', padding: '2px 5px', marginLeft: '-4px' }}
                  >
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2">

            {/* ── Notification Bell ── */}
            <div className="position-relative" ref={notifBellRef}>
              <button
                className="btn btn-sm position-relative d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                onClick={() => { setShowNotifBell(v => !v); markAllChatNotifsRead(); }}
                title="Notifications"
              >
                <i className="bi bi-bell-fill"></i>
                {chatUnreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.6rem', padding: '3px 5px' }}
                  >
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </button>

              {showNotifBell && (
                <div
                  className="position-absolute end-0 mt-2 shadow-lg"
                  style={{ width: 320, background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, zIndex: 2000 }}
                >
                  <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="fw-bold small text-white">Notifications</span>
                    <button className="btn btn-link btn-sm text-info p-0 text-decoration-none" style={{ fontSize: '0.75rem' }} onClick={markAllChatNotifsRead}>
                      Mark all read
                    </button>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {chatNotifications.length === 0 ? (
                      <div className="text-center py-4 text-muted small">No notifications yet</div>
                    ) : chatNotifications.map((n, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 border-bottom d-flex gap-2 align-items-start"
                        style={{ borderColor: 'rgba(255,255,255,0.07)', background: !n.isRead ? 'rgba(0,217,204,0.07)' : 'transparent', cursor: 'pointer' }}
                        onClick={() => { setActiveTab('support'); setShowNotifBell(false); }}
                      >
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                          style={{ width: 30, height: 30, background: !n.isRead ? 'rgba(0,217,204,0.2)' : 'rgba(255,255,255,0.05)' }}
                        >
                          <i className="bi bi-chat-fill" style={{ color: '#00d9cc', fontSize: '0.75rem' }}></i>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-bold" style={{ color: '#f8fafc', fontSize: '0.82rem' }}>{n.title}</div>
                          <div className="text-truncate" style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{n.message}</div>
                          <div style={{ color: '#64748b', fontSize: '0.68rem' }}>
                            {new Date(n.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        {!n.isRead && (
                          <span className="rounded-circle flex-shrink-0 mt-2" style={{ width: 7, height: 7, background: '#00d9cc', display: 'block' }}></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={onLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold">
              <i className="bi bi-box-arrow-right me-2"></i>Logout
            </button>
          </div>
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
                 <p className="badge bg-info bg-opacity-10 text-info mb-4">{student.studentId || student.id}</p>
                 
                 <div className="text-start bg-light bg-opacity-10 rounded-4 p-3">
                    <DetailRow label="Standard" value={student.class} icon="mortarboard" />
                    <DetailRow label="Teacher" value={student.classTeacher} icon="person-badge" />
                    <DetailRow label="Bus Route" value={student.busRoute} icon="bus-front" />
                    <DetailRow label="RFID Tag" value={student.rfid} icon="cpu" />
                    <DetailRow label="Roll No" value={student.rollNo} icon="hash" />
                    <DetailRow label="Blood Group" value={student.bloodGroup} icon="droplet-fill" />
                    <DetailRow label="Contact" value={student.emergencyContact} icon="telephone" />
                    <DetailRow label="Medical" value={student.medicalNote} icon="heart-pulse-fill" />
                 </div>
               </div>
            </div>

            <div className="col-lg-8">
               <div className="row g-3">
                 <ParentStat title="Attendance" value={student.attendance} icon="calendar2-check" color="#19917b" cardStyle={cardStyle} />
                 <ParentStat title="Wallet" value={`₹${student.wallet}`} icon="wallet2" color="#0f4877" cardStyle={cardStyle} />
                 <ParentStat title="Card Status" value={student.isActive ? "ACTIVE" : "SUSPENDED"} icon="credit-card-2-front" color={student.isActive ? "#19917b" : "#dc3545"} cardStyle={cardStyle} />
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



                        {/* --- EXISTING RFID SCANNER SECTION --- */}
                        <div className="p-3 mb-4 rounded-4 border" style={{ borderColor: colors.border, background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8f9fa' }}>
                            <h6 className="fw-bold small mb-3"><i className="bi bi-upc-scan me-2"></i>RFID Scanner</h6>
                            
                            <div className="d-flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Scan or Enter RFID Tag" 
                                    value={rfidInput}
                                    onChange={(e) => setRfidInput(e.target.value)}
                                    style={{ background: theme === 'dark' ? '#212529' : '#fff', color: colors.text, borderColor: colors.border }}
                                />
                                <button 
                                    onClick={handleScanRfid}
                                    disabled={scanningRfid || !rfidInput.trim()}
                                    className="btn btn-primary px-4 fw-bold shadow-sm d-flex align-items-center"
                                >
                                    {scanningRfid ? (
                                        <div className="spinner-border spinner-border-sm" role="status"></div>
                                    ) : (
                                        "Scan RFID"
                                    )}
                                </button>
                            </div>

                            {scanError && (
                                <div className="alert alert-danger small py-2 mb-0 d-flex align-items-center">
                                    <i className="bi bi-exclamation-circle-fill me-2"></i> {scanError}
                                </div>
                            )}

                            {scannedStudent && (
                                <div className="d-flex align-items-center mt-3 p-2 rounded-3" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff', border: `1px solid ${colors.border}` }}>
                                    <img src={scannedStudent.profile_image} alt="Student" className="rounded-circle me-3 border border-info" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                    <div className="flex-grow-1">
                                        <div className="fw-bold small lh-sm">{scannedStudent.name}</div>
                                        <div className="text-muted" style={{ fontSize: '10px' }}>ID: {scannedStudent.rfid_tag} | {scannedStudent.class_name}</div>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-bold text-info">₹{scannedStudent.wallet_balance}</div>
                                        <div className="text-muted" style={{ fontSize: '10px' }}>Balance</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* --- END NEW RFID SCANNER SECTION --- */}

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
                        <div className="list-group list-group-flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <HistoryItem 
                                        key={tx.id}
                                        title={tx.description || "Wallet Transaction"} 
                                        date={new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} 
                                        amt={`${tx.type === 'CREDIT' ? '+' : '-'}₹${tx.amount}`} 
                                        isPlus={tx.type === 'CREDIT'} 
                                    />
                                ))
                            ) : (
                                <>
                                    <HistoryItem title="Canteen - Meal" date="Today" amt="-₹80" />
                                    <HistoryItem title="Library - Late Fee" date="24 Mar" amt="-₹20" />
                                    <HistoryItem title="Wallet Recharge" date="22 Mar" amt="+₹1000" isPlus />
                                    <HistoryItem title="Uniform Shop" date="15 Mar" amt="-₹450" />
                                    <HistoryItem title="Bus Subscription" date="01 Mar" amt="-₹1200" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
                </>
            )}
          </div>
        )}

        {/* SUPPORT TAB */}
        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="row justify-content-center animate-slide-up">
            <div className="col-md-8">
              {activeChat ? (
                /* --- WHATSAPP-STYLE LIVE CHAT --- */
                <div className="card overflow-hidden shadow-lg border-0" style={{ ...cardStyle, borderRadius: '24px' }}>
                  {/* Chat Header */}
                  <div className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{ background: theme === 'dark' ? '#1e293b' : '#f8fafc', borderColor: colors.border }}>
                    <div className="d-flex align-items-center gap-3">
                      <button onClick={() => setActiveChat(null)} className="btn btn-link text-decoration-none p-0 d-flex align-items-center" style={{ color: colors.text }}>
                        <i className="bi bi-arrow-left fs-4"></i>
                      </button>
                      <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm animate-pulse" style={{ width: '45px', height: '45px', background: activeChat === 'admin_chat' ? '#0dcaf0' : '#198754' }}>
                        <i className={`bi bi-${activeChat === 'admin_chat' ? 'shield-lock-fill' : 'person-workspace'} fs-5`}></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: colors.text }}>
                          {activeChat === 'admin_chat' ? 'School Administrator Support' : 'Class Teacher (John Teacher)'}
                        </h6>
                        <span className="text-success small d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                          <span className="bg-success rounded-circle" style={{ width: '6px', height: '6px', display: 'inline-block' }}></span>
                          Typically replies instantly
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message History Area */}
                  <div className="d-flex flex-column gap-2 p-3" style={{ height: '350px', overflowY: 'auto', background: theme === 'dark' ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.5)' }}>
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => {
                        const isMe = msg.senderRole === 'parent';
                        return (
                          <div key={msg.id} className={`d-flex flex-column ${isMe ? 'align-self-end' : 'align-self-start'}`} style={{ maxWidth: '75%' }}>
                            <div className="py-2 px-3 shadow-sm" style={{
                              background: isMe ? 'linear-gradient(135deg, #0dcaf0, #0aa2c0)' : (theme === 'dark' ? '#1e293b' : '#ffffff'),
                              color: isMe ? '#fff' : colors.text,
                              borderRadius: isMe ? '16px 16px 0px 16px' : '16px 16px 16px 0px',
                              border: isMe ? 'none' : `1px solid ${colors.border}`
                            }}>
                              <p className="mb-1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.95rem' }}>{msg.message}</p>
                              <div className="d-flex align-items-center justify-content-end gap-1 small opacity-75" style={{ fontSize: '0.72rem' }}>
                                <span>{new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                {isMe && (
                                  <i className={`bi bi-check2-all ${msg.isSeen ? 'text-primary' : ''}`}></i>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 opacity-50">
                        <i className={`bi bi-${activeChat === 'admin_chat' ? 'shield-lock-fill' : 'chat-square-text-fill'} fs-1 mb-2`}></i>
                        <p className="small mb-0">No messages yet. Send a message to start the secure chat!</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Footer */}
                  <div className="p-3 border-top" style={{ background: theme === 'dark' ? '#1e293b' : '#f8fafc', borderColor: colors.border }}>
                    <div className="input-group shadow-sm" style={{ borderRadius: '30px', overflow: 'hidden' }}>
                      <input 
                        type="text" 
                        className="form-control border-0 bg-light bg-opacity-10 px-4 py-3" 
                        style={{ color: colors.text, background: theme === 'dark' ? '#212529' : '#fff' }}
                        placeholder="Type a secure message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                      />
                      <button
                        onClick={handleSendChatMessage}
                        disabled={chatSending || !chatInput.trim()}
                        className="btn btn-info text-white px-4 d-flex align-items-center justify-content-center"
                      >
                        {chatSending
                          ? <div className="spinner-border spinner-border-sm" role="status"></div>
                          : <i className="bi bi-send-fill fs-5"></i>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* --- CHAT SELECTION MENU --- */
                <div className="card p-4 touch-card shadow-sm" style={cardStyle}>
                  <h4 className="fw-bold mb-4">Help & Support</h4>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4 col-6">
                      <button onClick={handleAdminChat} className="btn btn-outline-info w-100 py-3 rounded-4">
                        <i className="bi bi-chat-dots fs-3 d-block mb-2"></i> 
                        Chat with Admin
                      </button>
                    </div>
                    <div className="col-md-4 col-6">
                      <button onClick={handleTeacherChat} className="btn btn-outline-success w-100 py-3 rounded-4">
                        <i className="bi bi-person-workspace fs-3 d-block mb-2"></i> 
                        Chat with Teacher
                      </button>
                    </div>
                    <div className="col-md-4 col-12">
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
              )}
            </div>
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === 'meetings' && (
          <div className="animate-fade-in">
            <Meetings theme={isDark ? 'dark' : 'light'} />
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


