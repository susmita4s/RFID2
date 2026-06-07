import React, { useState, useEffect } from "react";
import { Eye, EyeSlash, Person, Envelope, Telephone, Lock, Building, Briefcase } from "react-bootstrap-icons";
import "../Login.css"; // ✅ use same CSS as login

const Register = ({ setPage, role = "parent", onLogin, theme }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    schoolName: "",
    staffRole: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Dynamic Roles State
  const [dynamicRoles, setDynamicRoles] = useState([]);

  useEffect(() => {
    if (role === "staff") {
      fetch("http://localhost:5000/api/auth/roles")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDynamicRoles(data.roles);
          }
        })
        .catch(err => console.error("Failed to fetch roles:", err));
    }
  }, [role]);

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log("FORM DATA:", form);
    
    const { firstName, lastName, email, phone, password, confirmPassword, schoolName, staffRole } = form;

    // Frontend validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || (role === "administrator" && !schoolName) || (role === "staff" && !staffRole)) {
      setError("All required fields must be filled");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          confirmPassword,
          role: role === "administrator" ? "admin" : role === "staff" ? "staff" : "parent",
          schoolName: role === "administrator" ? schoolName : undefined,
          staffRole: role === "staff" ? staffRole : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setError(data.message || data.error || "Registration failed");
      } else if (data.requireOtp) {
        setShowOtpModal(true);
        setCooldown(60); // start 60s cooldown
        setSuccess(data.message);
      } else {
        setSuccess(data.message || "Registered Successfully!");
        // Clear form fields
        setForm({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
          schoolName: "",
          staffRole: "",
        });
        setTimeout(() => setPage("login"), 2000);
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          otp,
          schoolName: role === "administrator" ? form.schoolName : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
      } else {
        setSuccess("Account Activated Successfully!");
        setShowOtpModal(false);
        
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setTimeout(() => {
            if (onLogin) onLogin(data.user.role);
          }, 2000);
        } else {
          setTimeout(() => setPage("login"), 2000);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend OTP");
      } else {
        setSuccess(data.message || "OTP sent successfully");
        setCooldown(60);
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`container-fluid vh-100 d-flex align-items-center justify-content-center position-relative ${theme === 'dark' ? 'bg-dark-navy' : 'bg-light-gray'}`}
      style={{
        backgroundImage: `url(/bg-login.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Add a subtle overlay to ensure text remains readable */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: theme === 'dark' ? 'rgba(5, 22, 20, 0.7)' : 'rgba(241, 245, 249, 0.6)' }}></div>
      
      {/* OTP Modal Overlay */}
      {showOtpModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1050, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)" }}
        >
          <div className={`p-4 rounded-4 shadow-lg text-center ${theme === 'dark' ? 'bg-dark text-white' : 'bg-white'}`} style={{ width: "90%", maxWidth: "400px" }}>
            <h3 className="fw-bold mb-3">Verify Your Email</h3>
            <p className="text-muted small mb-4">
              We've sent a 6-digit OTP to <strong>{form.email}</strong>.<br/>
              This code will expire in 10 minutes.
            </p>
            
            {error && <div className="alert alert-danger small py-2">{error}</div>}
            {success && <div className="alert alert-success small py-2">{success}</div>}

            <form onSubmit={handleVerifyOtp}>
              <div className="mb-4">
                <input
                  type="text"
                  className="form-control text-center fw-bold fs-4 py-2 custom-input"
                  placeholder="------"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  style={{ letterSpacing: "10px" }}
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-cyan w-100 fw-bold py-2 mb-3"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <button
              onClick={handleResendOtp}
              disabled={cooldown > 0 || loading}
              className="btn btn-outline-secondary w-100 py-2 small"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        </div>
      )}

      <div 
        className="login-card w-100" 
        style={{ 
          maxWidth: "550px",
          position: 'relative', 
          zIndex: 1, 
          backdropFilter: 'blur(12px)', 
          backgroundColor: theme === 'dark' ? 'rgba(10, 36, 33, 0.6)' : 'rgba(255, 255, 255, 0.7)' 
        }}
      >
        <div className="text-center mb-4">
          <h2 className={`${theme === 'dark' ? 'text-white' : 'text-dark'} fw-bold`}>
            {role === "administrator" ? "Administrator" : role === "staff" ? "Staff" : "Parent"} Registration
          </h2>
          <p className="text-light-muted">
            {role === "administrator" 
              ? "Create an administrator account to manage the system" 
              : role === "staff" ? "Create a staff account" : "Create an account to monitor your child"}
          </p>
        </div>

        <div className="form-container p-4">
          {error && <div className="alert alert-danger small py-2">{error}</div>}
          {success && !showOtpModal && <div className="alert alert-success small py-2">{success}</div>}

          <form onSubmit={handleRegister}>
            <div className="row g-2 mb-3">
              <div className="col-6 position-relative">
                <Person className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px', zIndex: 5 }} />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="form-control custom-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              <div className="col-6 position-relative">
                <Person className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px', zIndex: 5 }} />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  required
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="form-control custom-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {role === "administrator" && (
              <div className="mb-3 position-relative">
                <Building className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px', zIndex: 5 }} />
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  autoComplete="organization"
                  required
                  placeholder="School Name"
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  className="form-control custom-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            )}

            {role === "staff" && (
              <div className="mb-3 position-relative">
                <Briefcase className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px', zIndex: 5 }} />
                <select
                  id="staffRole"
                  name="staffRole"
                  required
                  value={form.staffRole}
                  onChange={(e) => setForm({ ...form, staffRole: e.target.value })}
                  className="form-select custom-input"
                  style={{ paddingLeft: '40px', color: form.staffRole ? undefined : 'var(--text-muted)' }}
                >
                  <option value="" disabled>Select Staff Role</option>
                  {dynamicRoles.map((r, idx) => (
                    <option key={idx} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-3 position-relative">
              <Envelope className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px', zIndex: 5 }} />
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="form-control custom-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <div className="mb-3 position-relative">
              <Telephone className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px', zIndex: 5 }} />
              <input
                type="tel"
                id="phone"
                name="phone"
                autoComplete="tel"
                required
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="form-control custom-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <div className="mb-3 position-relative">
              <Lock className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px', zIndex: 5 }} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                autoComplete="new-password"
                required
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="form-control custom-input pe-5"
                style={{ paddingLeft: '40px' }}
              />
              <button
                type="button"
                className="btn position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent text-muted"
                onClick={() => setShowPassword(!showPassword)}
                style={{ zIndex: 5, paddingRight: '15px' }}
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </button>
            </div>

            <div className="mb-4 position-relative">
              <Lock className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px', zIndex: 5 }} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="form-control custom-input pe-5"
                style={{ paddingLeft: '40px' }}
              />
              <button
                type="button"
                className="btn position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent text-muted"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ zIndex: 5, paddingRight: '15px' }}
              >
                {showConfirmPassword ? <EyeSlash /> : <Eye />}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-cyan w-100 fw-bold py-2"
              disabled={loading}
            >
              {loading ? "Processing..." : "Register Now"}
            </button>
          </form>

          <div className="text-center mt-4 d-flex flex-column gap-2">
            <p className="text-light-muted small mb-0">
              Already have an account?{" "}
              <span
                onClick={() => setPage("login")}
                className="text-cyan text-decoration-none"
                style={{ cursor: "pointer" }}
              >
                Login here
              </span>
            </p>
            <span
              onClick={() => setPage("landing")}
              className="text-cyan small text-decoration-none"
              style={{ cursor: "pointer", opacity: 0.8 }}
            >
              ← Back to Home
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;