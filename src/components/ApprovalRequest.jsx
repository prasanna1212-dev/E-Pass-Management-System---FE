import React, { useState, useEffect } from "react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";
import "../styles/ApprovalRequest.css";
import plane from "../assets/plane.png"
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Empty } from "antd";


const ApprovalRequest = ({ theme, activeTab, searchQuery = "" }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [error, setError] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/approval-users-route/pending-users`,
        { withCredentials: true }
      );
      setPendingUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError("Error fetching pending users");
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [activeTab]);

  const handleApprove = async (username, email) => {
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/approval-users-route/approve-user`,
        { username, email },
        { withCredentials: true }
      );
      setSnackbarMessage(`${username} has been approved successfully.`);
      setSnackbarOpen(true);
      setPendingUsers(pendingUsers.filter((user) => user.domain_join_upn !== username));
      fetchPendingUsers();
    } catch (err) {
      setError("Error approving user.");
      console.error(err);
      setSnackbarMessage("Error approving user.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (username) => {
    try {
      await axios.post(
        `${API_BASE_URL}/approval-users-route/reject-user`,
        { username },
        { withCredentials: true }
      );
      setSnackbarMessage(`${username} has been rejected.`);
      setSnackbarOpen(true);
      setPendingUsers(pendingUsers.filter((user) => user.domain_join_upn !== username));
    } catch (err) {
      setError("Error rejecting user.");
      console.error(err);
      setSnackbarMessage("Error rejecting user.");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const filteredUsers = pendingUsers.filter((user) =>
    user.domain_join_upn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.employee_number?.toString().includes(searchQuery)
  );  

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

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
      timeZone: "Asia/Kolkata", // 🔐 lock to IST
    });
  };

  return (
    <div className={`approval-request-container ${theme}`}>
      {error && <p className="approval-request-error">{error}</p>}

      {loading && (
        <div className="approval-request-loader">
          <CircularProgress />
        </div>
      )}

      {!loading && filteredUsers.length === 0 ? (
        <p className="approval-request-empty">
          <Empty description="No Pending users available! All the users are in the approved list." />
        </p>
      ) : (
        <div className="approval-request-list">
          {paginatedUsers.map((user) => (
            <div key={user.domain_join_upn} className="approval-request-card">
              <div className="approval-request-header">
                <div className="approval-request-icon-container"><img src={plane} className="approval-request-icon"/></div>
                <div className="approval-request-title-section">
                  <h3 className="approval-request-title">Request for Approval</h3>
                  <p className="approval-request-meta">Requested at {formatDateTime(user.created_at)}</p>
                  {/* <p className="approval-request-by">By {user.domain_join_upn}</p> */}
                </div>
              </div>

              <div className="approval-request-priority">User Request</div>

              <div className="approval-request-message">
                <p>
                  <strong>{user.domain_join_upn}</strong> (Emp ID: <span style={{color:"dodgerblue"}}>{user.employee_number}</span>) has requested access.<br />
                  Email: <strong>{user.email}</strong>. <span style={{color:"orangered"}}>Please approve.</span>
                </p>
              </div>

              <div className="approval-request-actions">
              <button
                className="approval-request-btn reject"
                onClick={() => handleReject(user.domain_join_upn)}
              >
                <CloseCircleOutlined className="approval-request-icon-animated reject-icon" />
                Reject
              </button>

              <button
                className="approval-request-btn approve"
                onClick={() => handleApprove(user.domain_join_upn, user.email)}
              >
                <CheckCircleOutlined className="approval-request-icon-animated approve-icon" />
                Approve
              </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </div>
  );
};

export default ApprovalRequest;
