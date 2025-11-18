import React, { useState } from 'react';
import UserLoginModal from './UserLoginModal';
import SignUpModal from './SignUpModal';
// import nexgenlogo from "../assets/nexgenlogo.png";
import kgisl from "../assets/kgisl_logo_bg.png";
import { toast } from 'react-hot-toast';
import '../styles/LoginDashboard.css';
import { Player } from '@lottiefiles/react-lottie-player'; 
import animation from "../assets/QRscan.json";


function LoginDashboard({ onLoginSuccess }) {
  const [showSignUp, setShowSignUp] = useState(false);

  const handleSignUpClick = () => setShowSignUp(true);
  const handleSignUpClose = () => setShowSignUp(false);

  const handleLoginSuccess = (redirectPath, role, user) => {
    const usernameOnly = (user.domain_join_upn || user.email || "User").split("@")[0];
      toast.success(`Welcome, ${usernameOnly} !`);
    if (onLoginSuccess) onLoginSuccess(redirectPath, role, user);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-left-animation">
        <Player
          autoplay
          loop
          src={animation}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
      {/* Logo at top right */}
      <div className="login-topright-logo">
        <img src={kgisl} alt="nexgen" className="login-logo-img" />
      </div>
      <div className="login-dashboard-container">
        {showSignUp ? (
          <div className="signup-modal">
            <SignUpModal onClose={handleSignUpClose} />
          </div>
        ) : (
          <div className="login-box">
            <div className="login-header">
            </div>
            <UserLoginModal onLoginSuccess={handleLoginSuccess} onSignUpClick={handleSignUpClick} />
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginDashboard;
