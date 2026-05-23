import React from 'react';

const SuggestedQuestions = ({ onSelect }) => {
  const questions = [
    "Show attendance",
    "Show pending fees",
    "Show library books",
    "Show exam schedule"
  ];

  return (
    <div className="ai-suggested-questions">
      {questions.map((q, idx) => (
        <button 
          key={idx} 
          className="ai-suggested-btn"
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;
