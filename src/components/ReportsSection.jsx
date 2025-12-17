import React, { useEffect, useState, useCallback, useMemo } from "react";
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
    Statistic,
    Row,
    Col,
    Tag,
    Typography,
    notification,
    TimePicker,
    Radio,
    Tooltip,
    Badge,
    Spin,
    Tabs,
    Popconfirm,
    Divider,
    Alert,
    List,
    Empty,
    Switch,
    Collapse,
    Descriptions,
    Steps
} from "antd";
import {
    DownloadOutlined,
    FilterOutlined,
    ReloadOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    ScheduleOutlined,
    WarningOutlined,
    UserOutlined,
    CheckCircleOutlined,
    LineChartOutlined,
    SendOutlined,
    ThunderboltOutlined,
    UndoOutlined,
    FileTextOutlined,
    DeleteOutlined,
    EyeOutlined,
    CalendarOutlined,
    // ClockCircleOutlined,
    MailOutlined,
    StopOutlined,
    // PlayCircleOutlined,
    SettingOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    FireOutlined,
    MoonOutlined,
    ClockCircleFilled,
    CheckSquareOutlined,
    UnorderedListOutlined,
    SelectOutlined,
    ClearOutlined,
    TableOutlined
} from "@ant-design/icons";
import toast from "react-hot-toast";
import { 
    SearchOutlined,
//     WarningOutlined,
//     CheckCircleOutlined,
//     FireOutlined,
    ClockCircleOutlined,
//     ThunderboltOutlined,
    HourglassOutlined,
//     MoonOutlined,
//     CalendarOutlined,
//     StopOutlined,
    PlayCircleOutlined
} from "@ant-design/icons";
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const POLLING_INTERVAL = 300000;

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);
const animationStyles = `


/* Color variations */
.icon-danger { color: #ff4d4f; }
.icon-warning { color: #ff7a00; }
.icon-success { color: #52c41a; }
.icon-info { color: #1890ff; }
.icon-purple { color: #722ed1; }
.icon-orange { color: #faad14; }
`;

