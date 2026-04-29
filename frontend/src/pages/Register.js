import React, { useState, useEffect } from "react";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import "../Login.css"; // ✅ use same CSS as login

const Register = ({ setPage }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: "parent", // Hardcode role as parent for this form
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
      } else if (data.requireOtp) {
        setShowOtpModal(true);
        setCooldown(60); // start 60s cooldown
        setSuccess(data.message);
      } else {
        // Admin or fallback
        setSuccess("Registered Successfully!");
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
          email: formData.email,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
      } else {
        setSuccess("Account Activated Successfully!");
        setShowOtpModal(false);
        setTimeout(() => setPage("login"), 2000);
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
        body: JSON.stringify({ email: formData.email }),
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
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark-navy position-relative">
      
      {/* OTP Modal Overlay */}
      {showOtpModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1050, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)" }}
        >
          <div className="bg-white p-4 rounded-4 shadow-lg text-center" style={{ width: "90%", maxWidth: "400px" }}>
            <h3 className="fw-bold mb-3">Verify Your Email</h3>
            <p className="text-muted small mb-4">
              We've sent a 6-digit OTP to <strong>{formData.email}</strong>.<br/>
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

      <div className="login-card w-100" style={{ maxWidth: "450px" }}>
        <div className="text-center mb-4">
          <h2 className="text-white fw-bold">Parent Registration</h2>
          <p className="text-light-muted">Create an account to monitor your child</p>
        </div>

        <div className="form-container p-4">
          {error && <div className="alert alert-danger small py-2">{error}</div>}
          {success && !showOtpModal && <div className="alert alert-success small py-2">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-control custom-input"
                />
              </div>
              <div className="col-6">
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-control custom-input"
                />
              </div>
            </div>

            <div className="mb-3">
              <input
                type="email"
                name="email"
                required
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="form-control custom-input"
              />
            </div>

            <div className="mb-3">
              <input
                type="tel"
                name="phone"
                required
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="form-control custom-input"
              />
            </div>

            <div className="mb-3 position-relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="form-control custom-input pe-5"
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
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-control custom-input pe-5"
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

          <div className="text-center mt-4">
            <p className="text-light-muted small">
              Already have an account?{" "}
              <span
                onClick={() => setPage("login")}
                className="text-cyan text-decoration-none"
                style={{ cursor: "pointer" }}
              >
                Login here
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;