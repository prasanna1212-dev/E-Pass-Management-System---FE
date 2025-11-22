import React, { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import {
    Card,
    Table,
    Input,
    DatePicker,
    Button,
    Modal,
    Select,
    Checkbox,
    Form,
    Space,
    Tabs,
    Statistic,
    Row,
    Col,
    Tag,
    Divider,
    Typography,
    notification,
    TimePicker,
    InputNumber,
    Radio,
    Tooltip,
    Badge,
    Empty,
    Spin
} from "antd";
import {
    DownloadOutlined,
    MailOutlined,
    FilterOutlined,
    ReloadOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    ScheduleOutlined,
    WarningOutlined,
    UserOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    LineChartOutlined,
    SettingOutlined
} from "@ant-design/icons";
import toast from "react-hot-toast";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

const ReportsSection = () => {
    // Core Data States
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filter States
    const [dateRange, setDateRange] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [permissionFilter, setPermissionFilter] = useState("All");
    const [hostelFilter, setHostelFilter] = useState("All");
    const [violationFilter, setViolationFilter] = useState("All");
    
    // Modal States
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    
    // Form States
    const [exportForm] = Form.useForm();
    const [scheduleForm] = Form.useForm();
    
    // Stats States
    const [statistics, setStatistics] = useState({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        violations: 0,
        lateEntries: 0,
        overdue: 0
    });
    
    // Available Options
    const [hostels, setHostels] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    // Fetch data and calculate statistics
    const fetchReportsData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reports-route/reports/data`);
            if (!res.ok) throw new Error("Failed to fetch reports data");
            
            const result = await res.json();
            const sortedData = [...result].sort((a, b) => 
                dayjs(b.updated_at || b.created_at).valueOf() - dayjs(a.updated_at || a.created_at).valueOf()
            );
            
            setData(sortedData);
            calculateStatistics(sortedData);
            extractHostels(sortedData);
            applyFilters(sortedData);
            
        } catch (error) {
            console.error("Error fetching reports data:", error);
            notification.error({
                message: 'Data Fetch Failed',
                description: 'Unable to load reports data. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate comprehensive statistics
    const calculateStatistics = (records) => {
        const now = dayjs();
        
        const stats = {
            total: records.length,
            pending: records.filter(r => r.status === 'Pending').length,
            accepted: records.filter(r => r.status === 'Accepted').length,
            rejected: records.filter(r => r.status === 'Rejected').length,
            violations: 0,
            lateEntries: 0,
            overdue: 0
        };

        records.forEach(record => {
            // Late entry detection
            if (record.entry_time && record.time_in) {
                const expectedReturn = dayjs(`${record.date_to} ${record.time_in}`);
                const actualReturn = dayjs(record.entry_time);
                if (actualReturn.isAfter(expectedReturn)) {
                    stats.lateEntries++;
                    stats.violations++;
                }
            }

            // Overdue detection (not returned yet but past due time)
            if (record.status === 'Accepted' && !record.entry_time) {
                const expectedReturn = dayjs(`${record.date_to} ${record.time_in}`);
                if (now.isAfter(expectedReturn)) {
                    stats.overdue++;
                    stats.violations++;
                }
            }
        });

        setStatistics(stats);
    };

    // Extract unique hostels for filter
    const extractHostels = (records) => {
        const uniqueHostels = [...new Set(records
            .map(r => r.hostel || r.display_course)
            .filter(Boolean)
        )].sort();
        setHostels(uniqueHostels);
    };

    // Apply filters to data
    const applyFilters = useCallback((currentData = data) => {
        let filtered = [...currentData];

        // Date range filter with robust date handling
        if (dateRange && dateRange.length === 2) {
            const [start, end] = dateRange;
            filtered = filtered.filter(item => {
                try {
                    const dateFrom = dayjs(item.date_from);
                    const dateTo = dayjs(item.date_to);
                    const startDate = dayjs(start);
                    const endDate = dayjs(end);
                    
                    // Check if date_from or date_to falls within the selected range
                    const fromInRange = dateFrom.isBetween(startDate, endDate, 'day', '[]');
                    const toInRange = dateTo.isBetween(startDate, endDate, 'day', '[]');
                    
                    // Also check if the selected range overlaps with the item's date range
                    const overlaps = dateFrom.isSameOrBefore(endDate) && dateTo.isSameOrAfter(startDate);
                    
                    return fromInRange || toInRange || overlaps;
                } catch (error) {
                    console.warn('Date filtering error:', error);
                    return true; // Include item if date parsing fails
                }
            });
        }

        // Status filter
        if (statusFilter !== "All") {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        // Permission type filter
        if (permissionFilter !== "All") {
            filtered = filtered.filter(item => item.permission === permissionFilter);
        }

        // Hostel filter
        if (hostelFilter !== "All") {
            filtered = filtered.filter(item => 
                (item.hostel || item.display_course) === hostelFilter
            );
        }

        // Violation filter with enhanced logic
        if (violationFilter !== "All") {
            const now = dayjs();
            filtered = filtered.filter(item => {
                let hasViolation = false;

                try {
                    // Late entry check
                    if (item.entry_time && item.time_in) {
                        const expectedReturn = dayjs(`${item.date_to} ${item.time_in}`);
                        const actualReturn = dayjs(item.entry_time);
                        if (actualReturn.isValid() && expectedReturn.isValid() && actualReturn.isAfter(expectedReturn)) {
                            hasViolation = true;
                        }
                    }

                    // Overdue check
                    if (item.status === 'Accepted' && !item.entry_time) {
                        const expectedReturn = dayjs(`${item.date_to} ${item.time_in}`);
                        if (expectedReturn.isValid() && now.isAfter(expectedReturn)) {
                            hasViolation = true;
                        }
                    }
                } catch (error) {
                    console.warn('Violation check error:', error);
                }

                return violationFilter === "Violations" ? hasViolation : !hasViolation;
            });
        }

        setFilteredData(filtered);
        calculateStatistics(filtered);
    }, [dateRange, statusFilter, permissionFilter, hostelFilter, violationFilter, data]);

    useEffect(() => {
        fetchReportsData();
    }, [fetchReportsData]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Reset all filters
    const resetFilters = () => {
        setDateRange([]);
        setStatusFilter("All");
        setPermissionFilter("All");
        setHostelFilter("All");
        setViolationFilter("All");
        applyFilters(data);
        toast.success("Filters reset successfully");
    };

    // Violation status renderer
    const getViolationStatus = (record) => {
        const now = dayjs();
        let violations = [];

        // Late entry
        if (record.entry_time && record.time_in) {
            const expectedReturn = dayjs(`${record.date_to} ${record.time_in}`);
            const actualReturn = dayjs(record.entry_time);
            if (actualReturn.isAfter(expectedReturn)) {
                const lateDuration = actualReturn.diff(expectedReturn, 'hour', true);
                violations.push(`Late by ${Math.round(lateDuration)}h`);
            }
        }

        // Overdue
        if (record.status === 'Accepted' && !record.entry_time) {
            const expectedReturn = dayjs(`${record.date_to} ${record.time_in}`);
            if (now.isAfter(expectedReturn)) {
                const overdueDuration = now.diff(expectedReturn, 'hour', true);
                violations.push(`Overdue by ${Math.round(overdueDuration)}h`);
            }
        }

        if (violations.length === 0) {
            return <Tag color="success" icon={<CheckCircleOutlined />}>Clean</Tag>;
        }

        return violations.map((violation, index) => (
            <Tag key={index} color="error" icon={<WarningOutlined />}>
                {violation}
            </Tag>
        ));
    };

    // Table columns
    const columns = [
        {
            title: "Student Details",
            key: "student",
            width: 200,
            render: (_, record) => (
                <div>
                    <Text strong style={{ color: '#1890ff' }}>{record.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.display_id} • {record.hostel || record.display_course}
                    </Text>
                    <br />
                    <Tag size="small" color={record.permission === 'leave' ? 'blue' : 'green'}>
                        {record.permission === 'leave' ? 'Leave' : 'Outpass'}
                    </Tag>
                </div>
            )
        },
        {
            title: "Duration & Purpose",
            key: "details",
            width: 250,
            render: (_, record) => (
                <div>
                    <Text strong>{record.purpose}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(record.date_from).format('MMM D')} - {dayjs(record.date_to).format('MMM D, YYYY')}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {record.destination}
                    </Text>
                </div>
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => {
                const colors = {
                    'Pending': 'processing',
                    'Accepted': 'success',
                    'Rejected': 'error',
                    'Renewed': 'cyan',
                    'Completed': 'purple'
                };
                return <Tag color={colors[status] || 'default'}>{status}</Tag>;
            }
        },
        {
            title: "Violation Status",
            key: "violations",
            width: 200,
            render: (_, record) => getViolationStatus(record)
        },
        {
            title: "Timestamps",
            key: "timestamps",
            width: 180,
            render: (_, record) => (
                <div style={{ fontSize: '11px' }}>
                    <div>
                        <Text type="secondary">Out: </Text>
                        {record.exit_time ? (
                            <Text style={{ color: '#52c41a' }}>
                                {dayjs(record.exit_time).format('MMM D, HH:mm')}
                            </Text>
                        ) : (
                            <Text type="secondary">Not yet</Text>
                        )}
                    </div>
                    <div>
                        <Text type="secondary">In: </Text>
                        {record.entry_time ? (
                            <Text style={{ color: '#1890ff' }}>
                                {dayjs(record.entry_time).format('MMM D, HH:mm')}
                            </Text>
                        ) : (
                            <Text type="secondary">Not yet</Text>
                        )}
                    </div>
                </div>
            )
        }
    ];

    // Handle export
    const handleExport = async () => {
        try {
            const values = await exportForm.validateFields();
            setExportLoading(true);
            
            const exportData = {
                data: filteredData,
                filters: {
                    dateRange,
                    statusFilter,
                    permissionFilter,
                    hostelFilter,
                    violationFilter
                },
                reportType: values.reportType,
                format: values.format,
                includeViolations: values.includeViolations
            };

            const endpoint = values.reportType === 'violations' 
                ? '/reports-route/reports/export-violations'
                : '/reports-route/reports/export-full';

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exportData)
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${values.reportType}_report_${dayjs().format('YYYY-MM-DD')}.${values.format}`;
            a.click();
            window.URL.revokeObjectURL(url);

            notification.success({
                message: 'Export Successful',
                description: `${values.reportType} report downloaded successfully.`
            });

            setExportModalVisible(false);
            exportForm.resetFields();

        } catch (error) {
            console.error('Export error:', error);
            notification.error({
                message: 'Export Failed',
                description: 'Failed to generate report. Please try again.'
            });
        } finally {
            setExportLoading(false);
        }
    };

    // Handle schedule setup with proper data formatting
    const handleScheduleSetup = async () => {
        try {
            const values = await scheduleForm.validateFields();
            
            // Debug: Log the form values to see what we're getting
            console.log('Form values:', values);
            
            setScheduleLoading(true);

            // Format the data properly for backend validation
            const scheduleData = {
                frequency: values.frequency,
                time: values.time ? dayjs(values.time).format('HH:mm') : '09:00', // Convert dayjs to string
                reportType: values.reportType && values.reportType.length > 0 ? values.reportType : ['full'], // Ensure array
                toEmails: values.toEmails && values.toEmails.length > 0 ? values.toEmails : [], // Ensure array
                ccEmails: values.ccEmails || [], // Default to empty array
                message: values.message || '', // Default to empty string
                filters: {
                    dateRange,
                    statusFilter,
                    permissionFilter,
                    hostelFilter,
                    violationFilter
                }
            };

            // Additional validation before sending
            if (!scheduleData.toEmails || scheduleData.toEmails.length === 0) {
                notification.error({
                    message: 'Validation Error',
                    description: 'Please add at least one email recipient.'
                });
                return;
            }

            if (!scheduleData.reportType || scheduleData.reportType.length === 0) {
                notification.error({
                    message: 'Validation Error', 
                    description: 'Please select at least one report type.'
                });
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = [...scheduleData.toEmails, ...scheduleData.ccEmails]
                .filter(email => email && !emailRegex.test(email));
            
            if (invalidEmails.length > 0) {
                notification.error({
                    message: 'Invalid Email Format',
                    description: `Please fix these email addresses: ${invalidEmails.join(', ')}`
                });
                return;
            }

            console.log('Sending schedule data:', scheduleData);

            const response = await fetch(`${API_BASE_URL}/reports-route/reports/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
            });

            // Get response details for better error handling
            const responseText = await response.text();
            
            if (!response.ok) {
                console.error('Schedule API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    response: responseText
                });
                
                let errorMessage = 'Failed to set up email schedule.';
                
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.log('Could not parse error response as JSON');
                }
                
                throw new Error(`${response.status}: ${errorMessage}`);
            }

            // Parse successful response
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                result = { message: 'Schedule created successfully' };
            }

            notification.success({
                message: 'Schedule Created Successfully!',
                description: `${values.frequency.charAt(0).toUpperCase() + values.frequency.slice(1)} email reports have been scheduled.`,
                duration: 4.5
            });

            setScheduleModalVisible(false);
            scheduleForm.resetFields();

        } catch (error) {
            console.error('Schedule setup error:', error);
            
            let errorMessage = 'Failed to set up email schedule. Please try again.';
            
            if (error.message.includes('400')) {
                errorMessage = 'Invalid request data. Please check all required fields are filled correctly.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error. Please contact your administrator.';
            }
            
            notification.error({
                message: 'Schedule Setup Failed',
                description: errorMessage,
                duration: 6
            });
        } finally {
            setScheduleLoading(false);
        }
    };

    return (
        <div style={{ padding: 0, width: '100%' }}>
            <div style={{ width: '100%' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
                        <LineChartOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                        Reports & Analytics
                    </Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                        Comprehensive outpass and leave reports with automated insights
                    </Text>
                </div>

                {/* Statistics Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Total Requests"
                                value={statistics.total}
                                valueStyle={{ color: '#1890ff' }}
                                prefix={<UserOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Pending"
                                value={statistics.pending}
                                valueStyle={{ color: '#faad14' }}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Violations"
                                value={statistics.violations}
                                valueStyle={{ color: '#ff4d4f' }}
                                prefix={<WarningOutlined />}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                Late: {statistics.lateEntries} • Overdue: {statistics.overdue}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Success Rate"
                                value={statistics.total > 0 ? 
                                    Math.round(((statistics.total - statistics.violations) / statistics.total) * 100) : 0}
                                suffix="%"
                                valueStyle={{ 
                                    color: statistics.violations / statistics.total < 0.1 ? '#52c41a' : '#faad14' 
                                }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Filters & Actions */}
                <Card style={{ marginBottom: '24px' }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={6}>
                            <RangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                style={{ width: '100%' }}
                                placeholder={['Start Date', 'End Date']}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                value={statusFilter}
                                onChange={setStatusFilter}
                                style={{ width: '100%' }}
                                placeholder="Status"
                            >
                                <Option value="All">All Status</Option>
                                <Option value="Pending">Pending</Option>
                                <Option value="Accepted">Accepted</Option>
                                <Option value="Rejected">Rejected</Option>
                                <Option value="Completed">Completed</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                value={permissionFilter}
                                onChange={setPermissionFilter}
                                style={{ width: '100%' }}
                                placeholder="Type"
                            >
                                <Option value="All">All Types</Option>
                                <Option value="permission">Outpass</Option>
                                <Option value="leave">Leave</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                value={violationFilter}
                                onChange={setViolationFilter}
                                style={{ width: '100%' }}
                                placeholder="Violations"
                            >
                                <Option value="All">All Records</Option>
                                <Option value="Violations">Only Violations</Option>
                                <Option value="Clean">Clean Records</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={24} md={6} style={{ display: "flex", justifyContent: "flex-end" }}>
                            <Space wrap>
                                <Button 
                                    icon={<FilterOutlined />} 
                                    onClick={resetFilters}
                                    type="default"
                                >
                                    Reset
                                </Button>
                                <Button 
                                    icon={<ReloadOutlined />} 
                                    onClick={fetchReportsData}
                                    type="default"
                                >
                                    Refresh
                                </Button>
                                <Button 
                                    icon={<DownloadOutlined />} 
                                    onClick={() => setExportModalVisible(true)}
                                    type="primary"
                                >
                                    Export
                                </Button>
                                <Button 
                                    icon={<ScheduleOutlined />} 
                                    onClick={() => setScheduleModalVisible(true)}
                                    type="primary"
                                    style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                                >
                                    Schedule
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Data Table */}
                <Card>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={4} style={{ margin: 0 }}>
                            Reports Data
                            <Badge count={filteredData.length} style={{ marginLeft: '8px' }} />
                        </Title>
                        <Text type="secondary">
                            Showing {filteredData.length} of {data.length} records
                        </Text>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 50,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => 
                                `${range[0]}-${range[1]} of ${total} records`
                        }}
                        scroll={{ x: 1000 }}
                        size="small"
                    />
                </Card>

                {/* Export Modal */}
                <Modal
                    title={
                        <span>
                            <DownloadOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            Export Reports
                        </span>
                    }
                    open={exportModalVisible}
                    onCancel={() => setExportModalVisible(false)}
                    onOk={handleExport}
                    confirmLoading={exportLoading}
                    width={600}
                    okText="Generate & Download"
                    cancelText="Cancel"
                >
                    <Form form={exportForm} layout="vertical" initialValues={{ 
                        reportType: 'full', 
                        format: 'excel',
                        includeViolations: true
                    }}>
                        <Form.Item
                            label="Report Type"
                            name="reportType"
                            rules={[{ required: true, message: 'Please select report type' }]}
                        >
                            <Radio.Group>
                                <Radio.Button value="full">
                                    <FileExcelOutlined style={{ marginRight: '4px' }} />
                                    Full Report
                                </Radio.Button>
                                <Radio.Button value="violations">
                                    <WarningOutlined style={{ marginRight: '4px' }} />
                                    Violations Only
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item
                            label="Export Format"
                            name="format"
                            rules={[{ required: true, message: 'Please select format' }]}
                        >
                            <Radio.Group>
                                <Radio.Button value="excel">
                                    <FileExcelOutlined style={{ marginRight: '4px' }} />
                                    Excel (.xlsx)
                                </Radio.Button>
                                <Radio.Button value="pdf">
                                    <FilePdfOutlined style={{ marginRight: '4px' }} />
                                    PDF Document
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item name="includeViolations" valuePropName="checked">
                            <Checkbox>Include detailed violation analysis</Checkbox>
                        </Form.Item>

                        <div style={{ 
                            backgroundColor: '#f6f6f6', 
                            padding: '12px', 
                            borderRadius: '6px',
                            borderLeft: '3px solid #1890ff' 
                        }}>
                            <Text strong style={{ color: '#1890ff' }}>Applied Filters:</Text>
                            <div style={{ marginTop: '8px', fontSize: '13px' }}>
                                <div>📅 Date Range: {dateRange?.length ? 
                                    `${dayjs(dateRange[0]).format('MMM D')} - ${dayjs(dateRange[1]).format('MMM D, YYYY')}` : 
                                    'All Dates'}</div>
                                <div>📊 Status: {statusFilter}</div>
                                <div>📋 Type: {permissionFilter}</div>
                                <div>⚠️ Violations: {violationFilter}</div>
                                <div>📍 Records: {filteredData.length} entries</div>
                            </div>
                        </div>
                    </Form>
                </Modal>

                {/* Schedule Modal */}
                <Modal
                    title={
                        <span>
                            <ScheduleOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                            Schedule Email Reports
                        </span>
                    }
                    open={scheduleModalVisible}
                    onCancel={() => setScheduleModalVisible(false)}
                    onOk={handleScheduleSetup}
                    confirmLoading={scheduleLoading}
                    width={700}
                    okText="Create Schedule"
                    cancelText="Cancel"
                >
                    <Form 
                        form={scheduleForm} 
                        layout="vertical" 
                        initialValues={{ 
                            frequency: 'weekly',
                            time: dayjs('09:00', 'HH:mm'),
                            reportType: ['full'],
                            toEmails: [],
                            ccEmails: [],
                            message: ''
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Frequency"
                                    name="frequency"
                                    rules={[{ required: true, message: 'Please select frequency' }]}
                                >
                                    <Select placeholder="Select frequency">
                                        <Option value="daily">Daily</Option>
                                        <Option value="weekly">Weekly</Option>
                                        <Option value="monthly">Monthly</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Delivery Time"
                                    name="time"
                                    rules={[{ required: true, message: 'Please select delivery time' }]}
                                >
                                    <TimePicker 
                                        format="HH:mm" 
                                        style={{ width: '100%' }}
                                        placeholder="Select time"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Report Types to Include"
                            name="reportType"
                            rules={[{ required: true, message: 'Please select at least one report type' }]}
                        >
                            <Checkbox.Group>
                                <Row>
                                    <Col span={12}>
                                        <Checkbox value="full">Full Report</Checkbox>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox value="violations">Violations Report</Checkbox>
                                    </Col>
                                </Row>
                            </Checkbox.Group>
                        </Form.Item>

                        <Form.Item
                            label={
                                <span>
                                    Email Recipients (TO) <span style={{ color: 'red' }}>*</span>
                                </span>
                            }
                            name="toEmails"
                            rules={[
                                { required: true, message: 'Please add at least one recipient' },
                                {
                                    validator: (_, value) => {
                                        if (!value || value.length === 0) {
                                            return Promise.reject('At least one email is required');
                                        }
                                        
                                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                        const invalidEmails = value.filter(email => !emailRegex.test(email));
                                        
                                        if (invalidEmails.length > 0) {
                                            return Promise.reject(`Invalid email format: ${invalidEmails.join(', ')}`);
                                        }
                                        
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Select
                                mode="tags"
                                placeholder="Enter email addresses (press Enter or comma to add)"
                                tokenSeparators={[',', ' ']}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>

                        <Form.Item
                            label="CC Recipients (Optional)"
                            name="ccEmails"
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (!value || value.length === 0) {
                                            return Promise.resolve();
                                        }
                                        
                                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                        const invalidEmails = value.filter(email => !emailRegex.test(email));
                                        
                                        if (invalidEmails.length > 0) {
                                            return Promise.reject(`Invalid email format: ${invalidEmails.join(', ')}`);
                                        }
                                        
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Select
                                mode="tags"
                                placeholder="Enter CC email addresses (optional)"
                                tokenSeparators={[',', ' ']}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Custom Message (Optional)"
                            name="message"
                        >
                            <TextArea 
                                rows={3} 
                                placeholder="Add a custom message to include in the email..."
                                showCount
                                maxLength={500}
                            />
                        </Form.Item>

                        <div style={{ 
                            backgroundColor: '#f0f9ff', 
                            padding: '12px', 
                            borderRadius: '6px',
                            borderLeft: '3px solid #722ed1',
                            marginTop: '16px'
                        }}>
                            <Text strong style={{ color: '#722ed1' }}>Preview:</Text>
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                📧 Recipients will receive automated reports based on your schedule<br/>
                                📊 Reports will include data filtered by your current settings<br/>
                                ⏰ You can modify or cancel schedules anytime
                            </div>
                        </div>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default ReportsSection;