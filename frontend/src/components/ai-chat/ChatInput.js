import React, { useState } from 'react';

const ChatInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form className="ai-chat-input-container" onSubmit={handleSubmit}>
      <input
        type="text"
        className="ai-chat-input"
        placeholder="Ask a question..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
      />
      <button 
        type="submit" 
        className="ai-chat-send-btn"
        disabled={disabled || !input.trim()}
      >
        <i className="bi bi-send-fill"></i>
      </button>
    </form>
  );
};

export default ChatInput;
