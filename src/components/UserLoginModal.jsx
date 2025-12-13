import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert } from "antd";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/UserLoginModal.css";
import "../styles/fonts.css";

function UserLoginModal({ onSignUpClick, onLoginSuccess }) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailOrdomain_join_upn, setEmailOrdomain_join_upn] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const navigate = useNavigate();

  const DOMAIN_SUFFIX = "@kggroup.com";

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const applyDomainIfNeeded = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (trimmed.includes("@")) return trimmed;
    return `${trimmed}${DOMAIN_SUFFIX}`;
  };

  const getFormattedGreeting = () => {
    if (!emailOrdomain_join_upn || (!isPasswordFocused && !password)) {
      return "Hello!";
    }

    const usernameBeforeAt = emailOrdomain_join_upn.split("@")[0];
    if (!usernameBeforeAt) return "Hello!";

    const nameParts = usernameBeforeAt
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .filter(Boolean);

    return nameParts.length ? `Hello ${nameParts.join(" . ")}!` : "Hello!";
  };

  const handleLogin = async (e) => {
    e.preventDefault(); // ✅ allow browser to detect form submit

    const normalizedUPN = applyDomainIfNeeded(emailOrdomain_join_upn);

    if (!normalizedUPN || !password) {
      setError("Please fill out all fields");
      return;
    }

    try {
      const payload = { domain_join_upn: normalizedUPN, password };
      const response = await axios.post(`${API_BASE_URL}/auth/login`, payload);

      const { user, accessToken, refreshToken } = response.data;
      const { role, organizationalUnitPath, domain_join_upn, email } = user;

      localStorage.setItem("domain_join_upn", domain_join_upn);
      localStorage.setItem("email", email);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("role", role?.toLowerCase());

      const redirectPath =
        role === "superadmin" ? "/admin-dashboard" : "/user-dashboard";

      setTimeout(() => {
        navigate(redirectPath, {
          state: {
            user: { ...user, role, organizationalUnitPath, email },
            role,
          },
        });
      }, 500);

      onLoginSuccess?.(redirectPath, role, user);
    } catch (err) {
      setError(err.response?.data?.message || "Server Error");
    }
  };

  const shouldShowSuggestion =
    emailOrdomain_join_upn && !emailOrdomain_join_upn.includes("@");

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">{getFormattedGreeting()}</h2>
        <p className="login-subtitle">Welcome to a Smarter Workspace.</p>

        {/* ✅ FORM ADDED */}
        <form onSubmit={handleLogin} autoComplete="on">
          <div className="login-username-wrapper">
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Username"
              className="login-input"
              value={emailOrdomain_join_upn}
              onChange={(e) => setEmailOrdomain_join_upn(e.target.value)}
            />

            {shouldShowSuggestion && (
              <div
                className="login-domain-suggestion"
                onClick={() =>
                  setEmailOrdomain_join_upn(
                    applyDomainIfNeeded(emailOrdomain_join_upn)
                  )
                }
              >
                {applyDomainIfNeeded(emailOrdomain_join_upn)}
              </div>
            )}
          </div>

          <div className="login-password-wrapper">
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() =>
                !password && !emailOrdomain_join_upn &&
                setIsPasswordFocused(false)
              }
            />
            <span
              className="toggle-password-icon"
              onClick={togglePasswordVisibility}
            >
              {passwordVisible ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && (
            <Alert
              message={error}
              type={
                error === "User account is pending admin approval"
                  ? "warning"
                  : "error"
              }
              showIcon
              style={{ marginBottom: 10, textAlign: "center" }}
            />
          )}

          {/* ✅ submit button */}
          <button type="submit" className="signin-button">
            Sign in
          </button>
        </form>

        <div className="divider">
          <span className="divider-line" /> Or continue with{" "}
          <span className="divider-line" />
        </div>

        <p className="signup-text">
          Don&apos;t have an account?{" "}
          <span className="signup-link" onClick={onSignUpClick}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

export default UserLoginModal;


// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { Alert } from "antd";
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import "../styles/UserLoginModal.css";
// import "../styles/fonts.css";

// function UserLoginModal({ onSignUpClick, redirectPath, onLoginSuccess }) {
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//   const [passwordVisible, setPasswordVisible] = useState(false);
//   const [emailOrdomain_join_upn, setEmailOrdomain_join_upn] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isPasswordFocused, setIsPasswordFocused] = useState(false);
//   const navigate = useNavigate();

//   // ✅ fixed domain suffix
//   const DOMAIN_SUFFIX = "@kggroup.com";

//   const togglePasswordVisibility = () => {
//     setPasswordVisible(!passwordVisible);
//   };

//   // ✅ helper to add domain if user only typed username
//   const applyDomainIfNeeded = (value) => {
//     const trimmed = value.trim();
//     if (!trimmed) return trimmed;
//     if (trimmed.includes("@")) return trimmed; // already full UPN/email
//     return `${trimmed}${DOMAIN_SUFFIX}`;
//   };

//   // Extract and format username for greeting
//   const getFormattedGreeting = () => {
//     if (!emailOrdomain_join_upn || (!isPasswordFocused && !password)) {
//       return "Hello!";
//     }

