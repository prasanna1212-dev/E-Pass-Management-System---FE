import React, { useState, useEffect } from "react";
import check from "../assets/check.png"
import "../styles/ApprovedUsers.css";
import { StopOutlined } from "@ant-design/icons";
import { Empty } from "antd";


const ApprovedUser = ({ theme, activeTab, searchQuery = "" }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [approvedUsers, setApprovedUsers] = useState([]);

  const fetchApprovedUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/approved-users-route/approved-users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      setApprovedUsers(data);
    } catch (err) {
      console.error("Error fetching approved users:", err);
    }
  };

  useEffect(() => {
    fetchApprovedUsers();
  }, []);

  useEffect(() => {
    fetchApprovedUsers();
  }, [activeTab]);

  const handleRemovePermission = async (username) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/approved-users-route/remove-permission`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ username }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
      }
      await fetchApprovedUsers();
    } catch (error) {
      console.error("Error removing permission:", error);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata", // lock to IST
    });
  };


  const filteredUsers = approvedUsers.filter((user) =>
    user.domain_join_upn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.employee_number?.toString().includes(searchQuery) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  

  return (
    <div className="approved-user-wrapper">
      <div className={`approved-user-list ${theme}`}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div className="approved-user-card" key={user._id}>
              <div className="approved-user-header">
                <div><img src={check} className="approved-user-icon" /></div>
                <div>
                  <div className="approved-user-request-title">Approved User</div>
                  <div className="approved-user-request-time">
                    Approved at {formatDateTime(user.approved_at)}
                  </div>
                </div>
              </div>
  
              <div className="approved-user-badge">Active User</div>
  
              <div className="approved-user-details">
                <p>
                  <strong>{user.domain_join_upn}</strong> (Emp ID:{" "}
                  <span className="approved-user-empid">{user.employee_number}</span>) has grant with the access.
                </p>
                <p>
                  Email: <strong>{user.email}</strong>.
                </p>
              </div>
  
              <div className="approved-user-actions">
                <button
                  className="approved-user-approve"
                  onClick={() => handleRemovePermission(user.domain_join_upn)}
                >
                  <StopOutlined style={{ marginRight: 6 }} />
                  Deactivate
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="approved-user-empty">
            <div><Empty description="No approved users found." /></div>
          </div>
        )}
      </div>
    </div>
  );  
};

export default ApprovedUser;
