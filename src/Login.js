// // import React, { useState } from 'react';
// // import 'bootstrap/dist/css/bootstrap.min.css';
// // import './Login.css';
// // import { ShieldLock, Wifi, Grid, Person, PersonBadge } from 'react-bootstrap-icons';

// // const Login = () => {
// //     const [role, setRole] = useState('administrator');

// //     return (
// //         <div className="container-fluid vh-100 p-0 overflow-hidden">
// //             <div className="row g-0 h-100">
// //                 {/* Left Side: Branding */}
// //                 <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-start p-5 branding-section">
// //                     <div className="brand-header mb-5">
// //                         <div className="logo-box me-2">
// //                             <span className="logo-icon">💳</span>
// //                         </div>
// //                         <div>
// //                             <h2 className="m-0 fw-bold text-white">EduScan</h2>
// //                             <p className="text-info small m-0">RFID School Management</p>
// //                         </div>
// //                     </div>

// //                     <h1 className="display-4 fw-bold text-white">Smart School</h1>
// //                     <h1 className="display-4 fw-bold text-cyan mb-4">Management System</h1>
                    
// //                     <p className="text-light-muted mb-5 mw-75">
// //                         Streamline attendance, payments, library, and student management with RFID technology.
// //                     </p>

// //                     <div className="features mt-4">
// //                         <div className="d-flex align-items-center mb-4">
// //                             <div className="icon-circle me-3"><Wifi /></div>
// //                             <div>
// //                                 <h6 className="text-white mb-0">RFID Integration</h6>
// //                                 <small className="text-light-muted">Seamless card-based identification</small>
// //                             </div>
// //                         </div>
// //                         <div className="d-flex align-items-center mb-4">
// //                             <div className="icon-circle me-3"><ShieldLock /></div>
// //                             <div>
// //                                 <h6 className="text-white mb-0">Secure Access</h6>
// //                                 <small className="text-light-muted">Role-based permissions for admin & parents</small>
// //                             </div>
// //                         </div>
// //                         <div className="d-flex align-items-center mb-4">
// //                             <div className="icon-circle me-3"><Grid /></div>
// //                             <div>
// //                                 <h6 className="text-white mb-0">Complete Management</h6>
// //                                 <small className="text-light-muted">Attendance, fees, library in one place</small>
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </div>

// //                 {/* Right Side: Login Form */}
// //                 <div className="col-lg-6 d-flex align-items-center justify-content-center bg-dark-navy p-4">
// //                     <div className="login-card w-100" style={{ maxWidth: '450px' }}>
// //                         <div className="text-center mb-4">
// //                             <h2 className="text-white fw-bold">Welcome Back</h2>
// //                             <p className="text-light-muted">Sign in to your account to continue</p>
// //                         </div>

// //                         {/* Role Toggle */}
// //                         <div className="role-toggle d-flex mb-4">
// //                             <button 
// //                                 className={`btn-role flex-fill ${role === 'administrator' ? 'active' : ''}`}
// //                                 onClick={() => setRole('administrator')}
// //                             >
// //                                 <ShieldLock className="me-2" /> Administrator
// //                             </button>
// //                             <button 
// //                                 className={`btn-role flex-fill ${role === 'parent' ? 'active' : ''}`}
// //                                 onClick={() => setRole('parent')}
// //                             >
// //                                 <Person className="me-2" /> Parent
// //                             </button>
// //                         </div>

// //                         <div className="form-container p-4">
// //                             <form>
// //                                 <div className="mb-3">
// //                                     <label className="form-label text-white small">Email Address</label>
// //                                     <input type="email" className="form-control custom-input" placeholder="Enter your email" required />
// //                                 </div>
// //                                 <div className="mb-4">
// //                                     <div className="d-flex justify-content-between">
// //                                         <label className="form-label text-white small">Password</label>
// //                                         <a href="#" className="text-cyan text-decoration-none small">Forgot Password?</a>
// //                                     </div>
// //                                     <input type="password" className="form-control custom-input" placeholder="Enter your password" required />
// //                                 </div>
// //                                 <button type="submit" className="btn btn-cyan w-100 fw-bold py-2 mb-4">
// //                                     Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
// //                                 </button>
// //                             </form>
// //                             <div className="text-center">
// //                                 <p className="text-light-muted small">Don't have an account? <a href="#" className="text-cyan text-decoration-none">Register here</a></p>
// //                             </div>
// //                         </div>

// //                         {/* Demo Credentials */}
// //                         <div className="demo-box mt-4 p-3 text-center">
// //                             <p className="text-light-muted small mb-1">Demo Credentials</p>
// //                             <span className="text-white small opacity-75">Email: demo@eduscan.com   Pass: demo123</span>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // export default Login;

// import React, { useState } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import './Login.css';
// import { ShieldLock, Wifi, Grid, Person, Eye, EyeSlash, ArrowLeft } from 'react-bootstrap-icons';

// const Login = () => {
//     const [role, setRole] = useState('administrator');
//     const [isRegistering, setIsRegistering] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);

//     // Toggle between Login and Registration views
//     const toggleAuthMode = (e) => {
//         e.preventDefault();
//         setIsRegistering(!isRegistering);
//     };

