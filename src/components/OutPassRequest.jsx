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
  Spin,
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
  LoadingOutlined,
} from "@ant-design/icons";
import { 
  AlertTriangle, 
  User, 
  Shield, 
  Trash2, 
  Zap, 
  Target, 
  Clipboard, 
  Lightbulb, 
  Lock,
  Check,
  X
} from 'lucide-react';
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

  // 🆕 NEW: State for detailed item with images
  const [detailedItem, setDetailedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  // Edit Approval Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editedCheckOut, setEditedCheckOut] = useState(null);
  const [editedCheckIn, setEditedCheckIn] = useState(null);
  const [editedRemarks, setEditedRemarks] = useState("");
  const [editForm] = Form.useForm();
const [activePassModal, setActivePassModal] = useState(false);
const [activePassData, setActivePassData] = useState(null);
const [pendingAcceptAction, setPendingAcceptAction] = useState(null);
const [activePassLoading, setActivePassLoading] = useState(false);
const [selectedPassesToExpire, setSelectedPassesToExpire] = useState([]);
const [expireAllPasses, setExpireAllPasses] = useState(false);
const [expireMode, setExpireMode] = useState('none');
const [hostelFilter, setHostelFilter] = useState("All");


const handleHostelChange = (value) => {
  setHostelFilter(value);
  applyFilters(data, search, dateRange, statusFilter, permissionFilter, value);
};

  // 🚀 OPTIMIZED: Fast fetch without images
const fetchOutpassData = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);

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

    // 4. Permission Filter
    if (
      permissionFilter &&
      permissionFilter !== "All" &&
      temp.some((item) => item.permission)
    ) {
      temp = temp.filter((item) => item.permission === permissionFilter);
    }

    // 🆕 5. HOSTEL FILTER
    if (hostelFilter && hostelFilter !== "All") {
      temp = temp.filter((item) => item.hostel === hostelFilter);
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
  hostelFilter,  // 🆕 ADD THIS DEPENDENCY
  currentPage,
  pageSize,
]);
const getUniqueHostels = () => {
  const hostels = [...new Set(data.map(item => item.hostel).filter(Boolean))];
  return hostels.sort();
};
  const getUserDetails = () => {
  const userDomainJoinUpn = localStorage.getItem("domain_join_upn");
  
  // Safely extract name before '@' and capitalize
  const extractName = (upn) => {
    if (!upn) return 'User';
    const namePart = upn.split('@')[0]; // "john.doe"
    return namePart
      .split('.') // split by dot if present
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };
  
  return {
    upn: userDomainJoinUpn,
    displayName: extractName(userDomainJoinUpn)
  };
};

  // 🆕 NEW: Fetch detailed item with images on demand
  const fetchDetailedItem = useCallback(async (item) => {
    setDetailLoading(true);
    try {
      const requestType = item.is_leave_request || item.permission === 'leave' ? 'leave' : 'outpass';
      const res = await fetch(
        `${API_BASE_URL}/outpass-route/getinfo/outpass/${item.id}/details?type=${requestType}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch detailed item");
      }

      const detailedData = await res.json();
      setDetailedItem(detailedData);
    } catch (err) {
      console.error("Error fetching detailed item:", err);
      notification.error({
        message: "Error Loading Details",
        description: "Failed to load detailed information with images.",
      });
      // Fallback: use basic item without images
      setDetailedItem(item);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // 🚀 UPDATED: Enhanced view handler with image loading
  const handleViewItem = async (item) => {
    setSelectedItem(item);
    setDetailedItem(null); // Clear previous detailed data
    
    // Immediately show modal with basic info, then load images
    await fetchDetailedItem(item);
  };

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
    currentPermission,
    currentHostel  // 🆕 ADD THIS PARAMETER
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

    // 🆕 ADD HOSTEL FILTER LOGIC
    if (currentHostel && currentHostel !== "All") {
      temp = temp.filter((item) => item.hostel === currentHostel);
    }

    setFilteredData(temp);
    setCurrentPage(1);
  },
  []
);

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters(data, value, dateRange, statusFilter, permissionFilter,hostelFilter);
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
    applyFilters(data, search, dates, statusFilter, permissionFilter,hostelFilter);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    applyFilters(data, search, dateRange, value, permissionFilter,hostelFilter);
  };

  const handlePermissionChange = (value) => {
    setPermissionFilter(value);
    applyFilters(data, search, dateRange, statusFilter, value,hostelFilter);
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
    const { displayName } = getUserDetails(); 

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
              reviewed_by: displayName
          }),
        }
      );

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

  // ✅ ADD THIS LINE - Get displayName properly
  const { displayName } = getUserDetails(); 

  const loadingToastId = toast.loading("Rejecting renewal...");

  try {
    let response = await fetch(
      `${API_BASE_URL}/outpass-route/outpass/reject-renewal/${id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewed_by: displayName, // ✅ Now properly defined
        }),
      }
    );

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
const { displayName } = getUserDetails(); 

  let endpoint;
  if (isLeaveRequest) {
    endpoint = `${API_BASE_URL}/outpass-route/leave/accept/${record.id}`;
  } else {
    endpoint = `${API_BASE_URL}/outpass-route/outpass/accept/${record.id}`;
  }

  const loadingToastId = toast.loading(
    `Checking active passes for ${record.name}...`
  );

  try {
    // First, check for active passes (without force_accept)
    let response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force_accept: false,reviewed_by: displayName  }), // Check for active passes first
    });

    const result = await response.json();
    toast.dismiss(loadingToastId);

    if (response.ok && result.requires_confirmation) {
      // Active passes found - show confirmation modal
      setActivePassData({
        ...result,
        record: record,
        endpoint: endpoint,
        isLeaveRequest: isLeaveRequest,
        action_type: 'direct_accept',
        reviewed_by: displayName 
      });
      setActivePassModal(true);
      return;
    } else if (response.ok) {
      // No active passes - proceed with normal acceptance
      notification.success({
        message: `${isLeaveRequest ? "Leave" : "Outpass"} Accepted`,
        description: isLeaveRequest
          ? "Leave request accepted successfully."
          : "Outpass accepted. QR sent via email.",
      });
      await fetchOutpassData();
      setCurrentPage(1);
    } else {
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
      description: "Network or server error while checking active passes.",
    });
  }
};

  // Accept with edits (from component 2) - for outpass only
  const handleApproveWithEdits = async () => {
  try {
    const values = await editForm.validateFields();
    const { displayName } = getUserDetails(); 

    const checkout = values.checkout;
    const checkin = values.checkin;
    const remarks = values.remarks || "";

    const isLeaveRequest =
      editRecord.is_leave_request || editRecord.permission === "leave";
    const requestType = isLeaveRequest ? "leave" : "outpass";

    const loadingToastId = toast.loading(
      `Checking active passes for ${editRecord.name}...`
    );

    try {
      let endpoint = isLeaveRequest
        ? `${API_BASE_URL}/outpass-route/leave/accept/${editRecord.id}`
        : `${API_BASE_URL}/outpass-route/outpass/accept/${editRecord.id}`;

      // First, check for active passes (without force_accept)
      let response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updated_date_from: checkout.format("YYYY-MM-DD"),
          updated_time_out: checkout.format("HH:mm:ss"),
          updated_date_to: checkin.format("YYYY-MM-DD"),
          updated_time_in: checkin.format("HH:mm:ss"),
          remarks,
          force_accept: false, // Check for active passes first
          reviewed_by: displayName 
        }),
      });

      const resData = await response.json();
      toast.dismiss(loadingToastId);

      if (response.ok && resData.requires_confirmation) {
        // Active passes found - show confirmation modal with edit details
        setActivePassData({
          ...resData,
          record: editRecord,
          endpoint: endpoint,
          isLeaveRequest: isLeaveRequest,
          action_type: 'approve_with_edits',
          reviewed_by: displayName,
          edit_details: {
            updated_date_from: checkout.format("YYYY-MM-DD"),
            updated_time_out: checkout.format("HH:mm:ss"),
            updated_date_to: checkin.format("YYYY-MM-DD"),
            updated_time_in: checkin.format("HH:mm:ss"),
            remarks,
            reviewed_by: displayName
          }
        });
        setActivePassModal(true);
        return;
      } else if (response.ok) {
        // No active passes - proceed with normal approval
        notification.success({
          message: `${isLeaveRequest ? "Leave" : "Outpass"} Approved`,
          description: isLeaveRequest
            ? `Leave request approved by ${displayName} with updated timing.`
            : `QR emailed to student with updated timing. Approved by ${displayName}.`,
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
        description: "Unable to check active passes.",
      });
    }
  } catch (validationError) {
    return;
  }
};

