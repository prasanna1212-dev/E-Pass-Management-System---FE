import React, { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import {
  Table,
  Input,
  DatePicker,
  Button,
  Modal,
  Descriptions,
  Tag,
  Select,
  Pagination,
  notification,
  Image,
  Form,
  Typography,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  UndoOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  EditOutlined,
} from "@ant-design/icons";
import "../styles/OutPassRequest.css";
import toast from "react-hot-toast";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const POLLING_INTERVAL = 120000;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function OutPassRequest() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("All");
  const [permissionFilter, setPermissionFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Rejection Modal State
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionForm] = Form.useForm();
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // Edit Approval Modal State (from component 2)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editedCheckOut, setEditedCheckOut] = useState(null);
  const [editedCheckIn, setEditedCheckIn] = useState(null);
  const [editedRemarks, setEditedRemarks] = useState("");
  const [editForm] = Form.useForm();

  // Unified fetch function that handles both API endpoints
  const fetchOutpassData = useCallback(async () => {
    setLoading(true);
    try {
      // Try the unified endpoint first (from component 1)
      let res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);

      // Fallback to old endpoint if needed (from component 2)
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);
      }

      if (!res.ok) throw new Error("Failed to fetch data");

      const result = await res.json();
      // Sort: newest updated/created at the top
      const sorted = [...result].sort((a, b) => {
        const aTime = a.updated_at || a.created_at;
        const bTime = b.updated_at || b.created_at;
        return dayjs(bTime).valueOf() - dayjs(aTime).valueOf();
      });
      setData(sorted);

      // Apply all current filters
      let temp = sorted;
      const searchTerm = search ? search.toLowerCase() : "";

      // 1. Text Search Filter
      temp = temp.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          (item.hostel && item.hostel.toLowerCase().includes(searchTerm)) ||
          item.inst_name.toLowerCase().includes(searchTerm) ||
          (item.course && item.course.toLowerCase().includes(searchTerm)) ||
          item.purpose.toLowerCase().includes(searchTerm) ||
          (item.display_id &&
            item.display_id.toLowerCase().includes(searchTerm)) ||
          (item.hostel_id && item.hostel_id.toLowerCase().includes(searchTerm))
      );

      // 2. Date Range Filter
      if (dateRange && dateRange.length === 2) {
        const [start, end] = dateRange;
        temp = temp.filter(
          (item) =>
            dayjs(item.date_from).toDate() >= start.toDate() &&
            dayjs(item.date_to).toDate() <= end.toDate()
        );
      }

      // 3. Status Filter
      if (statusFilter && statusFilter !== "All") {
        temp = temp.filter((item) => item.status === statusFilter);
      }

      // 4. Permission Filter (if available)
      if (
        permissionFilter &&
        permissionFilter !== "All" &&
        temp.some((item) => item.permission)
      ) {
        temp = temp.filter((item) => item.permission === permissionFilter);
      }

      setFilteredData(temp);

      // Handle pagination reset
      const totalPages = Math.ceil(temp.length / pageSize);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
      } else if (temp.length > 0 && currentPage === 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Data fetching error:", err);
      notification.error({
        message: "Data Fetch Error",
        description: "Failed to load outpass/leave data from the server.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    search,
    dateRange,
    statusFilter,
    permissionFilter,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchOutpassData();
    const intervalId = setInterval(fetchOutpassData, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchOutpassData]);

  // Apply filters with all filter types
  const applyFilters = useCallback(
    (
      currentData,
      currentSearch,
      currentRange,
      currentStatus,
      currentPermission
    ) => {
      let temp = [...currentData].sort((a, b) => {
        const aTime = a.updated_at || a.created_at;
        const bTime = b.updated_at || b.created_at;
        return dayjs(bTime).valueOf() - dayjs(aTime).valueOf();
      });
      const searchTerm = currentSearch ? currentSearch.toLowerCase() : "";

      temp = temp.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          (item.hostel && item.hostel.toLowerCase().includes(searchTerm)) ||
          item.inst_name.toLowerCase().includes(searchTerm) ||
          (item.course && item.course.toLowerCase().includes(searchTerm)) ||
          item.purpose.toLowerCase().includes(searchTerm) ||
          (item.display_id &&
            item.display_id.toLowerCase().includes(searchTerm)) ||
          (item.hostel_id && item.hostel_id.toLowerCase().includes(searchTerm))
      );

      if (currentRange && currentRange.length === 2) {
        const [start, end] = currentRange;
        temp = temp.filter(
          (item) =>
            dayjs(item.date_from).toDate() >= start.toDate() &&
            dayjs(item.date_to).toDate() <= end.toDate()
        );
      }

      if (currentStatus && currentStatus !== "All") {
        temp = temp.filter((item) => item.status === currentStatus);
      }

      if (
        currentPermission &&
        currentPermission !== "All" &&
        temp.some((item) => item.permission)
      ) {
        temp = temp.filter((item) => item.permission === currentPermission);
      }

      setFilteredData(temp);
      setCurrentPage(1);
    },
    []
  );

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters(data, value, dateRange, statusFilter, permissionFilter);
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
    applyFilters(data, search, dates, statusFilter, permissionFilter);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    applyFilters(data, search, dateRange, value, permissionFilter);
  };

  const handlePermissionChange = (value) => {
    setPermissionFilter(value);
    applyFilters(data, search, dateRange, statusFilter, value);
  };

  const handlePaginationChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    const [hour, minute] = time.split(":");
    const date = dayjs().set("hour", hour).set("minute", minute).toDate();

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // --- RENEWAL APPROVAL (Outpass only) ---
  const handleDirectRenewApprove = async (record) => {
    const id = record.id;
    const formattedDate = record.new_date_to;
    const formattedTime = record.new_time_in;

    if (!formattedDate || !formattedTime) {
      notification.error({
        message: "Renewal Data Missing",
        description:
          "The requested new date/time data is missing from the record. Cannot auto-approve.",
      });
      return;
    }

    const loadingToastId = toast.loading(
      `Renewing outpass for ${record.name}...`
    );

    try {
      // Try new API structure first, then fallback
      let response = await fetch(
        `${API_BASE_URL}/outpass-route/outpass/approve-renewal/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date_to: formattedDate,
            time_in: formattedTime,
            reason:
              record.renewal_reason || "Renewal Approved by Staff/Warden.",
          }),
        }
      );

      if (!response.ok) {
        response = await fetch(
          `${API_BASE_URL}/outpass-route/outpass/approve-renewal/${id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date_to: formattedDate,
              time_in: formattedTime,
              reason:
                record.renewal_reason || "Renewal Approved by Staff/Warden.",
            }),
          }
        );
      }

      const result = await response.json();

      if (response.ok) {
        toast.dismiss(loadingToastId);
        notification.success({
          message: "Renewal Approved",
          description: `Outpass for ${
            record.name
          } successfully renewed to ${dayjs(formattedDate).format(
            "MMM D, YYYY"
          )} at ${formatTime(formattedTime)}.`,
        });
        await fetchOutpassData();
        setCurrentPage(1);
      } else {
        toast.dismiss(loadingToastId);
        notification.error({
          message: "Renewal Failed",
          description: result.message || "Failed to approve outpass renewal.",
        });
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Error approving renewal:", error);
      notification.error({
        message: "Network Error",
        description: "Network or server error while approving renewal.",
      });
    }
  };

  // --- RENEWAL REJECTION (Outpass only) ---
  const handleRejectRenewal = async (id) => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this renewal request?"
    );
    if (!confirmReject) return;

    const loadingToastId = toast.loading("Rejecting renewal...");

    try {
      let response = await fetch(
        `${API_BASE_URL}/outpass-route/outpass/reject-renewal/${id}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        response = await fetch(
          `${API_BASE_URL}/outpass-route/outpass/reject-renewal/${id}`,
          {
            method: "POST",
          }
        );
      }

      const result = await response.json();

      if (response.ok) {
        toast.dismiss(loadingToastId);
        notification.info({
          message: "Renewal Rejected",
          description: `Outpass renewal (ID: ${id}) has been successfully rejected.`,
        });
        await fetchOutpassData();
        setCurrentPage(1);
      } else {
        toast.dismiss(loadingToastId);
        notification.error({
          message: "Rejection Failed",
          description: result.message || "Failed to reject outpass renewal.",
        });
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Error during renewal rejection:", error);
      notification.error({
        message: "Network Error",
        description: "Network or server error while rejecting renewal.",
      });
    }
  };

  // Direct Accept handler (works for both outpass and leave)
  const handleAccept = async (record) => {
    const isLeaveRequest =
      record.is_leave_request || record.permission === "leave";

    let endpoint;
    if (isLeaveRequest) {
      endpoint = `${API_BASE_URL}/outpass-route/leave/accept/${record.id}`;
    } else {
      endpoint = `${API_BASE_URL}/outpass-route/outpass/accept/${record.id}`;
    }

    const loadingToastId = toast.loading(
      `Accepting ${isLeaveRequest ? "leave" : "outpass"} request...`
    );

    try {
      let response = await fetch(endpoint, { method: "POST" });

      // Fallback to old API structure if needed
      if (!response.ok) {
        endpoint = isLeaveRequest
          ? `${API_BASE_URL}/outpass-route/leave/accept/${record.id}`
          : `${API_BASE_URL}/outpass-route/outpass/accept/${record.id}`;
        response = await fetch(endpoint, { method: "POST" });
      }

      const result = await response.json();

      if (response.ok) {
        toast.dismiss(loadingToastId);
        notification.success({
          message: `${isLeaveRequest ? "Leave" : "Outpass"} Accepted`,
          description: isLeaveRequest
            ? "Leave request accepted successfully."
            : "Outpass accepted. QR sent via email.",
        });
        await fetchOutpassData();
        setCurrentPage(1);
      } else {
        toast.dismiss(loadingToastId);
        notification.error({
          message: "Acceptance Failed",
          description: result.message || "Failed to accept request.",
        });
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error(error);
      notification.error({
        message: "Network Error",
        description: "Network or server error while accepting request.",
      });
    }
  };

  // Accept with edits (from component 2) - for outpass only
  const handleApproveWithEdits = async () => {
    try {
      const values = await editForm.validateFields();

      const checkout = values.checkout;
      const checkin = values.checkin;
      const remarks = values.remarks || "";

      const isLeaveRequest =
        editRecord.is_leave_request || editRecord.permission === "leave";
      const requestType = isLeaveRequest ? "leave" : "outpass";

      const loadingToastId = toast.loading(
        `Approving ${requestType} with updated time...`
      );

      try {
        let endpoint = isLeaveRequest
          ? `${API_BASE_URL}/api/outpass-route/leave/accept/${editRecord.id}`
          : `${API_BASE_URL}/api/outpass-route/outpass/accept/${editRecord.id}`;

        let response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updated_date_from: checkout.format("YYYY-MM-DD"),
            updated_time_out: checkout.format("HH:mm:ss"),
            updated_date_to: checkin.format("YYYY-MM-DD"),
            updated_time_in: checkin.format("HH:mm:ss"),
            remarks,
          }),
        });

        // fallback to non /api routes
        if (!response.ok) {
          endpoint = isLeaveRequest
            ? `${API_BASE_URL}/outpass-route/leave/accept/${editRecord.id}`
            : `${API_BASE_URL}/outpass-route/outpass/accept/${editRecord.id}`;

          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updated_date_from: checkout.format("YYYY-MM-DD"),
              updated_time_out: checkout.format("HH:mm:ss"),
              updated_date_to: checkin.format("YYYY-MM-DD"),
              updated_time_in: checkin.format("HH:mm:ss"),
              remarks,
            }),
          });
        }

        const resData = await response.json();
        toast.dismiss(loadingToastId);

        if (response.ok) {
          notification.success({
            message: `${isLeaveRequest ? "Leave" : "Outpass"} Approved`,
            description: isLeaveRequest
              ? "Leave request approved with updated timing."
              : "QR emailed to student with updated timing.",
          });
          setEditModalOpen(false);
          fetchOutpassData();
        } else {
          notification.error({
            message: "Approval Failed",
            description: resData.message || "Unable to approve request.",
          });
        }
      } catch (err) {
        toast.dismiss(loadingToastId);
        notification.error({
          message: "Network Error",
          description: "Unable to approve request.",
        });
      }
    } catch (validationError) {
      // antd form already shows errors under fields, no need for toast
      return;
    }
  };

  // Open Rejection Modal
  const handleRejectClick = (record) => {
    setRejectionTarget(record);
    setRejectionModalVisible(true);
    rejectionForm.resetFields();
  };

  // Handle rejection (works for both outpass and leave)
  const handleRejectionSubmit = async () => {
    try {
      const values = await rejectionForm.validateFields();
      setRejectionLoading(true);

      const isLeaveRequest =
        rejectionTarget.is_leave_request ||
        rejectionTarget.permission === "leave";
      let endpoint;

      if (isLeaveRequest) {
        endpoint = `${API_BASE_URL}/outpass-route/leave/reject/${rejectionTarget.id}`;
      } else {
        endpoint = `${API_BASE_URL}/outpass-route/outpass/reject/${rejectionTarget.id}`;
      }

      let response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: values.reason.trim() || "No specific reason provided.",
        }),
      });

      // Fallback to old API
      if (!response.ok) {
        endpoint = isLeaveRequest
          ? `${API_BASE_URL}/outpass-route/leave/reject/${rejectionTarget.id}`
          : `${API_BASE_URL}/outpass-route/outpass/reject/${rejectionTarget.id}`;

        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: values.reason.trim() || "No specific reason provided.",
          }),
        });
      }

      const result = await response.json();

      if (response.ok) {
        notification.success({
          message: `${
            isLeaveRequest ? "Leave" : "Outpass"
          } Rejected Successfully`,
          description: `Rejection processed for ${rejectionTarget.name}.`,
        });

        setRejectionModalVisible(false);
        setRejectionTarget(null);
        await fetchOutpassData();
        setCurrentPage(1);
      } else {
        notification.error({
          message: "Rejection Failed",
          description: result.message || "Failed to reject request.",
        });
      }
    } catch (error) {
      console.error("Error during rejection process:", error);
      notification.error({
        message: "Network Error",
        description: "Network or server error while rejecting request.",
      });
    } finally {
      setRejectionLoading(false);
    }
  };

  const handleRejectionCancel = () => {
    setRejectionModalVisible(false);
    setRejectionTarget(null);
    rejectionForm.resetFields();
  };

  // Helper functions
  const buildDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;

    // normalize to local date (handles ISO / timezone)
    const dateOnly = dayjs(dateStr).format("YYYY-MM-DD");

    // support HH:mm or HH:mm:ss
    const timeFormat = timeStr.length === 5 ? "HH:mm" : "HH:mm:ss";

    return dayjs(`${dateOnly} ${timeStr}`, `YYYY-MM-DD ${timeFormat}`);
  };

  const computeDuration = (record) => {
    if (!record) return "N/A";

    const startDate = dayjs(record.date_from).format("YYYY-MM-DD");
    const endDate = dayjs(record.date_to).format("YYYY-MM-DD");

    const startTime = String(record.time_out || "00:00");
    const endTime = String(record.time_in || "00:00");

    const start = dayjs(`${startDate} ${startTime}`);
    const end = dayjs(`${endDate} ${endTime}`);

    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      return record.duration || "N/A";
    }

    const diffMs = end.diff(start);
    const totalMinutes = Math.floor(diffMs / 60000);

    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return `${days}D / ${hours}H / ${minutes}M`;
  };

  const getStudentImageSrc = (item) => {
    if (!item || !item.student_image) return null;

    if (
      typeof item.student_image === "string" &&
      item.student_image.startsWith("data:")
    ) {
      return item.student_image;
    }

    const mime = item.image_mimetype || "image/jpeg";
    return `data:${mime};base64,${item.student_image}`;
  };

  const getLeaveLetterSrc = (item) => {
    if (!item || !item.leave_letter) return null;

    const mime = item.letter_mimetype || "image/jpeg";
    const raw = item.leave_letter;

    // 1) already a full data URL
    if (typeof raw === "string" && raw.startsWith("data:")) {
      return raw;
    }

    // 2) already base64 string (no "data:" prefix)
    if (typeof raw === "string" && !raw.startsWith("\\x")) {
      return `data:${mime};base64,${raw}`;
    }

    // 3) hex string like "\xFFD8..."  -> convert hex -> base64
    if (typeof raw === "string" && raw.startsWith("\\x")) {
      const hex = raw.slice(2); // drop "\x"
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      const base64 = window.btoa(binary);
      return `data:${mime};base64,${base64}`;
    }

    // 4) Buffer-like object { type: 'Buffer', data: [...] }
    if (raw && typeof raw === "object" && Array.isArray(raw.data)) {
      const uint8 = new Uint8Array(raw.data);
      let binary = "";
      uint8.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const base64 = window.btoa(binary);
      return `data:${mime};base64,${base64}`;
    }

    // if nothing matched, bail
    return null;
  };

  const totalEntries = filteredData.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(currentPage * pageSize, totalEntries);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const PaginationInfo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ marginRight: 8, color: "#666" }}>Rows Per Page:</span>
        <Select
          defaultValue={pageSize}
          style={{ width: 80 }}
          onChange={(value) => handlePaginationChange(1, value)}
          size="small"
        >
          <Option value={10}>10</Option>
          <Option value={25}>25</Option>
          <Option value={50}>50</Option>
          <Option value={100}>100</Option>
        </Select>
      </div>
      <span style={{ color: "#333", fontWeight: 500, marginLeft: 16 }}>
        {`Showing ${
          totalEntries === 0 ? 0 : startIndex + 1
        }-${endIndex} of ${totalEntries} entries`}
      </span>
    </div>
  );

  // Check if data has permission field to show permission filter
  const hasPermissionData = data.some((item) => item.permission);

  // Unified columns with conditional rendering
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.permission && (
            <Tag
              color={record.permission === "leave" ? "blue" : "green"}
              size="small"
              icon={
                record.permission === "leave" ? (
                  <FileTextOutlined />
                ) : (
                  <UserOutlined />
                )
              }
            >
              {record.permission === "leave" ? "Leave" : "Outpass"}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "ID",
      key: "display_id",
      render: (text, record) => (
        <span style={{ fontWeight: 600 }}>
          {record.display_id || record.hostel_id}
          {record.permission && (
            <div style={{ fontSize: "11px", color: "#666" }}>
              {record.permission === "leave" ? "Roll No" : "Hostel ID"}
            </div>
          )}
        </span>
      ),
    },
    {
      title: "Hostel/Course",
      key: "hostel_course",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "dodgerblue" }}>
            {record.hostel || record.display_course || record.course}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.inst_name}
          </div>
        </div>
      ),
    },
    {
      title: "Purpose/Destination",
      key: "purpose_destination",
      render: (_, record) => (
        <div>
          <div>{record.purpose}</div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.destination || record.address}
          </div>
        </div>
      ),
    },
    // {
    //     title: "Mail ID",
    //     key: "Mail ID",
    //     render: (_, record) => (
    //         <div>
    //             <div style={{ fontSize: '11px', color: '#666' }}>
    //                 {record.mail_id || 'N/A'}
    //             </div>
    //         </div>
    //     )
    // },
    {
      title: "From",
      dataIndex: "date_from",
      render: (_, record) => {
        const date = new Date(record.date_from).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return `${date}, ${formatTime(record.time_out)}`;
      },
    },
    {
      title: "To",
      dataIndex: "date_to",
      render: (_, record) => {
        const date = new Date(record.date_to).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return `${date}, ${formatTime(record.time_in)}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status_tag",
      render: (status) => {
        let color;
        let text = status.toUpperCase();

        if (status === "Accepted") {
          color = "success";
        } else if (status === "Rejected") {
          color = "error";
        } else if (status === "Renewal Pending") {
          color = "warning";
        } else if (status === "Renewed") {
          color = "processing";
        } else if (status === "Completed") {
          color = "purple";
        } else {
          color = "default";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Action",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* View Button */}
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => setSelectedItem(record)}
          >
            View
          </Button>

          {/* Conditional Rendering based on Status and Type */}
          {record.status === "Renewal Pending" &&
          (record.permission === "permission" || !record.permission) ? (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleDirectRenewApprove(record)}
                style={{ backgroundColor: "#4b3d82", borderColor: "#4b3d82" }}
              >
                Renew
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleRejectRenewal(record.id)}
              >
                Reject
              </Button>
            </>
          ) : record.status === "Pending" ? (
            <>
              {/* 🚀 UPDATED: Both Leave and Outpass open modal for time review */}
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setEditRecord(record);

                  const originalOut = buildDateTime(
                    record.date_from,
                    record.time_out
                  );
                  const originalIn = buildDateTime(
                    record.date_to,
                    record.time_in
                  );
                  const now = dayjs();

                  // clamp checkout to now if original is in the past
                  const safeOut =
                    originalOut && originalOut.isAfter(now)
                      ? originalOut
                      : now.add(5, "minute");

                  // clamp check-in to be after checkout
                  let safeIn =
                    originalIn && originalIn.isAfter(safeOut)
                      ? originalIn
                      : safeOut.add(1, "hour");

                  setEditedCheckOut(safeOut);
                  setEditedCheckIn(safeIn);
                  setEditedRemarks("");

                  // initialise form fields
                  editForm.setFieldsValue({
                    checkout: safeOut,
                    checkin: safeIn,
                    remarks: "",
                  });

                  setEditModalOpen(true);
                }}
              >
                Accept
              </Button>

              <Button danger onClick={() => handleRejectClick(record)}>
                Reject
              </Button>
            </>
          ) : (
            <Tag
              color={
                record.status === "Accepted"
                  ? "success"
                  : record.status === "Rejected"
                  ? "error"
                  : record.status === "Renewed"
                  ? "processing"
                  : record.status === "Completed"
                  ? "purple"
                  : "default"
              }
              style={{ fontWeight: "600" }}
            >
              {record.status.toUpperCase()}
            </Tag>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="outpass-request-container">
      <h2 className="outpass-form-title">Outpass &amp; Leave Requests</h2>

      {/* Filter Panel */}
      <div className="outpass-request-filter-panel">
        <Input
          placeholder="Search name, ID, purpose..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 250 }}
          allowClear
        />
        <RangePicker
          onChange={handleDateChange}
          style={{ marginLeft: 10 }}
          allowClear
        />

        {/* Status Filter */}
        <Select
          value={statusFilter}
          style={{ width: 150, marginLeft: 10 }}
          onChange={handleStatusChange}
          placeholder="Status"
        >
          <Option value="All">All Status</Option>
          <Option value="Pending">Pending</Option>
          <Option value="Accepted">Accepted</Option>
          <Option value="Rejected">Rejected</Option>
          <Option value="Renewal Pending">Renewal Pending</Option>
          <Option value="Renewed">Renewed</Option>
          <Option value="Completed">Completed</Option>
        </Select>

        {/* Permission Filter - only show if data has permission field */}
        {hasPermissionData && (
          <Select
            value={permissionFilter}
            style={{ width: 150, marginLeft: 10 }}
            onChange={handlePermissionChange}
            placeholder="Type"
          >
            <Option value="All">All Types</Option>
            <Option value="permission">Outpass</Option>
            <Option value="leave">Leave</Option>
          </Select>
        )}

        <Button
          icon={<UndoOutlined />}
          onClick={() => {
            setSearch("");
            setDateRange([]);
            setStatusFilter("All");
            setPermissionFilter("All");
            applyFilters(data, "", [], "All", "All");
          }}
          style={{ marginLeft: 10, color: "red" }}
        >
          Reset
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchOutpassData();
            toast.success("Data Refreshed!");
          }}
          style={{ marginLeft: 10, color: "dodgerblue" }}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={paginatedData}
        rowKey="id"
        loading={loading}
        style={{ marginTop: 20 }}
        pagination={false}
      />

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          padding: "10px 0",
        }}
      >
        <PaginationInfo />
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalEntries}
          onChange={(page) => setCurrentPage(page)}
          showSizeChanger={false}
        />
      </div>

      {/* Rejection Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>
              Reject{" "}
              {rejectionTarget?.permission === "leave" ? "Leave" : "Outpass"}{" "}
              Request
            </span>
          </div>
        }
        open={rejectionModalVisible}
        onOk={handleRejectionSubmit}
        onCancel={handleRejectionCancel}
        confirmLoading={rejectionLoading}
        width={600}
        okText="Confirm Rejection"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          icon: <CloseCircleOutlined />,
        }}
        maskClosable={false}
      >
        {rejectionTarget && (
          <div>
            <div
              style={{
                backgroundColor: "#fff2f0",
                border: "1px solid #ffccc7",
                borderRadius: "6px",
                padding: "12px 16px",
                marginBottom: "20px",
              }}
            >
              <Text strong style={{ color: "#cf1322" }}>
                You are about to reject the{" "}
                {rejectionTarget.permission === "leave" ? "leave" : "outpass"}{" "}
                request for:
              </Text>
              <div style={{ marginTop: "8px" }}>
                <Text strong style={{ color: "#1890ff" }}>
                  {rejectionTarget.name}
                </Text>
                <Text style={{ marginLeft: "8px", color: "#666" }}>
                  (
                  {rejectionTarget.permission === "leave"
                    ? "Roll No"
                    : "Hostel ID"}
                  : {rejectionTarget.display_id || rejectionTarget.hostel_id})
                </Text>
              </div>
              <div style={{ marginTop: "4px", color: "#666" }}>
                <Text style={{ fontSize: "13px" }}>
                  {rejectionTarget.display_course || rejectionTarget.course} •{" "}
                  {rejectionTarget.purpose}
                </Text>
              </div>
            </div>

            <Form form={rejectionForm} layout="vertical">
              <Form.Item
                label="Reason for Rejection"
                name="reason"
                rules={[
                  {
                    required: true,
                    message: "Please provide a reason for rejection",
                  },
                  {
                    min: 10,
                    message: "Reason should be at least 10 characters long",
                  },
                  { max: 500, message: "Reason cannot exceed 500 characters" },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Please provide a clear reason for rejecting this request. This reason will be sent to the student."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Form>

            <div
              style={{
                fontSize: "13px",
                color: "#666",
                marginTop: "16px",
                padding: "8px 12px",
                backgroundColor: "#f6f6f6",
                borderRadius: "4px",
                borderLeft: "3px solid #1890ff",
              }}
            >
              <Text strong>Note:</Text> The rejection reason will be processed
              and may be sent to the student. Please ensure your reason is
              professional and clear.
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Approval Modal */}
      <Modal
        title={`Approve ${
          editRecord?.permission === "leave" ? "Leave" : "Outpass"
        } (Review & Edit)`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleApproveWithEdits}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Check-Out (Date & Time)"
            name="checkout"
            rules={[
              {
                required: true,
                message: "Please select check-out date & time",
              },
              () => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const now = dayjs();
                  if (value.isBefore(now, "minute")) {
                    return Promise.reject(
                      new Error("Check-out cannot be in the past")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              showTime={{ format: "hh:mm A" }}
              format="YYYY-MM-DD hh:mm A"
              style={{ width: "100%" }}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            label="Check-In (Date & Time)"
            name="checkin"
            rules={[
              { required: true, message: "Please select check-in date & time" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const checkout = getFieldValue("checkout");
                  if (!value || !checkout) return Promise.resolve();

                  const now = dayjs();
                  if (value.isBefore(now, "minute")) {
                    return Promise.reject(
                      new Error("Check-in cannot be in the past")
                    );
                  }
                  if (!value.isAfter(checkout)) {
                    return Promise.reject(
                      new Error("Check-in must be later than check-out")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              showTime={{ format: "hh:mm A" }}
              format="YYYY-MM-DD hh:mm A"
              style={{ width: "100%" }}
              disabledDate={(current) => {
                if (!current) return false;
                const todayBlocked = current < dayjs().startOf("day");
                const checkout = editForm.getFieldValue("checkout");
                if (!checkout) return todayBlocked;
                return (
                  todayBlocked || current.isBefore(checkout.startOf("day"))
                );
              }}
            />
          </Form.Item>

          <Form.Item label="Remarks (Why edited?)" name="remarks">
            <TextArea
              rows={3}
              placeholder="Enter remarks..."
              onChange={(e) => setEditedRemarks(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        visible={!!selectedItem}
        title={`${
          selectedItem?.permission === "leave" ? "Leave" : "Outpass"
        } Request Details`}
        centered
        onCancel={() => setSelectedItem(null)}
        footer={null}
        width={800}
      >
        {selectedItem && (
          <div style={{ padding: "0 10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  <span style={{ color: "dodgerblue" }}>
                    {selectedItem.name} (
                    {selectedItem.display_id || selectedItem.hostel_id})
                  </span>

                  <Tag
                    color={
                      selectedItem.status === "Accepted"
                        ? "success"
                        : selectedItem.status === "Rejected"
                        ? "error"
                        : selectedItem.status === "Renewed"
                        ? "processing"
                        : selectedItem.status === "Completed"
                        ? "purple"
                        : selectedItem.status === "Renewal Pending"
                        ? "warning"
                        : "default"
                    }
                    style={{ marginLeft: 10 }}
                  >
                    {selectedItem.status.toUpperCase()}
                  </Tag>

                  {selectedItem.permission && (
                    <Tag
                      color={
                        selectedItem.permission === "leave" ? "blue" : "green"
                      }
                      style={{ marginLeft: 5 }}
                    >
                      {selectedItem.permission === "leave"
                        ? "LEAVE"
                        : "OUTPASS"}
                    </Tag>
                  )}
                </h3>
              </div>

              {(getStudentImageSrc(selectedItem) ||
                (selectedItem.permission === "leave" &&
                  getLeaveLetterSrc(selectedItem))) && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {/* Student Photo */}
                  {getStudentImageSrc(selectedItem) && (
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 11,
                          marginBottom: 4,
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        Student Image
                      </div>
                      <Image
                        src={getStudentImageSrc(selectedItem)}
                        alt={`${selectedItem.name}'s photo`}
                        width={82}
                        height={82}
                        style={{
                          objectFit: "cover",
                          border: "2px solid #e0e7ff",
                          boxShadow: "0 4px 10px rgba(15, 23, 42, 0.15)",
                        }}
                        preview={{
                          mask: (
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 6px",
                                borderRadius: 999,
                                background: "rgba(15, 23, 42, 0.45)",
                                color: "#fff",
                              }}
                            >
                              Click to zoom
                            </span>
                          ),
                        }}
                      />
                    </div>
                  )}

                  {/* Leave Letter (only for leave requests) */}
                  {selectedItem.permission === "leave" &&
                    getLeaveLetterSrc(selectedItem) && (
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: 11,
                            marginBottom: 4,
                            color: "#64748b",
                            fontWeight: 500,
                          }}
                        >
                          Leave Letter
                        </div>
                        <Image
                          src={getLeaveLetterSrc(selectedItem)}
                          alt="Leave letter"
                          width={82}
                          height={82}
                          style={{
                            objectFit: "cover",
                            border: "2px solid #e0e7ff",
                            boxShadow: "0 4px 10px rgba(127, 29, 29, 0.2)",
                          }}
                          preview={{
                            mask: (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "2px 6px",
                                  borderRadius: 999,
                                  background: "rgba(127, 29, 29, 0.6)",
                                  color: "#fff",
                                }}
                              >
                                View letter
                              </span>
                            ),
                          }}
                        />
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Main Details */}
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 15 }}
            >
              <Descriptions.Item
                label={
                  selectedItem.permission === "leave"
                    ? "Roll No/Room"
                    : "Hostel/Room"
                }
              >
                {selectedItem.permission === "leave"
                  ? `${selectedItem.display_id || selectedItem.hostel_id} / ${
                      selectedItem.room_no || "N/A"
                    }`
                  : `${selectedItem.hostel || "N/A"} / ${
                      selectedItem.room_no || "N/A"
                    }`}
              </Descriptions.Item>
              <Descriptions.Item label="Purpose">
                {selectedItem.purpose}
              </Descriptions.Item>
              <Descriptions.Item label="Institution">
                {selectedItem.inst_name}
              </Descriptions.Item>
              <Descriptions.Item label="Course/Program">
                {selectedItem.display_course || selectedItem.course}
              </Descriptions.Item>
              <Descriptions.Item label="Contact">
                {selectedItem.display_contact || selectedItem.mobile}
              </Descriptions.Item>
              <Descriptions.Item label="Year">
                {selectedItem.year || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Destination" span={2}>
                {selectedItem.destination || selectedItem.address}
              </Descriptions.Item>
              <Descriptions.Item label="Mail ID" span={2}>
                {selectedItem.mail_id || "N/A"}
              </Descriptions.Item>
            </Descriptions>

            {/* Duration and Timing */}
            <Descriptions
              title={`${
                selectedItem.permission === "leave" ? "Leave" : "Outpass"
              } Timing`}
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 15 }}
            >
              <Descriptions.Item label="Duration" span={2}>
                <span style={{ fontWeight: 600, color: "dodgerblue" }}>
                  {computeDuration(selectedItem)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Check Out">
                {new Date(selectedItem.date_from).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                - {formatTime(selectedItem.time_out)}
              </Descriptions.Item>
              <Descriptions.Item label="Check In">
                {new Date(selectedItem.date_to).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                - {formatTime(selectedItem.time_in)}
              </Descriptions.Item>
            </Descriptions>

            {/* Exit/Entry Times if available */}
            {(selectedItem.exit_time || selectedItem.entry_time) && (
              <Descriptions
                title="Campus Activity"
                bordered
                column={2}
                size="small"
                style={{ marginBottom: 15 }}
              >
                {selectedItem.exit_time && (
                  <Descriptions.Item label="Campus Exit">
                    <span style={{ color: "orange", fontWeight: 600 }}>
                      {new Date(selectedItem.exit_time).toLocaleString()}
                    </span>
                  </Descriptions.Item>
                )}
                {selectedItem.entry_time && (
                  <Descriptions.Item label="Campus Entry">
                    <span style={{ color: "green", fontWeight: 600 }}>
                      {new Date(selectedItem.entry_time).toLocaleString()}
                    </span>
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Renewal Request Details (Outpass only) */}
            {selectedItem.status === "Renewal Pending" &&
              (!selectedItem.permission ||
                selectedItem.permission === "permission") && (
                <Descriptions
                  title="Renewal Request"
                  bordered
                  column={1}
                  size="small"
                  style={{ marginBottom: 15, borderColor: "#ffc53d" }}
                >
                  <Descriptions.Item label="Requested Reason">
                    <span style={{ fontWeight: 600 }}>
                      {selectedItem.renewal_reason ||
                        "No specific reason provided."}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Requested Check In">
                    <span style={{ color: "red", fontWeight: 600 }}>
                      {dayjs(selectedItem.new_date_to).format("MMM D, YYYY")} -{" "}
                      {formatTime(selectedItem.new_time_in)}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              )}

            {/* Rejection Details */}
            {selectedItem.status === "Rejected" &&
              selectedItem.rejection_reason && (
                <Descriptions
                  title="Rejection Details"
                  bordered
                  column={1}
                  size="small"
                  style={{ marginBottom: 15, borderColor: "#ff4d4f" }}
                >
                  <Descriptions.Item label="Rejection Reason">
                    <span style={{ color: "#cf1322", fontWeight: 600 }}>
                      {selectedItem.rejection_reason}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              )}

            {/* QR Code (Outpass only) */}
            {selectedItem.status === "Accepted" &&
              selectedItem.qr_code &&
              (!selectedItem.permission ||
                selectedItem.permission === "permission") && (
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <h4 style={{ color: "green", margin: "0 0 10px" }}>
                    Entry/Exit QR Pass
                  </h4>
                  <img
                    src={selectedItem.qr_code}
                    alt="QR Code"
                    style={{
                      width: "150px",
                      height: "150px",
                      border: "1px solid #ddd",
                    }}
                  />
                  {selectedItem.valid_until && (
                    <p style={{ color: "red", marginTop: 10 }}>
                      Valid Until:{" "}
                      {new Date(selectedItem.valid_until).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

            {/* Metadata */}
            <p
              style={{
                fontSize: 14,
                color: "#666",
                marginTop: 15,
                borderTop: "1px solid #eee",
                paddingTop: 10,
                textAlign: "center",
              }}
            >
              Requested:&nbsp;
              <span style={{ fontWeight: "600" }}>
                {new Date(selectedItem.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default OutPassRequest;