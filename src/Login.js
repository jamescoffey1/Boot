import React, { useState } from "react";
import axios from "axios";
import { FaUserAlt, FaEnvelope, FaLock } from "react-icons/fa";
import "./App.css";
import MatrixBackground from "./MatrixBackground";

function SignupSuccessPopup({ show, onClose }) {
  if (!show) return null;
  return (
    <div className="signup-popup-overlay">
      <div className="signup-popup">
        <div className="signup-popup-title">Sign up successful!</div>
        <div className="signup-popup-msg">You can now log in.</div>
        <button className="signup-popup-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function Login({ onLogin }) {
  const [mode, setMode] = useState(null); // null, 'login', 'signup'
  const [loginValue, setLoginValue] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSignupPopup, setShowSignupPopup] = useState(false);

  const API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

  async function handleSignup(e) {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      if (!signupUsername || !signupEmail || !signupPassword) {
        setError("Please fill in all fields.");
        return;
      }
      const response = await axios.post(`${API_URL}/users/signup`, {
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
      });
      setSuccess("Account created! You can now log in.");
      setError("");
      setShowSignupPopup(true);
      setMode("login");
      setLoginValue(signupUsername);
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.msg || "An error occurred during sign up.");
      setSuccess("");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      if (!loginValue || !password) {
        setError("Please fill in all fields.");
        return;
      }
      const response = await axios.post(`${API_URL}/users/login`, {
        login: loginValue,
        password,
      });

      // Store user data to maintain session
      localStorage.setItem("bootlegger_user", JSON.stringify(response.data.user));
      localStorage.setItem("loggedInUser", response.data.user.username); // for backward compatibility with other components

      setError("");
      setSuccess("");
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.response?.data?.msg || "An error occurred during login.");
      setSuccess("");
    }
  }

  return (
    <>
      <MatrixBackground />
      <SignupSuccessPopup show={showSignupPopup} onClose={() => setShowSignupPopup(false)} />
      <div className="login-bg">
        <div className="login-center">
          {mode === null && (
            <>
              <button className="login-btn" onClick={() => setMode("login")}>Login</button>
              <button className="login-btn" onClick={() => setMode("signup")}>Sign-up</button>
            </>
          )}
          {mode === "signup" && (
            <form className="signup-card" onSubmit={handleSignup}>
              <div className="signup-title">Welcome back</div>
              <label className="signup-label"><FaUserAlt className="signup-icon" /> Username</label>
              <input
                className="signup-input"
                placeholder="Enter your user name"
                value={signupUsername}
                onChange={e => setSignupUsername(e.target.value)}
                autoFocus
              />
              <label className="signup-label"><FaEnvelope className="signup-icon" /> Email</label>
              <input
                className="signup-input"
                placeholder="Enter your email address"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                type="email"
              />
              <label className="signup-label"><FaLock className="signup-icon" /> Password</label>
              <input
                className="signup-input"
                placeholder="Enter your password"
                type="password"
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
              />
              <div className="signup-remember-row">
                <input type="checkbox" id="signup-remember" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <label htmlFor="signup-remember" className="signup-remember-label">Remember me</label>
              </div>
              <button className="signup-btn" type="submit">Sign Up</button>
              {error && <div className="login-form-error">{error}</div>}
              {success && <div className="login-form-success">{success}</div>}
              <div className="signup-divider-row">
                <div className="signup-divider" />
                <span className="signup-or">OR</span>
                <div className="signup-divider" />
              </div>
              <div className="signup-bottom-link">
                Already have an account?{' '}
                <span className="signup-link" onClick={() => setMode("login")}>Login here</span>
              </div>
            </form>
          )}
          {mode === "login" && (
            <form className="signup-card" onSubmit={handleLogin}>
              <div className="signup-title">Welcome back</div>
              <label className="signup-label"><FaUserAlt className="signup-icon" /> Username or Email</label>
              <input
                className="signup-input"
                placeholder="Enter your username or email"
                value={loginValue}
                onChange={e => setLoginValue(e.target.value)}
                autoFocus
              />
              <label className="signup-label"><FaLock className="signup-icon" /> Password</label>
              <input
                className="signup-input"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div className="signup-remember-row">
                <input type="checkbox" id="login-remember" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <label htmlFor="login-remember" className="signup-remember-label">Remember me</label>
              </div>
              <button className="signup-btn" type="submit">Login</button>
              {error && <div className="login-form-error">{error}</div>}
              {success && <div className="login-form-success">{success}</div>}
              <div className="signup-divider-row">
                <div className="signup-divider" />
                <span className="signup-or">OR</span>
                <div className="signup-divider" />
              </div>
              <div className="signup-bottom-link">
                Don't have an account?{' '}
                <span className="signup-link" onClick={() => setMode("signup")}>Sign up here</span>
              </div>
            </form>
          )}
        </div>
        <div className="login-watermark">Bootlegger</div>
        <div className="login-copyright">Bootlegger © 2015-2026</div>
      </div>
    </>
  );
} 