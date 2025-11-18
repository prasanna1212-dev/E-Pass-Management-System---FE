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
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const inputRef = useRef(null);

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

      const res = await axios.get(
        `${API_BASE_URL}/outpass-route/outpass/validate/${idToCheck}`
      );

      setOutpassData(res.data);

      // Fetch student image if available
      if (res.data.details?.student_image) {
        fetchStudentImage(idToCheck);
      }

      const status = res.data.status;
      if (status === "Valid") toast.success("Outpass is Valid");
      else if (status === "Expired") toast.error("Outpass has Expired");
      else toast(res.data.status);

      // Clear input and refocus for next scan
      setHostelId("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
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

  // Fetch student image as blob
  const fetchStudentImage = async (hostelId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/outpass-route/outpass/student-image/${hostelId}`,
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
                Outpass Details
              </Title>

              <p>
                <strong>Name:</strong> {outpassData.details?.name || "N/A"}
              </p>
              <p>
                <strong>Hostel ID:</strong> {outpassData.details?.hostel_id || "N/A"}
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
                <CheckCircleOutlined /> Outpass is Valid
              </Text>
            )}
            {outpassData.status === "Expired" && (
              <Text strong className="qrscanner-status-expired">
                <CloseCircleOutlined /> Outpass Expired
              </Text>
            )}
            {outpassData.status === "Rejected" && (
              <Text strong className="qrscanner-status-rejected">
                <CloseCircleOutlined /> Outpass Rejected
              </Text>
            )}
            {outpassData.status === "Accepted" && (
              <Text strong className="qrscanner-status-pending">
                <ClockCircleOutlined /> Approved - Not Yet Active
              </Text>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default QRScanner;
