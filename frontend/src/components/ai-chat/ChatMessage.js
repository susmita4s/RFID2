import React from 'react';

const ChatMessage = ({ message, role }) => {
  return (
    <div className={`ai-chat-message-row ${role === 'user' ? 'user' : 'assistant'}`}>
      <div className="ai-chat-message-bubble">
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;
