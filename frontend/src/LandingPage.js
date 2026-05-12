
import React from 'react';
import { 
  CreditCard, 
  DoorOpen, 
  InfoCircle, 
  PersonBadge, 
  ArrowRightCircleFill 
} from 'react-bootstrap-icons';

const LandingPage = ({ onStart }) => {
  return (
    <div className="landing-wrapper">
      <style>{`
        .landing-wrapper {
          min-height: 100vh;
          background-color: var(--bg-main);
          background-image: radial-gradient(circle at top right, var(--accent) 0%, var(--bg-main) 70%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          padding: 20px;
          color: var(--text-primary);
          position: relative;
          overflow: hidden;
        }

        .landing-wrapper::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: url('https://www.transparenttextures.com/patterns/cubes.png');
          opacity: 0.05;
          animation: rotate 100s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .landing-card {
          background: var(--bg-card);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid var(--border);
          border-radius: 40px;
          padding: 60px;
          max-width: 1000px;
          width: 100%;
          box-shadow: 0 25px 50px -12px var(--card-shadow);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 10;
        }

        .smart-tag {
          background: var(--bg-input);
          color: var(--accent);
          padding: 10px 25px;
          border-radius: 50px;
          font-weight: 800;
          letter-spacing: 2px;
          font-size: 0.9rem;
          margin-bottom: 25px;
          display: inline-block;
          text-transform: uppercase;
          border: 1px solid var(--border);
        }

        .main-title {
          font-size: 4.5rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 25px;
          text-transform: uppercase;
          letter-spacing: -2px;
          color: var(--text-primary);
        }

        .sub-title {
          font-size: 1.5rem;
          color: var(--text-muted);
          font-weight: 400;
        }

        .get-started-btn {
          background: var(--accent);
          color: #ffffff;
          border: none;
          padding: 20px 50px;
          border-radius: 50px;
          font-size: 1.4rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 50px;
          box-shadow: 0 10px 30px rgba(32, 178, 170, 0.3);
        }

        .get-started-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(32, 178, 170, 0.5);
          background: var(--accent-hover);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 80px;
          width: 100%;
        }

        .feature-box {
          background: var(--bg-input);
          padding: 25px;
          border-radius: 24px;
          border: 1px solid var(--border);
          transition: 0.3s;
          text-align: center;
        }

        .feature-box:hover {
          background: var(--bg-card);
          transform: translateY(-5px);
          border-color: var(--accent);
        }

        .feat-icon {
          font-size: 2rem;
          margin-bottom: 15px;
          color: var(--accent);
          display: inline-block;
        }

        .feat-title {
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 5px;
          text-transform: uppercase;
          color: var(--text-primary);
        }

        .feat-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        @media (max-width: 992px) {
          .main-title { font-size: 3rem; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 576px) {
          .main-title { font-size: 2.2rem; }
          .features-grid { grid-template-columns: 1fr; }
          .landing-card { padding: 40px 20px; }
        }
      `}</style>

      <div className="landing-card animate-fade-in">
        <div className="landing-header">
          <div className="smart-tag">RFID Smart Campus</div>
          <h1 className="main-title">
            Welcome to a<br/>
            <span style={{color: 'var(--accent)'}}>Smarter</span><br/>
            Campus
          </h1>
          <p className="sub-title">Activate Your Smart Journey</p>
        </div>

        <button className="get-started-btn" onClick={onStart}>
          GET STARTED <ArrowRightCircleFill size={28} />
        </button>

        <div className="features-grid">
          <div className="feature-box">
            <DoorOpen className="feat-icon" />
            <div className="feat-title">Digital Access</div>
            <div className="feat-desc">Unlock doors & buildings</div>
          </div>
          <div className="feature-box">
            <CreditCard className="feat-icon" />
            <div className="feat-title">E-Purse Payments</div>
            <div className="feat-desc">Canteen & bookstore</div>
          </div>
          <div className="feature-box">
            <InfoCircle className="feat-icon" />
            <div className="feat-title">Real-Time Info</div>
            <div className="feat-desc">Campus map & events</div>
          </div>
          <div className="feature-box">
            <PersonBadge className="feat-icon" />
            <div className="feat-title">Smart ID</div>
            <div className="feat-desc">Your digital campus identity</div>
          </div>
        </div>
      </div>
      
      <div style={{position: 'absolute', bottom: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', zIndex: 10}}>
        SMART CAMPUS © 2024 | SMART | CONNECTED | SECURE
      </div>
    </div>
  );
};

export default LandingPage;