// NEW: Function to force accept despite active passes
const handleForceAccept = async () => {
  if (!activePassData) return;

  setActivePassLoading(true);
  const loadingToastId = toast.loading(
    `Processing ${activePassData.isLeaveRequest ? "leave" : "outpass"} acceptance...`
  );

  try {
    let requestBody = { force_accept: true , reviewed_by: activePassData.reviewed_by};

    // 🆕 NEW: Handle pass expiration based on selected mode
    let passesToExpire = [];
    
    if (expireMode === 'all') {
      // Expire all active passes
      passesToExpire = activePassData.active_passes.map(pass => ({
        id: pass.id,
        pass_type: pass.pass_type
      }));
    } else if (expireMode === 'selected') {
      // Expire only selected passes
      passesToExpire = selectedPassesToExpire;
    }

    if (passesToExpire.length > 0) {
      requestBody.expire_passes = passesToExpire;
    }

    // If it's an approve with edits action, include the edit details
    if (activePassData.action_type === 'approve_with_edits' && activePassData.edit_details) {
      requestBody = { ...requestBody, ...activePassData.edit_details };
    }

    let response = await fetch(activePassData.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    toast.dismiss(loadingToastId);

    if (response.ok) {
      const expiredCount = passesToExpire.length;
      let successMessage = `${activePassData.isLeaveRequest ? "Leave" : "Outpass"} Accepted`;
      
      if (expiredCount > 0) {
        successMessage += ` (${expiredCount} active pass${expiredCount > 1 ? 'es' : ''} expired)`;
      }

      notification.success({
        message: successMessage,
        description: activePassData.isLeaveRequest
          ? `Leave request accepted by ${activePassData.reviewed_by}.`
          : `Outpass accepted by ${activePassData.reviewed_by}. QR sent via email.`,
      });

      // Reset states and close modals
      setActivePassModal(false);
      setActivePassData(null);
      setSelectedPassesToExpire([]);
      setExpireMode('none');
      
      if (activePassData.action_type === 'approve_with_edits') {
        setEditModalOpen(false);
      }
      
      await fetchOutpassData();
      setCurrentPage(1);
    } else {
      notification.error({
        message: "Acceptance Failed",
        description: result.message || "Failed to accept request.",
      });
    }
  } catch (error) {
    toast.dismiss(loadingToastId);
    console.error("Error during force accept:", error);
    notification.error({
      message: "Network Error",
      description: "Network error while processing request.",
    });
  } finally {
    setActivePassLoading(false);
  }
};
const handleExpireModeChange = (mode) => {
  setExpireMode(mode);
  if (mode === 'all') {
    // Select all passes when "Expire All" is chosen
    const allPasses = activePassData.active_passes.map(pass => ({
      id: pass.id,
      pass_type: pass.pass_type
    }));
    setSelectedPassesToExpire(allPasses);
  } else if (mode === 'none') {
    // Clear selection when "Keep All Active" is chosen
    setSelectedPassesToExpire([]);
  }
  // For 'selected' mode, keep current selection
};

const handlePassSelection = (pass, checked) => {
  if (checked) {
    setSelectedPassesToExpire(prev => [...prev, { id: pass.id, pass_type: pass.pass_type }]);
  } else {
    setSelectedPassesToExpire(prev => 
      prev.filter(p => !(p.id === pass.id && p.pass_type === pass.pass_type))
    );
  }
};

// NEW: Function to cancel active pass modal
const handleActivePassCancel = () => {
  setActivePassModal(false);
  setActivePassData(null);
  setPendingAcceptAction(null);
  setSelectedPassesToExpire([]);
  setExpireMode('none');
};

// NEW: Function to format active pass display
const formatActivePassDisplay = (pass) => {
  const fromDate = new Date(pass.date_from).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const toDate = new Date(pass.date_to).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric", 
    year: "numeric",
  });
  const fromTime = formatTime(pass.time_out);
  const toTime = formatTime(pass.time_in);

  return {
    dateRange: `${fromDate} to ${toDate}`,
    timeRange: `${fromTime} - ${toTime}`,
  };
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
    
    // ✅ ADD THIS LINE - Get displayName properly
    const { displayName } = getUserDetails(); 

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
         reviewed_by: displayName  // ✅ Now properly defined
      }),
    });

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

    const dateOnly = dayjs(dateStr).format("YYYY-MM-DD");
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

  // 🚀 OPTIMIZED: Helper functions for images - now work with detailedItem
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

    if (typeof raw === "string" && raw.startsWith("data:")) {
      return raw;
    }

    if (typeof raw === "string" && !raw.startsWith("\\x")) {
      return `data:${mime};base64,${raw}`;
    }

    if (typeof raw === "string" && raw.startsWith("\\x")) {
      const hex = raw.slice(2);
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      const base64 = window.btoa(binary);
      return `data:${mime};base64,${base64}`;
    }

    if (raw && typeof raw === "object" && Array.isArray(raw.data)) {
      const uint8 = new Uint8Array(raw.data);
      let binary = "";
      uint8.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const base64 = window.btoa(binary);
      return `data:${mime};base64,${base64}`;
    }

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
const hasHostelData = data.some((item) => item.hostel);  // 🆕 ADD THIS IF YOU WANT CONDITIONAL RENDERING
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
              color={record.permission === "leave" ? "red" : "orange"}
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
  title: "Reviewed By",
  dataIndex: "reviewed_by",
  key: "reviewed_by",
  render: (reviewedBy, record) => (
    reviewedBy ? (
      <Tag color={record.status === "Rejected" ? "red" : "green"} style={{ fontWeight: 500 }}>
        {reviewedBy}
      </Tag>
    ) : (
      <span style={{ color: "#999", fontSize: "12px" }}>-</span>
    )
  ),
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
            onClick={() => handleViewItem(record)}
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

                  const safeOut =
                    originalOut && originalOut.isAfter(now)
                      ? originalOut
                      : now.add(5, "minute");

                  let safeIn =
                    originalIn && originalIn.isAfter(safeOut)
                      ? originalIn
                      : safeOut.add(1, "hour");

                  setEditedCheckOut(safeOut);
                  setEditedCheckIn(safeIn);
                  setEditedRemarks("");

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





