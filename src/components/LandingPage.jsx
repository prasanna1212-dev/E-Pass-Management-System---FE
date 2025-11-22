import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaSignOutAlt,
  FaHome,
  FaFileAlt,
  FaCheckSquare,
  FaUsers,
  FaQrcode,
  FaDatabase,
} from 'react-icons/fa';
import kgislogo from "../assets/kgisl_logo.png";
import Dashboard from './Dashboard';
import OutPassRequest from './OutPassRequest';
import ApprovalRequest from './ApprovalRequest';
import ApprovedUsers from './ApprovedUsers';
import QRScanner from './QRScanner';
import Masters from './Masters';
import ReportsSection from './ReportsSection';
import "../styles/LandingPage.css";

// Logo component
const Logo = () => (
  <div className="landing-page-logo-container">
    <img src={kgislogo} alt="Logo" className="landing-page-logo" />
  </div>
);

// ✅ All possible sidebar items (full list)
const ALL_SIDEBAR_ITEMS = [
  { name: 'Dashboard', icon: <FaHome />, content: <Dashboard /> },
  { name: 'Outpass Request', icon: <FaFileAlt />, content: <OutPassRequest /> },
  { name: 'QR Verification', icon: <FaQrcode />, content: <QRScanner /> },
  { name: 'Approval Request', icon: <FaCheckSquare />, content: <ApprovalRequest /> },
  { name: 'Approved Users', icon: <FaUsers />, content: <ApprovedUsers /> },
  { name: 'Masters', icon: <FaDatabase />, content: <Masters /> },
  { name: 'Reports', icon: <FaFileAlt />, content: <ReportsSection /> },
];

// ✅ Role → allowed items
const getSidebarItemsForRole = (role) => {
  const normalizedRole = (role || '').toLowerCase();

  // Admin → everything
  if (normalizedRole === 'admin') {
    return ALL_SIDEBAR_ITEMS;
  }

  // Warden → everything except Approval Request + Approved Users
  if (normalizedRole === 'warden') {
    return ALL_SIDEBAR_ITEMS.filter(
      (item) =>
        item.name !== 'Approval Request' &&
        item.name !== 'Approved Users' &&
        item.name !== 'Reports'
    );
  }

  // Security → only QR Verification
  if (normalizedRole === 'security') {
    return ALL_SIDEBAR_ITEMS.filter(
      (item) => item.name === 'QR Verification'
    );
  }

  // Default (no role / unknown role) → you can customize this
  // For now: just Dashboard + Outpass Request
  return ALL_SIDEBAR_ITEMS.filter((item) =>
    ['Dashboard'].includes(item.name)
  );
};

function LandingPage() {
  const navigate = useNavigate();

  // 🔹 Read role once from localStorage
  const [role] = useState(() => (localStorage.getItem("role") || "").toLowerCase());

  // 🔹 Build the sidebar based on role
  const sidebarItems = getSidebarItemsForRole(role);

  // State to manage the sidebar's collapsed status and active tab
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(
    sidebarItems.length ? sidebarItems[0] : null
  );

  const userDomainJoinUpn = localStorage.getItem("domain_join_upn");

  const extractName = (upn) => {
    if (!upn) return "User";
    const namePart = upn.split("@")[0];
    return namePart
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const displayName = extractName(userDomainJoinUpn);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSidebarClick = (item) => {
    setActiveTab(item);
  };

  const handleLogout = () => {
    navigate("/");
    localStorage.removeItem("domain_join_upn");
    localStorage.removeItem("email");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
  };

  return (
    <div className="landing-page-container">
      {/* --- Top Bar (Header) --- */}
      <header className="landing-page-top-bar">
        <div className="landing-page-top-bar-left">
          <button onClick={toggleSidebar} className="landing-page-sidebar-toggle">
            {isSidebarCollapsed ? <FaBars /> : <FaTimes />}
          </button>
          <Logo />
        </div>

        <div className="landing-page-top-bar-right">
          <div className="landing-page-user-profile">
            <FaUserCircle className="landing-page-user-icon" />
            <span className="landing-page-username">{displayName}</span>
            {role && (
              <span className="landing-page-role-badge">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            )}
          </div>
          <button className="landing-page-logout-btn" onClick={handleLogout}>
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
                  className={`landing-page-sidebar-item ${
                    activeTab && activeTab.name === item.name ? 'active' : ''
                  }`}
                  onClick={() => handleSidebarClick(item)}
                >
                  <button type="button" className="landing-page-sidebar-link">
                    <span className="landing-page-sidebar-icon">{item.icon}</span>
                    <span className="landing-page-sidebar-text">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="landing-page-content">
          <div className="landing-page-content-body">
            {activeTab && activeTab.content}
          </div>
        </main>
      </div>
    </div>
  );
}

export default LandingPage;