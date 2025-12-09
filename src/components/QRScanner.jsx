import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card, Spin, Input, Button, Typography, Modal, Image } from "antd";
import { toast } from "react-hot-toast";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  LogoutOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import kglogo from "../assets/kgisledu.png";
import "../styles/QRScanner.css";

const { Title, Text } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QRScanner = () => {
  const [hostelId, setHostelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [outpassData, setOutpassData] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [studentImage, setStudentImage] = useState(null);
  
  // 🚀 NEW: Entry/Exit Modal States
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const inputRef = useRef(null);

 const getUserInfo = () => {
    const userDomainJoinUpn = localStorage.getItem("domain_join_upn");
    const userEmail = localStorage.getItem("email");
    
    // Safely extract name before '@' and capitalize
    const extractName = (upn) => {
      if (!upn) return 'Unknown User';
      const namePart = upn.split('@')[0]; // "john.doe"
      return namePart
        .split('.') // split by dot if present
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    };
    
    const displayName = extractName(userDomainJoinUpn);
    
    return {
      name: displayName,
      email: userEmail || userDomainJoinUpn || 'unknown@domain.com',
      upn: userDomainJoinUpn
    };
  };
  const currentUser = getUserInfo();
  
  // 🕒 Live clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setCurrentTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-fetch if hostel_id is passed in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromURL = params.get("hostel_id");
    if (idFromURL) {
      const normalized = normalizeHostelId(idFromURL);
      setHostelId(normalized);
      handleFetchOutpass(normalized);
    }
  }, []);

  // Utility: normalize Hostel ID (e.g. nmh-1256 → NMH-1256)
  const normalizeHostelId = (id) => {
    if (!id) return "";
    let normalizedId = id.trim().toUpperCase();

    // Check for duplicate scan issue (e.g., NMH-3458NMH-3458)
    if (normalizedId.length > 0 && normalizedId.length % 2 === 0) {
      const halfLength = normalizedId.length / 2;
      const firstHalf = normalizedId.substring(0, halfLength);
      const secondHalf = normalizedId.substring(halfLength);

      if (firstHalf === secondHalf) {
        normalizedId = firstHalf;
      }
    }

    return normalizedId;
  };

  // 🚀 Enhanced status validation with late entry logic
  const determineOutpassStatus = (originalStatus, validUntil) => {
    if (!validUntil || originalStatus === "Valid") {
      return originalStatus;
    }

    const now = new Date();
    const validDate = new Date(validUntil);
    
    // Check if the valid date is today
    const isToday = (
      now.getFullYear() === validDate.getFullYear() &&
      now.getMonth() === validDate.getMonth() &&
      now.getDate() === validDate.getDate()
    );

    // If it's today and originally expired
    if (isToday && originalStatus === "Expired") {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Convert current time to minutes for easier comparison
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const ninePM = 21 * 60; // 9 PM in minutes (21:00)
      
      // If current time is before 9 PM, allow as valid
      if (currentTimeInMinutes < ninePM) {
        return "Valid";
      } else {
        // After 9 PM, mark as late entry
        return "Late Entry";
      }
    }

    // Return original status for all other cases
    return originalStatus;
  };

  const handleFetchOutpass = async (idValue) => {
    const idToCheck = normalizeHostelId(idValue || hostelId);
    if (!idToCheck) {
      toast.error("Please enter or scan a valid Hostel ID");
      return;
    }

    try {
      setLoading(true);
      setOutpassData(null);
      setStudentImage(null);
 const userInfo = getUserInfo();
     const res = await axios.get(
        `${API_BASE_URL}/outpass-route/outpass/validate/${idToCheck}`,
        {
          params: {
            scanner_name: userInfo.name,
            scanner_email: userInfo.email
          },
          headers: {
            'X-Scanner-Name': userInfo.name,
            'X-Scanner-Email': userInfo.email,
            'X-Scanner-UPN': userInfo.upn
          }
        }
      );

      // Apply enhanced status logic
      const enhancedStatus = determineOutpassStatus(res.data.status, res.data.valid_until);
      
      const enhancedData = {
        ...res.data,
        status: enhancedStatus
      };

      setOutpassData(enhancedData);

      // Fetch student image if available
      if (res.data.details?.student_image) {
        fetchStudentImage(idToCheck);
      }

      // 🚀 IMPROVED: Handle Entry/Exit Logic - only show modals on fresh scans
      if (enhancedStatus === "Valid" || enhancedStatus === "Late Entry") {
        handleEntryExitLogic(enhancedData, idToCheck);
      } else if (enhancedStatus === "Expired") {
        toast.error("Outpass has Expired");
      } else if (enhancedStatus === "Completed") {
        toast.success("Outpass Already Completed");
      } else {
        toast(enhancedStatus);
      }

      // Clear input and refocus for next scan (always clear after processing)
      setTimeout(() => {
        setHostelId("");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100); // Small delay to ensure modal states are updated
    } catch (err) {
      console.error(err);
      toast.error("Invalid or expired Hostel ID");
      // Clear input on error and refocus
      setHostelId("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // 🚀 UPDATED: Handle Entry/Exit Logic with support for both tables
  const handleEntryExitLogic = (data, scannedIdentifier) => {
    const scanCount = data.details?.scan_count || 0;
    const requestType = data.request_type; // 'outpass' or 'leave'
    
    // 🚀 NEW: Determine the correct identifier based on request type
    let identifier;
    if (requestType === 'outpass') {
      identifier = data.details.hostel_id || data.details.identifier;
    } else if (requestType === 'leave') {
      identifier = data.details.roll_no || data.details.identifier;
    } else {
      // Fallback to scanned identifier
      identifier = scannedIdentifier;
    }
    
    if (scanCount === 0) {
      // First scan - Student wants to exit campus
      setPendingAction({
        type: 'exit',
        data: data,
        identifier: identifier,
        requestType: requestType,
        outpassId: data.details.id
      });
      setExitModalVisible(true);
      toast.success("First scan detected - Confirm campus exit");
    } else if (scanCount === 1) {
      // Second scan - Student wants to enter campus
      setPendingAction({
        type: 'entry',
        data: data,
        identifier: identifier,
        requestType: requestType,
        outpassId: data.details.id
      });
      setEntryModalVisible(true);
      toast.success("Return scan detected - Confirm campus entry");
    } else {
      toast.info("Outpass already completed");
    }
  };

  // 🚀 UPDATED: Confirm Exit from Campus - supports both tables
  const handleConfirmExit = async () => {
    if (!pendingAction) return;

    try {
      setActionLoading(true);
            const userInfo = getUserInfo();
     const response = await axios.post(
        `${API_BASE_URL}/outpass-route/outpass/confirm-exit/${pendingAction.identifier}`,
        {
          outpass_id: pendingAction.outpassId,
          request_type: pendingAction.requestType,
          // 🔥 NEW: Include user info in action requests
          scanner_name: userInfo.name,
          scanner_email: userInfo.email
        }
      );


      if (response.data.success) {
        toast.success("Campus exit confirmed! Scan again when returning.");
        setExitModalVisible(false);
        setPendingAction(null);
        setOutpassData(null); // Clear current outpass data
        
        // DON'T auto-refresh - wait for next scan
      } else {
        toast.error(response.data.message || "Failed to confirm exit");
      }
    } catch (error) {
      console.error("Error confirming exit:", error);
      toast.error("Error confirming campus exit");
    } finally {
      setActionLoading(false);
      // Clear input and refocus after action
      setHostelId("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // 🚀 UPDATED: Confirm Entry to Campus - supports both tables
  const handleConfirmEntry = async () => {
    if (!pendingAction) return;

    try {
      setActionLoading(true);
      const userInfo = getUserInfo();
     const response = await axios.post(
        `${API_BASE_URL}/outpass-route/outpass/confirm-entry/${pendingAction.identifier}`,
        {
          outpass_id: pendingAction.outpassId,
          request_type: pendingAction.requestType,
          // 🔥 NEW: Include user info in action requests
          scanner_name: userInfo.name,
          scanner_email: userInfo.email
        }
      );

      if (response.data.success) {
        toast.success("Campus entry confirmed - Outpass completed!");
        setEntryModalVisible(false);
        setPendingAction(null);
        setOutpassData(null); // Clear current outpass data
        
        // DON'T auto-refresh - ready for next scan
      } else {
        toast.error(response.data.message || "Failed to confirm entry");
      }
    } catch (error) {
      console.error("Error confirming entry:", error);
      toast.error("Error confirming campus entry");
    } finally {
      setActionLoading(false);
      // Clear input and refocus after action
      setHostelId("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // 🚀 NEW: Cancel Action
  const handleCancelAction = () => {
    setExitModalVisible(false);
    setEntryModalVisible(false);
    setPendingAction(null);
    
    // Clear input and refocus
    setHostelId("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Fetch student image as blob
  const fetchStudentImage = async (identifier) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/outpass-route/outpass/student-image/${identifier}`,
        {
          responseType: "blob",
        }
      );

      const imageObjectURL = URL.createObjectURL(response.data);
      setStudentImage(imageObjectURL);
    } catch (err) {
      console.error("Error fetching student image:", err);
      setStudentImage(null);
    }
  };

  // Cleanup object URL when component unmounts
  useEffect(() => {
    return () => {
      if (studentImage) {
        URL.revokeObjectURL(studentImage);
      }
    };
  }, [studentImage]);

  const normalizeToLocal = (dateStr) => {
  if (!dateStr) return null;
  // if backend sends ISO with Z (UTC), drop Z so browser treats as local time
  return dateStr.endsWith("Z") ? dateStr.slice(0, -1) : dateStr;
};
  const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  
  try {
    // DON'T remove the "Z" - let JavaScript handle UTC properly
    const date = new Date(dateStr); // Keep the original ISO string with Z
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return "N/A";
    }
    
    // Format with proper timezone - this will correctly convert UTC to IST
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit", 
      hour12: true,
      timeZone: "Asia/Kolkata", // This works correctly with UTC input
    });
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateStr);
    return "N/A";
  }
};
  

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return "N/A";
    const [hour, minute, second] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, second || 0);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleRefresh = () => {
    setOutpassData(null);
    setStudentImage(null);
    setHostelId("");
    setPendingAction(null);
    setExitModalVisible(false);
    setEntryModalVisible(false);
    toast.success("Ready for next scan");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Simple input change handler - just updates state
  const handleInputChange = (e) => {
    const value = e.target.value;
    setHostelId(value);
  };

  // Handle Enter key press to trigger validation
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && hostelId.trim()) {
      handleFetchOutpass();
    }
  };

  return (
    <div className="qrscanner-container">
      <div className="qrscanner-header">
        <div className="qrscanner-header-left">
          <img src={kglogo} alt="KGISL Logo" className="qrscanner-logo" />
          <Title level={3} className="qrscanner-title">
            Hostel Outpass Verification
          </Title>
        </div>

        <div className="qrscanner-time">{currentTime}</div>
      </div>
  <div style={{ 
        background: '#f0f9ff', 
        border: '1px solid #bae7ff',
        borderRadius: '6px',
        padding: '8px 16px',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        <Text style={{ fontSize: '13px', color: '#1890ff' }}>
          <UserOutlined /> Scanner: <strong>{currentUser.name}</strong> ({currentUser.email})
        </Text>
      </div>
      <Text type="secondary" className="qrscanner-subtext">
        Scan the QR from your email or manually enter your Hostel ID below.
      </Text>

      <div className="qrscanner-input-group">
        <Input
          ref={inputRef}
          placeholder="Scan or Enter Hostel ID"
          value={hostelId}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="qrscanner-input"
          autoFocus
          allowClear
        />
        <Button
          type="primary"
          onClick={() => handleFetchOutpass()}
          className="qrscanner-btn"
        >
          Check
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          className="qrscanner-refresh-btn"
        >
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="qrscanner-loading">
          <Spin tip="Checking..." />
        </div>
      )}

      {outpassData && (
        <Card className="qrscanner-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <Title level={4} className="qrscanner-card-title">
                {outpassData.request_type === 'leave' ? 'Leave Pass Details' : 'Outpass Details'}
              </Title>

              <p>
                <strong>Name:</strong> {outpassData.details?.name || "N/A"}
              </p>
              <p>
                <strong>{outpassData.request_type === 'leave' ? 'Roll No:' : 'Hostel ID:'}</strong> {outpassData.details?.identifier || "N/A"}
              </p>
              <p>
                <strong>From Date:</strong>{" "}
                {formatDateOnly(outpassData.details?.date_from)}
              </p>
              <p>
                <strong>Time Out:</strong>{" "}
                {formatTime12Hour(outpassData.details?.time_out)}
              </p>
              <p>
                <strong>To Date:</strong>{" "}
                {formatDateOnly(outpassData.details?.date_to)}
              </p>
              <p>
                <strong>Time In:</strong>{" "}
                {formatTime12Hour(outpassData.details?.time_in)}
              </p>
              <p>
                <strong>Valid Until:</strong> {formatDateTime(outpassData.valid_until)}
              </p>
              
              {/* 🚀 NEW: Show Exit/Entry Times if available */}
              {outpassData.details?.exit_time && (
                <p>
                  <strong>Campus Exit:</strong> {formatDateTime(outpassData.details.exit_time)}
                </p>
              )}
              {outpassData.details?.entry_time && (
                <p>
                  <strong>Campus Entry:</strong> {formatDateTime(outpassData.details.entry_time)}
                </p>
              )}
              
              {/* 🚀 NEW: Show request type badge */}
              <div style={{ marginTop: '8px' }}>
                <span style={{
                  background: outpassData.request_type === 'leave' ? '#e6f7ff' : '#f6ffed',
                  color: outpassData.request_type === 'leave' ? '#1890ff' : '#52c41a',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {outpassData.request_type === 'leave' ? 'LEAVE PASS' : 'OUTPASS'}
                </span>
              </div>
            </div>

            {studentImage && (
              <div style={{ marginLeft: "20px" }}>
                <Image
                  width={120}
                  height={150}
                  src={studentImage}
                  alt="Student Photo"
                  style={{ objectFit: "cover", borderRadius: "8px", cursor: "pointer" }}
                  preview={{
                    mask: <UserOutlined style={{ fontSize: "24px" }} />,
                  }}
                />
              </div>
            )}
          </div>

          <div className="qrscanner-status" style={{ marginTop: "16px" }}>
            {outpassData.status === "Valid" && (
              <Text strong className="qrscanner-status-valid">
                <CheckCircleOutlined /> {outpassData.request_type === 'leave' ? 'Leave Pass' : 'Outpass'} is Valid
              </Text>
            )}
            {outpassData.status === "Expired" && (
              <Text strong className="qrscanner-status-expired">
                <CloseCircleOutlined /> {outpassData.request_type === 'leave' ? 'Leave Pass' : 'Outpass'} Expired
              </Text>
            )}
            {outpassData.status === "Late Entry" && (
              <Text strong className="qrscanner-status-late-entry">
                <ExclamationCircleOutlined /> Late Entry - After 9 PM
              </Text>
            )}
            {outpassData.status === "Rejected" && (
              <Text strong className="qrscanner-status-rejected">
                <CloseCircleOutlined /> {outpassData.request_type === 'leave' ? 'Leave Pass' : 'Outpass'} Rejected
              </Text>
            )}
            {outpassData.status === "Accepted" && (
              <Text strong className="qrscanner-status-pending">
                <ClockCircleOutlined /> Approved - Not Yet Active
              </Text>
            )}
            {outpassData.status === "Completed" && (
              <Text strong className="qrscanner-status-completed">
                <CheckCircleOutlined /> {outpassData.request_type === 'leave' ? 'Leave Pass' : 'Outpass'} Completed
              </Text>
            )}
          </div>
        </Card>
      )}

      {/* 🚀 UPDATED: EXIT CONFIRMATION MODAL - supports both tables */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogoutOutlined style={{ color: '#1890ff' }} />
            <span>Confirm Campus Exit</span>
          </div>
        }
        open={exitModalVisible}
        onOk={handleConfirmExit}
        onCancel={handleCancelAction}
        confirmLoading={actionLoading}
        okText="Confirm Exit"
        cancelText="Cancel"
        okButtonProps={{
          type: "primary",
          style: { backgroundColor: '#1890ff' }
        }}
        maskClosable={false}
      >
        {pendingAction && (
          <div>
            <div style={{ 
              backgroundColor: '#e6f7ff', 
              border: '1px solid #91d5ff', 
              borderRadius: '6px', 
              padding: '16px', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <Title level={4} style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
                {pendingAction.data.details?.name}
              </Title>
              <Text style={{ color: '#666' }}>
                {pendingAction.requestType === 'leave' ? 'Roll No:' : 'Hostel ID:'} {pendingAction.identifier}
              </Text>
              <br />
              <span style={{
                background: pendingAction.requestType === 'leave' ? '#e6f7ff' : '#f6ffed',
                color: pendingAction.requestType === 'leave' ? '#1890ff' : '#52c41a',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                marginTop: '4px',
                display: 'inline-block'
              }}>
                {pendingAction.requestType === 'leave' ? 'LEAVE PASS' : 'OUTPASS'}
              </span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <LogoutOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px' }} />
              <Title level={4} style={{ margin: '0', color: '#1890ff' }}>
                Student Leaving Campus
              </Title>
              <Text style={{ color: '#666', fontSize: '14px' }}>
                Click "Confirm Exit" to record the campus departure time
              </Text>
            </div>

            <div style={{ 
              backgroundColor: '#f6f6f6', 
              padding: '12px', 
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <Text style={{ fontSize: '13px', color: '#666' }}>
                <strong>Current Time:</strong> {currentTime}
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* 🚀 UPDATED: ENTRY CONFIRMATION MODAL - supports both tables */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LoginOutlined style={{ color: '#52c41a' }} />
            <span>Confirm Campus Entry</span>
          </div>
        }
        open={entryModalVisible}
        onOk={handleConfirmEntry}
        onCancel={handleCancelAction}
        confirmLoading={actionLoading}
        okText="Confirm Entry"
        cancelText="Cancel"
        okButtonProps={{
          type: "primary",
          style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
        }}
        maskClosable={false}
      >
        {pendingAction && (
          <div>
            <div style={{ 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f', 
              borderRadius: '6px', 
              padding: '16px', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <Title level={4} style={{ margin: '0 0 8px 0', color: '#52c41a' }}>
                {pendingAction.data.details?.name}
              </Title>
              <Text style={{ color: '#666' }}>
                {pendingAction.requestType === 'leave' ? 'Roll No:' : 'Hostel ID:'} {pendingAction.identifier}
              </Text>
              <br />
              <span style={{
                background: pendingAction.requestType === 'leave' ? '#e6f7ff' : '#f6ffed',
                color: pendingAction.requestType === 'leave' ? '#1890ff' : '#52c41a',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                marginTop: '4px',
                display: 'inline-block'
              }}>
                {pendingAction.requestType === 'leave' ? 'LEAVE PASS' : 'OUTPASS'}
              </span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <LoginOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '12px' }} />
              <Title level={4} style={{ margin: '0', color: '#52c41a' }}>
                Student Returning to Campus
              </Title>
              <Text style={{ color: '#666', fontSize: '14px' }}>
                Click "Confirm Entry" to complete the {pendingAction.requestType === 'leave' ? 'leave pass' : 'outpass'} and record return time
              </Text>
            </div>

            <div style={{ 
              backgroundColor: '#f6f6f6', 
              padding: '12px', 
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <Text style={{ fontSize: '13px', color: '#666' }}>
                <strong>Current Time:</strong> {currentTime}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QRScanner;