// 🎨 Animated Icon Component
const AnimatedIcon = ({ 
    icon: Icon, 
    animation = 'pulse', 
    color = 'icon-info',
    size = 16,
    className = '',
    style = {} 
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <span 
            className={`animated-icon icon-${animation} ${color} ${className}`}
            style={{
                fontSize: `${size}px`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${size + 4}px`,
                height: `${size + 4}px`,
                ...style
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Icon style={{ 
                fontSize: `${size}px`,
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease'
            }} />
        </span>
    );
};

const violationIcons = {
    all: { icon: SearchOutlined, animation: 'pulse', color: 'icon-info' },
    violations: { icon: WarningOutlined, animation: 'shake', color: 'icon-danger' },
    clean: { icon: CheckCircleOutlined, animation: 'pulse', color: 'icon-success' },
    
    leaveCritical: { icon: FireOutlined, animation: 'glow', color: 'icon-danger' },
    leaveLate: { icon: ClockCircleOutlined, animation: 'bounce', color: 'icon-warning' },
    
    outpassCritical: { icon: ThunderboltOutlined, animation: 'shake', color: 'icon-danger' },
    outpassExtended: { icon: HourglassOutlined, animation: 'rotate', color: 'icon-warning' },
    outpassDuration: { icon: ClockCircleOutlined, animation: 'pulse', color: 'icon-orange' },
    
    afterHours: { icon: MoonOutlined, animation: 'glow', color: 'icon-purple' },
    overdue: { icon: CalendarOutlined, animation: 'shake', color: 'icon-danger' },
    expired: { icon: StopOutlined, animation: 'pulse', color: 'icon-danger' },
    completed: { icon: PlayCircleOutlined, animation: 'bounce', color: 'icon-success' }
};
const ViolationIcon = ({ type, size = 16, className = '' }) => {
    const config = violationIcons[type] || violationIcons.all;
    
    return (
        <AnimatedIcon
            icon={config.icon}
            animation={config.animation}
            color={config.color}
            size={size}
            className={className}
        />
    );
};
const EnhancedViolationSelect = ({ 
    value, 
    onChange, 
    statistics, 
    style = { width: 240 } 
}) => {
    useEffect(() => {
        // Inject styles
        const styleElement = document.createElement('style');
        styleElement.textContent = animationStyles;
        document.head.appendChild(styleElement);
        
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    return (
        <Select
            value={value}
            onChange={onChange}
            style={style}
            placeholder="Select Violation Filter"
            showSearch
            optionFilterProp="label"
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            dropdownRender={(menu) => (
                <div>
                    {/* Enhanced Header with Animated Stats */}
                    <div style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: 'linear-gradient(90deg, #f0f9ff 0%, #e6f7ff 100%)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <ViolationIcon type="violations" size={14} />
                        <span>
                            <strong>Violations:</strong> {statistics.violations} | 
                            <strong> Clean:</strong> {statistics.total - statistics.violations}
                        </span>
                    </div>
                    {menu}
                </div>
            )}
        >
            {/* 🎨 MAIN CATEGORIES - With Animated Icons */}
            <Option value="All" label="All Records">
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '2px 0'
                }}>
                    <ViolationIcon type="all" />
                    <span>All Records</span>
                    <span style={{ 
                        marginLeft: 'auto', 
                        color: '#999', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        
                    }}>
                        ({statistics.total})
                    </span>
                </div>
            </Option>
            
            <Option value="Violations" label="Any Violations">
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '2px 0'
                }}>
                    <ViolationIcon type="violations" />
                    <span style={{ color: '#ff4d4f', fontWeight: '500' }}>Any Violations</span>
                    <span style={{ 
                        marginLeft: 'auto', 
                        color: '#ff4d4f', 
                        fontSize: '11px',
                        fontWeight: 'bold'
                    }}>
                        ({statistics.violations})
                    </span>
                </div>
            </Option>
            
            <Option value="Clean" label="Clean Records">
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '2px 0'
                }}>
                    <ViolationIcon type="clean" />
                    <span style={{ color: '#52c41a', fontWeight: '500' }}>Clean Records</span>
                    <span style={{ 
                        marginLeft: 'auto', 
                        color: '#52c41a', 
                        fontSize: '11px',
                        fontWeight: 'bold'
                    }}>
                        ({statistics.total - statistics.violations})
                    </span>
                </div>
            </Option>
            
            {/* Elegant Divider */}
            <Option disabled style={{ height: '1px', padding: 0, margin: '8px 0' }}>
                <div style={{ 
                    height: '1px', 
                    background: 'linear-gradient(90deg, transparent, #d9d9d9, transparent)' 
                }}></div>
            </Option>

            {/* 🎨 LEAVE VIOLATIONS - Enhanced with Animations */}
            <Option value="LeaveCritical" label="Leave Critical">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 0',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ViolationIcon type="leaveCritical" />
                        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                            Leave Critical
                        </span>
                    </div>
                    <span style={{ 
                        color: '#ff4d4f', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: '#fff1f0',
                        padding: '2px 6px',
                        borderRadius: '10px'
                    }}>
                        {statistics.leaveCriticalViolations}
                    </span>
                </div>
            </Option>
            
            <Option value="LeaveLate" label="Leave Late">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ViolationIcon type="leaveLate" />
                        <span style={{ color: '#ff7a00', fontWeight: '500' }}>
                            Leave Late Returns
                        </span>
                    </div>
                    <span style={{ 
                        color: '#ff7a00', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: '#fff7e6',
                        padding: '2px 6px',
                        borderRadius: '10px'
                    }}>
                        {statistics.leaveLateReturns}
                    </span>
                </div>
            </Option>

            {/* 🎨 OUTPASS VIOLATIONS - Enhanced with Animations */}
            <Option value="OutpassCritical" label="Outpass Critical">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ViolationIcon type="outpassCritical" />
                        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                            Outpass Critical
                        </span>
                    </div>
                    <span style={{ 
                        color: '#ff4d4f', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: '#fff1f0',
                        padding: '2px 6px',
                        borderRadius: '10px'
                    }}>
                        {statistics.outpassCritical}
                    </span>
                </div>
            </Option>
            
            <Option value="OutpassExtended" label="Outpass Extended">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ViolationIcon type="outpassExtended" />
                        <span style={{ color: '#ff7a00', fontWeight: '500' }}>
                            Outpass Extended
                        </span>
                    </div>
                    <span style={{ 
                        color: '#ff7a00', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: '#fff7e6',
                        padding: '2px 6px',
                        borderRadius: '10px'
                    }}>
                        {statistics.outpassExtended}
                    </span>
                </div>
            </Option>
            
            <Option value="OutpassDuration" label="Outpass Duration">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ViolationIcon type="outpassDuration" />
                        <span style={{ color: '#faad14', fontWeight: '500' }}>
                            Duration Exceeded
                        </span>
                    </div>
                    <span style={{ 
                        color: '#faad14', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: '#fffbe6',
                        padding: '2px 6px',
                        borderRadius: '10px'
                    }}>
                        {statistics.outpassDurationExceeded}
                    </span>
                </div>
            </Option>

            {/* 🎨 STATUS & TIMING - Enhanced with Animations */}
            <Option value="AfterHours" label="After Hours">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ViolationIcon type="afterHours" />
                        <span style={{ color: '#722ed1', fontWeight: '500' }}>After Hours Returns</span>
                    </div>
                    <span style={{ 
                        color: '#722ed1', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: '#f9f0ff',
                        padding: '2px 6px',
                        borderRadius: '10px'
                    }}>
                        {statistics.outpassAfterHours}
                    </span>
                </div>
            </Option>
            
            <Option value="Overdue" label="Overdue">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ViolationIcon type="overdue" />
                        <span style={{ color: '#ff4d4f', fontWeight: '500' }}>Currently Overdue</span>
                    </div>
                    <span style={{ 
                        color: '#ff4d4f', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: '#fff1f0',
                        padding: '2px 6px',
                        borderRadius: '10px'
                    }}>
                        {statistics.overdue}
                    </span>
                </div>
            </Option>
            
            <Option value="Expired" label="Expired">
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '4px 0'
                }}>
                    <ViolationIcon type="expired" />
                    <span style={{ color: '#ff4d4f', fontWeight: '500' }}>Expired (Past Due Date)</span>
                </div>
            </Option>
            
            <Option value="Completed" label="Completed">
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '4px 0'
                }}>
                    <ViolationIcon type="completed" />
                    <span style={{ color: '#52c41a', fontWeight: '500' }}>Completed Returns</span>
                </div>
            </Option>
        </Select>
    );
};

const AnimatedFilterButtons = ({ violationFilter, setViolationFilter, statistics }) => {
    return (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
                size="small"
                type={violationFilter === "LeaveCritical" ? "primary" : "default"}
                danger={violationFilter === "LeaveCritical"}
                onClick={() => setViolationFilter("LeaveCritical")}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    borderRadius: '16px',
                    fontWeight: '500'
                }}
            >
                <ViolationIcon type="leaveCritical" size={14} />
                Leave Critical ({statistics.leaveCriticalViolations})
            </Button>
            
            <Button
                size="small"
                type={violationFilter === "OutpassCritical" ? "primary" : "default"}
                danger={violationFilter === "OutpassCritical"}
                onClick={() => setViolationFilter("OutpassCritical")}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    borderRadius: '16px',
                    fontWeight: '500'
                }}
            >
                <ViolationIcon type="outpassCritical" size={14} />
                Outpass Critical ({statistics.outpassCritical})
            </Button>
            
            <Button
                size="small"
                type={violationFilter === "Clean" ? "primary" : "default"}
                onClick={() => setViolationFilter("Clean")}
                style={{
                    backgroundColor: violationFilter === "Clean" ? "#52c41a" : undefined,
                    borderColor: violationFilter === "Clean" ? "#52c41a" : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    borderRadius: '16px',
                    fontWeight: '500'
                }}
            >
                <ViolationIcon type="clean" size={14} />
                Clean Records
            </Button>
            
            {/* Add more buttons as needed... */}
        </div>
    );
};
const ReportsSection = () => {
    // Core Data States
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🆕 NEW: Row Selection States
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);

    // Filter States
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [permissionFilter, setPermissionFilter] = useState("All");
    const [hostelFilter, setHostelFilter] = useState("All");
    const [violationFilter, setViolationFilter] = useState("All");

    // Modal States
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [immediateEmailModalVisible, setImmediateEmailModalVisible] = useState(false);
    const [scheduleManagementVisible, setScheduleManagementVisible] = useState(false);
    const [scheduleDetailsVisible, setScheduleDetailsVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    // 🆕 NEW: Preview Modal States
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [previewConfig, setPreviewConfig] = useState({});

    // Form States
    const [exportForm] = Form.useForm();
    const [scheduleForm] = Form.useForm();
    const [immediateEmailForm] = Form.useForm();

    // Loading States
    const [exportLoading, setExportLoading] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [immediateEmailLoading, setImmediateEmailLoading] = useState(false);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [cancelScheduleLoading, setCancelScheduleLoading] = useState(false);

    // Other States
    const [schedules, setSchedules] = useState([]);
    const [activeTab, setActiveTab] = useState('reports');
    const [statistics, setStatistics] = useState({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        violations: 0,
        lateEntries: 0,
        overdue: 0,
        leaveLateReturns: 0,
        leaveCriticalViolations: 0,
        outpassDurationExceeded: 0,
        outpassExtended: 0,
        outpassAfterHours: 0,
        outpassCritical: 0
    });
    const [hostels, setHostels] = useState([]);

    // Schedule form states
    const [repeatType, setRepeatType] = useState("weekly");
    const [repeatInterval, setRepeatInterval] = useState(1);
    const [selectedWeekdays, setSelectedWeekdays] = useState([1, 2, 3, 4, 5]);
    const [monthlyDay, setMonthlyDay] = useState(1);
    const [endsType, setEndsType] = useState("never");
    const [endDate, setEndDate] = useState("");
    const [occurrenceCount, setOccurrenceCount] = useState(10);

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    const WEEKDAYS = [
        { key: 1, label: "Mon" },
        { key: 2, label: "Tue" },
        { key: 3, label: "Wed" },
        { key: 4, label: "Thu" },
        { key: 5, label: "Fri" },
        { key: 6, label: "Sat" },
        { key: 0, label: "Sun" },
    ];

    const [escalationUsers, setEscalationUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersFetched, setUsersFetched] = useState(false);

    // Existing helper functions (keeping all violation analysis logic)
    const violationCache = new Map();

  const formatDuration = (hours) => {
    // Handle very small durations (less than 1 minute)
    if (hours < (1/60)) {
        return '< 1m';
    }
    
    // 🆕 NEW: Handle sub-hour durations by showing exact minutes (no rounding)
    if (hours < 1) {
        const minutes = Math.floor(hours * 60);
        if (minutes === 0) {
            return '< 1m';
        }
        return `${minutes}m`;
    }
    
    // 🔧 EXACT: Handle 1-23 hours with exact minutes (no rounding)
    if (hours < 24) {
        const wholeHours = Math.floor(hours);
        const exactMinutes = Math.floor((hours - wholeHours) * 60);
        
        if (exactMinutes === 0) {
            return `${wholeHours}h`;
        } else {
            return `${wholeHours}h ${exactMinutes}m`;
        }
    }

    // Handle 24+ hours with exact calculation (no rounding)
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const remainingMinutes = Math.floor(((hours % 24) - remainingHours) * 60);

    if (remainingHours === 0 && remainingMinutes === 0) {
        return `${days}d`;
    } else if (remainingMinutes === 0) {
        return `${days}d ${remainingHours}h`;
    } else {
        return `${days}d ${remainingHours}h ${remainingMinutes}m`;
    }
};


    const determineRecordStatus = (record) => {
        const now = dayjs();
        let expectedReturn;

        if (record.expected_return_datetime) {
            expectedReturn = dayjs(record.expected_return_datetime);
        } else if (record.date_to && record.time_in) {
            const dateStr = record.date_to.includes('T') ?
                record.date_to.split('T')[0] : record.date_to;
            expectedReturn = dayjs(`${dateStr} ${record.time_in}`);
        }

        if (!expectedReturn || !expectedReturn.isValid()) {
            return record.status;
        }

        const isExpired = now.isAfter(expectedReturn);

        if (record.entry_time) {
            return "Completed";
        } else if (isExpired && record.status === 'Accepted') {
            return "Expired";
        }

        return record.status;
    };

    const analyzeViolations = useCallback((record) => {
        const cacheKey = `${record.id}_${record.entry_time}_${record.expected_return_datetime}_${record.permission}`;
        if (violationCache.has(cacheKey)) {
            return violationCache.get(cacheKey);
        }

        const now = dayjs();
        const violations = {
            isLate: false,
            isOverdue: false,
            isExtended: false,
            isAfterHours: false,
            isCritical: false,
            lateDuration: 0,
            overdueDuration: 0,
            violationType: null,
            permissionType: 'unknown',
            exceedDuration: 0,
            daysLate: 0,
            returnTime: null,
            expectedReturn: null,
            dataSource: record.request_type || 'unknown',
            lateDurationFormatted: '',
            exceedDurationFormatted: '',
            overdueDurationFormatted: '',
            calculatedStatus: record.status,
            isExpired: false
        };

        try {
            const permissionType = (record.permission || '').toLowerCase();
            const requestType = (record.request_type || '').toLowerCase();

            violations.permissionType =
                permissionType === 'leave' || requestType === 'leave' ? 'leave' :
                    permissionType === 'permission' || permissionType === 'outpass' || requestType === 'outpass' ? 'outpass' :
                        'unknown';

            let expectedReturn;
            if (record.expected_return_datetime) {
                expectedReturn = dayjs(record.expected_return_datetime);
            } else if (record.date_to && record.time_in) {
                const dateStr = record.date_to.includes('T') ?
                    record.date_to.split('T')[0] : record.date_to;
                expectedReturn = dayjs(`${dateStr} ${record.time_in}`);
            }

            if (expectedReturn && expectedReturn.isValid()) {
                violations.expectedReturn = expectedReturn;
                violations.isExpired = now.isAfter(expectedReturn);
                violations.calculatedStatus = determineRecordStatus(record);

                if (violations.isExpired && !record.entry_time) {
                    violations.isOverdue = true;
                    violations.overdueDuration = now.diff(expectedReturn, 'hour', true);
                    violations.overdueDurationFormatted = formatDuration(violations.overdueDuration);
                }
            }

            if (!record.entry_time) {
                if (violations.isOverdue) {
                    console.log(`⏰ Overdue: ${record.name} ${violations.overdueDurationFormatted}`);
                }
                violationCache.set(cacheKey, violations);
                return violations;
            }

            let actualReturn = dayjs(record.entry_time);

            if (!actualReturn.isValid() || !expectedReturn || !expectedReturn.isValid()) {
                console.warn(`⚠️ Invalid dates for ${record.name}: actual=${record.entry_time}, expected=${expectedReturn}`);
                violationCache.set(cacheKey, violations);
                return violations;
            }

            violations.returnTime = actualReturn;

            const timeDifferenceHours = actualReturn.diff(expectedReturn, 'hour', true);
            const daysDifference = Math.max(0, actualReturn.diff(expectedReturn.startOf('day'), 'day'));

            violations.lateDuration = Math.max(0, timeDifferenceHours);
            violations.daysLate = daysDifference;
            violations.lateDurationFormatted = formatDuration(violations.lateDuration);
            violations.exceedDuration = Math.max(0, timeDifferenceHours);
            violations.exceedDurationFormatted = formatDuration(violations.exceedDuration);

            if (violations.permissionType === 'leave') {
                if (daysDifference > 0) {
                    violations.isCritical = true;
                    violations.isLate = true;
                    violations.violationType = 'leave_critical';
                } else if (daysDifference === 0) {
                    const returnHour = actualReturn.hour();
                    if (timeDifferenceHours > 0 && returnHour >= 21) {
                        violations.isLate = true;
                        violations.isAfterHours = true;
                        violations.violationType = 'leave_late';
                    } else if (timeDifferenceHours > 0.25) {
                        violations.isLate = true;
                        violations.violationType = 'leave_late';
                    }
                }
            } else if (violations.permissionType === 'outpass') {
                if (violations.exceedDuration > 0) {
                    violations.isLate = true;

                    if (violations.exceedDuration >= 24.0) {
                        violations.isExtended = true;
                        const returnHour = actualReturn.hour();
                        const sameDay = actualReturn.format('YYYY-MM-DD') === expectedReturn.format('YYYY-MM-DD');

                        if (sameDay && returnHour >= 21) {
                            violations.isAfterHours = true;
                            violations.isCritical = true;
                            violations.violationType = 'outpass_critical';
                        } else {
                            violations.violationType = 'outpass_extended';
                        }
                    } else if (violations.exceedDuration >= 2.0) {
                        violations.isExtended = true;
                        violations.violationType = 'outpass_extended';
                    } else {
                        violations.violationType = 'outpass_duration';
                    }

                    if (!violations.isCritical && actualReturn.hour() >= 21) {
                        violations.isAfterHours = true;
                    }
                }
            } else {
                if (timeDifferenceHours > 0) {
                    violations.isLate = true;
                    violations.lateDuration = timeDifferenceHours;

                    if (timeDifferenceHours >= 24.0) {
                        violations.isExtended = true;
                    }

                    if (actualReturn.hour() >= 21) {
                        violations.isAfterHours = true;
                    }

                    if (violations.isExtended && violations.isAfterHours) {
                        violations.isCritical = true;
                    }

                    violations.violationType = 'legacy';
                }
            }
        } catch (error) {
            console.error(`❌ Violation analysis error for ${record.name}:`, error);
        }

        violationCache.set(cacheKey, violations);
        return violations;
    }, []);

    // 🆕 NEW: Enhanced Row Selection Configuration
    // 🆕 FIXED: Row Selection Configuration
    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys, newSelectedRows) => {
            console.log('🔲 Row selection changed:', {
                selectedCount: newSelectedRowKeys.length,
                totalFiltered: filteredData.length
            });
            setSelectedRowKeys(newSelectedRowKeys);
            setSelectedRows(newSelectedRows);
        },
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            console.log(`🔲 Row ${selected ? 'selected' : 'deselected'}:`, record.name);
        },
        onSelectAll: (selected, selectedRows, changeRows) => {
            console.log(`🔲 ${selected ? 'Select' : 'Deselect'} all:`, changeRows.length, 'rows');
            toast.success(
                `${selected ? 'Selected' : 'Deselected'} ${changeRows.length} rows`,
                { duration: 2000 }
            );
        },
        getCheckboxProps: (record) => ({
            name: record.name,
        }),
        columnTitle: (
            <Tooltip title="Select rows for export/email">
                <CheckSquareOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
        ),
        columnWidth: 50,
        // 🆕 FIXED: Ensure checkbox state consistency
        preserveSelectedRowKeys: true,
    };

    // 🆕 NEW: Selection Helper Functions
    const selectAllFiltered = () => {
        const allKeys = filteredData.map(record => record.uniqueKey || record.id);
        setSelectedRowKeys(allKeys);
        setSelectedRows([...filteredData]);
        toast.success(`Selected all ${filteredData.length} filtered rows`);
    };

    const clearSelection = () => {
        setSelectedRowKeys([]);
        setSelectedRows([]);
        toast.success('Selection cleared');
    };

    const selectViolationsOnly = () => {
        const violationRecords = filteredData.filter(record => {
            const violationData = analyzeViolations(record);
            return violationData.isLate || violationData.isOverdue;
        });
        const violationKeys = violationRecords.map(record => record.uniqueKey || record.id);
        setSelectedRowKeys(violationKeys);
        setSelectedRows(violationRecords);
        toast.success(`Selected ${violationRecords.length} records with violations`);
    };

    // 🆕 NEW: Get Data for Export/Email (with selection support)
    const getDataForOperation = (useSelection = false) => {
        if (useSelection && selectedRows.length > 0) {
            return {
                data: selectedRows,
                source: 'selected',
                count: selectedRows.length,
                description: `${selectedRows.length} selected records`
            };
        } else {
            return {
                data: filteredData,
                source: 'filtered',
                count: filteredData.length,
                description: `${filteredData.length} filtered records`
            };
        }
    };

    // 🆕 NEW: Preview Data Modal Component
    // 🆕 FIXED: Preview Data Modal Component - Show All Data
    const PreviewDataModal = () => {
        const { data: dataToPreview = [], config = {} } = previewConfig;

        return (
            <Modal
                title={
                    <span>
                        <EyeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        Preview Data to be Sent ({dataToPreview?.length || 0} records)
                    </span>
                }
                open={previewModalVisible}
                onCancel={() => setPreviewModalVisible(false)}
                width={1200}
                footer={[
                    <Button key="cancel" onClick={() => setPreviewModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="send"
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleConfirmFromPreview}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Confirm & Send
                    </Button>
                ]}
            >
                <div style={{ marginBottom: '16px' }}>
                    <Card
                        size="small"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            margin: '-16px',
                            padding: '20px',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px',
                                paddingBottom: '12px',
                                borderBottom: '2px solid #f0f2ff'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '16px',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}>
                                    <EyeOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </div>
                                <div>
                                    <Title level={4} style={{
                                        margin: 0,
                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontWeight: 600
                                    }}>
                                        Data Preview
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>
                                        Review your data before sending
                                    </Text>
                                </div>
                            </div>

                            <Row gutter={[16, 12]}>
                                <Col xs={24} sm={12}>
                                    <Card size="small" style={{
                                        borderRadius: '8px',
                                        border: '1px solid #e8f0ff',
                                        background: 'linear-gradient(to right, #f8faff, #ffffff)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: config.source === 'selected' ? 'linear-gradient(135deg, #52c41a, #389e0d)' : 'linear-gradient(135deg, #1890ff, #096dd9)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px'
                                            }}>
                                                {config.source === 'selected' ?
                                                    <CheckSquareOutlined style={{ fontSize: '16px', color: 'white' }} /> :
                                                    <UnorderedListOutlined style={{ fontSize: '16px', color: 'white' }} />
                                                }
                                            </div>
                                            <div>
                                                <Text strong style={{ display: 'block', fontSize: '16px', color: '#1a1a1a' }}>
                                                    {dataToPreview?.length || 0}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {config.source === 'selected' ? 'Selected' : 'Filtered'} Records
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Card size="small" style={{
                                        borderRadius: '8px',
                                        border: '1px solid #fff7e6',
                                        background: 'linear-gradient(to right, #fffbf0, #ffffff)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #faad14, #d48806)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px'
                                            }}>
                                                <MailOutlined style={{ fontSize: '16px', color: 'white' }} />
                                            </div>
                                            <div>
                                                <Text strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>
                                                    {config.recipients?.length ? config.recipients.length : 'N/A'} Recipients
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                                    {config.recipients?.length > 0 ? config.recipients[0] : 'Not specified'}
                                                    {config.recipients?.length > 1 && ` +${config.recipients.length - 1} more`}
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Card size="small" style={{
                                        borderRadius: '8px',
                                        border: '1px solid #f6ffed',
                                        background: 'linear-gradient(to right, #f6ffed, #ffffff)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #52c41a, #389e0d)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px'
                                            }}>
                                                <FileTextOutlined style={{ fontSize: '16px', color: 'white' }} />
                                            </div>
                                            <div>
                                                <Text strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>
                                                    {config.reportType || 'Standard'}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                                    Report Type
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Card size="small" style={{
                                        borderRadius: '8px',
                                        border: '1px solid #fff1f0',
                                        background: 'linear-gradient(to right, #fff1f0, #ffffff)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #ff4d4f, #cf1322)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px'
                                            }}>
                                                {config.format === 'pdf' ?
                                                    <FilePdfOutlined style={{ fontSize: '16px', color: 'white' }} /> :
                                                    <FileExcelOutlined style={{ fontSize: '16px', color: 'white' }} />
                                                }
                                            </div>
                                            <div>
                                                <Text strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>
                                                    {(config.format || 'Excel').toUpperCase()}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                                    Export Format
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Status Bar */}
                            <div style={{
                                marginTop: '16px',
                                padding: '12px 16px',
                                background: 'linear-gradient(90deg, #e6f7ff 0%, #f0f9ff 100%)',
                                borderRadius: '8px',
                                border: '1px solid #d4edda',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <CheckCircleOutlined style={{
                                        fontSize: '18px',
                                        color: '#52c41a',
                                        marginRight: '8px',
                                        animation: 'pulse 2s infinite'
                                    }} />
                                    <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                                        Ready to process {dataToPreview?.length || 0} records
                                    </Text>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: '#52c41a',
                                                animation: `bounce 1.4s infinite ${i * 0.16}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <style jsx>{`
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        
        .ant-card-small > .ant-card-body {
            padding: 16px;
        }
        
        .preview-card:hover {
            transform: translateY(-2px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
    `}</style>
                </div>

                <Table
                    dataSource={dataToPreview} // 🆕 FIXED: Show all data, not just first 10
                    rowKey={(record) => record.uniqueKey || record.id}
                    pagination={{
                        pageSize: 50,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
                        pageSizeOptions: ['25', '50', '100', '200']
                    }} // 🆕 FIXED: Added pagination instead of limiting rows
                    scroll={{ x: 1000, y: 400 }}
                    size="small"
                    columns={[
                        {
                            title: "Student",
                            key: "student",
                            width: 200,
                            render: (_, record) => (
                                <div>
                                    <Text strong style={{ color: '#1890ff' }}>{record.name}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {record.display_id || record.hostel_id}
                                    </Text>
                                </div>
                            )
                        },
                        {
                            title: "Type",
                            key: "type",
                            width: 80,
                            render: (_, record) => (
                                <Tag color={record.permission === 'leave' ? 'red' : 'orange'}>
                                    {record.permission === 'leave' ? 'Leave' : 'Outpass'}
                                </Tag>
                            )
                        },
                        {
                            title: "Purpose",
                            key: "purpose",
                            width: 200,
                            render: (_, record) => (
                                <Tooltip title={record.purpose}>
                                    <Text ellipsis style={{ maxWidth: '200px' }}>
                                        {record.purpose}
                                    </Text>
                                </Tooltip>
                            )
                        },
                        {
                            title: "Duration",
                            key: "duration",
                            width: 150,
                            render: (_, record) => (
                                <div style={{ fontSize: '12px' }}>
                                    <div>{dayjs(record.date_from).format('MMM D')} - {dayjs(record.date_to).format('MMM D')}</div>
                                </div>
                            )
                        },
                        {
                            title: "Status",
                            key: "status",
                            width: 100,
                            render: (_, record) => {
                                const violationData = analyzeViolations(record);
                                const displayStatus = violationData.calculatedStatus || record.status;
                                const colors = {
                                    'Pending': 'processing',
                                    'Accepted': 'success',
                                    'Rejected': 'error',
                                    'Renewed': 'cyan',
                                    'Completed': 'purple',
                                    'Expired': 'red'
                                };
                                return <Tag color={colors[displayStatus] || 'default'}>{displayStatus}</Tag>;
                            }
                        },
                        {
                            title: "Violations",
                            key: "violations",
                            width: 200,
                            render: (_, record) => {
                                const violationData = analyzeViolations(record);
                                if (!violationData.isLate && !violationData.isOverdue) {
                                    return <Tag color="success" icon={<CheckCircleOutlined />}>Clean</Tag>;
                                }

                                const violations = [];
                                if (violationData.violationType === 'leave_critical') {
                                    violations.push(<Tag key="leave-critical" color="red">Leave Critical</Tag>);
                                }
                                if (violationData.violationType === 'outpass_critical') {
                                    violations.push(<Tag key="outpass-critical" color="red">Outpass Critical</Tag>);
                                }
                                if (violationData.isLate && !violationData.isCritical) {
                                    violations.push(<Tag key="late" color="orange">Late</Tag>);
                                }
                                if (violationData.isOverdue) {
                                    violations.push(<Tag key="overdue" color="red">Overdue</Tag>);
                                }

                                return violations.length > 0 ? violations : <Tag color="success">Clean</Tag>;
                            }
                        }
                    ]}
                />
            </Modal>
        );
    };

    // Existing fetch functions (unchanged)
    const fetchEscalationUsers = useCallback(async () => {
        if (usersFetched) return;

        setLoadingUsers(true);
        try {
            const response = await fetch(`${API_BASE_URL}/escalation-masters/getinfo`);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const users = await response.json();
            const transformedUsers = users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                designation: user.designation,
                searchText: `${user.name} ${user.email} ${user.designation}`.toLowerCase(),
                displayLabel: `${user.name} (${user.designation})`,
                value: user.email
            }));

            setEscalationUsers(transformedUsers);
            setUsersFetched(true);
        } catch (error) {
            console.error('❌ Failed to fetch escalation users:', error);
            notification.error({
                message: 'Failed to Load User Directory',
                description: 'Could not fetch user list. Manual email entry is still available.',
                duration: 3
            });
        } finally {
            setLoadingUsers(false);
        }
    }, [usersFetched]);

    // Unified fetch function (unchanged)
    const fetchReportsData = useCallback(async () => {
        setLoading(true);
        try {
            let res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);
            if (!res.ok) {
                res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);
            }
            if (!res.ok) throw new Error("Failed to fetch data");

            const result = await res.json();
            const uniqueRecords = result.reduce((acc, item, index) => {
                const uniqueKey = `${item.id}_${item.created_at}_${index}`;
                const recordWithUniqueKey = { ...item, uniqueKey };

                const existingIndex = acc.findIndex(existing => existing.id === item.id);
                if (existingIndex >= 0) {
                    const existing = acc[existingIndex];
                    const existingTime = dayjs(existing.updated_at || existing.created_at);
                    const currentTime = dayjs(item.updated_at || item.created_at);

                    if (currentTime.isAfter(existingTime)) {
                        acc[existingIndex] = recordWithUniqueKey;
                    }
                } else {
                    acc.push(recordWithUniqueKey);
                }
                return acc;
            }, []);

            const sorted = uniqueRecords.sort((a, b) => {
                const aTime = a.updated_at || a.created_at;
                const bTime = b.updated_at || b.created_at;
                return dayjs(bTime).valueOf() - dayjs(aTime).valueOf();
            });

            violationCache.clear();
            setData(sorted);
            extractHostels(sorted);
        } catch (err) {
            console.error("Data fetching error:", err);
            notification.error({
                message: 'Data Fetch Error',
                description: 'Failed to load outpass/leave data from the server.',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Other existing functions (fetchSchedules, cancelSchedule, etc. - unchanged)
    const fetchSchedules = useCallback(async () => {
        setSchedulesLoading(true);
        try {
            let res = await fetch(`${API_BASE_URL}/reports-route/reports/schedules`);
            if (!res.ok) {
                res = await fetch(`${API_BASE_URL}/reports-route/reports/schedules`);
            }
            if (!res.ok) throw new Error('Failed to fetch schedules');

            const result = await res.json();
            if (result.success) {
                setSchedules(result.schedules || []);
            } else {
                throw new Error(result.message || 'Failed to fetch schedules');
            }
        } catch (error) {
            console.error('❌ Schedule fetch error:', error);
            notification.error({
                message: 'Failed to Load Schedules',
                description: 'Could not fetch existing email schedules. Please try again.',
            });
        } finally {
            setSchedulesLoading(false);
        }
    }, []);

    const cancelSchedule = async (scheduleId) => {
        setCancelScheduleLoading(true);
        try {
            let res = await fetch(`${API_BASE_URL}/reports-route/reports/schedules/${scheduleId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                res = await fetch(`${API_BASE_URL}/reports-route/reports/schedules/${scheduleId}`, {
                    method: 'DELETE',
                });
            }

            const result = await res.json();
            if (res.ok) {
                notification.success({
                    message: 'Schedule Cancelled',
                    description: 'The email schedule has been successfully cancelled.',
                });
                fetchSchedules();
                toast.success('📅 Schedule cancelled successfully!');
            } else {
                throw new Error(result.message || 'Failed to cancel schedule');
            }
        } catch (error) {
            console.error('❌ Cancel schedule error:', error);
            notification.error({
                message: 'Failed to Cancel Schedule',
                description: error.message || 'Could not cancel the schedule. Please try again.',
            });
        } finally {
            setCancelScheduleLoading(false);
        }
    };

    // Statistics and filtering functions (unchanged)
    const calculateAdvancedStatistics = useCallback((records) => {
        const stats = {
            total: records.length,
            pending: records.filter(r => r.status === 'Pending').length,
            accepted: records.filter(r => r.status === 'Accepted').length,
            rejected: records.filter(r => r.status === 'Rejected').length,
            violations: 0,
            lateEntries: 0,
            overdue: 0,
            leaveLateReturns: 0,
            leaveCriticalViolations: 0,
            outpassDurationExceeded: 0,
            outpassExtended: 0,
            outpassAfterHours: 0,
            outpassCritical: 0
        };

        records.forEach(record => {
            const violationData = analyzeViolations(record);

            if (violationData.isLate) {
                stats.lateEntries++;
                stats.violations++;
            }

            if (violationData.isOverdue) {
                stats.overdue++;
                stats.violations++;
            }

            switch (violationData.violationType) {
                case 'leave_late':
                    stats.leaveLateReturns++;
                    break;
                case 'leave_critical':
                    stats.leaveCriticalViolations++;
                    break;
                case 'outpass_duration':
                    stats.outpassDurationExceeded++;
                    break;
                case 'outpass_extended':
                    stats.outpassExtended++;
                    break;
                case 'outpass_critical':
                    stats.outpassCritical++;
                    break;
            }

            if (violationData.permissionType === 'outpass' && violationData.isAfterHours) {
                stats.outpassAfterHours++;
            }
        });

        setStatistics(stats);
    }, [analyzeViolations]);

    const extractHostels = (records) => {
        const uniqueHostels = [...new Set(records
            .map(r => r.hostel || r.display_course)
            .filter(Boolean)
        )].sort();
        setHostels(uniqueHostels);
    };

    const applyFiltersToData = useCallback(() => {
        if (data.length === 0) {
            setFilteredData([]);
            calculateAdvancedStatistics([]);
            return;
        }

        let filtered = [...data];

        if (search && search.trim()) {
            const searchTerm = search.toLowerCase().trim();
            filtered = filtered.filter((item) => (
                item.name?.toLowerCase().includes(searchTerm) ||
                (item.hostel && item.hostel.toLowerCase().includes(searchTerm)) ||
                item.inst_name?.toLowerCase().includes(searchTerm) ||
                (item.course && item.course.toLowerCase().includes(searchTerm)) ||
                item.purpose?.toLowerCase().includes(searchTerm) ||
                (item.display_id && item.display_id.toLowerCase().includes(searchTerm)) ||
                (item.hostel_id && item.hostel_id.toLowerCase().includes(searchTerm))
            ));
        }

        if (dateRange && dateRange.length === 2) {
    const [start, end] = dateRange;
    const startDate = dayjs(start).startOf('day');
    const endDate = dayjs(end).endOf('day');

    filtered = filtered.filter(item => {
        try {
            // 🔧 CHANGED: Only check created_at column for date filtering
            if (!item.created_at) {
                return true; // Include records without created_at
            }

            const createdDate = dayjs(item.created_at);
            
            if (!createdDate.isValid()) {
                return true; // Include records with invalid created_at
            }

            // Check if created_at falls within the selected date range
            return createdDate.isBetween(startDate, endDate, null, '[]') ||
                   createdDate.isSame(startDate, 'day') ||
                   createdDate.isSame(endDate, 'day');
                   
        } catch (error) {
            console.warn('Date filtering error for item:', item.id, error);
            return true; // Include records on error
        }
    });
}

        if (statusFilter && statusFilter !== "All") {
            filtered = filtered.filter(item => {
                const violationData = analyzeViolations(item);
                const displayStatus = violationData.calculatedStatus || item.status;
                return displayStatus === statusFilter;
            });
        }

        if (permissionFilter && permissionFilter !== "All") {
            filtered = filtered.filter(item => item.permission === permissionFilter);
        }

        if (hostelFilter && hostelFilter !== "All") {
            filtered = filtered.filter(item =>
                (item.hostel || item.display_course || item.course) === hostelFilter
            );
        }

        if (violationFilter && violationFilter !== "All") {
            filtered = filtered.filter(item => {
                const violationData = analyzeViolations(item);

                switch (violationFilter) {
                    case "Violations":
                        return violationData.isLate || violationData.isOverdue;
                    case "Clean":
                        return !violationData.isLate && !violationData.isOverdue;
                    case "LeaveCritical":
                        return violationData.violationType === 'leave_critical';
                    case "LeaveLate":
                        return violationData.violationType === 'leave_late';
                    case "OutpassCritical":
                        return violationData.violationType === 'outpass_critical';
                    case "OutpassExtended":
                        return violationData.violationType === 'outpass_extended';
                    case "OutpassDuration":
                        return violationData.violationType === 'outpass_duration';
                    case "AfterHours":
                        return violationData.isAfterHours;
                    case "Late":
                        return violationData.isLate;
                    case "Overdue":
                        return violationData.isOverdue;
                    case "Expired":
                        return violationData.calculatedStatus === 'Expired';
                    case "Completed":
                        return violationData.calculatedStatus === 'Completed';
                    case "Extended":
                        return violationData.isExtended;
                    case "Critical":
                        return violationData.isCritical;
                    default:
                        return true;
                }
            });
        }

        // 🆕 NEW: Clear selection when filters change
        if (selectedRowKeys.length > 0) {
            const filteredIds = new Set(filtered.map(item => item.uniqueKey || item.id));
            const validSelectedKeys = selectedRowKeys.filter(key => filteredIds.has(key));
            const validSelectedRows = selectedRows.filter(row => filteredIds.has(row.uniqueKey || row.id));

            if (validSelectedKeys.length !== selectedRowKeys.length) {
                setSelectedRowKeys(validSelectedKeys);
                setSelectedRows(validSelectedRows);

                const removedCount = selectedRowKeys.length - validSelectedKeys.length;
                if (removedCount > 0) {
                    toast.success(`${removedCount} selected rows were filtered out`, {
                        duration: 3000,
                        style: {
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            color: '#1890ff',
                        },
                    });
                }
            }
        }

        setFilteredData(filtered);
        calculateAdvancedStatistics(filtered);
    }, [data, search, dateRange, statusFilter, permissionFilter, hostelFilter, violationFilter, analyzeViolations, calculateAdvancedStatistics, selectedRowKeys, selectedRows]);

    // useEffect hooks (unchanged)
    useEffect(() => {
        fetchReportsData();
        const intervalId = setInterval(fetchReportsData, POLLING_INTERVAL);
        return () => clearInterval(intervalId);
    }, [fetchReportsData]);

    useEffect(() => {
        if (activeTab === 'schedules') {
            fetchSchedules();
        }
    }, [activeTab, fetchSchedules]);

    useEffect(() => {
        applyFiltersToData();
    }, [applyFiltersToData]);

    useEffect(() => {
        if (scheduleModalVisible || immediateEmailModalVisible) {
            fetchEscalationUsers();
        }
    }, [scheduleModalVisible, immediateEmailModalVisible, fetchEscalationUsers]);

    // Filter handlers (unchanged)
    const handleSearch = (value) => setSearch(value);
    const handleDateChange = (dates) => setDateRange(dates);
    const handleStatusChange = (value) => setStatusFilter(value);
    const handlePermissionChange = (value) => setPermissionFilter(value);
    const handleHostelChange = (value) => setHostelFilter(value);
    const handleViolationChange = (value) => setViolationFilter(value);

    const resetFilters = () => {
        console.log('🔄 Resetting all filters');
        setSearch("");
        setDateRange([]);
        setStatusFilter("All");
        setPermissionFilter("All");
        setHostelFilter("All");
        setViolationFilter("All");
        clearSelection(); // Also clear selection
        toast.success("Filters and selection reset successfully");
    };

    // Existing helper functions (formatTime, getAdvancedViolationStatus, etc. - unchanged)
    const formatTime = (time) => {
        if (!time) return "N/A";
        try {
            if (time.includes('T') || time.includes(' ')) {
                return dayjs(time).format('hh:mm A');
            } else {
                const [hour, minute] = time.split(":");
                const date = dayjs().set('hour', parseInt(hour)).set('minute', parseInt(minute));
                return date.format('hh:mm A');
            }
        } catch (error) {
            console.warn('Time formatting error:', error);
            return time;
        }
    };

    const getAdvancedViolationStatus = (record) => {
        const violationData = analyzeViolations(record);
        const violations = [];

        if (violationData.isExpired && !record.entry_time) {
            violations.push(
                <Tag key="expired" color="red" icon={<ClockCircleOutlined />} style={{ fontWeight: 'bold' }}>
                    EXPIRED: {violationData.overdueDurationFormatted} ago
                </Tag>
            );
        }

        if (violationData.permissionType === 'leave') {
            switch (violationData.violationType) {
                case 'leave_critical':
                    violations.push(
                        <Tag key="leave-critical" color="red" icon={<FireOutlined />} style={{ fontWeight: 'bold' }}>
                            LEAVE CRITICAL: {violationData.lateDurationFormatted} Late Return
                        </Tag>
                    );
                    break;
                case 'leave_late':
                    violations.push(
                        <Tag key="leave-late" color="volcano" icon={<MoonOutlined />}>
                            LEAVE LATE: {violationData.lateDurationFormatted} After Return Time
                        </Tag>
                    );
                    break;
            }
        } else if (violationData.permissionType === 'outpass') {
            switch (violationData.violationType) {
                case 'outpass_critical':
                    violations.push(
                        <Tag key="outpass-critical" color="red" icon={<FireOutlined />} style={{ fontWeight: 'bold' }}>
                            OUTPASS CRITICAL: {violationData.exceedDurationFormatted} Over + After 9PM
                        </Tag>
                    );
                    break;
                case 'outpass_extended':
                    violations.push(
                        <Tag key="outpass-extended" color="volcano" icon={<ClockCircleFilled />}>
                            OUTPASS EXTENDED: {violationData.exceedDurationFormatted} Over Duration
                        </Tag>
                    );
                    break;
                case 'outpass_duration':
                    violations.push(
                        <Tag key="outpass-duration" color="orange" icon={<ClockCircleOutlined />}>
                            OUTPASS LATE: {violationData.exceedDurationFormatted} Over
                        </Tag>
                    );
                    break;
            }

            if (violationData.isAfterHours && violationData.violationType !== 'outpass_critical') {
                violations.push(
                    <Tag key="outpass-afterhours" color="purple" icon={<MoonOutlined />}>
                        After Hours Return
                    </Tag>
                );
            }
        } else {
            if (violationData.isCritical) {
                violations.push(
                    <Tag key="legacy-critical" color="red" icon={<FireOutlined />} style={{ fontWeight: 'bold' }}>
                        CRITICAL: Multiple Violations ({violationData.lateDurationFormatted})
                    </Tag>
                );
            } else if (violationData.isExtended) {
                violations.push(
                    <Tag key="legacy-extended" color="volcano" icon={<ClockCircleFilled />}>
                        Extended: {violationData.lateDurationFormatted} late
                    </Tag>
                );
            } else if (violationData.isLate) {
                violations.push(
                    <Tag key="legacy-late" color="orange" icon={<WarningOutlined />}>
                        Late: {violationData.lateDurationFormatted}
                    </Tag>
                );
            }

            if (violationData.isAfterHours && !violationData.isCritical) {
                violations.push(
                    <Tag key="legacy-afterhours" color="purple" icon={<MoonOutlined />}>
                        After Hours Return
                    </Tag>
                );
            }
        }

        if (violations.length === 0) {
            return <Tag color="success" icon={<CheckCircleOutlined />}>Clean</Tag>;
        }

        return violations;
    };

    // 🚀 ENHANCED: Export Handler with Selection Support
    const handleExport = async (skipPreview = false) => {
        try {
            const values = await exportForm.validateFields();
            const useSelection = values.dataSource === 'selected';
            const operationData = getDataForOperation(useSelection);

            if (!operationData.data || operationData.data.length === 0) {
                notification.warning({
                    message: 'No Data to Export',
                    description: useSelection
                        ? 'No rows are selected. Please select rows or switch to filtered data.'
                        : 'There are no records matching your current filters. Please adjust your filters and try again.',
                });
                return;
            }

            // 🔧 FIXED: Check skipPreview parameter AND form value
            if (!skipPreview && values.showPreview) {
                setPreviewConfig({
                    data: operationData.data,
                    source: operationData.source,
                    type: 'export',
                    reportType: values.reportType,
                    format: values.format,
                    recipients: ['Local Download']
                });
                setPreviewModalVisible(true);
                return; // Exit here, actual export will be triggered from preview modal
            }


            setExportLoading(true);

            const exportData = {
                data: operationData.data,
                dataSource: operationData.source, // 🆕 NEW: Include data source info
                selectedCount: useSelection ? operationData.count : null, // 🆕 NEW: Include selection count
                filters: {
                    search,
                    dateRange: dateRange?.length ? dateRange.map(d => d.format('YYYY-MM-DD')) : null,
                    statusFilter,
                    permissionFilter,
                    hostelFilter,
                    violationFilter
                },
                reportType: values.reportType,
                format: values.format,
                includeViolations: values.includeViolations,
                enhancedViolations: true
            };

            const endpoint = values.reportType === 'violations'
                ? '/api/reports-route/reports/export-violations'
                : '/api/reports-route/reports/export-full';

            let response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exportData)
            });

            if (!response.ok) {
                const oldEndpoint = endpoint.replace('/api/reports-route/', '/reports-route/');
                response = await fetch(`${API_BASE_URL}${oldEndpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(exportData)
                });
            }

            if (!response.ok) throw new Error('Export failed');

            // 🔧 FIXED: Ensure proper MIME type and filename for Excel
            // 🔧 FIXED: Use the filename from Content-Disposition header sent by backend
            const blob = await response.blob();

            // Extract filename from Content-Disposition header if available
            let downloadFilename = `report_${dayjs().format('YYYY-MM-DD')}.${values.format === 'excel' ? 'xlsx' : values.format}`;

            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const matches = contentDisposition.match(/filename=([^;]+)/);
                if (matches && matches[1]) {
                    downloadFilename = matches[1].replace(/"/g, '').trim();
                }
            }

            // 🔧 CRITICAL: Set correct MIME type before creating blob
            let finalBlob = blob;
            if (values.format === 'excel') {
                finalBlob = new Blob([blob], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
            } else if (values.format === 'pdf') {
                finalBlob = new Blob([blob], { type: 'application/pdf' });
            }

            // Create and trigger download
            const url = window.URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadFilename; // 🔧 Use extracted filename from backend
            a.click();
            window.URL.revokeObjectURL(url);



            notification.success({
                message: 'Export Successful',
                description: `${values.reportType} report with ${operationData.count} ${operationData.source} records downloaded successfully.`
            });

            setExportModalVisible(false);
            exportForm.resetFields();

            // Clear selection after successful export if it was used
            if (useSelection) {
                clearSelection();
            }

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

    // 🚀 ENHANCED: Email Handler with Selection and Preview Support
    const handleImmediateEmail = async (fromPreview = false) => {
        try {
            const values = await immediateEmailForm.validateFields();
            const useSelection = values.dataSource === 'selected';
            const operationData = getDataForOperation(useSelection);


            if (!operationData.data || operationData.data.length === 0) {
                notification.warning({
                    message: 'No Data Available',
                    description: useSelection
                        ? 'No rows are selected. Please select rows or switch to filtered data.'
                        : 'There are no records to send with the current filters. Please adjust your filters and try again.',
                });
                return;
            }

            // 🆕 NEW: Show preview for emails if requested or if data is small
            if (!fromPreview && values.showPreview) {
                const operationData = getDataForOperation(useSelection);

                setPreviewConfig({
                    data: operationData.data,
                    source: operationData.source,
                    type: 'email',
                    reportType: values.reportType,
                    format: values.format,
                    recipients: values.toEmails
                });
                setPreviewModalVisible(true);
                return; // Exit here, actual email will be triggered from preview modal
            }

            setImmediateEmailLoading(true);

            const emailData = {
                data: operationData.data,
                dataSource: operationData.source, // 🆕 NEW: Include data source info
                selectedCount: useSelection ? operationData.count : null, // 🆕 NEW: Include selection count
                filters: {
                    search,
                    dateRange,
                    statusFilter,
                    permissionFilter,
                    hostelFilter,
                    violationFilter
                },
                reportType: values.reportType,
                format: values.format,
                toEmails: values.toEmails,
                ccEmails: values.ccEmails || [],
                subject: values.subject,
                message: values.message,
                includeViolations: values.includeViolations,
                enhancedViolations: true,
                // 🆕 NEW: Include preview data for small datasets
                includePreviewInEmail: operationData.count <= 10
            };

            let response = await fetch(`${API_BASE_URL}/reports-route/reports/send-immediate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                response = await fetch(`${API_BASE_URL}/reports-route/reports/send-immediate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailData)
                });
            }

            const result = await response.json();

            if (response.ok) {
                notification.success({
                    message: 'Email with Enhanced Data Sent! ✨',
                    description: `${values.reportType === 'violations' ? 'Violations' : 'Full'} report with ${operationData.count} ${operationData.source} records sent successfully.`,
                });
                setImmediateEmailModalVisible(false);
                immediateEmailForm.resetFields();
                toast.success(`📧 ${operationData.count} ${operationData.source} records sent!`);

                // Clear selection after successful email if it was used
                if (useSelection) {
                    clearSelection();
                }
            } else {
                throw new Error(result.message || 'Failed to send email');
            }

        } catch (error) {
            console.error('Immediate email error:', error);
            notification.error({
                message: 'Email Send Failed',
                description: error.message || 'Failed to send email report. Please try again.'
            });
        } finally {
            setImmediateEmailLoading(false);
        }
    };

    // Existing helper functions and components (EnhancedEmailSelect, etc. - keeping them all unchanged)
    const EnhancedEmailSelect = ({
        value = [],
        onChange,
        placeholder = "Enter email addresses or select users...",
        loading = false,
        formInstance = null,
        fieldName = 'toEmails'
    }) => {
        const [searchValue, setSearchValue] = useState('');

        const filteredUsers = useMemo(() => {
            if (!searchValue || searchValue.trim().length === 0) {
                return escalationUsers;
            }

            const searchTerm = searchValue.toLowerCase().trim();

            return escalationUsers.filter(user => {
                const nameMatch = user.name.toLowerCase().includes(searchTerm);
                const emailMatch = user.email.toLowerCase().includes(searchTerm);
                const designationMatch = user.designation.toLowerCase().includes(searchTerm);
                const combinedMatch = user.searchText.includes(searchTerm);

                return nameMatch || emailMatch || designationMatch || combinedMatch;
            });
        }, [searchValue, escalationUsers]);

        const handleChange = (newValues) => {
            onChange?.(newValues);
            setSearchValue('');
        };

        const handleSearch = (searchText) => {
            setSearchValue(searchText);
        };

        const renderOption = (user) => (
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 0'
            }}>
                <div>
                    <div style={{ fontWeight: '500', color: '#1890ff' }}>
                        {user.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {user.email}
                    </div>
                </div>
                <Tag size="small" color="blue" style={{ margin: 0 }}>
                    {user.designation}
                </Tag>
            </div>
        );

        const options = useMemo(() => {
            const userOptions = filteredUsers.map(user => ({
                key: `user_${user.id}`,
                value: user.email,
                label: renderOption(user),
                searchable: true,
                userData: user
            }));

            const manualOptions = [];
            if (searchValue && EMAIL_REGEX.test(searchValue.trim())) {
                const trimmedSearch = searchValue.trim();
                const emailExists = escalationUsers.some(u => u.email.toLowerCase() === trimmedSearch.toLowerCase()) ||
                    value.some(email => email.toLowerCase() === trimmedSearch.toLowerCase());

                if (!emailExists) {
                    manualOptions.push({
                        key: `manual_${trimmedSearch}`,
                        value: trimmedSearch,
                        label: (
                            <div style={{ color: '#52c41a', fontStyle: 'italic' }}>
                                ✍️ Add manually: {trimmedSearch}
                            </div>
                        ),
                        searchable: false
                    });
                }
            }

            return [...userOptions, ...manualOptions];
        }, [filteredUsers, searchValue, value]);

        const handleQuickAdd = (designation) => {
            if (!formInstance) {
                toast.error('Form instance not available for Quick Add');
                return;
            }

            const usersWithDesignation = escalationUsers.filter(u => u.designation === designation);
            const currentValues = formInstance.getFieldValue(fieldName) || [];
            const newEmails = usersWithDesignation.map(u => u.email);
            const uniqueEmails = [...new Set([...currentValues, ...newEmails])];

            formInstance.setFieldValue(fieldName, uniqueEmails);

            if (value === currentValues) {
                handleChange(uniqueEmails);
            }

            const fieldDisplayName = fieldName.replace('Emails', '').toUpperCase();
            toast.success(`Added ${usersWithDesignation.length} ${designation}(s) to ${fieldDisplayName} recipients`);
        };

        return (
            <div>
                <Select
                    mode="tags"
                    value={value}
                    onChange={handleChange}
                    onSearch={handleSearch}
                    searchValue={searchValue}
                    placeholder={placeholder}
                    loading={loading}
                    style={{ width: '100%' }}
                    tokenSeparators={[',', ';', ' ']}
                    filterOption={false}
                    showSearch={true}
                    optionFilterProp="label"
                    notFoundContent={
                        loading ? (
                            <div style={{ textAlign: 'center', padding: '8px' }}>
                                <Spin size="small" /> Loading users...
                            </div>
                        ) : searchValue && searchValue.trim().length > 0 ? (
                            filteredUsers.length === 0 && !EMAIL_REGEX.test(searchValue.trim()) ? (
                                <div style={{ textAlign: 'center', padding: '8px', color: '#666' }}>
                                    🔍 No users found for "{searchValue}"
                                    <br />
                                    <small>Try typing a valid email to add manually</small>
                                </div>
                            ) : null
                        ) : (
                            <div style={{ textAlign: 'center', padding: '8px', color: '#666' }}>
                                👥 Type to search users
                                <br />
                                <small>Or enter email manually</small>
                            </div>
                        )
                    }
                    dropdownRender={(menu) => (
                        <div>
                            {escalationUsers.length > 0 && (
                                <div style={{
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #f0f0f0',
                                    backgroundColor: '#fafafa',
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    👥 {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                                    {searchValue && ` for "${searchValue}"`} • ✍️ Manual entry supported
                                </div>
                            )}
                            {menu}

                            {formInstance && escalationUsers.length > 0 && !searchValue && (
                                <div style={{
                                    padding: '8px 12px',
                                    borderTop: '1px solid #f0f0f0',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                                        Quick Add by Designation:
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {[...new Set(escalationUsers.map(u => u.designation))].map(designation => {
                                            const usersWithDesignation = escalationUsers.filter(u => u.designation === designation);
                                            return (
                                                <Button
                                                    key={designation}
                                                    size="small"
                                                    type="link"
                                                    onClick={() => handleQuickAdd(designation)}
                                                    style={{
                                                        padding: '2px 8px',
                                                        height: 'auto',
                                                        fontSize: '11px',
                                                        lineHeight: '1.2'
                                                    }}
                                                >
                                                    <Tag size="small" color="blue" style={{ margin: 0, fontSize: '10px' }}>
                                                        {designation}
                                                    </Tag>
                                                    <span style={{ marginLeft: '4px' }}>+{usersWithDesignation.length}</span>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    options={options}
                    tagRender={({ label, value, closable, onClose }) => {
                        const user = escalationUsers.find(u => u.email === value);

                        return (
                            <Tag
                                closable={closable}
                                onClose={onClose}
                                style={{
                                    marginRight: 3,
                                    backgroundColor: user ? '#e6f7ff' : '#f6ffed',
                                    borderColor: user ? '#91d5ff' : '#b7eb8f',
                                    color: user ? '#1890ff' : '#52c41a'
                                }}
                            >
                                {user ? (
                                    <span>
                                        👤 {user.name}
                                        <small style={{ marginLeft: '4px', opacity: 0.7 }}>
                                            ({user.designation})
                                        </small>
                                    </span>
                                ) : (
                                    <span>✍️ {value}</span>
                                )}
                            </Tag>
                        );
                    }}
                />
            </div>
        );
    };

    // Continue with other existing helper functions (schedule functions, etc.)
    const splitEmails = (emailString) =>
        emailString
            .split(/[,;\s]+/)
            .map(email => email.trim())
            .filter(Boolean);

    const validateEmails = (emailArray) => emailArray.every(email => EMAIL_REGEX.test(email));

    // Keep all existing schedule functions unchanged...
    const toggleWeekday = (dayKey) => {
        setSelectedWeekdays(prev =>
            prev.includes(dayKey)
                ? prev.filter(d => d !== dayKey)
                : [...prev, dayKey].sort((a, b) => a - b)
        );
    };

    const getRepeatSummary = () => {
        if (repeatType === "none") return "Does not repeat";

        const intervalText = repeatInterval > 1 ? `every ${repeatInterval} ` : "every ";

        switch (repeatType) {
            case "daily":
                return `${intervalText}day`;
            case "weekly": {
                const dayNames = WEEKDAYS
                    .filter(d => selectedWeekdays.includes(d.key))
                    .map(d => d.label)
                    .join(", ");
                return `${intervalText}week on ${dayNames || "—"}`;
            }
            case "monthly":
                return `${intervalText}month on day ${monthlyDay}`;
            case "custom":
                return `Custom rule (${intervalText}${selectedWeekdays.length ? "weekdays set; " : ""}${monthlyDay ? `monthday ${monthlyDay}` : ""})`;
            default:
                return "";
        }
    };

    // 🚀 ENHANCED: Schedule Handler with Selection Support
    const handleScheduleSetup = async () => {
        try {
            const values = await scheduleForm.validateFields();
            const useSelection = values.dataSource === 'selected';
            const operationData = getDataForOperation(useSelection);

            // 🆕 ADD: Preview check for schedules (ADD THIS BLOCK)
            if (!values._skipPreview && values.showPreview) {
                setPreviewConfig({
                    data: operationData.data,
                    source: operationData.source,
                    type: 'schedule',
                    reportType: values.reportType,
                    format: values.formats,
                    recipients: values.toEmails,
                    scheduleInfo: {
                        frequency: repeatType,
                        time: values.time?.format?.('HH:mm') || '09:00',
                        repeatSummary: getRepeatSummary()
                    }
                });
                setPreviewModalVisible(true);
                return; // Exit here, actual schedule will be triggered from preview modal
            }

            // Email validation (unchanged)
            const toEmails = values.toEmails || [];
            const ccEmails = values.ccEmails || [];
            const bccEmails = values.bccEmails || [];

            if (toEmails.length === 0) {
                notification.error({
                    message: 'Validation Error',
                    description: 'Please add at least one email recipient in TO field.'
                });
                return;
            }

            if (!validateEmails(toEmails)) {
                notification.error({
                    message: 'Validation Error',
                    description: 'One or more TO emails are invalid.'
                });
                return;
            }

            if (ccEmails.length && !validateEmails(ccEmails)) {
                notification.error({
                    message: 'Validation Error',
                    description: 'One or more CC emails are invalid.'
                });
                return;
            }

            if (bccEmails.length && !validateEmails(bccEmails)) {
                notification.error({
                    message: 'Validation Error',
                    description: 'One or more BCC emails are invalid.'
                });
                return;
            }

            // Schedule validation (unchanged)
            if (repeatType === "weekly" && selectedWeekdays.length === 0) {
                notification.error({
                    message: 'Validation Error',
                    description: 'Please select at least one weekday.'
                });
                return;
            }

            if (endsType === "after" && (occurrenceCount < 1 || occurrenceCount > 1000)) {
                notification.error({
                    message: 'Validation Error',
                    description: 'Occurrences must be between 1 and 1000.'
                });
                return;
            }

            if (endsType === "on" && !endDate) {
                notification.error({
                    message: 'Validation Error',
                    description: 'Please select an end date.'
                });
                return;
            }

            setScheduleLoading(true);

            // Build enhanced schedule rule
            const scheduleRule = {
                freq: repeatType === "custom" ? "custom" : repeatType,
                interval: Number(repeatInterval) || 1,
            };

            if (repeatType === "weekly" || repeatType === "custom") {
                scheduleRule.byweekday = selectedWeekdays;
            }

            if (repeatType === "monthly" || repeatType === "custom") {
                scheduleRule.bymonthday = Number(monthlyDay) || 1;
            }

            scheduleRule.ends = {
                mode: endsType,
                until: endsType === "on" ? endDate : undefined,
                count: endsType === "after" ? Number(occurrenceCount) : undefined,
            };

            const enhancedScheduleData = {
                frequency: repeatType,
                scheduleRule: scheduleRule,
                time: values.time ? dayjs(values.time).format('HH:mm') : '09:00',
                reportType: values.reportType && values.reportType.length > 0 ? values.reportType : ['full'],
                formats: values.formats && values.formats.length > 0 ? values.formats : ['excel'],
                includeViolations: values.includeViolations || false,
                recipients: {
                    to: toEmails,
                    cc: ccEmails,
                    bcc: bccEmails
                },
                toEmails: toEmails,
                ccEmails: ccEmails,
                bccEmails: bccEmails,
                message: values.message || '',
                // 🆕 NEW: Include data source for schedules
                dataSource: useSelection ? 'selected' : 'filtered',
                selectedRowsSnapshot: useSelection ? operationData.data : null, // Store snapshot for selected data
                filters: {
                    search,
                    dateRange,
                    statusFilter,
                    permissionFilter,
                    hostelFilter,
                    violationFilter
                },
                enhancedViolations: true
            };

            let response = await fetch(`${API_BASE_URL}/reports-route/reports/enhanced-schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enhancedScheduleData)
            });

            if (!response.ok) {
                const fallbackData = {
                    frequency: enhancedScheduleData.frequency === 'none' ? 'daily' : enhancedScheduleData.frequency,
                    time: enhancedScheduleData.time,
                    reportType: enhancedScheduleData.reportType,
                    formats: enhancedScheduleData.formats,
                    toEmails: enhancedScheduleData.toEmails,
                    ccEmails: enhancedScheduleData.ccEmails,
                    bccEmails: enhancedScheduleData.bccEmails,
                    message: enhancedScheduleData.message,
                    includeViolations: enhancedScheduleData.includeViolations,
                    filters: enhancedScheduleData.filters,
                    enhancedSchedule: enhancedScheduleData.scheduleRule,
                    enhancedViolations: true,
                    dataSource: enhancedScheduleData.dataSource,
                    selectedRowsSnapshot: enhancedScheduleData.selectedRowsSnapshot
                };

                response = await fetch(`${API_BASE_URL}/reports-route/reports/schedule`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fallbackData)
                });
            }

            const result = await response.json();

            if (response.ok) {
                const repeatSummary = enhancedScheduleData.frequency === 'none' ? 'one-time' : enhancedScheduleData.frequency;
                const recipientCount = enhancedScheduleData.toEmails?.length || 0;

                notification.success({
                    message: 'Enhanced Schedule Created Successfully! 🎉',
                    description: `${repeatSummary.charAt(0).toUpperCase() + repeatSummary.slice(1)} email reports with ${useSelection ? 'selected' : 'filtered'} data scheduled for ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}.`,
                });

                setScheduleModalVisible(false);
                scheduleForm.resetFields();

                // Reset all enhanced scheduling state
                setRepeatType("weekly");
                setRepeatInterval(1);
                setSelectedWeekdays([1, 2, 3, 4, 5]);
                setMonthlyDay(1);
                setEndsType("never");
                setEndDate("");
                setOccurrenceCount(10);

                if (activeTab === 'schedules') {
                    fetchSchedules();
                }

                // Clear selection after successful schedule creation if it was used
                if (useSelection) {
                    clearSelection();
                }

                toast.success('🚀 Enhanced schedule created with row selection support!');
            } else {
                throw new Error(result.message || 'Failed to create enhanced schedule');
            }

        } catch (error) {
            console.error('Enhanced schedule setup error:', error);
            notification.error({
                message: 'Enhanced Schedule Setup Failed',
                description: error.message || 'Failed to create schedule with enhanced options. Please try again.'
            });
        } finally {
            setScheduleLoading(false);
        }
    };

    // Keep all other existing functions unchanged (formatScheduleData, viewScheduleDetails, etc.)
    const formatScheduleData = (schedule) => {
        try {
            const reportTypes = typeof schedule.report_types === 'string'
                ? JSON.parse(schedule.report_types)
                : schedule.report_types || [];

            const formats = typeof schedule.formats === 'string'
                ? JSON.parse(schedule.formats)
                : schedule.formats || [];

            const toEmails = typeof schedule.to_emails === 'string'
                ? JSON.parse(schedule.to_emails)
                : schedule.to_emails || [];

            const ccEmails = typeof schedule.cc_emails === 'string'
                ? JSON.parse(schedule.cc_emails)
                : schedule.cc_emails || [];

            const bccEmails = typeof schedule.bcc_emails === 'string'
                ? JSON.parse(schedule.bcc_emails)
                : schedule.bcc_emails || [];

            const scheduleRule = typeof schedule.schedule_rule === 'string'
                ? JSON.parse(schedule.schedule_rule)
                : schedule.schedule_rule || {};

            const weekdays = typeof schedule.weekdays === 'string'
                ? JSON.parse(schedule.weekdays)
                : schedule.weekdays || [];

            return {
                ...schedule,
                reportTypes: reportTypes,
                formats: formats,
                emails: toEmails,
                ccEmails: ccEmails,
                bccEmails: bccEmails,
                enhancedScheduleRule: scheduleRule,
                weekdaysArray: weekdays,
                isEnhanced: schedule.is_enhanced || false,
                scheduleSummary: schedule.schedule_summary || '',
                recipientsCount: schedule.recipients_count || {
                    to: toEmails.length,
                    cc: ccEmails.length,
                    bcc: bccEmails.length
                }
            };
        } catch (error) {
            console.warn('Format schedule error:', error);
            return {
                ...schedule,
                reportTypes: [],
                formats: [],
                emails: [],
                ccEmails: [],
                bccEmails: [],
                enhancedScheduleRule: {},
                weekdaysArray: [],
                isEnhanced: false,
                scheduleSummary: '',
                recipientsCount: { to: 0, cc: 0, bcc: 0 }
            };
        }
    };

    const viewScheduleDetails = (schedule) => {
        setSelectedSchedule(formatScheduleData(schedule));
        setScheduleDetailsVisible(true);
    };

    const hasPermissionData = data.some(item => item.permission);

    // 🚀 ENHANCED: Table columns (unchanged, but now supports row selection)
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
                        {record.display_id || record.hostel_id} • {record.hostel || record.display_course}
                    </Text>
                    <br />
                    {record.permission && (
                        <Tag
                            size="small"
                            color={record.permission === 'leave' ? 'red' : 'orange'}
                            icon={record.permission === 'leave' ? <FileTextOutlined /> : <UserOutlined />}
                        >
                            {record.permission === 'leave' ? 'Leave' : 'Outpass'}
                        </Tag>
                    )}
                </div>
            )
        },
        {
            title: "Duration & Purpose",
            key: "details",
            width: 280,
            render: (_, record) => (
                <div>
                    <Text strong>{record.purpose}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        📅 {dayjs(record.date_from).format('MMM D')} - {dayjs(record.date_to).format('MMM D, YYYY')}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        ⏰ Out: {formatTime(record.time_out)} • Return: {formatTime(record.time_in)}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        📍 {record.destination || record.address}
                    </Text>
                </div>
            )
        },
        {
            title: "Status",
            key: "status",
            width: 120,
            render: (_, record) => {
                const violationData = analyzeViolations(record);
                const displayStatus = violationData.calculatedStatus || record.status;

                const colors = {
                    'Pending': 'processing',
                    'Accepted': 'success',
                    'Rejected': 'error',
                    'Renewed': 'cyan',
                    'Completed': 'purple',
                    'Expired': 'red',
                    'Renewal Pending': 'warning'
                };

                return <Tag color={colors[displayStatus] || 'default'}>{displayStatus}</Tag>;
            }
        },
        {
            title: "Enhanced Leave/Outpass Violation Status",
            key: "violations",
            width: 280,
            render: (_, record) => getAdvancedViolationStatus(record)
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
                                {dayjs(record.exit_time).format('MMM D, hh:mm A')}
                            </Text>
                        ) : (
                            <Text type="secondary">Not yet</Text>
                        )}
                    </div>
                    <div>
                        <Text type="secondary">In: </Text>
                        {record.entry_time ? (
                            <Text style={{ color: '#1890ff' }}>
                                {dayjs(record.entry_time).format('MMM D, hh:mm A')}
                            </Text>
                        ) : (
                            <Text type="secondary">Not yet</Text>
                        )}
                    </div>
                </div>
            )
        }
    ];

    // Keep all existing schedule columns unchanged...
    const scheduleColumns = [
        {
            title: 'Enhanced Schedule Details',
            key: 'details',
            width: 300,
            render: (_, record) => {
                const formatted = formatScheduleData(record);
                return (
                    <div>
                        <Text strong style={{ color: '#1890ff' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {record.is_enhanced ?
                                <Badge dot color="green">Enhanced Schedule</Badge> :
                                'Standard Schedule'
                            }
                        </Text>
                        <br />
                        <Text strong style={{ fontSize: '13px', color: '#333' }}>
                            {record.schedule_summary || `${record.frequency.charAt(0).toUpperCase() + record.frequency.slice(1)} Reports`}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ClockCircleOutlined style={{ marginRight: '4px' }} />
                            Delivery: {formatTime(record.delivery_time)}
                        </Text>
                        {record.next_run_time && (
                            <>
                                <br />
                                <Text type="secondary" style={{ fontSize: '11px', color: '#52c41a' }}>
                                    ⏭️ Next: {dayjs(record.next_run_time).format('MMM D, hh:mm A')}
                                </Text>
                            </>
                        )}
                        <br />
                        <div style={{ marginTop: '4px' }}>
                            {formatted.reportTypes.map(type => (
                                <Tag key={type} size="small" color={type === 'violations' ? 'red' : 'blue'}>
                                    {type === 'violations' ? 'Violations' : 'Full Report'}
                                </Tag>
                            ))}
                            {formatted.formats && formatted.formats.map(format => (
                                <Tag key={format} size="small" color="cyan">
                                    {format.toUpperCase()}
                                </Tag>
                            ))}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Enhanced Recipients',
            key: 'recipients',
            width: 220,
            render: (_, record) => {
                const formatted = formatScheduleData(record);
                const recipientsCount = record.recipients_count || {
                    to: formatted.emails?.length || 0,
                    cc: formatted.ccEmails?.length || 0,
                    bcc: formatted.bccEmails?.length || 0
                };

                return (
                    <div>
                        <div style={{ marginBottom: '4px' }}>
                            <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                <MailOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                                TO: {recipientsCount.to}
                            </Text>
                            {recipientsCount.cc > 0 && (
                                <Text style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                                    CC: {recipientsCount.cc}
                                </Text>
                            )}
                            {recipientsCount.bcc > 0 && (
                                <Text style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                                    BCC: {recipientsCount.bcc}
                                </Text>
                            )}
                        </div>
                        <Tooltip title={formatted.emails?.join(', ') || 'No recipients'}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                {formatted.emails?.[0] || 'No recipients'}
                                {(formatted.emails?.length || 0) > 1 && ` +${formatted.emails.length - 1} more`}
                            </Text>
                        </Tooltip>
                    </div>
                );
            }
        },
        {
            title: 'Status & Progress',
            key: 'status',
            width: 180,
            render: (_, record) => (
                <div>
                    <Tag color="success" icon={<PlayCircleOutlined />}>Active</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        Created: {dayjs(record.created_at).format('MMM D, YYYY')}
                    </Text>
                    <br />
                    {record.last_sent ? (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            Last sent: {dayjs(record.last_sent).format('MMM D, hh:mm A')}
                        </Text>
                    ) : (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            Not sent yet
                        </Text>
                    )}
                    <br />
                    {record.max_occurrences && (
                        <div style={{ marginTop: '4px' }}>
                            <Text style={{ fontSize: '11px', color: '#722ed1' }}>
                                📊 {record.current_occurrences || 0}/{record.max_occurrences} sends
                            </Text>
                        </div>
                    )}
                    {record.total_sent > 0 && (
                        <Text style={{ fontSize: '11px', color: '#52c41a' }}>
                            📈 Total: {record.total_sent} sent
                        </Text>
                    )}
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => viewScheduleDetails(record)}
                        style={{ width: '100%' }}
                        type={record.is_enhanced ? 'primary' : 'default'}
                    >
                        {record.is_enhanced ? 'Enhanced Details' : 'View Details'}
                    </Button>
                    <Popconfirm
                        title="Cancel Schedule"
                        description="Are you sure you want to cancel this email schedule?"
                        onConfirm={() => cancelSchedule(record.id)}
                        okText="Yes, Cancel"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                        icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                    >
                        <Button
                            size="small"
                            danger
                            icon={<StopOutlined />}
                            loading={cancelScheduleLoading}
                            style={{ width: '100%' }}
                        >
                            Cancel
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // Main Render

    // NEW: central handler used by preview modal "Confirm & Send"
    const handleConfirmFromPreview = () => {
        if (!previewConfig) return;

        if (previewConfig.type === "email") {
            // Avoid validation again; tell handler this came from preview
            handleImmediateEmail(true);
        } else if (previewConfig.type === "export") {
            handleExport(true);
        } else if (previewConfig.type === "schedule") {
            const currentValues = scheduleForm.getFieldsValue();
            scheduleForm.setFieldsValue({
                ...currentValues,
                skipPreview: true,
                showPreview: false,
            });
            handleScheduleSetup();
        }

        setPreviewModalVisible(false);
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
                        <LineChartOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                        Enhanced Leave/Outpass Reports & Analytics with Row Selection
                    </Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                        Comprehensive reports with row selection, data preview, and advanced violation tracking
                    </Text>
                </div>

                {/* Enhanced Statistics Cards */}
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
                                title="All Violations"
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
                        <Card style={{ borderLeft: '4px solid #1890ff' }}>
                            <Statistic
                                title="Leave Violations"
                                value={statistics.leaveLateReturns + statistics.leaveCriticalViolations}
                                valueStyle={{ color: '#1890ff' }}
                                prefix={<FileTextOutlined />}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                🚨 Critical: {statistics.leaveCriticalViolations} • ⏰ Late: {statistics.leaveLateReturns}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderLeft: '4px solid #52c41a' }}>
                            <Statistic
                                title="Outpass Violations"
                                value={statistics.outpassDurationExceeded + statistics.outpassExtended + statistics.outpassCritical}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<UserOutlined />}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                🚨 Critical: {statistics.outpassCritical} • 🔥 Extended: {statistics.outpassExtended}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* 🆕 NEW: Selection Summary Card */}
                {selectedRowKeys.length > 0 && (
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col span={24}>
                            <Alert
                                type="info"
                                showIcon
                                icon={<CheckSquareOutlined />}
                                message={
                                    <span style={{ fontWeight: 'bold' }}>
                                        🔲 {selectedRowKeys.length} rows selected out of {filteredData.length} filtered records
                                    </span>
                                }
                                description={
                                    <div>
                                        <div>📊 Selected data will be used for export and email operations when "Selected Rows" option is chosen</div>
                                        <div style={{ marginTop: '8px' }}>
                                            <Space>
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    icon={<SelectOutlined />}
                                                    onClick={selectAllFiltered}
                                                >
                                                    Select All Filtered ({filteredData.length})
                                                </Button>
                                                <Button
                                                    size="small"
                                                    icon={<WarningOutlined />}
                                                    onClick={selectViolationsOnly}
                                                    style={{ backgroundColor: '#fff2e8', borderColor: '#ffbb96', color: '#fa541c' }}
                                                >
                                                    Select Violations Only
                                                </Button>
                                                <Button
                                                    size="small"
                                                    icon={<ClearOutlined />}
                                                    onClick={clearSelection}
                                                >
                                                    Clear Selection
                                                </Button>
                                            </Space>
                                        </div>
                                    </div>
                                }
                                style={{ border: '2px solid #1890ff', backgroundColor: '#e6f7ff' }}
                            />
                        </Col>
                    </Row>
                )}

                {/* Critical Violations Alert */}
                {(statistics.leaveCriticalViolations > 0 || statistics.outpassCritical > 0) && (
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col span={24}>
                            <Alert
                                type="error"
                                showIcon
                                icon={<FireOutlined />}
                                message={
                                    <span style={{ fontWeight: 'bold' }}>
                                        🚨 Critical Violations Detected: {statistics.leaveCriticalViolations + statistics.outpassCritical} students
                                    </span>
                                }
                                description={
                                    <div>
                                        <div>📋 Leave Critical: {statistics.leaveCriticalViolations} students returned on later days</div>
                                        <div>🎯 Outpass Critical: {statistics.outpassCritical} students with 24h+ extension AND after 9 PM return</div>
                                    </div>
                                }
                                action={
                                    <Space direction="vertical" size="small">
                                        {statistics.leaveCriticalViolations > 0 && (
                                            <Button
                                                type="primary"
                                                danger
                                                size="small"
                                                onClick={() => setViolationFilter("LeaveCritical")}
                                            >
                                                View Leave Critical ({statistics.leaveCriticalViolations})
                                            </Button>
                                        )}
                                        {statistics.outpassCritical > 0 && (
                                            <Button
                                                type="primary"
                                                danger
                                                size="small"
                                                onClick={() => setViolationFilter("OutpassCritical")}
                                            >
                                                View Outpass Critical ({statistics.outpassCritical})
                                            </Button>
                                        )}
                                    </Space>
                                }
                                style={{ border: '2px solid #ff4d4f' }}
                            />
                        </Col>
                    </Row>
                )}

                {/* Main Tabs Section */}
                <Card>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        size="large"
                        type="card"
                    >
                        {/* Reports Tab with Enhanced Row Selection */}
                        <TabPane
                            tab={
                                <span>
                                    <LineChartOutlined />
                                    Enhanced Reports Data with Row Selection
                                </span>
                            }
                            key="reports"
                        >
                            {/* Enhanced Filter Panel */}
                            <Card style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                    <Input
                                        placeholder="Search name, ID, purpose..."
                                        value={search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        style={{ width: 250 }}
                                        allowClear
                                    />

                                    <RangePicker
                                        value={dateRange}
                                        onChange={handleDateChange}
                                        style={{ width: 300 }}
                                        allowClear
                                    />

                                    <Select
                                        value={statusFilter}
                                        onChange={handleStatusChange}
                                        style={{ width: 150 }}
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

                                    {hasPermissionData && (
                                        <Select
                                            value={permissionFilter}
                                            onChange={handlePermissionChange}
                                            style={{ width: 150 }}
                                            placeholder="Type"
                                        >
                                            <Option value="All">All Types</Option>
                                            <Option value="permission">Outpass</Option>
                                            <Option value="leave">Leave</Option>
                                        </Select>
                                    )}

                                    <Select
                                        value={hostelFilter}
                                        onChange={handleHostelChange}
                                        style={{ width: 180 }}
                                        placeholder="Hostel/Course"
                                    >
                                        <Option value="All">All Hostels</Option>
                                        {hostels.map(hostel => (
                                            <Option key={hostel} value={hostel}>{hostel}</Option>
                                        ))}
                                    </Select>

         <EnhancedViolationSelect
    value={violationFilter}
    onChange={handleViolationChange}
    statistics={statistics}
    style={{ width: 240 }}
/>

                                    <Space>
                                        <Button
                                            icon={<UndoOutlined />}
                                            onClick={resetFilters}
                                            style={{ color: "red" }}
                                        >
                                            Reset
                                        </Button>
                                        <Button
                                            icon={<ReloadOutlined />}
                                            onClick={() => {
                                                fetchReportsData();
                                                toast.success("Data Refreshed!");
                                            }}
                                            style={{ color: "dodgerblue" }}
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
                                        <Tooltip title="Send filtered or selected data immediately via email">
                                            <Button
                                                icon={<SendOutlined />}
                                                onClick={() => setImmediateEmailModalVisible(true)}
                                                type="primary"
                                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                                disabled={filteredData.length === 0}
                                            >
                                                Send Email
                                            </Button>
                                        </Tooltip>
                                        <Button
                                            icon={<ScheduleOutlined />}
                                            onClick={() => setScheduleModalVisible(true)}
                                            type="primary"
                                            style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                                        >
                                            Schedule
                                        </Button>
                                    </Space>
                                </div>

                                {/* Enhanced Quick Filter Buttons */}
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    
                                    {/* 🆕 NEW: Row Selection Buttons */}
                                    <Divider type="vertical" style={{ height: '24px' }} />
                                    <Button
                                        size="small"
                                        icon={<SelectOutlined />}
                                        onClick={selectAllFiltered}
                                        style={{ backgroundColor: '#f0f9ff', borderColor: '#91d5ff', color: '#1890ff' }}
                                    >
                                        Select All ({filteredData.length})
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<WarningOutlined />}
                                        onClick={selectViolationsOnly}
                                        style={{ backgroundColor: '#fff2e8', borderColor: '#ffbb96', color: '#fa541c' }}
                                    >
                                        Select Violations
                                    </Button>
                                    {selectedRowKeys.length > 0 && (
                                        <Button
                                            size="small"
                                            icon={<ClearOutlined />}
                                            onClick={clearSelection}
                                            style={{ backgroundColor: '#fff1f0', borderColor: '#ffccc7', color: '#f5222d' }}
                                        >
                                            Clear ({selectedRowKeys.length})
                                        </Button>
                                    )}
                                </div>
                            </Card>

                            {/* Enhanced Data Table with Row Selection */}
                            <div>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Title level={4} style={{ margin: 0 }}>
                                        Enhanced Reports Data with Row Selection
                                        <Badge count={filteredData.length} style={{ marginLeft: '8px' }} />
                                        {selectedRowKeys.length > 0 && (
                                            <Badge
                                                count={`${selectedRowKeys.length} selected`}
                                                style={{ marginLeft: '8px', backgroundColor: '#52c41a' }}
                                            />
                                        )}
                                    </Title>
                                    <div style={{ textAlign: 'right' }}>
                                        <Text type="secondary">
                                            Showing {filteredData.length} of {data.length} records
                                        </Text>
                                        {selectedRowKeys.length > 0 && (
                                            <>
                                                <br />
                                                <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                                                    🔲 <strong>{selectedRowKeys.length} rows selected</strong> for export/email
                                                </Text>
                                            </>
                                        )}
                                        <br />
                                        {violationFilter !== "All" && (
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                📊 Filtered by: <strong>{violationFilter}</strong>
                                            </Text>
                                        )}
                                    </div>
                                </div>

                                {/* 🚀 ENHANCED: Table with Row Selection */}
                                <Table
                                    rowSelection={rowSelection}
                                    columns={columns}
                                    dataSource={filteredData}
                                    rowKey={(record) => record.uniqueKey || record.id} // 🆕 FIXED: Simplified rowKey
                                    loading={loading}
                                    pagination={{
                                        pageSize: 50,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) =>
                                            `${range[0]}-${range[1]} of ${total} records • ${selectedRowKeys.length} selected`,
                                        pageSizeOptions: ['25', '50', '100', '200']
                                    }}
                                    scroll={{ x: 1200 }}
                                    size="small"
                                    rowClassName={(record) => {
                                        const violationData = analyzeViolations(record);
                                        let className = '';

                                        if (violationData.violationType === 'leave_critical' ||
                                            violationData.violationType === 'outpass_critical') {
                                            className += 'critical-violation-row';
                                        }

                                        // 🆕 FIXED: Check selection using consistent key
                                        if (selectedRowKeys.includes(record.uniqueKey || record.id)) {
                                            className += ' selected-row';
                                        }

                                        return className;
                                    }}
                                />
                            </div>
                        </TabPane>

                        {/* Schedules Management Tab (unchanged) */}
                        <TabPane
                            tab={
                                <span>
                                    <SettingOutlined />
                                    Email Schedules
                                    {schedules.length > 0 && (
                                        <Badge count={schedules.length} style={{ marginLeft: '8px' }} />
                                    )}
                                </span>
                            }
                            key="schedules"
                        >
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        Active Email Schedules
                                        <Badge count={schedules.length} style={{ marginLeft: '8px' }} />
                                    </Title>
                                    <Text type="secondary">
                                        Manage your automated report delivery schedules with enhanced row selection support
                                    </Text>
                                </div>
                                <Space>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={() => {
                                            fetchSchedules();
                                            toast.success("Schedules refreshed!");
                                        }}
                                        loading={schedulesLoading}
                                    >
                                        Refresh
                                    </Button>
                                    <Button
                                        icon={<ScheduleOutlined />}
                                        onClick={() => setScheduleModalVisible(true)}
                                        type="primary"
                                        style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                                    >
                                        Create New Schedule
                                    </Button>
                                </Space>
                            </div>

                            {schedulesLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <Spin size="large" />
                                    <div style={{ marginTop: '16px' }}>Loading schedules...</div>
                                </div>
                            ) : schedules.length === 0 ? (
                                <Card>
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '16px' }}>
                                                    No email schedules found
                                                </Text>
                                                <br />
                                                <Text type="secondary">
                                                    Create your first automated report schedule with enhanced row selection support
                                                </Text>
                                            </div>
                                        }
                                    >
                                        <Button
                                            type="primary"
                                            icon={<ScheduleOutlined />}
                                            onClick={() => setScheduleModalVisible(true)}
                                            style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                                        >
                                            Create Email Schedule
                                        </Button>
                                    </Empty>
                                </Card>
                            ) : (
                                <Table
                                    columns={scheduleColumns}
                                    dataSource={schedules}
                                    rowKey="id"
                                    loading={schedulesLoading}
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) =>
                                            `${range[0]}-${range[1]} of ${total} schedules`,
                                    }}
                                    scroll={{ x: 800 }}
                                />
                            )}
                        </TabPane>
                    </Tabs>
                </Card>

                {/* Preview Modal */}
                <PreviewDataModal />

                {/* 🚀 ENHANCED: Export Modal with Row Selection Support */}
                <Modal
                    title={
                        <span>
                            <DownloadOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            Export Reports with Row Selection
                        </span>
                    }
                    open={exportModalVisible}
                    onCancel={() => setExportModalVisible(false)}
                    onOk={() => handleExport()}
                    confirmLoading={exportLoading}
                    width={700}
                    okText="Generate & Download"
                    cancelText="Cancel"
                >
                    <Form form={exportForm} layout="vertical" initialValues={{
                        reportType: 'full',
                        format: 'excel',
                        includeViolations: true,
                        dataSource: 'filtered',
                        showPreview: false
                    }}>
                        {/* 🆕 NEW: Data Source Selection */}
                        <Form.Item
                            label="Data Source"
                            name="dataSource"
                            rules={[{ required: true, message: 'Please select data source' }]}
                        >
                            <Radio.Group>
                                <Radio.Button value="filtered">
                                    <UnorderedListOutlined style={{ marginRight: '4px' }} />
                                    All Filtered Data ({filteredData.length} records)
                                </Radio.Button>
                                <Radio.Button
                                    value="selected"
                                    disabled={selectedRowKeys.length === 0}
                                    style={{
                                        backgroundColor: selectedRowKeys.length > 0 ? '#f6ffed' : undefined,
                                        borderColor: selectedRowKeys.length > 0 ? '#b7eb8f' : undefined
                                    }}
                                >
                                    <CheckSquareOutlined style={{ marginRight: '4px' }} />
                                    Selected Rows Only ({selectedRowKeys.length} records)
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        {selectedRowKeys.length === 0 && (
                            <Alert
                                message="No rows selected"
                                description="Select rows in the table to enable 'Selected Rows Only' option."
                                type="info"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />
                        )}

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

                        <Form.Item>
                            <Space direction="vertical">
                                <Form.Item name="includeViolations" valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Checkbox>Include detailed violation analysis</Checkbox>
                                </Form.Item>
                                <Form.Item name="showPreview" valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Checkbox>
                                        <EyeOutlined style={{ marginRight: '4px' }} />
                                        Preview data before export
                                    </Checkbox>
                                </Form.Item>
                            </Space>
                        </Form.Item>

                        <div style={{
                            backgroundColor: '#f6f6f6',
                            padding: '12px',
                            borderRadius: '6px',
                            borderLeft: '3px solid #1890ff'
                        }}>
                            <Text strong style={{ color: '#1890ff' }}>Export Summary:</Text>
                            <div style={{ marginTop: '8px', fontSize: '13px' }}>
                                <div>📊 Data Source: {exportForm.getFieldValue('dataSource') === 'selected' ?
                                    `${selectedRowKeys.length} selected rows` :
                                    `${filteredData.length} filtered records`}</div>
                                <div>📅 Date Range: {dateRange?.length ?
                                    `${dayjs(dateRange[0]).format('MMM D')} - ${dayjs(dateRange[1]).format('MMM D, YYYY')}` :
                                    'All Dates'}</div>
                                <div>📋 Filters: {statusFilter} • {permissionFilter} • {violationFilter}</div>
                                <div>🏠 Hostel: {hostelFilter}</div>
                            </div>
                        </div>
                    </Form>
                </Modal>

                {/* 🚀 ENHANCED: Immediate Email Modal with Row Selection and Preview Support */}
                <Modal
                    title={
                        <span>
                            <SendOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                            Send Email Report with Row Selection
                        </span>
                    }
                    open={immediateEmailModalVisible}
                    onCancel={() => setImmediateEmailModalVisible(false)}
                    onOk={() => handleImmediateEmail()}
                    confirmLoading={immediateEmailLoading}
                    width={800}
                    okText={
                        <span>
                            <ThunderboltOutlined style={{ marginRight: '4px' }} />
                            Send Now
                        </span>
                    }
                    cancelText="Cancel"
                >
                    <Form
                        form={immediateEmailForm}
                        layout="vertical"
                        initialValues={{
                            reportType: 'full',
                            format: 'excel',
                            includeViolations: true,
                            dataSource: 'filtered',
                            showPreview: false,
                            subject: `Hostel Management Report - ${dayjs().format('YYYY-MM-DD HH:mm')}`,
                            toEmails: [],
                            ccEmails: [],
                            message: ''
                        }}
                    >
                        {/* 🆕 NEW: Data Source Selection */}
                        <Form.Item
                            label="Data Source"
                            name="dataSource"
                            rules={[{ required: true, message: 'Please select data source' }]}
                        >
                            <Radio.Group>
                                <Radio.Button value="filtered">
                                    <UnorderedListOutlined style={{ marginRight: '4px' }} />
                                    All Filtered Data ({filteredData.length} records)
                                </Radio.Button>
                                <Radio.Button
                                    value="selected"
                                    disabled={selectedRowKeys.length === 0}
                                    style={{
                                        backgroundColor: selectedRowKeys.length > 0 ? '#f6ffed' : undefined,
                                        borderColor: selectedRowKeys.length > 0 ? '#b7eb8f' : undefined
                                    }}
                                >
                                    <CheckSquareOutlined style={{ marginRight: '4px' }} />
                                    Selected Rows Only ({selectedRowKeys.length} records)
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        {selectedRowKeys.length === 0 && (
                            <Alert
                                message="No rows selected"
                                description="Select rows in the table to enable 'Selected Rows Only' option, or use filtered data."
                                type="info"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />
                        )}

                        <div style={{
                            backgroundColor: '#e6fffb',
                            padding: '12px',
                            borderRadius: '6px',
                            borderLeft: '3px solid #52c41a',
                            marginBottom: '16px'
                        }}>
                            <Text strong style={{ color: '#52c41a' }}>
                                <ThunderboltOutlined style={{ marginRight: '4px' }} />
                                Email Preview:
                            </Text>
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                📧 Ready to send {immediateEmailForm.getFieldValue('dataSource') === 'selected' ?
                                    `${selectedRowKeys.length} selected records` :
                                    `${filteredData.length} filtered records`} immediately<br />
                                📊 Current filters: {statusFilter} • {permissionFilter} • {violationFilter}<br />
                                🏠 Hostel: {hostelFilter}<br />
                                📅 {dateRange?.length ?
                                    `${dayjs(dateRange[0]).format('MMM D')} - ${dayjs(dateRange[1]).format('MMM D, YYYY')}` :
                                    'All dates'}
                            </div>
                        </div>

                        <Row gutter={16}>
                            <Col span={12}>
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
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Format"
                                    name="format"
                                    rules={[{ required: true, message: 'Please select format' }]}
                                >
                                    <Radio.Group>


                                        <Radio.Button value="excel">
                                            <FileExcelOutlined style={{ marginRight: '4px' }} />
                                            Excel
                                        </Radio.Button>
                                        <Radio.Button value="pdf">
                                            <FilePdfOutlined style={{ marginRight: '4px' }} />
                                            PDF
                                        </Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label={
                                <span>
                                    <UserOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                                    Email Recipients (TO) <span style={{ color: 'red' }}>*</span>
                                    <Tooltip title="Search from user directory or type emails manually">
                                        <InfoCircleOutlined style={{ marginLeft: '4px', color: '#666' }} />
                                    </Tooltip>
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
                                        const invalidEmails = value.filter(email => !EMAIL_REGEX.test(email));
                                        if (invalidEmails.length > 0) {
                                            return Promise.reject(`Invalid email format: ${invalidEmails.join(', ')}`);
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <EnhancedEmailSelect
                                loading={loadingUsers}
                                placeholder="🔍 Search users or type email@domain.com"
                                formInstance={immediateEmailForm}
                                fieldName="toEmails"
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span>
                                    <UserOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                                    CC Recipients (Optional)
                                </span>
                            }
                            name="ccEmails"
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (!value || value.length === 0) return Promise.resolve();
                                        const invalidEmails = value.filter(email => !EMAIL_REGEX.test(email));
                                        if (invalidEmails.length > 0) {
                                            return Promise.reject(`Invalid CC email format: ${invalidEmails.join(', ')}`);
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <EnhancedEmailSelect
                                loading={loadingUsers}
                                placeholder="🔍 Optional CC recipients"
                                formInstance={immediateEmailForm}
                                fieldName="ccEmails"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Email Subject"
                            name="subject"
                            rules={[{ required: true, message: 'Please enter email subject' }]}
                        >
                            <Input
                                placeholder="Email subject line..."
                                showCount
                                maxLength={100}
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

                        <Form.Item>
                            <Space direction="vertical">
                                <Form.Item name="includeViolations" valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Checkbox>Include detailed violation analysis in reports</Checkbox>
                                </Form.Item>
                                <Form.Item name="showPreview" valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Checkbox>
                                        <EyeOutlined style={{ marginRight: '4px' }} />
                                        Preview data before sending (recommended for {filteredData.length > 10 ? 'large datasets' : 'verification'})
                                    </Checkbox>
                                </Form.Item>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* 🚀 ENHANCED: Schedule Modal with Row Selection Support */}
                <Modal
                    title={
                        <span>
                            <ScheduleOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                            Schedule Email Reports with Row Selection
                        </span>
                    }
                    open={scheduleModalVisible}
                    onCancel={() => {
                        setScheduleModalVisible(false);
                        scheduleForm.resetFields();
                        setRepeatType("weekly");
                        setRepeatInterval(1);
                        setSelectedWeekdays([1, 2, 3, 4, 5]);
                        setMonthlyDay(1);
                        setEndsType("never");
                        setEndDate("");
                        setOccurrenceCount(10);
                    }}
                    onOk={() => handleScheduleSetup()}
                    confirmLoading={scheduleLoading}
                    width={900}
                    okText="Create Schedule"
                    cancelText="Cancel"
                >
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f6f6f6', borderRadius: '6px' }}>
                        <Text type="secondary">
                            Configure automated email schedules for reports with enhanced row selection support and violation tracking. Use <strong>Repeat</strong> options for flexible scheduling.
                        </Text>
                    </div>

                    <Form
                        form={scheduleForm}
                        layout="vertical"
                        initialValues={{
                            time: dayjs('09:00', 'HH:mm'),
                            reportType: ['full'],
                            formats: ['excel'],
                            toEmails: [],
                            ccEmails: [],
                            bccEmails: [],
                            message: '',
                            includeViolations: true,
                            dataSource: 'filtered'
                        }}
                    >
                        {/* 🆕 NEW: Data Source Selection for Schedules */}
                        <Form.Item
                            label="Data Source for Scheduled Reports"
                            name="dataSource"
                            rules={[{ required: true, message: 'Please select data source' }]}
                        >
                            <Radio.Group>
                                <Radio.Button value="filtered">
                                    <UnorderedListOutlined style={{ marginRight: '4px' }} />
                                    Current Filtered Data ({filteredData.length} records)
                                </Radio.Button>
                                <Radio.Button
                                    value="selected"
                                    disabled={selectedRowKeys.length === 0}
                                    style={{
                                        backgroundColor: selectedRowKeys.length > 0 ? '#f6ffed' : undefined,
                                        borderColor: selectedRowKeys.length > 0 ? '#b7eb8f' : undefined
                                    }}
                                >
                                    <CheckSquareOutlined style={{ marginRight: '4px' }} />
                                    Current Selected Rows ({selectedRowKeys.length} records snapshot)
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        {selectedRowKeys.length === 0 && (
                            <Alert
                                message="No rows currently selected"
                                description="Select rows in the table to enable 'Current Selected Rows' option for scheduled reports."
                                type="info"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />
                        )}

                        {/* Email Recipients Section */}
                        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                            <Title level={5} style={{ margin: '0 0 16px 0', color: '#1890ff' }}>
                                <MailOutlined style={{ marginRight: '8px' }} />
                                Enhanced Email Recipients
                                {loadingUsers && <Spin size="small" style={{ marginLeft: '8px' }} />}
                            </Title>

                            {escalationUsers.length > 0 && (
                                <div style={{
                                    marginBottom: '12px',
                                    padding: '8px 12px',
                                    backgroundColor: '#f6ffed',
                                    border: '1px solid #b7eb8f',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}>
                                    <Text style={{ color: '#52c41a' }}>
                                        👥 <strong>{escalationUsers.length} users</strong> loaded from directory •
                                        Search by name, email, or designation • Manual entry supported
                                    </Text>
                                </div>
                            )}

                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <Form.Item
                                        label={
                                            <span>
                                                <UserOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                                                To Recipients <span style={{ color: 'red' }}>*</span>
                                                <Tooltip title="Search by name, email, or designation from user directory, or type emails manually">
                                                    <InfoCircleOutlined style={{ marginLeft: '4px', color: '#666' }} />
                                                </Tooltip>
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
                                                    const invalidEmails = value.filter(email => !EMAIL_REGEX.test(email));
                                                    if (invalidEmails.length > 0) {
                                                        return Promise.reject(`Invalid email format: ${invalidEmails.join(', ')}`);
                                                    }
                                                    return Promise.resolve();
                                                }
                                            }
                                        ]}
                                    >
                                        <EnhancedEmailSelect
                                            loading={loadingUsers}
                                            placeholder="🔍 Search users or type email@domain.com"
                                            formInstance={scheduleForm}
                                            fieldName="toEmails"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        label={
                                            <span>
                                                <UserOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                                                CC Recipients (Optional)
                                                <Tooltip title="Carbon copy - recipients will see other CC/TO addresses">
                                                    <InfoCircleOutlined style={{ marginLeft: '4px', color: '#666' }} />
                                                </Tooltip>
                                            </span>
                                        }
                                        name="ccEmails"
                                        rules={[
                                            {
                                                validator: (_, value) => {
                                                    if (!value || value.length === 0) return Promise.resolve();
                                                    const invalidEmails = value.filter(email => !EMAIL_REGEX.test(email));
                                                    if (invalidEmails.length > 0) {
                                                        return Promise.reject(`Invalid CC email format: ${invalidEmails.join(', ')}`);
                                                    }
                                                    return Promise.resolve();
                                                }
                                            }
                                        ]}
                                    >
                                        <EnhancedEmailSelect
                                            loading={loadingUsers}
                                            placeholder="🔍 Optional CC recipients"
                                            formInstance={scheduleForm}
                                            fieldName="ccEmails"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        label={
                                            <span>
                                                <MailOutlined style={{ marginRight: '4px', color: '#722ed1' }} />
                                                BCC Recipients (Optional)
                                                <Tooltip title="Blind carbon copy - recipients won't see other BCC addresses">
                                                    <InfoCircleOutlined style={{ marginLeft: '4px', color: '#666' }} />
                                                </Tooltip>
                                            </span>
                                        }
                                        name="bccEmails"
                                        rules={[
                                            {
                                                validator: (_, value) => {
                                                    if (!value || value.length === 0) return Promise.resolve();
                                                    const invalidEmails = value.filter(email => !EMAIL_REGEX.test(email));
                                                    if (invalidEmails.length > 0) {
                                                        return Promise.reject(`Invalid BCC email format: ${invalidEmails.join(', ')}`);
                                                    }
                                                    return Promise.resolve();
                                                }
                                            }
                                        ]}
                                    >
                                        <EnhancedEmailSelect
                                            loading={loadingUsers}
                                            placeholder="🔍 Optional BCC recipients"
                                            formInstance={scheduleForm}
                                            fieldName="bccEmails"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* Schedule Configuration */}
                        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                            <Title level={5} style={{ margin: '0 0 16px 0', color: '#722ed1' }}>
                                <ClockCircleOutlined style={{ marginRight: '8px' }} />
                                Schedule Configuration
                            </Title>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        label="Send Time"
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

                                <Col span={8}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Repeat
                                        </label>
                                        <Select
                                            value={repeatType}
                                            onChange={setRepeatType}
                                            style={{ width: '100%' }}
                                        >
                                            <Option value="none">Does not repeat</Option>
                                            <Option value="daily">Daily</Option>
                                            <Option value="weekly">Weekly</Option>
                                            <Option value="monthly">Monthly</Option>
                                            <Option value="custom">Custom...</Option>
                                        </Select>
                                        <small style={{ color: '#666', fontSize: '12px' }}>
                                            {getRepeatSummary()}
                                        </small>
                                    </div>
                                </Col>

                                {repeatType !== "none" && (
                                    <Col span={8}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                                Interval
                                            </label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={365}
                                                value={repeatInterval}
                                                onChange={(e) => setRepeatInterval(Number(e.target.value) || 1)}
                                                placeholder="1"
                                                addonBefore="Every"
                                            />
                                        </div>
                                    </Col>
                                )}
                            </Row>

                            {/* Weekdays Selection */}
                            {(repeatType === "weekly" || repeatType === "custom") && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        Weekdays
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {WEEKDAYS.map((day) => (
                                            <Button
                                                key={day.key}
                                                size="small"
                                                type={selectedWeekdays.includes(day.key) ? "primary" : "default"}
                                                onClick={() => toggleWeekday(day.key)}
                                                style={{
                                                    minWidth: '40px',
                                                    backgroundColor: selectedWeekdays.includes(day.key) ? '#1890ff' : undefined,
                                                    borderColor: selectedWeekdays.includes(day.key) ? '#1890ff' : undefined,
                                                    color: selectedWeekdays.includes(day.key) ? 'white' : undefined
                                                }}
                                            >
                                                {day.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Monthly Day Selection */}
                            {(repeatType === "monthly" || repeatType === "custom") && (
                                <Row gutter={16} style={{ marginBottom: '16px' }}>
                                    <Col span={8}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                                Day of Month
                                            </label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={31}
                                                value={monthlyDay}
                                                onChange={(e) => setMonthlyDay(Number(e.target.value) || 1)}
                                                placeholder="1"
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            )}

                            {/* Ends Configuration */}
                            {repeatType !== "none" && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        Ends
                                    </label>
                                    <div style={{ marginBottom: '12px' }}>
                                        <Radio.Group value={endsType} onChange={(e) => setEndsType(e.target.value)}>
                                            <Radio.Button value="never">Never</Radio.Button>
                                            <Radio.Button value="on">On Date</Radio.Button>
                                            <Radio.Button value="after">After N Times</Radio.Button>
                                        </Radio.Group>
                                    </div>

                                    {endsType === "on" && (
                                        <div style={{ maxWidth: '200px' }}>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                placeholder="Select end date"
                                            />
                                        </div>
                                    )}

                                    {endsType === "after" && (
                                        <div style={{ maxWidth: '150px' }}>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={1000}
                                                value={occurrenceCount}
                                                onChange={(e) => setOccurrenceCount(Number(e.target.value) || 1)}
                                                placeholder="10"
                                                addonAfter="times"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Report Configuration */}
                        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                            <Title level={5} style={{ margin: '0 0 16px 0', color: '#52c41a' }}>
                                <FileTextOutlined style={{ marginRight: '8px' }} />
                                Report Configuration
                            </Title>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Report Types to Include"
                                        name="reportType"
                                        rules={[{ required: true, message: 'Please select at least one report type' }]}
                                    >
                                        <Checkbox.Group>
                                            <Row>
                                                <Col span={24}>
                                                    <Checkbox value="full">Full Report</Checkbox>
                                                </Col>
                                                <Col span={24}>
                                                    <Checkbox value="violations">Violations Report</Checkbox>
                                                </Col>
                                            </Row>
                                        </Checkbox.Group>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        label="Report Formats to Include"
                                        name="formats"
                                        rules={[{ required: true, message: 'Please select at least one format' }]}
                                    >
                                        <Checkbox.Group>
                                            <Row>
                                                <Col span={24}>
                                                    <Checkbox value="excel">
                                                        <FileExcelOutlined style={{ marginRight: '4px' }} />
                                                        Excel (.xlsx)
                                                    </Checkbox>
                                                </Col>
                                                <Col span={24}>
                                                    <Checkbox value="pdf">
                                                        <FilePdfOutlined style={{ marginRight: '4px' }} />
                                                        PDF Document
                                                    </Checkbox>
                                                </Col>
                                            </Row>
                                        </Checkbox.Group>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="includeViolations" valuePropName="checked">
                                <Checkbox>Include detailed Leave/Outpass violation analysis in reports</Checkbox>
                            </Form.Item>
                            <Form.Item name="showPreview" valuePropName="checked" style={{ marginBottom: 0 }}>
                                <Checkbox>
                                    <EyeOutlined style={{ marginRight: '4px' }} />
                                    Preview data before creating schedule
                                </Checkbox>
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
                        </div>

                        {/* Schedule Preview */}
                        <div style={{
                            backgroundColor: '#f0f9ff',
                            padding: '12px',
                            borderRadius: '6px',
                            borderLeft: '3px solid #722ed1',
                            marginTop: '16px'
                        }}>
                            <Text strong style={{ color: '#722ed1' }}>Schedule Preview:</Text>
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                <div>📧 <strong>Repeat:</strong> {getRepeatSummary()}</div>
                                <div>⏰ <strong>Time:</strong> {scheduleForm.getFieldValue('time')?.format?.('hh:mm A') || '09:00 AM'}</div>
                                <div>📊 <strong>Data:</strong> {scheduleForm.getFieldValue('dataSource') === 'selected' ?
                                    `${selectedRowKeys.length} selected rows snapshot` :
                                    'Current filtered data (updates with filters)'}</div>
                                <div>📋 <strong>Ends:</strong> {endsType === 'never' ? 'Never' : endsType === 'on' ? `On ${endDate}` : `After ${occurrenceCount} occurrences`}</div>
                                <div>⚠️ You can modify or cancel schedules anytime in the Schedules tab</div>
                            </div>
                        </div>
                    </Form>
                </Modal>

                {/* Schedule Details Modal */}
                <Modal
                    title={
                        <span>
                            <InfoCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            {selectedSchedule?.isEnhanced ? 'Enhanced Schedule Details' : 'Schedule Details'}
                            {selectedSchedule?.isEnhanced && (
                                <Badge count="Enhanced" style={{ backgroundColor: '#52c41a', marginLeft: '8px' }} />
                            )}
                        </span>
                    }
                    open={scheduleDetailsVisible}
                    onCancel={() => setScheduleDetailsVisible(false)}
                    footer={[
                        <Button key="close" onClick={() => setScheduleDetailsVisible(false)}>
                            Close
                        </Button>,
                        <Popconfirm
                            key="cancel"
                            title="Cancel Schedule"
                            description="Are you sure you want to cancel this email schedule?"
                            onConfirm={() => {
                                cancelSchedule(selectedSchedule?.id);
                                setScheduleDetailsVisible(false);
                            }}
                            okText="Yes, Cancel"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                        >
                            <Button danger icon={<StopOutlined />} loading={cancelScheduleLoading}>
                                Cancel Schedule
                            </Button>
                        </Popconfirm>
                    ]}
                    width={800}
                >
                    {selectedSchedule && (
                        <div>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Card size="small" title="Schedule Information" style={{ marginBottom: '16px' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Type:</Text> {selectedSchedule.isEnhanced ?
                                                <Tag color="green">Enhanced with Row Selection</Tag> :
                                                <Tag>Standard Schedule</Tag>
                                            }
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Frequency:</Text> {selectedSchedule.frequency.charAt(0).toUpperCase() + selectedSchedule.frequency.slice(1)}
                                        </div>
                                        {selectedSchedule.scheduleSummary && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <Text strong>Schedule:</Text>
                                                <div style={{ marginTop: '4px', padding: '6px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                                                    <Text style={{ color: '#1890ff', fontSize: '13px' }}>{selectedSchedule.scheduleSummary}</Text>
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Delivery Time:</Text> {formatTime(selectedSchedule.delivery_time)}
                                        </div>
                                        {selectedSchedule.next_run_time && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <Text strong>Next Run:</Text>
                                                <Text style={{ color: '#52c41a', marginLeft: '8px' }}>
                                                    {dayjs(selectedSchedule.next_run_time).format('MMM D, YYYY hh:mm A')}
                                                </Text>
                                            </div>
                                        )}
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Created:</Text> {dayjs(selectedSchedule.created_at).format('MMM D, YYYY HH:mm')}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Status:</Text> <Tag color="success">Active</Tag>
                                        </div>
                                    </Card>

                                    {selectedSchedule.isEnhanced && selectedSchedule.enhancedScheduleRule && (
                                        <Card size="small" title="Advanced Scheduling Rules">
                                            {selectedSchedule.repeat_interval && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    <Text strong>Interval:</Text> Every {selectedSchedule.repeat_interval} {selectedSchedule.frequency}(s)
                                                </div>
                                            )}
                                            {selectedSchedule.weekdaysArray && selectedSchedule.weekdaysArray.length > 0 && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    <Text strong>Weekdays:</Text>
                                                    <div style={{ marginTop: '4px' }}>
                                                        {selectedSchedule.weekdaysArray.map(dayKey => {
                                                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                            return (
                                                                <Tag key={dayKey} size="small" color="blue">
                                                                    {dayNames[dayKey]}
                                                                </Tag>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedSchedule.monthly_day && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    <Text strong>Monthly Day:</Text> {selectedSchedule.monthly_day}
                                                </div>
                                            )}
                                            {selectedSchedule.ends_type && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    <Text strong>Ends:</Text>
                                                    {selectedSchedule.ends_type === 'never' && ' Never'}
                                                    {selectedSchedule.ends_type === 'on' && selectedSchedule.end_date &&
                                                        ` On ${dayjs(selectedSchedule.end_date).format('MMM D, YYYY')}`}
                                                    {selectedSchedule.ends_type === 'after' && selectedSchedule.max_occurrences &&
                                                        ` After ${selectedSchedule.max_occurrences} occurrences`}
                                                </div>
                                            )}
                                        </Card>
                                    )}
                                </Col>

                                <Col span={12}>
                                    <Card size="small" title="Delivery Stats" style={{ marginBottom: '16px' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Total Sent:</Text> {selectedSchedule.total_sent || 0}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Last Sent:</Text> {selectedSchedule.last_sent ?
                                                dayjs(selectedSchedule.last_sent).format('MMM D, YYYY HH:mm') :
                                                'Not sent yet'}
                                        </div>
                                        {selectedSchedule.max_occurrences && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <Text strong>Progress:</Text>
                                                <div style={{ marginTop: '4px' }}>
                                                    <Text style={{ color: '#722ed1' }}>
                                                        {selectedSchedule.current_occurrences || 0} / {selectedSchedule.max_occurrences} occurrences
                                                    </Text>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '6px',
                                                        backgroundColor: '#f0f0f0',
                                                        borderRadius: '3px',
                                                        marginTop: '4px'
                                                    }}>
                                                        <div style={{
                                                            width: `${((selectedSchedule.current_occurrences || 0) / selectedSchedule.max_occurrences) * 100}%`,
                                                            height: '100%',
                                                            backgroundColor: '#722ed1',
                                                            borderRadius: '3px'
                                                        }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedSchedule.error_message && (
                                            <div style={{ marginTop: '12px' }}>
                                                <Alert
                                                    message="Last Error"
                                                    description={selectedSchedule.error_message}
                                                    type="error"
                                                    size="small"
                                                />
                                            </div>
                                        )}
                                    </Card>

                                    <Card size="small" title="Report Configuration">
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Report Types:</Text>
                                            <div style={{ marginTop: '4px' }}>
                                                {selectedSchedule.reportTypes.map(type => (
                                                    <Tag key={type} size="small" color={type === 'violations' ? 'red' : 'blue'}>
                                                        {type === 'violations' ? 'Violations' : 'Full Report'}
                                                    </Tag>
                                                ))}
                                            </div>
                                        </div>
                                        {selectedSchedule.formats && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <Text strong>Formats:</Text>
                                                <div style={{ marginTop: '4px' }}>
                                                    {selectedSchedule.formats.map(format => (
                                                        <Tag key={format} size="small" color="cyan">
                                                            {format.toUpperCase()}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <Text strong>Include Violations:</Text> {selectedSchedule.include_violations ? 'Yes' : 'No'}
                                        </div>
                                    </Card>
                                </Col>
                            </Row>

                            <Divider />

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Card size="small" title="TO Recipients">
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Count:</Text> {selectedSchedule.recipientsCount.to}
                                        </div>
                                        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                            {selectedSchedule.emails.map((email, index) => (
                                                <Tag key={index} style={{ margin: '2px', fontSize: '11px' }}>{email}</Tag>
                                            ))}
                                        </div>
                                    </Card>
                                </Col>

                                {selectedSchedule.ccEmails.length > 0 && (
                                    <Col span={8}>
                                        <Card size="small" title="CC Recipients">
                                            <div style={{ marginBottom: '8px' }}>
                                                <Text strong>Count:</Text> {selectedSchedule.recipientsCount.cc}
                                            </div>
                                            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                {selectedSchedule.ccEmails.map((email, index) => (
                                                    <Tag key={index} color="orange" style={{ margin: '2px', fontSize: '11px' }}>{email}</Tag>
                                                ))}
                                            </div>
                                        </Card>
                                    </Col>
                                )}

                                {selectedSchedule.bccEmails.length > 0 && (
                                    <Col span={8}>
                                        <Card size="small" title="BCC Recipients">
                                            <div style={{ marginBottom: '8px' }}>
                                                <Text strong>Count:</Text> {selectedSchedule.recipientsCount.bcc}
                                            </div>
                                            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                {selectedSchedule.bccEmails.map((email, index) => (
                                                    <Tag key={index} color="purple" style={{ margin: '2px', fontSize: '11px' }}>{email}</Tag>
                                                ))}
                                            </div>
                                        </Card>
                                    </Col>
                                )}
                            </Row>

                            {selectedSchedule.custom_message && (
                                <>
                                    <Divider />
                                    <Card size="small" title="Custom Message">
                                        <Text>{selectedSchedule.custom_message}</Text>
                                    </Card>
                                </>
                            )}
                        </div>
                    )}
                </Modal>
            </div>

            <style jsx global>{`
                .critical-violation-row {
                    background-color: #fff2f0 !important;
                    border-left: 4px solid #ff4d4f !important;
                }
                .critical-violation-row:hover {
                    background-color: #ffebee !important;
                }
                .selected-row {
                    background-color: #e6f7ff !important;
                    border-left: 4px solid #1890ff !important;
                }
                .selected-row:hover {
                    background-color: #d4edda !important;
                }
                .selected-row.critical-violation-row {
                    background: linear-gradient(90deg, #fff2f0 0%, #e6f7ff 100%) !important;
                    border-left: 4px solid #722ed1 !important;
                }
            `}</style>
        </div>
    );
};

export default ReportsSection;