const EnhancedActivePassModal = () => (
  <Modal
    title={null}
    open={activePassModal}
    onCancel={handleActivePassCancel}
    width={720}
    maskClosable={false}
    className="minimal-active-pass-modal"
    footer={null}
    closeIcon={<X size={18} color="#6b7280" />}
    style={{
      background: 'transparent',
    }}
    styles={{
      content: {
        padding: 0,
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        maxHeight: '90vh'
      },
      mask: {
        backdropFilter: 'blur(4px)',
        background: 'rgba(15, 23, 42, 0.3)'
      }
    }}
  >
    {activePassData && (
      <div>
        {/* Compact Header */}
        <div style={{ 
          padding: '20px 24px 16px', 
          textAlign: 'center', 
          borderBottom: '1px solid #f1f5f9' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #fecaca',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ 
                color: '#1f2937', 
                margin: '0 0 2px', 
                fontSize: '18px', 
                fontWeight: '600'
              }}>
                Active Pass Conflict
              </h2>
              
              <p style={{ 
                color: '#6b7280', 
                margin: 0, 
                fontSize: '14px'
              }}>
                Student has active passes. Choose how to handle them.
              </p>
            </div>
          </div>

          {/* Compact Student Info */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <User size={16} color="white" />
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#1f2937',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {activePassData.student_info.name}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280'
              }}>
                {activePassData.student_info.hostel_id || activePassData.student_info.roll_no}
              </div>
            </div>
            <div
              style={{
                background: '#ef4444',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                flexShrink: 0
              }}
            >
              {activePassData.active_passes.length} Active
            </div>
          </div>
        </div>

        {/* Compact Action Selection */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              Choose Action
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr 1fr", 
              gap: "12px"
            }}>
              {/* Keep All */}
              <div 
                style={{ 
                  padding: "16px 12px", 
                  border: `2px solid ${expireMode === 'none' ? '#10b981' : '#e5e7eb'}`, 
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: expireMode === 'none' ? '#f0fdf4' : '#ffffff',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => handleExpireModeChange('none')}
              >
                {expireMode === 'none' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#10b981',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={10} color="white" />
                  </div>
                )}
                
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: expireMode === 'none' ? '#10b981' : '#e5e7eb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px'
                    }}
                  >
                    <Shield size={18} color={expireMode === 'none' ? 'white' : '#6b7280'} />
                  </div>
                  
                  <h4 style={{ 
                    color: expireMode === 'none' ? "#047857" : "#374151", 
                    margin: '0 0 2px', 
                    fontSize: '13px', 
                    fontWeight: '600' 
                  }}>
                    Keep All Active
                  </h4>
                  <p style={{ 
                    fontSize: "11px", 
                    color: expireMode === 'none' ? "#059669" : "#6b7280", 
                    margin: 0,
                    lineHeight: '1.2'
                  }}>
                    Allow multiple passes
                  </p>
                </div>
              </div>

              {/* Expire All */}
              <div 
                style={{ 
                  padding: "16px 12px", 
                  border: `2px solid ${expireMode === 'all' ? '#ef4444' : '#e5e7eb'}`, 
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: expireMode === 'all' ? '#fef2f2' : '#ffffff',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => handleExpireModeChange('all')}
              >
                {expireMode === 'all' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#ef4444',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={10} color="white" />
                  </div>
                )}
                
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: expireMode === 'all' ? '#ef4444' : '#e5e7eb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px'
                    }}
                  >
                    <Trash2 size={18} color={expireMode === 'all' ? 'white' : '#6b7280'} />
                  </div>
                  
                  <h4 style={{ 
                    color: expireMode === 'all' ? "#991b1b" : "#374151", 
                    margin: '0 0 2px', 
                    fontSize: '13px', 
                    fontWeight: '600' 
                  }}>
                    Expire All ({activePassData.active_passes.length})
                  </h4>
                  <p style={{ 
                    fontSize: "11px", 
                    color: expireMode === 'all' ? "#dc2626" : "#6b7280", 
                    margin: 0,
                    lineHeight: '1.2'
                  }}>
                    Replace with new only
                  </p>
                </div>
              </div>

              {/* Custom Selection */}
              <div 
                style={{ 
                  padding: "16px 12px", 
                  border: `2px solid ${expireMode === 'selected' ? '#3b82f6' : '#e5e7eb'}`, 
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: expireMode === 'selected' ? '#eff6ff' : '#ffffff',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => handleExpireModeChange('selected')}
              >
                {expireMode === 'selected' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#3b82f6',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={10} color="white" />
                  </div>
                )}
                
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: expireMode === 'selected' ? '#3b82f6' : '#e5e7eb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px'
                    }}
                  >
                    <Zap size={18} color={expireMode === 'selected' ? 'white' : '#6b7280'} />
                  </div>
                  
                  <h4 style={{ 
                    color: expireMode === 'selected' ? "#1e40af" : "#374151", 
                    margin: '0 0 2px', 
                    fontSize: '13px', 
                    fontWeight: '600' 
                  }}>
                    Custom Selection
                  </h4>
                  <p style={{ 
                    fontSize: "11px", 
                    color: expireMode === 'selected' ? "#2563eb" : "#6b7280", 
                    margin: 0,
                    lineHeight: '1.2'
                  }}>
                    Choose specific passes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Pass List */}
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#1f2937", 
              marginBottom: "10px",
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Clipboard size={14} color="#6b7280" />
              Current Active Passes
            </h3>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              maxHeight: '240px',
              overflowY: 'auto'
            }}>
              {activePassData.active_passes.map((pass, index) => {
                const displayInfo = formatActivePassDisplay(pass);
                const isSelected = selectedPassesToExpire.some(
                  p => p.id === pass.id && p.pass_type === pass.pass_type
                );
                
                return (
                  <div
                    key={`${pass.pass_type}_${pass.id}`}
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${isSelected ? '#fecaca' : '#e5e7eb'}`,
                      borderRadius: "6px",
                      padding: "12px",
                      borderLeft: `3px solid ${pass.pass_type === 'leave' ? '#ef4444' : '#f59e0b'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: '10px' }}>
                      {expireMode === 'selected' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handlePassSelection(pass, e.target.checked)}
                          style={{ 
                            width: '14px', 
                            height: '14px',
                            accentColor: '#ef4444',
                            marginTop: '2px'
                          }}
                        />
                      )}
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "6px", gap: "6px", flexWrap: 'wrap' }}>
                          <div
                            style={{
                              background: pass.pass_type === 'leave' ? '#ef4444' : '#f59e0b',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}
                          >
                            {pass.pass_type === 'leave' ? 'LEAVE' : 'OUTPASS'}
                          </div>
                          
                          <div
                            style={{
                              background: pass.status === 'Accepted' ? '#10b981' : '#3b82f6',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}
                          >
                            {pass.status.toUpperCase()}
                          </div>
                          
                          {isSelected && (
                            <div
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}
                            >
                              WILL EXPIRE
                            </div>
                          )}
                        </div>
                        
                        <div style={{ fontSize: "13px", color: "#1f2937", fontWeight: '500', marginBottom: '4px' }}>
                          {pass.purpose}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280", lineHeight: '1.3' }}>
                          {displayInfo.dateRange} • {displayInfo.timeRange}
                        </div>
                      </div>
                      
                      <div style={{ 
                        fontSize: "10px", 
                        color: "#9ca3af", 
                        background: '#f3f4f6',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontFamily: 'monospace'
                      }}>
                        #{pass.id}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact Selection Summary */}
            {expireMode === 'selected' && (
              <div style={{ 
                marginTop: "8px", 
                padding: "8px 12px", 
                background: selectedPassesToExpire.length > 0 ? '#f0f9ff' : '#fef3c7', 
                border: `1px solid ${selectedPassesToExpire.length > 0 ? '#bfdbfe' : '#fed7aa'}`,
                borderRadius: "6px" 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: selectedPassesToExpire.length > 0 ? '#3b82f6' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedPassesToExpire.length > 0 ? (
                      <Check size={10} color="white" />
                    ) : (
                      <AlertTriangle size={10} color="white" />
                    )}
                  </div>
                  <div>
                    <div style={{ 
                      color: selectedPassesToExpire.length > 0 ? "#1e40af" : "#92400e",
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {selectedPassesToExpire.length} pass(es) selected to expire
                    </div>
                    {selectedPassesToExpire.length === 0 && expireMode === 'selected' && (
                      <div style={{ color: "#ef4444", fontSize: '11px' }}>
                        Select at least one pass to proceed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compact Warning */}
          <div
            style={{
              background: '#fef3c7',
              border: "1px solid #fed7aa",
              borderRadius: "6px",
              padding: "8px 12px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div style={{ fontSize: "11px", color: "#92400e", lineHeight: '1.3' }}>
                <strong>Warning:</strong> Expired passes cannot be reactivated and will be archived immediately.
              </div>
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div
          style={{
            background: '#f8fafc',
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <Button 
            onClick={handleActivePassCancel}
            size="middle"
            style={{
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              fontWeight: '500',
              minWidth: '100px',
              height: '36px'
            }}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            size="middle"
            loading={activePassLoading}
            onClick={handleForceAccept}
            disabled={expireMode === 'selected' && selectedPassesToExpire.length === 0}
            style={{
              borderRadius: '6px',
              border: 'none',
              background: expireMode === 'none' 
                ? '#10b981'
                : expireMode === 'all' 
                  ? '#ef4444'
                  : '#3b82f6',
              fontWeight: '600',
              minWidth: '140px',
              height: '36px'
            }}
          >
            {expireMode === 'none' ? 'Keep All & Proceed' : 
             expireMode === 'all' ? `Expire All & Proceed` :
             `Expire Selected & Proceed`}
          </Button>
        </div>
      </div>
    )}
  </Modal>
);

//   const EnhancedActivePassModal = () => (
//   <Modal
//     title={
//       <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//         <ExclamationCircleOutlined style={{ color: "#faad14" }} />
//         <span>Active Pass(es) Found - Choose Action</span>
//       </div>
//     }
//     open={activePassModal}
//     onCancel={handleActivePassCancel}
//     width={800}
//     maskClosable={false}
//     footer={[
//       <Button key="cancel" onClick={handleActivePassCancel}>
//         Cancel
//       </Button>,
//       <Button 
//         key="proceed" 
//         type="primary" 
//         danger={expireMode !== 'none'}
//         loading={activePassLoading}
//         onClick={handleForceAccept}
//         icon={<CheckCircleOutlined />}
//         disabled={expireMode === 'selected' && selectedPassesToExpire.length === 0}
//       >
//         {expireMode === 'none' ? 'Proceed (Keep All Active)' : 
//          expireMode === 'all' ? `Proceed (Expire All ${activePassData?.active_passes.length || 0})` :
//          `Proceed (Expire ${selectedPassesToExpire.length} Selected)`}
//       </Button>,
//     ]}
//   >
//     {activePassData && (
//       <div>
//         {/* Warning Section */}
//         <div
//           style={{
//             backgroundColor: "#fff7e6",
//             border: "1px solid #ffd591",
//             borderRadius: "6px",
//             padding: "16px",
//             marginBottom: "20px",
//           }}
//         >
//           <Text strong style={{ color: "#d46b08", fontSize: "16px" }}>
//             ⚠️ Warning: Active Pass(es) Detected
//           </Text>
//           <div style={{ marginTop: "8px" }}>
//             <Text strong style={{ color: "#1890ff" }}>
//               {activePassData.student_info.name}
//             </Text>
//             <Text style={{ marginLeft: "8px", color: "#666" }}>
//               ({activePassData.student_info.hostel_id || activePassData.student_info.roll_no})
//             </Text>
//           </div>
//           <div style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
//             This student has <strong>{activePassData.active_passes.length}</strong> active pass(es).
//             Choose how to handle them before approving this new request.
//           </div>
//         </div>

//         {/* 🆕 NEW: Expiration Mode Selection */}
//         <div style={{ marginBottom: "20px" }}>
//           <Text strong style={{ fontSize: "16px", color: "#1f2937", marginBottom: "12px", display: "block" }}>
//             🎯 Choose Action:
//           </Text>
          
//           <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
//             <div 
//               style={{ 
//                 padding: "12px", 
//                 border: `2px solid ${expireMode === 'none' ? '#52c41a' : '#d9d9d9'}`, 
//                 borderRadius: "8px",
//                 cursor: "pointer",
//                 backgroundColor: expireMode === 'none' ? '#f6ffed' : '#fafafa'
//               }}
//               onClick={() => handleExpireModeChange('none')}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                 <input 
//                   type="radio" 
//                   checked={expireMode === 'none'} 
//                   onChange={() => handleExpireModeChange('none')}
//                 />
//                 <Text strong style={{ color: "#52c41a" }}>Keep All Active (Allow Multiple Passes)</Text>
//               </div>
//               <Text style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
//                 Proceed without expiring any passes. Student will have multiple active passes.
//               </Text>
//             </div>

//             <div 
//               style={{ 
//                 padding: "12px", 
//                 border: `2px solid ${expireMode === 'all' ? '#ff4d4f' : '#d9d9d9'}`, 
//                 borderRadius: "8px",
//                 cursor: "pointer",
//                 backgroundColor: expireMode === 'all' ? '#fff2f0' : '#fafafa'
//               }}
//               onClick={() => handleExpireModeChange('all')}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                 <input 
//                   type="radio" 
//                   checked={expireMode === 'all'} 
//                   onChange={() => handleExpireModeChange('all')}
//                 />
//                 <Text strong style={{ color: "#ff4d4f" }}>
//                   Expire All Active Passes ({activePassData.active_passes.length})
//                 </Text>
//               </div>
//               <Text style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
//                 Automatically expire all active passes and approve only this new request.
//               </Text>
//             </div>

//             <div 
//               style={{ 
//                 padding: "12px", 
//                 border: `2px solid ${expireMode === 'selected' ? '#1890ff' : '#d9d9d9'}`, 
//                 borderRadius: "8px",
//                 cursor: "pointer",
//                 backgroundColor: expireMode === 'selected' ? '#f0f5ff' : '#fafafa'
//               }}
//               onClick={() => handleExpireModeChange('selected')}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                 <input 
//                   type="radio" 
//                   checked={expireMode === 'selected'} 
//                   onChange={() => handleExpireModeChange('selected')}
//                 />
//                 <Text strong style={{ color: "#1890ff" }}>Custom Selection</Text>
//               </div>
//               <Text style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
//                 Choose specific passes to expire. Others will remain active.
//               </Text>
//             </div>
//           </div>
//         </div>

//         {/* Active Passes List with Checkboxes */}
//         <div style={{ marginBottom: "20px" }}>
//           <Text strong style={{ fontSize: "16px", color: "#1f2937" }}>
//             Current Active Passes:
//           </Text>
//           <div style={{ marginTop: "12px" }}>
//             {activePassData.active_passes.map((pass, index) => {
//               const displayInfo = formatActivePassDisplay(pass);
//               const isSelected = selectedPassesToExpire.some(
//                 p => p.id === pass.id && p.pass_type === pass.pass_type
//               );
              
//               return (
//                 <div
//                   key={`${pass.pass_type}_${pass.id}`}
//                   style={{
//                     backgroundColor: isSelected ? "#fff2f0" : "#f8fafc",
//                     border: `1px solid ${isSelected ? "#ffccc7" : "#e2e8f0"}`,
//                     borderRadius: "8px",
//                     padding: "12px 16px",
//                     marginBottom: "8px",
//                     borderLeft: `4px solid ${pass.pass_type === 'leave' ? '#ef4444' : '#f59e0b'}`,
//                   }}
//                 >
//                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//                     <div style={{ flex: 1 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
//                         {expireMode === 'selected' && (
//                           <input
//                             type="checkbox"
//                             checked={isSelected}
//                             onChange={(e) => handlePassSelection(pass, e.target.checked)}
//                             style={{ marginRight: "8px" }}
//                           />
//                         )}
//                         <Tag 
//                           color={pass.pass_type === 'leave' ? 'red' : 'orange'}
//                           style={{ marginRight: "8px" }}
//                         >
//                           {pass.pass_type === 'leave' ? 'LEAVE PASS' : 'OUTPASS'}
//                         </Tag>
//                         <Tag color={pass.status === 'Accepted' ? 'green' : 'blue'}>
//                           {pass.status.toUpperCase()}
//                         </Tag>
//                         {isSelected && (
//                           <Tag color="red" style={{ marginLeft: "8px" }}>
//                             WILL EXPIRE
//                           </Tag>
//                         )}
//                       </div>
                      
//                       <div style={{ marginTop: "8px" }}>
//                         <div style={{ fontSize: "14px", color: "#374151", marginBottom: "4px" }}>
//                           <strong>Purpose:</strong> {pass.purpose}
//                         </div>
//                         <div style={{ fontSize: "13px", color: "#6b7280" }}>
//                           <strong>Period:</strong> {displayInfo.dateRange}
//                         </div>
//                         <div style={{ fontSize: "13px", color: "#6b7280" }}>
//                           <strong>Time:</strong> {displayInfo.timeRange}
//                         </div>
//                         <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
//                           Created: {new Date(pass.created_at).toLocaleDateString("en-US", {
//                             month: "short",
//                             day: "numeric",
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </div>
//                       </div>
//                     </div>
                    
//                     <Text style={{ fontSize: "12px", color: "#64748b", marginLeft: "16px" }}>
//                       ID: {pass.id}
//                     </Text>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Selection Summary */}
//           {expireMode === 'selected' && (
//             <div style={{ 
//               marginTop: "12px", 
//               padding: "8px 12px", 
//               backgroundColor: "#f0f5ff", 
//               border: "1px solid #b7eb8f", 
//               borderRadius: "4px" 
//             }}>
//               <Text strong style={{ color: "#1890ff" }}>
//                 Selected: {selectedPassesToExpire.length} pass(es) to expire
//               </Text>
//               {selectedPassesToExpire.length === 0 && expireMode === 'selected' && (
//                 <Text style={{ color: "#ff4d4f", marginLeft: "8px" }}>
//                   (Select at least one pass to proceed)
//                 </Text>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Recommendation Section */}
//         <div
//           style={{
//             backgroundColor: "#fef3c7",
//             border: "1px solid #fcd34d",
//             borderRadius: "6px",
//             padding: "12px 16px",
//             marginTop: "16px",
//           }}
//         >
//           <Text strong style={{ color: "#92400e" }}>
//             💡 Recommendations:
//           </Text>
//           <div style={{ marginTop: "4px", fontSize: "14px", color: "#78350f" }}>
//             • <strong>Keep All Active:</strong> Use when student legitimately needs multiple passes<br/>
//             • <strong>Expire All:</strong> Best for replacing old passes with new timing<br/>
//             • <strong>Custom Selection:</strong> When only specific passes conflict with the new request
//           </div>
//         </div>

//         {/* Final Note */}
//         <div style={{ marginTop: "16px", fontSize: "13px", color: "#6b7280" }}>
//           <Text strong>Note:</Text> Expired passes will be marked as "Expired" in the system and 
//           can no longer be used for campus entry/exit. The new pass will be immediately active.
//         </div>
//       </div>
//     )}
//   </Modal>
// );
 
// const EnhancedActivePassModal = () => (
//   <Modal
//     title={
//       <div>
//         <div style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}>
//           Permission Conflict Resolution
//         </div>
//         <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: "400" }}>
//           Student has active permissions requiring attention
//         </div>
//       </div>
//     }
//     open={activePassModal}
//     onCancel={handleActivePassCancel}
//     width={820}
//     maskClosable={false}
//     styles={{
//       header: { borderBottom: "1px solid #e5e7eb", paddingBottom: "16px" },
//       body: { padding: "20px 0" }
//     }}
//     footer={[
//       <Button 
//         key="cancel" 
//         onClick={handleActivePassCancel}
//         style={{ height: "40px", fontSize: "14px", borderRadius: "6px" }}
//       >
//         Cancel
//       </Button>,
//       <Button 
//         key="proceed" 
//         type="primary" 
//         loading={activePassLoading}
//         onClick={handleForceAccept}
//         disabled={expireMode === 'selected' && selectedPassesToExpire.length === 0}
//         style={{ 
//           height: "40px",
//           fontSize: "14px",
//           fontWeight: "600",
//           borderRadius: "6px",
//           background: expireMode === 'none' 
//             ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
//             : expireMode === 'all'
//             ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
//             : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
//           border: "none"
//         }}
//       >
//         {expireMode === 'none' ? 'Proceed (Keep All)' : 
//          expireMode === 'all' ? `Proceed (Remove ${activePassData?.active_passes.length || 0})` :
//          `Proceed (Remove ${selectedPassesToExpire.length})`}
//       </Button>,
//     ]}
//   >
//     {activePassData && (
//       <div>
//         {/* Compact Student Info */}
//         <div style={{
//           background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//           borderRadius: "12px",
//           padding: "20px",
//           marginBottom: "20px",
//           color: "white",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center"
//         }}>
//           <div>
//             <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "2px" }}>
//               {activePassData.student_info.name}
//             </div>
//             <div style={{ fontSize: "14px", opacity: 0.9 }}>
//               ID: {activePassData.student_info.hostel_id || activePassData.student_info.roll_no}
//             </div>
//           </div>
//           <div style={{
//             background: "rgba(255, 255, 255, 0.2)",
//             borderRadius: "8px",
//             padding: "12px 16px",
//             textAlign: "center"
//           }}>
//             <div style={{ fontSize: "24px", fontWeight: "800", lineHeight: 1 }}>
//               {activePassData.active_passes.length}
//             </div>
//             <div style={{ fontSize: "12px", opacity: 0.9 }}>Active</div>
//           </div>
//         </div>

//         {/* Compact Resolution Options */}
//         <div style={{ marginBottom: "20px" }}>
//           <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
//             Choose Action
//           </div>
          
//           <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//             {/* Keep All */}
//             <div 
//               style={{ 
//                 padding: "16px", 
//                 border: `2px solid ${expireMode === 'none' ? '#10b981' : '#e5e7eb'}`, 
//                 borderRadius: "10px",
//                 cursor: "pointer",
//                 background: expireMode === 'none' 
//                   ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)'
//                   : '#ffffff',
//                 transition: "all 0.2s ease"
//               }}
//               onClick={() => handleExpireModeChange('none')}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                 <div 
//                   style={{ 
//                     width: "20px", 
//                     height: "20px", 
//                     borderRadius: "50%", 
//                     border: `2px solid ${expireMode === 'none' ? '#10b981' : '#d1d5db'}`,
//                     background: expireMode === 'none' ? '#10b981' : 'transparent',
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center"
//                   }}
//                 >
//                   {expireMode === 'none' && <div style={{ width: "6px", height: "6px", backgroundColor: "white", borderRadius: "50%" }} />}
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ fontSize: "15px", fontWeight: "600", color: expireMode === 'none' ? '#059669' : '#374151' }}>
//                     Allow Concurrent Permissions
//                   </div>
//                   <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
//                     Keep all existing permissions active alongside the new one
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Replace All */}
//             <div 
//               style={{ 
//                 padding: "16px", 
//                 border: `2px solid ${expireMode === 'all' ? '#ef4444' : '#e5e7eb'}`, 
//                 borderRadius: "10px",
//                 cursor: "pointer",
//                 background: expireMode === 'all' 
//                   ? 'linear-gradient(135deg, #fef2f2 0%, #fefcfc 100%)'
//                   : '#ffffff',
//                 transition: "all 0.2s ease"
//               }}
//               onClick={() => handleExpireModeChange('all')}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                 <div 
//                   style={{ 
//                     width: "20px", 
//                     height: "20px", 
//                     borderRadius: "50%", 
//                     border: `2px solid ${expireMode === 'all' ? '#ef4444' : '#d1d5db'}`,
//                     background: expireMode === 'all' ? '#ef4444' : 'transparent',
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center"
//                   }}
//                 >
//                   {expireMode === 'all' && <div style={{ width: "6px", height: "6px", backgroundColor: "white", borderRadius: "50%" }} />}
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ fontSize: "15px", fontWeight: "600", color: expireMode === 'all' ? '#dc2626' : '#374151' }}>
//                     Replace All Permissions ({activePassData.active_passes.length})
//                   </div>
//                   <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
//                     Remove all current permissions and activate only the new one
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Custom Selection */}
//             <div 
//               style={{ 
//                 padding: "16px", 
//                 border: `2px solid ${expireMode === 'selected' ? '#3b82f6' : '#e5e7eb'}`, 
//                 borderRadius: "10px",
//                 cursor: "pointer",
//                 background: expireMode === 'selected' 
//                   ? 'linear-gradient(135deg, #eff6ff 0%, #f8faff 100%)'
//                   : '#ffffff',
//                 transition: "all 0.2s ease"
//               }}
//               onClick={() => handleExpireModeChange('selected')}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                 <div 
//                   style={{ 
//                     width: "20px", 
//                     height: "20px", 
//                     borderRadius: "50%", 
//                     border: `2px solid ${expireMode === 'selected' ? '#3b82f6' : '#d1d5db'}`,
//                     background: expireMode === 'selected' ? '#3b82f6' : 'transparent',
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center"
//                   }}
//                 >
//                   {expireMode === 'selected' && <div style={{ width: "6px", height: "6px", backgroundColor: "white", borderRadius: "50%" }} />}
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ fontSize: "15px", fontWeight: "600", color: expireMode === 'selected' ? '#2563eb' : '#374151' }}>
//                     Manual Selection
//                   </div>
//                   <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
//                     Choose specific permissions to remove, keep others active
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Compact Permissions List */}
//         <div style={{ marginBottom: "16px" }}>
//           <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
//             Active Permissions ({activePassData.active_passes.length})
//           </div>
          
