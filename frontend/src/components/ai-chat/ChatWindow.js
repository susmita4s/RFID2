import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import SuggestedQuestions from './SuggestedQuestions';
import './ai-chat.css';

const ChatWindow = ({ onClose, theme, token }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [retryMsg, setRetryMsg] = useState('');
  const messagesEndRef = useRef(null);
  
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    // Fetch initial chat history
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/ai-chat/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch AI chat history", err);
      } finally {
        setFetchingHistory(false);
      }
    };
    
    if (token) {
      fetchHistory();
    } else {
      setFetchingHistory(false);
    }
  }, [token, backendUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (text) => {
    // Add user message to UI immediately (optimistic update)
    const tempId = `temp_${Date.now()}`;
    const userMsg = { id: tempId, role: 'user', message: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/ai-chat/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      if (res.status === 503 && data.error === 'ai_unavailable') {
        // AI is temporarily busy — remove optimistic user message and show retry notice
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setRetryMsg(data.message || 'The AI is busy, please try again in a moment.');
        setTimeout(() => setRetryMsg(''), 5000);
        return;
      }

      if (data.success && data.message) {
        // Replace temp user msg with real saved one from DB, then add AI reply
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempId),
          data.userMsg,
          data.message
        ]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (err) {
      console.error(err);
      // Remove optimistic message on network error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setRetryMsg('Network error. Please check your connection and try again.');
      setTimeout(() => setRetryMsg(''), 5000);
    } finally {
      setLoading(false);
    }
  };


  const handleEscalate = async () => {
    const issue = prompt("Please briefly describe your issue for the administrator:");
    if (!issue) return;
    
    try {
      const res = await fetch(`${backendUrl}/api/ai-chat/escalate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ issue })
      });
      
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'assistant',
          message: "I've sent an escalation request to the administrator. They will contact you soon."
        }]);
      }
    } catch (e) {
      alert("Failed to escalate issue.");
    }
  };

  return (
    <div className={`ai-chat-window ${theme === 'dark' ? 'dark-mode' : ''}`}>
      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-title">
          <i className="bi bi-robot fs-4"></i>
          AI Parent Assistant
        </div>
        <button className="ai-chat-close-btn" onClick={onClose} title="Close">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* Messages Area */}
      <div className="ai-chat-messages-container">
        {fetchingHistory ? (
          <div className="text-center text-muted mt-3">Loading history...</div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center mt-3" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                <p>Hello! I can help you with attendance, fees, library books, and more.</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <ChatMessage key={msg.id || index} message={msg.message} role={msg.role} />
            ))}
            
            {!loading && (
              <div className="mt-2 mb-1">
                <SuggestedQuestions onSelect={handleSendMessage} />
              </div>
            )}
          </>
        )}
        
        {loading && <TypingIndicator />}
        
        {/* Retry notice - shown when AI is temporarily unavailable */}
        {retryMsg && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '13px',
            color: theme === 'dark' ? '#fbbf24' : '#92400e',
            textAlign: 'center'
          }}>
            ⚠️ {retryMsg}
          </div>
        )}
        
        {/* Invisible div to scroll to bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Escalate option if there are messages */}
      {!fetchingHistory && messages.length > 0 && (
        <div className="px-3 pb-2 text-center">
          <button 
            className="btn btn-link btn-sm text-decoration-none" 
            style={{ fontSize: '11px', color: '#64748b' }}
            onClick={handleEscalate}
          >
            Not helpful? Escalate to Admin
          </button>
        </div>
      )}

      {/* Input Area */}
      <ChatInput onSend={handleSendMessage} disabled={loading || fetchingHistory} />
    </div>
  );
};

export default ChatWindow;
