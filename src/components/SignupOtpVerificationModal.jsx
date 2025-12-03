// src/components/OtpVerificationModal.js
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../styles/SignupOtpVerificationModal.css';
import { Form, Input, Button, Alert } from "antd";


function OtpVerificationModal({ onClose, signupData, onOtpSuccess }) {

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Destructure & remap employee_number → employeeNumber
    const {
      domain_join_upn,
      password,
      email,
      employee_number,
      domain_to_join,
      recaptchaToken,
      specifyDomainOrUnit
    } = signupData;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(180);
  const [resendLoading, setResendLoading] = useState(false);

 // countdown
 useEffect(() => {
  if (timer > 0 && !success) {
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }
  if (timer === 0) {
    setError("OTP has expired. Please request a new one.");
  }
}, [timer, success]);

const handleChange = (el, idx) => {
  const v = el.value.replace(/[^0-9]/g, "");
  if (v.length <= 1) {
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < 5) {
      document.getElementById(`otp-input-${idx+1}`)?.focus();
    }
  }
  if (el.selectionStart === 0 && !v && idx > 0) {
    document.getElementById(`otp-input-${idx-1}`)?.focus();
  }
};

const handleOtpVerification = async () => {
  setLoading(true);
  setError("");
  const enteredOtp = otp.join("");

  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: enteredOtp }),
    });
    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
      setTimeout(onOtpSuccess, 1000);
    } else {
      setError(data.message || "OTP verification failed. Please try again.");
    }
  } catch {
    setError("An error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
};

const handleResendOtp = async () => {
  setResendLoading(true);
  setError("");

  // Build the exact same payload you used on signup:
  const payload = {
    domain_join_upn,
    password,
    email,
    employeeNumber: employee_number,
    domain_to_join,
    recaptchaToken,
    specifyDomainOrUnit,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (
      res.ok &&
      data.message ===
        "User exists in AD. OTP sent to email for verification."
    ) {
      setTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setTimeout(() => document.getElementById("otp-input-0")?.focus(), 50);
    } else {
      setError(data.message || "Failed to resend OTP. Please try again.");
    }
  } catch {
    setError("An error occurred while resending OTP. Please try again.");
  } finally {
    setResendLoading(false);
  }
};

return (
  <div className="otp-modal-overlay">
    <div className="otp-modal-container">
      <span onClick={onClose} className="otp-modal-close">
        <FaTimes />
      </span>
      <h2 className="otp-modal-title" style={{ color: "gray" }}>
        OTP Verification
      </h2>

      <p className="otp-timer">
        {timer > 0
          ? `OTP expires in: ${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`
          : "OTP has expired"}
      </p>

      <Form onFinish={handleOtpVerification} className="otp-modal-form">
        <div className="otp-input-container">
          {otp.map((d, i) => (
            <Form.Item key={i} className="otp-input-item">
              <Input
                id={`otp-input-${i}`}
                maxLength={1}
                value={d}
                onChange={e => handleChange(e.target, i)}
                disabled={timer === 0 || success}
                className="otp-input-box"
              />
            </Form.Item>
          ))}
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 10 }}
          />
        )}
        {success && (
          <Alert
            message="OTP verified successfully!"
            type="success"
            showIcon
            style={{ marginBottom: 10 }}
          />
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={loading || timer === 0 || success}
            block
          >
            Verify OTP
          </Button>
        </Form.Item>

        {timer === 0 && !success && (
          <Form.Item>
            <Button
              onClick={handleResendOtp}
              loading={resendLoading}
              disabled={resendLoading}
              block
            >
              Resend OTP
            </Button>
          </Form.Item>
        )}
      </Form>
    </div>
  </div>
);
}

export default OtpVerificationModal;