//           <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
//             {activePassData.active_passes.map((pass, index) => {
//               const displayInfo = formatActivePassDisplay(pass);
//               const isSelected = selectedPassesToExpire.some(
//                 p => p.id === pass.id && p.pass_type === pass.pass_type
//               );
              
//               return (
//                 <div
//                   key={`${pass.pass_type}_${pass.id}`}
//                   style={{
//                     background: isSelected 
//                       ? 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)'
//                       : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
//                     border: `1px solid ${isSelected ? '#fca5a5' : '#e2e8f0'}`,
//                     borderRadius: "8px",
//                     padding: "12px",
//                     marginBottom: "8px",
//                     borderLeft: `4px solid ${pass.pass_type === 'leave' ? '#ef4444' : '#f59e0b'}`,
//                     transition: "all 0.2s ease"
//                   }}
//                 >
//                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//                     <div style={{ flex: 1 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
//                         {expireMode === 'selected' && (
//                           <input
//                             type="checkbox"
//                             checked={isSelected}
//                             onChange={(e) => handlePassSelection(pass, e.target.checked)}
//                             style={{ 
//                               width: "16px", 
//                               height: "16px", 
//                               marginRight: "10px",
//                               cursor: "pointer",
//                               accentColor: "#ef4444"
//                             }}
//                           />
//                         )}
                        
