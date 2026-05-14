import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const SetPassword = ({ onGoToLogin }) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [token, setToken]               = useState('');
  const [parentInfo, setParentInfo]     = useState(null);
  const [tokenStatus, setTokenStatus]   = useState('validating'); // 'validating' | 'valid' | 'invalid' | 'expired' | 'used'

  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [showPassword, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [success, setSuccess]           = useState(false);
  const [countdown, setCountdown]       = useState(5);

  // ── Password strength ──────────────────────────────────────────────────────
  const strength = (() => {
    if (!password) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (password.length >= 8)              score++;
    if (/[A-Z]/.test(password))            score++;
    if (/[a-z]/.test(password))            score++;
    if (/[0-9]/.test(password))            score++;
    if (/[^A-Za-z0-9]/.test(password))    score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
    return { score, label: labels[score], color: colors[score] };
  })();

  // ── Step 1: Extract token from URL & validate ──────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');

    if (!t) {
      setTokenStatus('invalid');
      return;
    }

    setToken(t);
    validateToken(t);
  }, []);

  const validateToken = async (t) => {
    try {
      const res  = await fetch(`/api/parents/validate-token?token=${encodeURIComponent(t)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setParentInfo(data.parent);
        setTokenStatus('valid');
      } else if (data.code === 'TOKEN_EXPIRED') {
        setTokenStatus('expired');
      } else if (data.code === 'ALREADY_ACTIVE') {
        setTokenStatus('used');
      } else {
        setTokenStatus('invalid');
      }
    } catch {
      setTokenStatus('invalid');
    }
  };

  // ── Step 2: Submit new password ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (strength.score < 3) {
      setSubmitError('Please choose a stronger password (Good or better).');
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch('/api/parents/set-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password, confirmPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        // Countdown then redirect to login
        let c = 5;
        const interval = setInterval(() => {
          c--;
          setCountdown(c);
          if (c <= 0) {
            clearInterval(interval);
            // Clear the token from the URL and go to login
            window.history.replaceState({}, document.title, '/');
            if (onGoToLogin) onGoToLogin();
          }
        }, 1000);
      } else {
        setSubmitError(data.message || 'Failed to set password. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const StatusCard = ({ icon, title, subtitle, actionLabel, onAction }) => (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={{ color: '#00d9cc', fontSize: '22px' }}>💳</span>
            <span style={styles.logoText}>EduScan</span>
          </div>
        </div>
        <div style={styles.body}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>{icon}</div>
          <h3 style={styles.statusTitle}>{title}</h3>
          <p style={styles.statusSubtitle}>{subtitle}</p>
          {actionLabel && onAction && (
            <button onClick={onAction} style={styles.btnPrimary}>{actionLabel}</button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Render: Validating ─────────────────────────────────────────────────────
  if (tokenStatus === 'validating') {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.logo}>
              <span style={{ color: '#00d9cc', fontSize: '22px' }}>💳</span>
              <span style={styles.logoText}>EduScan</span>
            </div>
          </div>
          <div style={{ ...styles.body, textAlign: 'center' }}>
            <div style={styles.spinner} />
            <p style={{ color: '#94a3b8', marginTop: '20px' }}>Validating your activation link…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Invalid token ──────────────────────────────────────────────────
  if (tokenStatus === 'invalid') {
    return (
      <StatusCard
        icon="❌"
        title="Invalid Activation Link"
        subtitle="This activation link is invalid or has already been used. Please contact your school administrator for a new invitation."
        actionLabel="Go to Login"
        onAction={() => { window.history.replaceState({}, '', '/'); if (onGoToLogin) onGoToLogin(); }}
      />
    );
  }

  // ── Render: Expired token ──────────────────────────────────────────────────
  if (tokenStatus === 'expired') {
    return (
      <StatusCard
        icon="⏰"
        title="Activation Link Expired"
        subtitle="This activation link has expired (valid for 24 hours). Please contact your school administrator to resend the invitation."
        actionLabel="Go to Login"
        onAction={() => { window.history.replaceState({}, '', '/'); if (onGoToLogin) onGoToLogin(); }}
      />
    );
  }

  // ── Render: Already activated ──────────────────────────────────────────────
  if (tokenStatus === 'used') {
    return (
      <StatusCard
        icon="✅"
        title="Account Already Activated"
        subtitle="Your Parent Portal account is already active. Please login with your email and password."
        actionLabel="Go to Login"
        onAction={() => { window.history.replaceState({}, '', '/'); if (onGoToLogin) onGoToLogin(); }}
      />
    );
  }

  // ── Render: Success ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.logo}>
              <span style={{ color: '#00d9cc', fontSize: '22px' }}>💳</span>
              <span style={styles.logoText}>EduScan</span>
            </div>
          </div>
          <div style={{ ...styles.body, textAlign: 'center' }}>
            <div style={styles.successCircle}>✓</div>
            <h3 style={{ ...styles.statusTitle, color: '#10b981' }}>Password Created Successfully!</h3>
            <p style={styles.statusSubtitle}>
              Your Parent Portal account is now active. You can login using your email and the password you just created.
            </p>
            <div style={styles.countdownBox}>
              <span style={{ color: '#00d9cc', fontWeight: '700', fontSize: '24px' }}>{countdown}</span>
              <span style={{ color: '#94a3b8', fontSize: '14px', display: 'block' }}>Redirecting to Login…</span>
            </div>
            <button
              onClick={() => { window.history.replaceState({}, '', '/'); if (onGoToLogin) onGoToLogin(); }}
              style={styles.btnPrimary}
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Set Password Form ──────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={{ color: '#00d9cc', fontSize: '22px' }}>💳</span>
            <span style={styles.logoText}>EduScan</span>
          </div>
          <h2 style={styles.headerTitle}>Set Your Password</h2>
          <p style={styles.headerSubtitle}>Parent Portal Activation</p>
        </div>

        {/* Body */}
        <div style={styles.body}>

          {/* Welcome message */}
          {parentInfo && (
            <div style={styles.welcomeBox}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>👋</div>
              <p style={{ color: '#1e293b', fontWeight: '600', margin: '0 0 4px 0' }}>
                Welcome, {parentInfo.firstName}!
              </p>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                {parentInfo.email}
              </p>
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div style={styles.errorBox}>
              <span style={{ marginRight: '8px' }}>⚠️</span>{submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Password field */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  style={styles.input}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex="-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={styles.strengthTrack}>
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        style={{
                          ...styles.strengthSegment,
                          backgroundColor: i <= strength.score ? strength.color : '#e2e8f0'
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', color: strength.color, fontWeight: '600' }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  style={{
                    ...styles.input,
                    borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : undefined
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                  tabIndex="-1"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                  Passwords do not match.
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p style={{ color: '#10b981', fontSize: '12px', marginTop: '6px' }}>
                  ✓ Passwords match
                </p>
              )}
            </div>

            {/* Requirements */}
            <div style={styles.requirementsBox}>
              <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                Password Requirements:
              </p>
              {[
                { check: password.length >= 8,           label: 'At least 8 characters' },
                { check: /[A-Z]/.test(password),         label: 'One uppercase letter' },
                { check: /[a-z]/.test(password),         label: 'One lowercase letter' },
                { check: /[0-9]/.test(password),         label: 'One number' },
              ].map((req, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ color: req.check ? '#10b981' : '#94a3b8', fontSize: '12px' }}>
                    {req.check ? '✓' : '○'}
                  </span>
                  <span style={{ color: req.check ? '#1e293b' : '#94a3b8', fontSize: '12px' }}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.btnPrimary,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {submitting ? (
                <span>Creating Password…</span>
              ) : (
                <span>🔐 Create My Password</span>
              )}
            </button>

          </form>

          <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
            🔒 This is a secure one-time link. It will expire after use.
          </p>
        </div>

      </div>
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  },
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    padding: '32px 40px',
    textAlign: 'center',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0,217,204,0.12)',
    border: '2px solid #00d9cc',
    borderRadius: '12px',
    padding: '8px 16px',
    marginBottom: '16px',
  },
  logoText: {
    color: '#00d9cc',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '1px',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 6px 0',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: 0,
  },
  body: {
    padding: '32px 36px',
  },
  welcomeBox: {
    background: 'linear-gradient(135deg, #ecfdf5, #f0fdf9)',
    border: '1px solid #6ee7b7',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    marginBottom: '24px',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    color: '#1e293b',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '12px 44px 12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  },
  strengthTrack: {
    display: 'flex',
    gap: '4px',
    marginBottom: '4px',
  },
  strengthSegment: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    transition: 'background-color 0.3s',
  },
  requirementsBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '24px',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #00d9cc, #0891b2)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50px',
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 15px rgba(0,217,204,0.35)',
    display: 'block',
    textAlign: 'center',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '20px',
  },
  statusTitle: {
    color: '#0f172a',
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '12px',
  },
  statusSubtitle: {
    color: '#64748b',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '28px',
  },
  successCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    color: '#fff',
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
  },
  countdownBox: {
    background: '#f0fdf4',
    border: '2px solid #6ee7b7',
    borderRadius: '12px',
    padding: '16px',
    margin: '20px 0',
    textAlign: 'center',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTopColor: '#00d9cc',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
};

// Spinner keyframes injected globally
if (typeof document !== 'undefined' && !document.getElementById('sp-keyframes')) {
  const style = document.createElement('style');
  style.id = 'sp-keyframes';
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default SetPassword;