//     return (
//         <div className="container-fluid vh-100 p-0 overflow-hidden">
//             <div className="row g-0 h-100">
//                 {/* Left Side: Branding (Hidden on mobile for registration) */}
//                 <div className={`col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-start p-5 branding-section`}>
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
//                         <FeatureItem icon={<Wifi />} title="RFID Integration" desc="Seamless card-based identification" />
//                         <FeatureItem icon={<ShieldLock />} title="Secure Access" desc="Role-based permissions for admin & parents" />
//                         <FeatureItem icon={<Grid />} title="Complete Management" desc="Attendance, fees, library in one place" />
//                     </div>
//                 </div>

//                 {/* Right Side: Auth Form */}
//                 <div className="col-lg-6 d-flex flex-column align-items-center justify-content-center bg-dark-navy p-4 overflow-auto">
                    
//                     {/* Back to Login Link (Only for Registration) */}
//                     {isRegistering && (
//                         <div className="w-100 mb-4" style={{ maxWidth: '450px' }}>
//                             <a href="#" onClick={toggleAuthMode} className="text-light-muted text-decoration-none small d-flex align-items-center">
//                                 <ArrowLeft className="me-2" /> Back to Login
//                             </a>
//                         </div>
//                     )}

//                     <div className="login-card w-100" style={{ maxWidth: '450px' }}>
//                         <div className="text-center mb-4">
//                             <h2 className="text-white fw-bold">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
//                             <p className="text-light-muted">
//                                 {isRegistering ? 'Register to access the school management system' : 'Sign in to your account to continue'}
//                             </p>
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
//                                 {isRegistering && (
//                                     <div className="mb-3">
//                                         <label className="form-label text-white small">Full Name</label>
//                                         <input type="text" className="form-control custom-input" placeholder="Enter your full name" required />
//                                     </div>
//                                 )}

//                                 <div className="row">
//                                     <div className={`${isRegistering ? 'col-md-6' : 'col-12'} mb-3`}>
//                                         <label className="form-label text-white small">Email Address</label>
//                                         <input type="email" className="form-control custom-input" placeholder="your@email.com" required />
//                                     </div>
//                                     {isRegistering && (
//                                         <div className="col-md-6 mb-3">
//                                             <label className="form-label text-white small">Phone Number</label>
//                                             <input type="tel" className="form-control custom-input" placeholder="+1 (555) 000-0000" />
//                                         </div>
//                                     )}
//                                 </div>

//                                 <div className="mb-3">
//                                     <div className="d-flex justify-content-between">
//                                         <label className="form-label text-white small">Password</label>
//                                         {!isRegistering && <a href="#" className="text-cyan text-decoration-none small">Forgot Password?</a>}
//                                     </div>
//                                     <div className="position-relative">
//                                         <input 
//                                             type={showPassword ? "text" : "password"} 
//                                             className="form-control custom-input pe-5" 
//                                             placeholder="Create a strong password" 
//                                             required 
//                                         />
//                                         <div 
//                                             className="position-absolute top-50 end-0 translate-middle-y me-3 cursor-pointer text-light-muted"
//                                             onClick={() => setShowPassword(!showPassword)}
//                                         >
//                                             {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {isRegistering && (
//                                     <div className="mb-4">
//                                         <label className="form-label text-white small">Confirm Password</label>
//                                         <input type="password" className="form-control custom-input" placeholder="Confirm your password" required />
//                                     </div>
//                                 )}

//                                 {isRegistering && role === 'parent' && (
//                                     <div className="info-box mb-4 p-3 rounded">
//                                         <p className="text-cyan small mb-0">
//                                             As a parent, you'll be able to link your child's RFID card after registration to view their attendance, fees, and library records.
//                                         </p>
//                                     </div>
//                                 )}

//                                 <button type="submit" className="btn btn-cyan w-100 fw-bold py-2 mb-4 shadow-glow">
//                                     {isRegistering ? 'Register as ' : 'Sign in as '}
//                                     {role.charAt(0).toUpperCase() + role.slice(1)}
//                                 </button>
//                             </form>
                            
//                             <div className="text-center">
//                                 <p className="text-light-muted small">
//                                     {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
//                                     <a href="#" onClick={toggleAuthMode} className="text-cyan text-decoration-none ms-1 fw-bold">
//                                         {isRegistering ? 'Sign in' : 'Register here'}
//                                     </a>
//                                 </p>
//                             </div>
//                         </div>

//                         {!isRegistering && (
//                             <div className="demo-box mt-4 p-3 text-center">
//                                 <p className="text-light-muted small mb-1">Demo Credentials</p>
//                                 <span className="text-white small opacity-75">Email: demo@eduscan.com &nbsp; Pass: demo123</span>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// // Sub-component for features
// const FeatureItem = ({ icon, title, desc }) => (
//     <div className="d-flex align-items-center mb-4">
//         <div className="icon-circle me-3 shadow-glow">{icon}</div>
//         <div>
//             <h6 className="text-white mb-0">{title}</h6>
//             <small className="text-light-muted">{desc}</small>
//         </div>
//     </div>
// );

// export default Login;


import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';
import { ShieldLock, Wifi, Grid, Person } from 'react-bootstrap-icons';

const Login = ({ onLogin }) => {
    const [role, setRole] = useState('administrator');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Calls the login function passed from App.js
        if (onLogin) onLogin(role);
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
                                className={`btn-role flex-fill ${role === 'administrator' ? 'active' : ''}`}
                                onClick={() => setRole('administrator')}
                            >
                                <ShieldLock className="me-2" /> Administrator
                            </button>
                            <button 
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

export default Login;