//                         <span 
//                           style={{ 
//                             background: pass.pass_type === 'leave' 
//                               ? 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)'
//                               : 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
//                             color: pass.pass_type === 'leave' ? '#dc2626' : '#d97706',
//                             padding: "3px 8px",
//                             borderRadius: "12px",
//                             fontSize: "11px",
//                             fontWeight: "600",
//                             marginRight: "6px"
//                           }}
//                         >
//                           {pass.pass_type === 'leave' ? 'LEAVE' : 'OUTPASS'}
//                         </span>
                        
//                         <span 
//                           style={{ 
//                             background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
//                             color: '#059669',
//                             padding: "3px 8px",
//                             borderRadius: "12px",
//                             fontSize: "11px",
//                             fontWeight: "600"
//                           }}
//                         >
//                           {pass.status}
//                         </span>
                        
//                         {isSelected && (
//                           <span 
//                             style={{ 
//                               background: '#fee2e2',
//                               color: '#dc2626',
//                               padding: "3px 8px",
//                               borderRadius: "12px",
//                               fontSize: "11px",
//                               fontWeight: "600",
//                               marginLeft: "6px"
//                             }}
//                           >
//                             REMOVING
//                           </span>
//                         )}
//                       </div>
                      
//                       <div style={{ 
//                         paddingLeft: expireMode === 'selected' ? "26px" : "0",
//                         display: "grid",
//                         gridTemplateColumns: "2fr 1fr",
//                         gap: "8px",
//                         fontSize: "13px"
//                       }}>
//                         <div>
//                           <div style={{ color: "#111827", fontWeight: "600", marginBottom: "2px" }}>
//                             {pass.purpose}
//                           </div>
//                           <div style={{ color: "#6b7280" }}>
//                             {displayInfo.dateRange}
//                           </div>
//                         </div>
                        
