// import React, { useState } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import './Login.css';
// import { ShieldLock, Wifi, Grid, Person, PersonBadge } from 'react-bootstrap-icons';

// const Login = () => {
//     const [role, setRole] = useState('administrator');

//     return (
//         <div className="container-fluid vh-100 p-0 overflow-hidden">
//             <div className="row g-0 h-100">
//                 {/* Left Side: Branding */}
//                 <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-start p-5 branding-section">
//                     <div className="brand-header mb-5">
//                         <div className="logo-box me-2">
//                             <span className="logo-icon">💳</span>
//                         </div>
//                         <div>
//                             <h2 className="m-0 fw-bold text-white">EduScan</h2>
//                             <p className="text-info small m-0">RFID School Management</p>
//                         </div>
//                     </div>

//                     <h1 className="display-4 fw-bold text-white">Smart School</h1>
//                     <h1 className="display-4 fw-bold text-cyan mb-4">Management System</h1>

//                     <p className="text-light-muted mb-5 mw-75">
//                         Streamline attendance, payments, library, and student management with RFID technology.
//                     </p>

//                     <div className="features mt-4">
//                         <div className="d-flex align-items-center mb-4">
//                             <div className="icon-circle me-3"><Wifi /></div>
//                             <div>
//                                 <h6 className="text-white mb-0">RFID Integration</h6>
//                                 <small className="text-light-muted">Seamless card-based identification</small>
//                             </div>
//                         </div>
//                         <div className="d-flex align-items-center mb-4">
//                             <div className="icon-circle me-3"><ShieldLock /></div>
//                             <div>
//                                 <h6 className="text-white mb-0">Secure Access</h6>
//                                 <small className="text-light-muted">Role-based permissions for admin & parents</small>
//                             </div>
//                         </div>
//                         <div className="d-flex align-items-center mb-4">
//                             <div className="icon-circle me-3"><Grid /></div>
//                             <div>
//                                 <h6 className="text-white mb-0">Complete Management</h6>
//                                 <small className="text-light-muted">Attendance, fees, library in one place</small>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Right Side: Login Form */}
//                 <div className="col-lg-6 d-flex align-items-center justify-content-center bg-dark-navy p-4">
//                     <div className="login-card w-100" style={{ maxWidth: '450px' }}>
//                         <div className="text-center mb-4">
//                             <h2 className="text-white fw-bold">Welcome Back</h2>
//                             <p className="text-light-muted">Sign in to your account to continue</p>
//                         </div>

//                         {/* Role Toggle */}
//                         <div className="role-toggle d-flex mb-4">
//                             <button
//                                 className={`btn-role flex-fill ${role === 'administrator' ? 'active' : ''}`}
//                                 onClick={() => setRole('administrator')}
//                             >
//                                 <ShieldLock className="me-2" /> Administrator
//                             </button>
//                             <button
//                                 className={`btn-role flex-fill ${role === 'parent' ? 'active' : ''}`}
//                                 onClick={() => setRole('parent')}
//                             >
//                                 <Person className="me-2" /> Parent
//                             </button>
//                         </div>

//                         <div className="form-container p-4">
//                             <form>
//                                 <div className="mb-3">
//                                     <label className="form-label text-white small">Email Address</label>
//                                     <input type="email" className="form-control custom-input" placeholder="Enter your email" required />
//                                 </div>
//                                 <div className="mb-4">
//                                     <div className="d-flex justify-content-between">
//                                         <label className="form-label text-white small">Password</label>
//                                         <a href="#" className="text-cyan text-decoration-none small">Forgot Password?</a>
//                                     </div>
//                                     <input type="password" className="form-control custom-input" placeholder="Enter your password" required />
//                                 </div>
//                                 <button type="submit" className="btn btn-cyan w-100 fw-bold py-2 mb-4">
//                                     Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
//                                 </button>
//                             </form>
//                             <div className="text-center">
//                                 <p className="text-light-muted small">Don't have an account? <a href="#" className="text-cyan text-decoration-none">Register here</a></p>
//                             </div>
//                         </div>

//                         {/* Demo Credentials */}
//                         <div className="demo-box mt-4 p-3 text-center">
//                             <p className="text-light-muted small mb-1">Demo Credentials</p>
//                             <span className="text-white small opacity-75">Email: demo@eduscan.com   Pass: demo123</span>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;

import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';
import { ShieldLock, Wifi, Grid, Person } from 'react-bootstrap-icons';

const Auth = ({ onLogin }) => {
    const [role, setRole] = useState('administrator');

    const handleSubmit = (e) => {
        e.preventDefault();
        // This triggers the login function in your App.js
        if (onLogin) {
            onLogin(role);
        }
    };

    return (
        <div className="container-fluid vh-100 p-0 overflow-hidden">
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
                        Streamline attendance, payments, library, and student management with RFID technology.
                    </p>

                    <div className="features mt-4">
                        <div className="d-flex align-items-center mb-4">
                            <div className="icon-circle me-3"><Wifi /></div>
                            <div>
                                <h6 className="text-white mb-0">RFID Integration</h6>
                                <small className="text-light-muted">Seamless card-based identification</small>
                            </div>
                        </div>
                        <div className="d-flex align-items-center mb-4">
                            <div className="icon-circle me-3"><ShieldLock /></div>
                            <div>
                                <h6 className="text-white mb-0">Secure Access</h6>
                                <small className="text-light-muted">Role-based permissions for admin & parents</small>
                            </div>
                        </div>
                        <div className="d-flex align-items-center mb-4">
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

                        {/* Role Toggle */}
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
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-white small">Email Address</label>
                                    <input type="email" className="form-control custom-input" placeholder="Enter your email" required />
                                </div>
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between">
                                        <label className="form-label text-white small">Password</label>
                                        <a href="#" className="text-cyan text-decoration-none small">Forgot Password?</a>
                                    </div>
                                    <input type="password" className="form-control custom-input" placeholder="Enter your password" required />
                                </div>
                                <button type="submit" className="btn btn-cyan w-100 fw-bold py-2 mb-4">
                                    Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            </form>
                            <div className="text-center">
                                <p className="text-light-muted small">Don't have an account? <a href="#" className="text-cyan text-decoration-none">Register here</a></p>
                            </div>
                        </div>

                        {/* Demo Credentials */}
                        <div className="demo-box mt-4 p-3 text-center">
                            <p className="text-light-muted small mb-1">Demo Credentials</p>
                            <span className="text-white small opacity-75">Email: demo@eduscan.com   Pass: demo123</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;