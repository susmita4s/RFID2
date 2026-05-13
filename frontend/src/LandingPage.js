
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DoorOpen,
  InfoCircle,
  PersonBadge,
  ArrowRightCircleFill,
  ShieldCheck,
  Wifi,
  BusFront,
  BookHalf
} from 'react-bootstrap-icons';

/* ── RFID-related slide images ── */
const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=700&auto=format&fit=crop&q=85',
    label: 'Classroom Entry',
    caption: 'Student scanning at classroom door',
    status: 'Attendance'
  },
  {
    url: 'https://images.unsplash.com/photo-1556611356-91e847c2f00d?w=700&auto=format&fit=crop&q=85',
    label: 'Bus Boarding',
    caption: 'Safe entry to school transport',
    status: 'Boarded'
  },
  {
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=700&auto=format&fit=crop&q=85',
    label: 'Library Access',
    caption: 'Digital turnstile verification',
    status: 'Granted'
  },
  {
    url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&auto=format&fit=crop&q=85',
    label: 'Canteen Payment',
    caption: 'One-tap wallet transactions',
    status: 'Paid'
  },
];

const LandingPage = ({ onStart }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="lp-root">
      <style>{`
        /* ── ROOT ── */
        .lp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          color: #fff;
        }

        /* ── BLURRED CAMPUS BACKGROUND ── */
        .lp-bg {
          position: absolute;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1562774053-701939374585?w=1920&auto=format&fit=crop&q=80');
          background-size: cover;
          background-position: center;
          filter: blur(14px) brightness(0.28) saturate(1.5);
          transform: scale(1.07);
          z-index: 0;
        }
        .lp-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(140deg, rgba(5,22,20,0.9) 0%, rgba(20,100,90,0.55) 100%);
          z-index: 1;
        }

        /* ── FLOATING DECO ICONS ── */
        .lp-deco {
          position: absolute;
          color: #20b2aa;
          opacity: 0.15;
          z-index: 2;
          animation: lp-float 7s ease-in-out infinite;
        }
        .lp-deco:nth-child(even) { animation-duration: 9s; }
        @keyframes lp-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }

        /* ── MAIN GLASSMORPHISM CARD ── */
        .lp-card {
          position: relative;
          z-index: 10;
          background: rgba(8, 30, 27, 0.70);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(32,178,170,0.28);
          border-radius: 36px;
          padding: 52px 56px 44px 56px;
          max-width: 1080px;
          width: 100%;
          box-shadow:
            0 32px 80px rgba(0,0,0,0.55),
            0 0 0 1px rgba(32,178,170,0.10);
        }

        /* ── HERO ROW ── */
        .lp-hero {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 52px;
          align-items: center;
          margin-bottom: 44px;
        }

        /* ── LEFT: TEXT ── */
        .lp-tag {
          display: inline-block;
          background: rgba(32,178,170,0.20);
          color: #20b2aa;
          border: 1px solid rgba(32,178,170,0.40);
          border-radius: 50px;
          padding: 8px 22px;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .lp-title {
          font-size: 3.8rem;
          font-weight: 900;
          line-height: 1.06;
          letter-spacing: -2px;
          text-transform: uppercase;
          color: #fff;
          margin: 0 0 16px 0;
        }
        .lp-title .lp-accent { color: #20b2aa; }

        .lp-sub {
          font-size: 1.2rem;
          color: rgba(255,255,255,0.60);
          font-weight: 400;
          margin: 0;
        }

        /* ── RIGHT: SLIDER CARD ── */
        .lp-slider-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lp-slider-card {
          background: rgba(32,178,170,0.10);
          border: 1.5px solid rgba(32,178,170,0.38);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          box-shadow:
            0 16px 48px rgba(0,0,0,0.45),
            0 0 28px rgba(32,178,170,0.18);
        }

        .lp-slider-viewport {
          overflow: hidden;
          border-radius: 22px 22px 0 0;
          height: 230px;
        }

        .lp-slider-track {
          display: flex;
          height: 100%;
          transition: transform 0.65s cubic-bezier(0.4,0,0.2,1);
        }

        .lp-slide-img {
          min-width: 100%;
          height: 100%;
          object-fit: cover;
          flex-shrink: 0;
          filter: brightness(0.85) saturate(1.1);
        }

        /* Badge on image */
        .lp-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(32,178,170,0.92);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 5px 13px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.4s ease;
        }

        .lp-slide-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px 6px 16px;
        }
        .lp-slide-footer span  { font-size: 0.78rem; color: rgba(255,255,255,0.65); }
        .lp-slide-footer strong { font-size: 0.8rem; color: #20b2aa; }

        /* Dot indicators */
        .lp-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          padding: 6px 0 10px;
        }
        .lp-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: rgba(32,178,170,0.30);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }
        .lp-dot.active {
          background: #20b2aa;
          width: 20px;
          border-radius: 4px;
        }

        /* ── GET STARTED BUTTON ── */
        .lp-btn {
          width: 100%;
          background: #20b2aa;
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 16px 28px;
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 28px rgba(32,178,170,0.45);
          transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .lp-btn:hover {
          background: #1bc9c1;
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(32,178,170,0.60);
        }

        /* ── FEATURE BOXES ── */
        .lp-features {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .lp-feat {
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(32,178,170,0.14);
          border-radius: 20px;
          padding: 22px 16px 18px;
          text-align: center;
          cursor: default;
          transition: all 0.28s ease;
        }
        .lp-feat:hover {
          background: rgba(32,178,170,0.10);
          border-color: rgba(32,178,170,0.40);
          transform: translateY(-5px);
          box-shadow: 0 10px 28px rgba(32,178,170,0.14);
        }
        .lp-feat-icon {
          font-size: 1.75rem;
          color: #20b2aa;
          display: inline-block;
          margin-bottom: 10px;
        }
        .lp-feat-title {
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #fff;
          margin-bottom: 4px;
        }
        .lp-feat-desc {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.48);
        }

        /* ── FOOTER ── */
        .lp-footer {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.72rem;
          letter-spacing: 1.2px;
          color: rgba(255,255,255,0.28);
          z-index: 10;
          white-space: nowrap;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 920px) {
          .lp-hero { grid-template-columns: 1fr; gap: 32px; }
          .lp-title { font-size: 2.8rem; }
          .lp-card  { padding: 40px 32px; }
          .lp-slider-card, .lp-btn { max-width: 380px; margin: 0 auto; width: 100%; }
        }
        @media (max-width: 580px) {
          .lp-title    { font-size: 2.1rem; }
          .lp-features { grid-template-columns: repeat(2, 1fr); }
          .lp-card     { padding: 28px 16px; }
        }
      `}</style>

      {/* ── Background ── */}
      <div className="lp-bg" />
      <div className="lp-overlay" />

      {/* ── Decorative icons ── */}
      <BookHalf    className="lp-deco" style={{fontSize:'3rem',   top:'7%',    left:'3%'}} />
      <Wifi        className="lp-deco" style={{fontSize:'2.6rem', top:'5%',    right:'4%'}} />
      <ShieldCheck className="lp-deco" style={{fontSize:'2.8rem', bottom:'17%',left:'2.5%'}} />
      <BusFront    className="lp-deco" style={{fontSize:'2.5rem', bottom:'13%',right:'3%'}} />

      {/* ── Main card ── */}
      <div className="lp-card">

        {/* ── Hero row ── */}
        <div className="lp-hero">

          {/* Left: text */}
          <div>
            <div className="lp-tag">RFID Smart Campus</div>
            <h1 className="lp-title">
              Welcome to a<br/>
              <span className="lp-accent">Smarter</span><br/>
              Campus
            </h1>
            <p className="lp-sub">Activate Your Smart Journey</p>
          </div>

          {/* Right: slider + button */}
          <div className="lp-slider-wrap">

            {/* Slider card */}
            <div className="lp-slider-card">

              {/* Viewport */}
              <div className="lp-slider-viewport">
                <div
                  className="lp-slider-track"
                  style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                  {SLIDES.map((s, i) => (
                    <img key={i} className="lp-slide-img" src={s.url} alt={s.label} />
                  ))}
                </div>
              </div>

              {/* Badge */}
              <div className="lp-badge">
                <Wifi size={9} /> {SLIDES[activeSlide].label}
              </div>

              {/* Footer */}
              <div className="lp-slide-footer">
                <span>{SLIDES[activeSlide].caption}</span>
                <strong>● {SLIDES[activeSlide].status}</strong>
              </div>

              {/* Dots */}
              <div className="lp-dots">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    className={`lp-dot${i === activeSlide ? ' active' : ''}`}
                    onClick={() => setActiveSlide(i)}
                  />
                ))}
              </div>
            </div>

            {/* GET STARTED */}
            <button className="lp-btn" onClick={onStart}>
              GET STARTED <ArrowRightCircleFill size={20} />
            </button>
          </div>
        </div>

        {/* ── Feature boxes ── */}
        <div className="lp-features">
          <div className="lp-feat">
            <DoorOpen   className="lp-feat-icon" />
            <div className="lp-feat-title">Digital Access</div>
            <div className="lp-feat-desc">Unlock doors & buildings</div>
          </div>
          <div className="lp-feat">
            <CreditCard className="lp-feat-icon" />
            <div className="lp-feat-title">E-Purse Payments</div>
            <div className="lp-feat-desc">Canteen & bookstore</div>
          </div>
          <div className="lp-feat">
            <InfoCircle className="lp-feat-icon" />
            <div className="lp-feat-title">Real-Time Info</div>
            <div className="lp-feat-desc">Campus map & events</div>
          </div>
          <div className="lp-feat">
            <PersonBadge className="lp-feat-icon" />
            <div className="lp-feat-title">Smart ID</div>
            <div className="lp-feat-desc">Your digital campus identity</div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="lp-footer">
        SMART CAMPUS © 2024 &nbsp;|&nbsp; SMART | CONNECTED | SECURE
      </div>
    </div>
  );
};

export default LandingPage;