//                         <div>
//                           <div style={{ color: "#374151", fontWeight: "500" }}>
//                             {displayInfo.timeRange}
//                           </div>
//                           <div style={{ color: "#9ca3af", fontSize: "12px" }}>
//                             #{pass.id}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Selection Summary */}
//           {expireMode === 'selected' && (
//             <div style={{ 
//               marginTop: "12px", 
//               padding: "12px", 
//               background: selectedPassesToExpire.length === 0 
//                 ? 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)'
//                 : 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
//               border: `1px solid ${selectedPassesToExpire.length === 0 ? '#fca5a5' : '#93c5fd'}`,
//               borderRadius: "8px",
//               textAlign: "center"
//             }}>
//               <div style={{ 
//                 color: selectedPassesToExpire.length === 0 ? "#dc2626" : "#2563eb", 
//                 fontSize: "14px", 
//                 fontWeight: "600" 
//               }}>
//                 {selectedPassesToExpire.length === 0 
//                   ? "Select permissions to remove"
//                   : `${selectedPassesToExpire.length} selected for removal`
//                 }
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Compact Footer */}
//         <div style={{
//           background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
//           border: "1px solid #e2e8f0",
//           borderRadius: "8px",
//           padding: "12px",
//           fontSize: "13px",
//           color: "#6b7280",
//           textAlign: "center"
//         }}>
//           <strong>Note:</strong> Removed permissions are permanently deactivated. New permission activates immediately.
//         </div>
//       </div>
//     )}
//   </Modal>
// );

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
  value={hostelFilter}
  style={{ width: 150, marginLeft: 10 }}
  onChange={handleHostelChange}
  placeholder="Hostel"
