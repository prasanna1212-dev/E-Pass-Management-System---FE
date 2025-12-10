import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUserCircle, FaSignOutAlt, FaHome, FaFileAlt, FaCheckSquare, FaUsers, FaQrcode, FaDatabase, FaUserShield } from 'react-icons/fa';
import kgislogo from "../assets/kgisl_logo.png";
import Dashboard from './Dashboard';
import OutPassRequest from './OutPassRequest';
import ApprovalRequest from './ApprovalRequest';
import ApprovedUsers from './ApprovedUsers';
import QRScanner from './QRScanner';
import Masters from './Masters';
import RoleBasedAccess from './RoleBasedAccess';
import ReportsSection from './ReportsSection';
import "../styles/LandingPage.css";

// Mock Logo component - replace with your actual logo image or component
const Logo = () => (
  <div className="landing-page-logo-container">
    <img src={kgislogo} alt="Logo" className="landing-page-logo" />
  </div>
);

// Sidebar navigation links
const sidebarItems = [
  { name: 'Dashboard', icon: <FaHome />, content: <Dashboard/> },
  { name: 'Outpass Request', icon: <FaFileAlt />, content: <OutPassRequest/> },
  { name: 'Masters', icon: <FaDatabase />, content: <Masters/> },
  { name: 'Reports', icon: <FaFileAlt />, content: <ReportsSection /> },
];

function WardenLandingPage() {
  // State to manage the sidebar's collapsed status and active tab
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(sidebarItems[0]); // Default active tab
  const navigate = useNavigate();
  const userDomainJoinUpn = localStorage.getItem("domain_join_upn");
  const extractName = (upn) => {
    if (!upn) return "User";
    const namePart = upn.split("@")[0]; // "john.doe"
    return namePart
      .split(".") // split by dot if present
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const displayName = extractName(userDomainJoinUpn);
  // Function to toggle the sidebar state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Function to handle clicking on a sidebar item
  const handleSidebarClick = (item) => {
    setActiveTab(item); // Set the clicked item as the active tab
  };

 const handleLogout = () => {
    navigate("/");
    localStorage.removeItem("domain_join_upn");
  };

  return (
    <div className="landing-page-container">
      {/* --- Top Bar (Header) --- */}
      <header className="landing-page-top-bar">
        <div className="landing-page-top-bar-left">
          {/* Sidebar Toggle Button */}
          <button onClick={toggleSidebar} className="landing-page-sidebar-toggle">
            {isSidebarCollapsed ? <FaBars /> : <FaTimes />}
          </button>
          {/* Logo */}
          <Logo />
        </div>
        
        <div className="landing-page-top-bar-right">
          {/* User Icon and Name (Replace 'manda userSangolkar' with dynamic data) */}
          <div className="landing-page-user-profile">
            <FaUserCircle className="landing-page-user-icon" />
            <span className="landing-page-username">{displayName}</span>
          </div>
          {/* Logout Button */}
          <button className="landing-page-logout-btn" onClick={() => handleLogout()}>
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      {/* --- Main Layout: Sidebar and Content --- */}
      <div className="landing-page-main">
        {/* Sidebar */}
        <aside className={`landing-page-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <nav className="landing-page-sidebar-nav">
            <ul>
              {sidebarItems.map((item) => (
                <li
                  key={item.name}
                  className={`landing-page-sidebar-item ${activeTab.name === item.name ? 'active' : ''}`}
                  onClick={() => handleSidebarClick(item)} // Handle click event
                >
                  <a href="#" className="landing-page-sidebar-link">
                    <span className="landing-page-sidebar-icon">{item.icon}</span>
                    <span className="landing-page-sidebar-text">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="landing-page-content">
          {/* Render active tab's content */}
          <div className="landing-page-content-body">
            {activeTab.content}
          </div>
        </main>
      </div>
    </div>
  );
}

export default WardenLandingPage;