//     const usernameBeforeAt = emailOrdomain_join_upn.split("@")[0];
//     if (!usernameBeforeAt) return "Hello!";

//     const nameParts = usernameBeforeAt
//       .split(".")
//       .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
//       .filter((part) => part.length > 0);

//     if (nameParts.length === 0) return "Hello!";

//     const formattedName = nameParts.join(" . ");
//     return `Hello ${formattedName}!`;
//   };

//   const handleLogin = async () => {
//     // ✅ always normalize with domain before validating / sending
//     const normalizedUPN = applyDomainIfNeeded(emailOrdomain_join_upn);

//     if (!normalizedUPN || !password) {
//       setError("Please fill out all fields");
//       return;
//     }

//     try {
//       const payload = { domain_join_upn: normalizedUPN, password };
//       const response = await axios.post(`${API_BASE_URL}/auth/login`, payload);
//       const { user } = response.data;
//       const { role } = response.data.user;
//       const { organizationalUnitPath, domain_join_upn, email } = user;

//       // reflect normalized value in UI/localStorage
//       localStorage.setItem("domain_join_upn", domain_join_upn);
//       localStorage.setItem("email", email);
//       localStorage.setItem("accessToken", response.data.accessToken);
//       localStorage.setItem("refreshToken", response.data.refreshToken);

//       // ✅ store role so LandingPage can use it
//       if (role) {
//         localStorage.setItem("role", role.toLowerCase());
//       } else {
//         localStorage.removeItem("role");
//       }

//       let nextRedirectPath = "/user-dashboard";
//       if (role === "superadmin") nextRedirectPath = "/admin-dashboard";

//       setTimeout(() => {
//         navigate(nextRedirectPath, {
//           state: {
//             user: { ...user, domain_join_upn, role, organizationalUnitPath, email },
//             role,
//           },
//         });
//       }, 1000);

//       if (onLoginSuccess) onLoginSuccess(nextRedirectPath, role, user);
//     } catch (err) {
//       setError(err.response?.data?.message || "Server Error");
//     }
//   };

//   const handleInputChange = (setter) => (e) => {
//     setter(e.target.value);
//     if (error) setError("");
//   };

//   const handlePasswordFocus = () => {
//     setIsPasswordFocused(true);
//   };

//   const handlePasswordBlur = () => {
//     if (!password && !emailOrdomain_join_upn) {
//       setIsPasswordFocused(false);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       handleLogin();
//     }
//   };

//   // ✅ when user clicks the suggestion "rames@kggroup.com"
//   const handleDomainSuggestionClick = () => {
//     setEmailOrdomain_join_upn((prev) => applyDomainIfNeeded(prev));
//   };

//   // whether to show suggestion dropdown
//   const shouldShowSuggestion =
//     emailOrdomain_join_upn.trim() !== "" &&
//     !emailOrdomain_join_upn.includes("@");

//   const suggestedValue = applyDomainIfNeeded(emailOrdomain_join_upn);

//   return (
//     <div className="login-container">
//       <div className="login-card">
//         <h2 className="login-title">{getFormattedGreeting()}</h2>
//         <p className="login-subtitle">Welcome to a Smarter Workspace.</p>

//         <div className="login-username-wrapper">
//           <input
//             type="text"
//             name="username"
//             autoComplete="username"
//             placeholder="Username"
//             className="login-input"
//             value={emailOrdomain_join_upn}
//             onChange={handleInputChange(setEmailOrdomain_join_upn)}
//             onKeyDown={handleKeyDown}
//           />

//           {/* ✅ suggestion dropdown for @kggroup.com */}
//           {shouldShowSuggestion && (
//             <div
//               className="login-domain-suggestion"
//               onClick={handleDomainSuggestionClick}
//             >
//               {suggestedValue}
//             </div>
//           )}
//         </div>

//         <div className="login-password-wrapper">
//           <input
//             type={passwordVisible ? "text" : "password"}
//             name="password"
//             autoComplete="current-password"
//             placeholder="Password"
//             className="login-input"
//             value={password}
//             onChange={handleInputChange(setPassword)}
//             onFocus={handlePasswordFocus}
//             onBlur={handlePasswordBlur}
//             onKeyDown={handleKeyDown}
//           />
//           <span className="toggle-password-icon" onClick={togglePasswordVisibility}>
//             {passwordVisible ? <FaEyeSlash /> : <FaEye />}
//           </span>
//         </div>

//         {error && (
//           <Alert
//             message={error}
//             type={
//               error === "User account is pending admin approval" ? "warning" : "error"
//             }
//             showIcon
//             style={{ marginBottom: "10px", textAlign: "center" }}
//           />
//         )}

//         <button className="signin-button" onClick={handleLogin}>
//           Sign in
//         </button>

//         <div className="divider">
//           <span className="divider-line" /> Or continue with{" "}
//           <span className="divider-line" />
//         </div>

//         <p className="signup-text">
//           Don&apos;t have an account?{" "}
//           <span className="signup-link" onClick={onSignUpClick}>
//             Sign up
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// }

// export default UserLoginModal;