>
  <Option value="All">All Hostels</Option>
  {getUniqueHostels().map(hostel => (
    <Option key={hostel} value={hostel}>{hostel}</Option>
  ))}
</Select>
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

        {/* Permission Filter */}
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
            setHostelFilter("All");  
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

      {/* 🚀 UPDATED: View Details Modal with loading states and optimized image handling */}
      <Modal
        visible={!!selectedItem}
        title={`${
          selectedItem?.permission === "leave" ? "Leave" : "Outpass"
        } Request Details`}
        centered
        onCancel={() => {
          setSelectedItem(null);
          setDetailedItem(null);
        }}
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
                        selectedItem.permission === "leave" ? "red" : "orange"
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

              {/* 🚀 OPTIMIZED: Image section with loading states */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 90,
                }}
              >
                {detailLoading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spin 
                      indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                    />
                    <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                      Loading images...
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Student Photo */}
                    {detailedItem && getStudentImageSrc(detailedItem) && (
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
                          src={getStudentImageSrc(detailedItem)}
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
                    {detailedItem &&
                      selectedItem.permission === "leave" &&
                      getLeaveLetterSrc(detailedItem) && (
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
                            src={getLeaveLetterSrc(detailedItem)}
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

                    {/* Show placeholders if no images are found and loading is complete */}
                    {!detailLoading && (!detailedItem || (!getStudentImageSrc(detailedItem) && 
                      !(selectedItem.permission === "leave" && getLeaveLetterSrc(detailedItem)))) && (
                      <div style={{ textAlign: "center", color: "#999", fontSize: 12 }}>
                        No images available
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Main Details - use selectedItem for basic info, detailedItem for extended data */}
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

              {(selectedItem.status === "Accepted" || 
  selectedItem.status === "Rejected" ||
  selectedItem.status === "Renewed" || 
  selectedItem.status === "Completed") && 
 selectedItem.reviewed_by && (
  <Descriptions
    title={`${selectedItem.status === "Rejected" ? "Rejection" : "Review"} Details`}
    bordered
    column={1}
    size="small"
    style={{ 
      marginBottom: 15, 
      borderColor: selectedItem.status === "Rejected" ? "#ff4d4f" : "#52c41a" 
    }}
  >
    <Descriptions.Item label="Reviewed By">
      <span style={{ 
        color: selectedItem.status === "Rejected" ? "#cf1322" : "#389e0d", 
        fontWeight: 600 
      }}>
        {selectedItem.reviewed_by}
      </span>
    </Descriptions.Item>
    {selectedItem.rejection_reason && (
      <Descriptions.Item label="Rejection Reason">
        <span style={{ color: "#cf1322", fontWeight: 600 }}>
          {selectedItem.rejection_reason}
        </span>
      </Descriptions.Item>
    )}
    <Descriptions.Item label={`${selectedItem.status === "Rejected" ? "Rejected" : "Processed"} On`}>
      <span style={{ color: "#666", fontWeight: 500 }}>
        {new Date(selectedItem.updated_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </span>
    </Descriptions.Item>
  </Descriptions>
)}

            {/* QR Code (Outpass only) - use detailedItem for QR data */}
            {selectedItem.status === "Accepted" &&
              detailedItem?.qr_code &&
              (!selectedItem.permission ||
                selectedItem.permission === "permission") && (
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <h4 style={{ color: "green", margin: "0 0 10px" }}>
                    Entry/Exit QR Pass
                  </h4>
                  <img
                    src={detailedItem.qr_code}
                    alt="QR Code"
                    style={{
                      width: "150px",
                      height: "150px",
                      border: "1px solid #ddd",
                    }}
                  />
                  {detailedItem.valid_until && (
                    <p style={{ color: "red", marginTop: 10 }}>
                      Valid Until:{" "}
                      {new Date(detailedItem.valid_until).toLocaleString()}
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
      {EnhancedActivePassModal()}
    </div>
  );
}

export default OutPassRequest;