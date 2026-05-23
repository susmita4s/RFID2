import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="ai-chat-message-row assistant">
      <div className="ai-typing-indicator">
        <div className="ai-typing-dot"></div>
        <div className="ai-typing-dot"></div>
        <div className="ai-typing-dot"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
