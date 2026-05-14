import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';
import { ShieldLock, Wifi, Grid, Person, XCircleFill, Eye, EyeSlash } from 'react-bootstrap-icons';

const Auth = ({ onLogin, setPage, setRegisterRole }) => {
    const [role, setRole] = useState('administrator');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // State for the Feature Popup
    const [activeFeature, setActiveFeature] = useState(null);

    // Content for the Popups
    const featureInfo = {
        rfid: {
            title: "RFID Integration",
            icon: <Wifi />,
            description: "Our advanced RFID system provides real-time tracking of students. It automates attendance logs and sends instant notifications to parents' mobile devices as soon as a student scans their ID card."
        },
        secure: {
            title: "Secure Access",
            icon: <ShieldLock />,
            description: "Security is our priority. We use end-to-end encryption for all student data. Role-based access ensures that Administrators and Parents only see information relevant to their permissions."
        },
        management: {
            title: "Complete Management",
            description: "A truly all-in-one solution. From fee collection tracking to library book management and automated report card generation, EduScan handles the heavy lifting of school administration.",
            icon: <Grid />
        }
    };

    // --- OTP State ---
    const [showOTP, setShowOTP] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const [verifying, setVerifying] = useState(false);

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;
        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
        // Focus next input
        if (element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length < 6) return setError('Please enter complete OTP');
        
        setVerifying(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/parents/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: otpEmail, otp: otpValue })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                if (onLogin) onLogin('parent');
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('Verification failed. Please check your network.');
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loginUrl = role === 'parent' 
                ? 'http://localhost:5000/api/parents/login' 
                : 'http://localhost:5000/api/auth/login';

            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // If unverified parent tries to login
                if (data.requireOtp || data.error?.includes('verify your email')) {
                    setError('Please verify your email via the activation link before login.');
                } else {
                    setError(data.error || 'Invalid email or password.');
                }
            } else {
                if (data.requiresOTP) {
                    setOtpEmail(data.email || email);
                    setShowOTP(true);
                } else {
                    // Success (Admin)
                    localStorage.setItem('token', data.token);
                    const userData = data.admin || data.user;
                    localStorage.setItem('user', JSON.stringify(userData));
                    
                    if (onLogin) {
                        onLogin(userData.role === 'admin' ? 'administrator' : 'parent');
                    }
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Server connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 p-0 overflow-hidden position-relative">
            
            {/* Feature Popup Modal */}
            {activeFeature && (
                <div className="feature-overlay" onClick={() => setActiveFeature(null)}>
                    <div className="feature-popup-card" onClick={(e) => e.stopPropagation()}>
                        <button className="close-popup" onClick={() => setActiveFeature(null)}>
                            <XCircleFill />
                        </button>
                        <div className="icon-circle mb-3">{featureInfo[activeFeature].icon}</div>
                        <h3 className="text-white mb-3">{featureInfo[activeFeature].title}</h3>
                        <p className="text-light-muted">{featureInfo[activeFeature].description}</p>
                        <button className="btn btn-cyan mt-3" onClick={() => setActiveFeature(null)}>Got it</button>
                    </div>
                </div>
            )}

            {/* OTP Modal Overlay */}
            {showOTP && (
                <div className="feature-overlay d-flex justify-content-center align-items-center" style={{ zIndex: 9999 }}>
                    <div className="login-card p-4 text-center" style={{ maxWidth: '400px', width: '100%', background: '#fff' }}>
                        <h3 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Verify Login</h3>
                        <p className="small text-muted mb-4">
                            We've sent a 6-digit secure OTP to <strong>{otpEmail}</strong>.<br/>
                            Please enter it below to securely access the Parent Portal.
                        </p>
                        
                        {error && <div className="alert alert-danger py-2 small">{error}</div>}

                        <form onSubmit={handleVerifyOTP}>
                            <div className="d-flex justify-content-center gap-2 mb-4">
                                {otp.map((data, index) => (
                                    <input
                                        className="form-control text-center fw-bold fs-4"
                                        type="text"
                                        name="otp"
                                        maxLength="1"
                                        key={index}
                                        value={data}
                                        onChange={e => handleOtpChange(e.target, index)}
                                        onFocus={e => e.target.select()}
                                        style={{ width: '45px', height: '55px', border: '2px solid #e2e8f0', borderRadius: '10px', color: '#0f172a', backgroundColor: '#f8fafc' }}
                                    />
                                ))}
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn btn-cyan w-100 fw-bold py-3 mb-3 shadow"
                                disabled={verifying}
                            >
                                {verifying ? "Verifying..." : "Secure Login"}
                            </button>
                            
                            <button 
                                type="button" 
                                className="btn btn-link text-muted small w-100 text-decoration-none"
                                onClick={() => { setShowOTP(false); setError(''); }}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="row g-0 h-100">
                {/* Left Side: Branding */}
                <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-start p-5 branding-section">
                    <div className="brand-header mb-5">
                        <div className="logo-box me-2">
                            <span className="logo-icon">💳</span>
                        </div>
                        <div>
                            <h2 className="m-0 fw-bold text-white">EduScan</h2>
                            <p className="text-info small m-0">RFID School Management</p>
                        </div>
                    </div>

                    <h1 className="display-4 fw-bold text-white">Smart School</h1>
                    <h1 className="display-4 fw-bold text-cyan mb-4">Management System</h1>
                    
                    <p className="text-light-muted mb-5 mw-75">
                        <strong>Streamline attendance, payments, library, and student management with RFID technology. 
                        </strong>
                    </p>

                    <div className="features mt-4">
                        {/* FEATURE 1 */}
                        <div className="feature-item d-flex align-items-center mb-4" onClick={() => setActiveFeature('rfid')}>
                            <div className="icon-circle me-3"><Wifi /></div>
                            <div>
                                <h6 className="text-white mb-0">RFID Integration</h6>
                                <small className="text-light-muted">Seamless card-based identification</small>
                            </div>
                        </div>

                        {/* FEATURE 2 */}
                        <div className="feature-item d-flex align-items-center mb-4" onClick={() => setActiveFeature('secure')}>
                            <div className="icon-circle me-3"><ShieldLock /></div>
                            <div>
                                <h6 className="text-white mb-0">Secure Access</h6>
                                <small className="text-light-muted">Role-based permissions for admin & parents</small>
                            </div>
                        </div>

                        {/* FEATURE 3 */}
                        <div className="feature-item d-flex align-items-center mb-4" onClick={() => setActiveFeature('management')}>
                            <div className="icon-circle me-3"><Grid /></div>
                            <div>
                                <h6 className="text-white mb-0">Complete Management</h6>
                                <small className="text-light-muted">Attendance, fees, library in one place</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="col-lg-6 d-flex align-items-center justify-content-center bg-dark-navy p-4">
                    <div className="login-card w-100" style={{ maxWidth: '450px' }}>
                        <div className="text-center mb-4">
                            <h2 className="text-white fw-bold">Welcome Back</h2>
                            <p className="text-light-muted">Sign in to your account to continue</p>
                        </div>

                        <div className="role-toggle d-flex mb-4">
                            <button 
                                type="button"
                                className={`btn-role flex-fill ${role === 'administrator' ? 'active' : ''}`}
                                onClick={() => setRole('administrator')}
                            >
                                <ShieldLock className="me-2" /> Administrator
                            </button>
                            <button 
                                type="button"
                                className={`btn-role flex-fill ${role === 'parent' ? 'active' : ''}`}
                                onClick={() => setRole('parent')}
                            >
                                <Person className="me-2" /> Parent
                            </button>
                        </div>

                        <div className="form-container p-4">
                            {error && <div className="alert alert-danger small py-2 text-center">{error}</div>}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-white small">Email Address</label>
                                    <input 
                                        type="email" 
                                        className="form-control custom-input" 
                                        placeholder="Eg:abc@gmail.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between">
                                        <label className="form-label text-white small"></label>
                                        <span 
                                            onClick={() => setPage('forgot-password')}
                                            className="text-cyan text-decoration-none small"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            Forgot Password?
                                        </span>
                                    </div>
                                    <div className="position-relative">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            className="form-control custom-input" 
                                            placeholder="Enter your password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required 
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-link text-white position-absolute end-0 top-50 translate-middle-y text-decoration-none px-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex="-1"
                                            style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                                        >
                                            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className="btn btn-cyan w-100 fw-bold py-2 mb-4"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                                </button>
                            </form>
                            <div className="text-center">
                                <p className="text-light-muted small">Don't have an account?{" "}
                                    <span
                                        onClick={() => {
                                            if (setRegisterRole) setRegisterRole(role);
                                            setPage('register');
                                        }}
                                        className="text-cyan text-decoration-none"
                                        style={{ cursor: "pointer" }}
                                    >
                                        Register here
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="demo-box mt-4 p-3 text-center">
                            <p className="text-light-muted small mb-1">Demo Credentials</p>
                            <span className="text-white small opacity-75">Admin: admin@school.com / admin123</span><br/>
                            <span className="text-white small opacity-75">Parent: parent1@example.com / demo123 (if seeded)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;