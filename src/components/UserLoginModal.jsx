import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert } from "antd";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/UserLoginModal.css";
import "../styles/fonts.css";

function UserLoginModal({ onSignUpClick, redirectPath, onLoginSuccess }) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailOrdomain_join_upn, setEmailOrdomain_join_upn] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async () => {
    if (!emailOrdomain_join_upn || !password) {
      setError("Please fill out all fields");
      return;
    }

    try {
      const payload = { domain_join_upn: emailOrdomain_join_upn, password };
      const response = await axios.post(`${API_BASE_URL}/auth/login`, payload);
      const { user } = response.data;
      const { role } = response.data.user;
      const { organizationalUnitPath, domain_join_upn, email } = user;

      localStorage.setItem("domain_join_upn", domain_join_upn);
      localStorage.setItem("email", email);
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);

      let redirectPath = "/user-dashboard";
      if (role === "admin") redirectPath = "/admin-dashboard";

      setTimeout(() => {
        navigate(redirectPath, {
          state: {
            user: { ...user, domain_join_upn, role, organizationalUnitPath, email },
            role,
          },
        });
      }, 1000);

      if (onLoginSuccess) onLoginSuccess(redirectPath, role, user);
    } catch (err) {
      setError(err.response?.data?.message || "Server Error");
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Hello!</h2>
        <p className="login-subtitle">Welcome to a Smarter Workspace.</p>

        <input
          type="text"
          placeholder="Username"
          className="login-input"
          value={emailOrdomain_join_upn}
          onChange={handleInputChange(setEmailOrdomain_join_upn)}
        />

        <div className="login-password-wrapper">
          <input
            type={passwordVisible ? "text" : "password"}
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={handleInputChange(setPassword)}
          />
          <span className="toggle-password-icon" onClick={togglePasswordVisibility}>
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {/* <div className="recover-password">Recover Password?</div> */}

        {error && (
          <Alert
            message={error}
            type={error === "User account is pending admin approval" ? "warning" : "error"}
            showIcon
            style={{ marginBottom: "10px", textAlign: "center" }}
          />
        )}

        <button className="signin-button" onClick={handleLogin}>Sign in</button>

        <div className="divider">
          <span className="divider-line" /> Or continue with <span className="divider-line" />
        </div>

        <p className="signup-text">
          Don’t have an account?{" "}
          <span className="signup-link" onClick={onSignUpClick}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

export default UserLoginModal;
