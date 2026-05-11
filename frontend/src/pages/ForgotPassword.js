import React, { useState, useEffect } from "react";
import { Eye, EyeSlash, ArrowLeft } from "react-bootstrap-icons";
import "../Login.css"; // uses same CSS as login

const ForgotPassword = ({ setPage }) => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to request password reset");
      } else {
        setSuccess(data.message || "OTP sent to your email.");
        setStep(2);
        setCooldown(60); // start 60s cooldown
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Password reset failed");
      } else {
        setSuccess("Password reset successfully!");
        setTimeout(() => setPage("login"), 2000);
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
      <div className="login-card w-100" style={{ maxWidth: "450px" }}>
        
        {/* Back Button */}
        <button 
          onClick={() => setPage("login")}
          className="btn btn-link text-light-muted text-decoration-none p-0 mb-3 d-flex align-items-center"
        >
          <ArrowLeft className="me-2" /> Back to Login
        </button>

        <div className="text-center mb-4">
          <h2 className="text-white fw-bold">Reset Password</h2>
          <p className="text-light-muted">
            {step === 1 ? "Enter your email to receive an OTP" : "Enter OTP and your new password"}
          </p>
        </div>

        <div className="form-container p-4">
          {error && <div className="alert alert-danger small py-2">{error}</div>}
          {success && <div className="alert alert-success small py-2">{success}</div>}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp}>
              <div className="mb-4">
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control custom-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-cyan w-100 fw-bold py-2"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="mb-3">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="form-control custom-input text-muted"
                />
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="form-control custom-input text-center fw-bold fs-5 py-2"
                  style={{ letterSpacing: "5px" }}
                />
              </div>

              <div className="mb-3 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  required
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="btn btn-cyan w-100 fw-bold py-2 mb-3"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={cooldown > 0 || loading}
                className="btn btn-outline-secondary w-100 py-2 small"
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
