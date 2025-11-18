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
    Image
} from "antd"; 
import { 
    SearchOutlined, 
    ReloadOutlined, 
    UndoOutlined, 
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from "@ant-design/icons";
import "../styles/OutPassRequest.css";
import toast from "react-hot-toast";

const { RangePicker } = DatePicker;
const { Option } = Select; 

const POLLING_INTERVAL = 30000; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function OutPassRequest() {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false); 
    
    // 💡 NEW STATE for Status Filter
    const [statusFilter, setStatusFilter] = useState("All"); 
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); 

    // DEDICATED FETCH FUNCTION - Updated to use all current filters
    const fetchOutpassData = useCallback(async () => {
        setLoading(true); 
        try {
            const res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);
            if (!res.ok) throw new Error("Failed to fetch data");
            
            const result = await res.json();
            // 🔹 Sort: newest updated/created at the top
            const sorted = [...result].sort((a, b) => {
              const aTime = a.updated_at || a.created_at;
              const bTime = b.updated_at || b.created_at;
              return dayjs(bTime).valueOf() - dayjs(aTime).valueOf(); // desc
            });
            setData(result);
            
            // Recalculate filtered data using current filter states
            let temp = sorted;
            const searchTerm = search ? search.toLowerCase() : "";
                
            // 1. Text Search Filter
            temp = temp.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.hostel.toLowerCase().includes(searchTerm) ||
                item.inst_name.toLowerCase().includes(searchTerm) || 
                item.course.toLowerCase().includes(searchTerm) ||
                item.purpose.toLowerCase().includes(searchTerm) ||
                item.hostel_id.toLowerCase().includes(searchTerm)
            );

            // 2. Date Range Filter
            if (dateRange && dateRange.length === 2) {
                const [start, end] = dateRange;
                temp = temp.filter(item => 
                    dayjs(item.date_from).toDate() >= start.toDate() &&
                    dayjs(item.date_to).toDate() <= end.toDate()
                );
            }
            
            // 💡 3. Status Filter (NEW LOGIC)
            if (statusFilter && statusFilter !== "All") {
                temp = temp.filter(item => item.status === statusFilter);
            }
            
            setFilteredData(temp);

            // Handle pagination reset on fetch
            const totalPages = Math.ceil(temp.length / pageSize);
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(1);
            } else if (temp.length > 0 && currentPage === 0) {
                setCurrentPage(1); 
            }

        } catch (err) {
            console.error("Data fetching error:", err);
            notification.error({
                message: 'Data Fetch Error',
                description: 'Failed to load outpass data from the server.',
            });
        } finally {
            setLoading(false);
        }
    }, [search, dateRange, statusFilter, currentPage, pageSize]); // 💡 Added statusFilter to dependencies

    // useEffect for initial fetch and Polling
    useEffect(() => {
        fetchOutpassData();

        const intervalId = setInterval(() => {
            fetchOutpassData();
        }, POLLING_INTERVAL); 

        return () => clearInterval(intervalId);
    }, [fetchOutpassData]);

    // Apply filters logic (used by filter handlers) - Updated signature and logic
    const applyFilters = useCallback((currentData, currentSearch, currentRange, currentStatus) => {
        let temp = [...currentData].sort((a, b) => {
          const aTime = a.updated_at || a.created_at;
          const bTime = b.updated_at || b.created_at;
          return dayjs(bTime).valueOf() - dayjs(aTime).valueOf();
        });
        const searchTerm = currentSearch ? currentSearch.toLowerCase() : "";
            
        temp = temp.filter((item) => (
            item.name.toLowerCase().includes(searchTerm) ||
            item.hostel.toLowerCase().includes(searchTerm) ||
            item.inst_name.toLowerCase().includes(searchTerm) || 
            item.course.toLowerCase().includes(searchTerm) ||
            item.purpose.toLowerCase().includes(searchTerm) ||
            item.hostel_id.toLowerCase().includes(searchTerm)
        ));

        if (currentRange && currentRange.length === 2) {
            const [start, end] = currentRange;
            temp = temp.filter(
                (item) =>
                    dayjs(item.date_from).toDate() >= start.toDate() &&
                    dayjs(item.date_to).toDate() <= end.toDate()
            );
        }
        
        // 💡 Status Filter Logic
        if (currentStatus && currentStatus !== "All") {
            temp = temp.filter(item => item.status === currentStatus);
        }

        setFilteredData(temp);
        setCurrentPage(1); 
    }, []);

    const handleSearch = (value) => {
        setSearch(value);
        applyFilters(data, value, dateRange, statusFilter); // Pass statusFilter
    };

    const handleDateChange = (dates) => {
        setDateRange(dates);
        applyFilters(data, search, dates, statusFilter); // Pass statusFilter
    };

    // 💡 NEW Handler for Status Change
    const handleStatusChange = (value) => {
        setStatusFilter(value);
        applyFilters(data, search, dateRange, value); // Pass new status value
    };

    const handlePaginationChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const formatTime = (time) => {
        if (!time) return "N/A";
        // Convert "HH:MM:SS" string to a Date object for time formatting
        const [hour, minute] = time.split(":");
        const date = dayjs().set('hour', hour).set('minute', minute).toDate();
        
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // --- DIRECT RENEWAL APPROVAL LOGIC (UPDATED) ---
    const handleDirectRenewApprove = async (record) => {
        // Use the requested new values from the record
        const id = record.id;
        const formattedDate = record.new_date_to; // Assuming the date is already in YYYY-MM-DD format
        const formattedTime = record.new_time_in; // Assuming the time is already in HH:MM:SS format

        if (!formattedDate || !formattedTime) {
            notification.error({
                message: 'Renewal Data Missing',
                description: 'The requested new date/time data is missing from the record. Cannot auto-approve.',
            });
            return;
        }
        
        // Show a loading/progress toast
        const loadingToastId = toast.loading(`Renewing outpass for ${record.name}...`);

        try {
            // API endpoint to approve the renewal and update dates/status
            const response = await fetch(`${API_BASE_URL}/outpass-route/outpass/approve-renewal/${id}`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date_to: formattedDate,
                    time_in: formattedTime,
                    reason: record.renewal_reason || 'Renewal Approved by Staff/Warden.' // Send back the original reason or a generic one
                })
            });
            
            const result = await response.json();

            if (response.ok) {
                toast.dismiss(loadingToastId);
                notification.success({
                    message: 'Renewal Approved',
                    description: `Outpass for ${record.name} successfully renewed to ${dayjs(formattedDate).format('MMM D, YYYY')} at ${formatTime(formattedTime)}.`,
                });
                await fetchOutpassData();
                setCurrentPage(1); 
            } else {
                toast.dismiss(loadingToastId);
                notification.error({
                    message: 'Renewal Failed',
                    description: result.message || "Failed to approve outpass renewal.",
                });
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            console.error("Error approving renewal:", error);
            notification.error({
                message: 'Network Error',
                description: 'Network or server error while approving renewal.',
            });
        }
    };
    
    // --- Handle Renewal Rejection (UPDATED) ---
    const handleRejectRenewal = async (id) => {
        const confirmReject = window.confirm("Are you sure you want to reject this renewal request?");
        if (!confirmReject) return;
        
        const loadingToastId = toast.loading("Rejecting renewal...");

        try {
            // Assuming a separate endpoint for renewal rejection
            const response = await fetch(`${API_BASE_URL}/outpass-route/outpass/reject-renewal/${id}`, {
                method: "POST",
            });

            const result = await response.json();

            if (response.ok) {
                toast.dismiss(loadingToastId);
                notification.info({
                    message: 'Renewal Rejected',
                    description: `Outpass renewal (ID: ${id}) has been successfully rejected.`,
                });
                await fetchOutpassData();
                setCurrentPage(1); 
            } else {
                toast.dismiss(loadingToastId);
                notification.error({
                    message: 'Rejection Failed',
                    description: result.message || "Failed to reject outpass renewal.",
                });
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            console.error("Error during renewal rejection:", error);
            notification.error({
                message: 'Network Error',
                description: 'Network or server error while rejecting renewal.',
            });
        }
    };

    // Accept/Reject handlers (Initial Submission) - Minor Update for consistency
    const handleAccept = async (id) => {
        const loadingToastId = toast.loading("Accepting initial request...");
        
          try {
            const response = await fetch(`${API_BASE_URL}/outpass-route/outpass/accept/${id}`, {
                method: "POST",
            });
            const result = await response.json();
            if (response.ok) {
                toast.dismiss(loadingToastId);
                notification.success({
                    message: 'Outpass Accepted',
                    description: "Outpass accepted. QR sent via email.",
                });
                await fetchOutpassData();
                setCurrentPage(1); 
            } else {
                toast.dismiss(loadingToastId);
                notification.error({
                    message: 'Acceptance Failed',
                    description: result.message || "Failed to accept outpass.",
                });
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            console.error(error);
            notification.error({
                message: 'Network Error',
                description: 'Network or server error while accepting outpass.',
            });
        }
    };

    // const handleReject = async (id) => {
    //     // ... (Original handleReject logic) ...
    //     const confirmReject = window.confirm("Are you sure you want to reject this initial request?");
    //     if (!confirmReject) return;
        
    //     const loadingToastId = toast.loading("Rejecting initial request...");

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/outpass-route/outpass/reject/${id}`, {
    //             method: "POST",
    //         });

    //         const result = await response.json();

    //         if (response.ok) {
    //             toast.dismiss(loadingToastId);
    //             notification.info({
    //                 message: 'Outpass Rejected',
    //                 description: "Outpass successfully rejected.",
    //             });
    //             await fetchOutpassData();
    //             setCurrentPage(1);  
    //         } else {
    //             toast.dismiss(loadingToastId);
    //             notification.error({
    //                 message: 'Rejection Failed',
    //                 description: result.message || "Failed to reject outpass.",
    //             });
    //         }
    //     } catch (error) {
    //         toast.dismiss(loadingToastId);
    //         console.error("Error during rejection process:", error);
    //         notification.error({
    //             message: 'Network Error',
    //             description: 'Network or server error while rejecting outpass.',
    //         });
    //     }
    // };

    const handleReject = async (id) => {
        // Step 1: confirm
        const confirmReject = window.confirm("Are you sure you want to reject this initial request?");
        if (!confirmReject) return;

        // Step 2: ask for reason
        const reason = window.prompt(
            "Please enter the reason for rejection (this will be sent in the email to the student):",
            ""
        );

        // optional: if user cancels the prompt, do nothing
        if (reason === null) {
            toast.dismiss();
            return;
        }

        const loadingToastId = toast.loading("Rejecting initial request...");

        try {
            const response = await fetch(`${API_BASE_URL}/outpass-route/outpass/reject/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason }), // ⬅️ send reason to backend
            });

            const result = await response.json();

            if (response.ok) {
                toast.dismiss(loadingToastId);
                notification.info({
                    message: "Outpass Rejected",
                    description: "Outpass successfully rejected and email sent to the student.",
                });
                await fetchOutpassData();
                setCurrentPage(1);
            } else {
                toast.dismiss(loadingToastId);
                notification.error({
                    message: "Rejection Failed",
                    description: result.message || "Failed to reject outpass.",
                });
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            console.error("Error during rejection process:", error);
            notification.error({
                message: "Network Error",
                description: "Network or server error while rejecting outpass.",
            });
        }
    };

    const totalEntries = filteredData.length;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(currentPage * pageSize, totalEntries);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Helper for the "Showing X-Y of Z entries" text (omitted for brevity, assume unchanged)
    const PaginationInfo = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 8, color: '#666' }}>Rows Per Page:</span>
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
            <span style={{ color: '#333', fontWeight: 500, marginLeft: 16 }}>
                {`Showing ${totalEntries === 0 ? 0 : startIndex + 1}-${endIndex} of ${totalEntries} entries`}
            </span>
        </div>
    );
    

    const columns = [
        { title: "Name", dataIndex: "name", key: "name" },
        { title: "Hostel", dataIndex: "hostel", key: "hostel" },
        { title: "Institution", dataIndex: "inst_name", key: "inst_name", render: (text) => <span style={{ color: "dodgerblue", fontWeight: 600 }}>{text}</span> },
        { title: "Course", dataIndex: "course", key: "course" },
        { title: "Purpose", dataIndex: "purpose", key: "purpose" },
        {
            title: "From",
            dataIndex: "date_from",
            render: (_, record) => {
                const date = new Date(record.date_from).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", });
                return `${date}, ${formatTime(record.time_out)}`;
            },
        },
        {
            title: "To",
            dataIndex: "date_to",
            render: (_, record) => {
                const date = new Date(record.date_to).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", });
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
                } else if (status === "Renewed") { // The staff-approved status
                    color = "processing";
                } else {
                    color = "default";
                }
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: "Action",
            render: (_, record) => (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {/* View Button */}
                    <Button icon={<EyeOutlined />} type="link" onClick={() => setSelectedItem(record)}>
                        View
                    </Button>

                    {/* Conditional Rendering based on Status */}
                    {record.status === "Renewal Pending" ? (
                        <>
                            {/* Staff action: Approve Renewal (DIRECT CALL) */}
                            <Button 
                                type="primary" 
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleDirectRenewApprove(record)} 
                                style={{ backgroundColor: '#4b3d82', borderColor: '#4b3d82' }}
                            >
                                Renew
                            </Button>
                            {/* Staff action: Reject Renewal */}
                            <Button danger icon={<CloseCircleOutlined />} onClick={() => handleRejectRenewal(record.id)}>
                                Reject
                            </Button>
                        </>
                    ) : record.status === "Pending" ? (
                        <>
                            {/* Staff action: Initial Accept/Reject */}
                            <Button type="primary" onClick={() => handleAccept(record.id)}>
                                Accept
                            </Button>
                            <Button danger onClick={() => handleReject(record.id)}>
                                Reject
                            </Button>
                        </>
                    ) : (
                        <Tag 
                            color={record.status === "Accepted" ? "success" : record.status === "Rejected" ? "error" : record.status === "Renewed" ? "processing" : "default"}
                            style={{ fontWeight: "600" }}
                        >
                            {record.status.toUpperCase()}
                        </Tag>
                    )}
                </div>
            ),
        }
    ];

    const computeDuration = (record) => {
    if (!record) return "N/A";

    // Normalize dates to YYYY-MM-DD (Day.js can handle Date or string)
    const startDate = dayjs(record.date_from).format("YYYY-MM-DD");
    const endDate = dayjs(record.date_to).format("YYYY-MM-DD");

    // Raw times from DB ("HH:mm" or "HH:mm:ss")
    const startTime = String(record.time_out || "00:00");
    const endTime = String(record.time_in || "00:00");

    const start = dayjs(`${startDate} ${startTime}`);
    const end = dayjs(`${endDate} ${endTime}`);

    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        // Fallback to whatever is in DB if parsing goes weird
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

      // If backend already gives a full data URL:
      if (typeof item.student_image === "string" && item.student_image.startsWith("data:")) {
        return item.student_image;
      }

      const mime = item.image_mimetype || "image/jpeg";

      // student_image here is pure base64 (no "0x", no Buffer, just a string)
      return `data:${mime};base64,${item.student_image}`;
    };
    console.log("image src:", getStudentImageSrc(selectedItem));

    return (
        <div className="outpass-request-container">
            <h2 className="outpass-form-title">Submission&nbsp; Request</h2>

            {/* Filter Panel (Updated) */}
            <div className="outpass-request-filter-panel">
                <Input
                    placeholder="Search name, hostel, purpose..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 250 }}
                    allowClear
                />
                <RangePicker onChange={handleDateChange} style={{ marginLeft: 10 }} allowClear/>
                
                {/* 💡 NEW STATUS SELECT FILTER */}
                <Select
                    value={statusFilter}
                    style={{ width: 180, marginLeft: 10 }}
                    onChange={handleStatusChange}
                    placeholder="Filter by Status"
                    allowClear
                >
                    <Option value="All">All Statuses</Option>
                    <Option value="Pending">Pending</Option>
                    <Option value="Accepted">Accepted</Option>
                    <Option value="Rejected">Rejected</Option>
                    <Option value="Renewal Pending">Renewal Pending</Option>
                    <Option value="Renewed">Renewed</Option>
                </Select>

                <Button
                    icon={<UndoOutlined />}
                    onClick={() => {
                        setSearch("");
                        setDateRange([]);
                        setStatusFilter("All"); // 💡 Reset Status Filter
                        applyFilters(data, "", [], "All"); // Apply resets to filter data
                    }}
                    style={{ marginLeft: 10, color:"red" }}
                >
                    Reset Filters
                </Button>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                        fetchOutpassData(); 
                        toast.success("Updated Data Synced!");
                    }}
                    style={{ marginLeft: 10, color:"dodgerblue" }}
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

            {/* CUSTOM PAGINATION CONTAINER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '10px 0' }}>
                <PaginationInfo /> 
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalEntries}
                    onChange={(page) => setCurrentPage(page)} 
                    showSizeChanger={false}
                />
            </div>
            
            {/* VIEW DETAILS MODAL (Unchanged - uses selectedItem state) */}
            <Modal
              visible={!!selectedItem}
              title={`Outpass Request Details`}
              centered
              onCancel={() => setSelectedItem(null)}
              footer={null}
              width={800}
            >
              {selectedItem && (
                <div style={{ padding: '0 10px' }}>
                  {/* 1. Header and Status */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    {/* Left: Name + Status */}
                    <div>
                      <h3 style={{ margin: 0 }}>
                        <span style={{ color: "dodgerblue" }}>
                          {selectedItem.name} ({selectedItem.hostel_id})
                        </span>

                        <Tag
                          color={
                            selectedItem.status === "Accepted"
                              ? "success"
                              : selectedItem.status === "Rejected"
                              ? "error"
                              : selectedItem.status === "Renewed"
                              ? "processing"
                              : selectedItem.status === "Renewal Pending"
                              ? "warning"
                              : "default"
                          }
                          style={{ marginLeft: 10 }}
                        >
                          {selectedItem.status.toUpperCase()}
                        </Tag>
                      </h3>
                    </div>

                    {/* Right: Student Photo with zoom-on-click */}
                    {getStudentImageSrc(selectedItem) && (
                      <Image
                        src={getStudentImageSrc(selectedItem)}
                        alt={`${selectedItem.name}'s photo`}
                        width={82}
                        height={82}
                        style={{
                          // borderRadius: "50%",
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
                    )}
                  </div>

                  {/* 2. Main Details - Descriptions Component */}
                  <Descriptions bordered column={2} size="small" style={{ marginBottom: 15 }}>
                    <Descriptions.Item label="Hostel/Room">{selectedItem.hostel} / {selectedItem.room_no}</Descriptions.Item>
                    <Descriptions.Item label="Purpose">{selectedItem.purpose}</Descriptions.Item>
                    <Descriptions.Item label="Institution">{selectedItem.inst_name}</Descriptions.Item>
                    <Descriptions.Item label="Course/Year">{selectedItem.course} / {selectedItem.year}</Descriptions.Item>
                    <Descriptions.Item label="Mobile">{selectedItem.mobile}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedItem.mail_id}</Descriptions.Item>
                    <Descriptions.Item label="Destination" span={2}>{selectedItem.address}</Descriptions.Item>
                  </Descriptions>
                  
                  {/* 3. Duration and Timing */}
                  <Descriptions title="Outpass Timing" bordered column={2} size="small" style={{ marginBottom: 15 }}>
                    <Descriptions.Item label="Duration" span={2}>
                      <span style={{ fontWeight: 600, color: 'dodgerblue' }}>{computeDuration(selectedItem)}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Check Out">
                      {new Date(selectedItem.date_from).toLocaleDateString("en-US", { month: "short", day: "numeric" })} 
                      - {formatTime(selectedItem.time_out)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Check In">
                      {new Date(selectedItem.date_to).toLocaleDateString("en-US", { month: "short", day: "numeric" })} 
                      - {formatTime(selectedItem.time_in)}
                    </Descriptions.Item>
                  </Descriptions>

                  {/* 4. Renewal Request Details (New) */}
                  {selectedItem.status === "Renewal Pending" && (
                    <Descriptions title="Renewal Request" bordered column={1} size="small" style={{ marginBottom: 15, borderColor: '#ffc53d' }}>
                      <Descriptions.Item label="Requested Reason">
                        <span style={{ fontWeight: 600 }}>{selectedItem.renewal_reason || 'No specific reason provided.'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Requested Check In">
                        <span style={{ color: 'red', fontWeight: 600 }}>
                          {dayjs(selectedItem.new_date_to).format('MMM D, YYYY')} - {formatTime(selectedItem.new_time_in)}
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                  
                  {/* 5. QR Code and Validity (Conditional) */}
                  {selectedItem.status === "Accepted" && selectedItem.qr_code && (
                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                      <h4 style={{ color: 'green', margin: '0 0 10px' }}>Entry/Exit QR Pass</h4>
                      <img 
                        src={selectedItem.qr_code} 
                        alt="QR Code" 
                        style={{ width: '150px', height: '150px', border: '1px solid #ddd' }} 
                      />
                      {selectedItem.valid_until && <p style={{ color: 'red', marginTop: 10 }}>Valid Until: {new Date(selectedItem.valid_until).toLocaleString()}</p>}
                    </div>
                  )}

                  {/* 6. Metadata */}
                  <p style={{ fontSize: 14, color: '#666', marginTop: 15, borderTop: '1px solid #eee', paddingTop: 10, textAlign: 'center' }}>
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