import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import './ai-chat.css';

const FloatingChatButton = ({ theme, token }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ai-chat-widget">
      {isOpen && (
        <ChatWindow 
          onClose={() => setIsOpen(false)} 
          theme={theme} 
          token={token} 
        />
      )}
      
      {!isOpen && (
        <button 
          className="ai-chat-button" 
          onClick={() => setIsOpen(true)}
          title="Ask AI Assistant"
        >
          <i className="bi bi-robot"></i>
        </button>
      )}
    </div>
  );
};

export default FloatingChatButton;
