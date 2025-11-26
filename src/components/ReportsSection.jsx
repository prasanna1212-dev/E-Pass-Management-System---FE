import React, { useEffect, useState, useCallback,useMemo } from "react";
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
    Empty
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
    ClockCircleOutlined,
    MailOutlined,
    StopOutlined,
    PlayCircleOutlined,
    SettingOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    FireOutlined,
    MoonOutlined,
    ClockCircleFilled
} from "@ant-design/icons";
import toast from "react-hot-toast";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const POLLING_INTERVAL = 120000;

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

const ReportsSection = () => {
    // Core Data States - Following OutPassRequest pattern
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter States - Following OutPassRequest exact pattern
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
    // Schedule Management Modal States
    const [scheduleManagementVisible, setScheduleManagementVisible] = useState(false);
    const [scheduleDetailsVisible, setScheduleDetailsVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    // Form States
    const [exportForm] = Form.useForm();
    const [scheduleForm] = Form.useForm();
    const [immediateEmailForm] = Form.useForm();

    // Loading States
    const [exportLoading, setExportLoading] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [immediateEmailLoading, setImmediateEmailLoading] = useState(false);
    // Schedule Management Loading States
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [cancelScheduleLoading, setCancelScheduleLoading] = useState(false);

    // Schedules State
    const [schedules, setSchedules] = useState([]);
    const [activeTab, setActiveTab] = useState('reports');

    // ✨ ENHANCED: Advanced Stats with proper leave/outpass violation types
    const [statistics, setStatistics] = useState({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        violations: 0,
        lateEntries: 0,
        overdue: 0,
        // 🆕 UPDATED: Leave-specific violations
        leaveLateReturns: 0,        // Leave: After 9 PM on same day
        leaveCriticalViolations: 0, // Leave: Returned on later days
        // 🆕 UPDATED: Outpass-specific violations
        outpassDurationExceeded: 0,  // Outpass: Exceeded requested duration
        outpassExtended: 0,          // Outpass: 2+ hours over duration
        outpassAfterHours: 0,        // Outpass: After 9 PM returns
        outpassCritical: 0           // Outpass: Extended + After hours
    });
    const [hostels, setHostels] = useState([]);

    const [repeatType, setRepeatType] = useState("weekly");
    const [repeatInterval, setRepeatInterval] = useState(1);
    const [selectedWeekdays, setSelectedWeekdays] = useState([1, 2, 3, 4, 5]); // Mon-Fri default
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

    const fetchEscalationUsers = useCallback(async () => {
        if (usersFetched) return; // Don't fetch if already loaded

        setLoadingUsers(true);
        try {
            console.log('📧 Fetching escalation users from API...');

            const response = await fetch(`https://172.30.6.12:5059/api/escalation-masters/getinfo`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const users = await response.json();

            // Transform users for easier use in selects
            const transformedUsers = users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                designation: user.designation,
                // Create search-friendly display text
                searchText: `${user.name} ${user.email} ${user.designation}`.toLowerCase(),
                // Create display label
                displayLabel: `${user.name} (${user.designation})`,
                value: user.email // The actual value we want to store
            }));

            setEscalationUsers(transformedUsers);
            setUsersFetched(true);

            console.log('✅ Escalation users loaded:', transformedUsers.length);

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

    const splitEmails = (emailString) =>
        emailString
            .split(/[,;\s]+/)
            .map(email => email.trim())
            .filter(Boolean);

    const validateEmails = (emailArray) => emailArray.every(email => EMAIL_REGEX.test(email));

    // ✅ ENHANCED: Violation cache for performance
    const violationCache = new Map();

    // ✨ COMPLETELY UPDATED: Advanced violation analysis with proper Leave/Outpass logic
    // ✅ FIXED: Enhanced violation analysis with proper data structure handling
    const analyzeViolations = useCallback((record) => {
        const cacheKey = `${record.id}_${record.entry_time}_${record.expected_return_datetime}_${record.permission}`;
        if (violationCache.has(cacheKey)) {
            return violationCache.get(cacheKey);
        }

        const now = dayjs();
        const violations = {
            // Basic violation flags (backward compatibility)
            isLate: false,
            isOverdue: false,
            isExtended: false,
            isAfterHours: false,
            isCritical: false,
            lateDuration: 0,
            overdueDuration: 0,

            // 🆕 Enhanced violation details
            violationType: null,
            permissionType: 'unknown',
            exceedDuration: 0,
            daysLate: 0,
            returnTime: null,
            expectedReturn: null,
            dataSource: record.request_type || 'unknown' // 'outpass' or 'leave'
        };

        try {
            // 🔍 STEP 1: Determine permission type with fallback logic
            const permissionType = (record.permission || '').toLowerCase();
            const requestType = (record.request_type || '').toLowerCase();

            // Enhanced permission type detection
            violations.permissionType =
                permissionType === 'leave' || requestType === 'leave' ? 'leave' :
                    permissionType === 'permission' || permissionType === 'outpass' || requestType === 'outpass' ? 'outpass' :
                        'unknown';

            console.log(`🔍 Analyzing ${record.name}: Type=${violations.permissionType}, Source=${violations.dataSource}`);

            // 🔍 STEP 2: Enhanced validation with better error handling
            if (!record.entry_time) {
                // Check for overdue (accepted but no entry)
                if (record.status === 'Accepted') {
                    let expectedReturn;

                    // 🔥 FIXED: Use the pre-calculated expected_return_datetime if available
                    if (record.expected_return_datetime) {
                        expectedReturn = dayjs(record.expected_return_datetime);
                    } else {
                        // Fallback to manual calculation
                        expectedReturn = dayjs(`${record.date_to} ${record.time_in}`);
                    }

                    if (expectedReturn.isValid() && now.isAfter(expectedReturn)) {
                        violations.isOverdue = true;
                        violations.overdueDuration = now.diff(expectedReturn, 'hour', true);
                        violations.expectedReturn = expectedReturn;
                    }
                }
                violationCache.set(cacheKey, violations);
                return violations;
            }

            // 🔍 STEP 3: Enhanced time parsing with proper fallback
            let expectedReturn;
            let actualReturn = dayjs(record.entry_time);

            if (record.expected_return_datetime) {
                // 🔥 NEW: Use pre-calculated datetime for accuracy
                expectedReturn = dayjs(record.expected_return_datetime);
            } else {
                // Fallback to manual combination
                if (record.date_to && record.time_in) {
                    // Handle different date formats
                    const dateStr = record.date_to.includes('T') ?
                        record.date_to.split('T')[0] :
                        record.date_to;
                    expectedReturn = dayjs(`${dateStr} ${record.time_in}`);
                }
            }

            if (!actualReturn.isValid() || !expectedReturn.isValid()) {
                console.warn(`⚠️ Invalid dates for ${record.name}: actual=${record.entry_time}, expected=${expectedReturn}`);
                violationCache.set(cacheKey, violations);
                return violations;
            }

            violations.returnTime = actualReturn;
            violations.expectedReturn = expectedReturn;

            // 🔍 STEP 4: Enhanced timing calculations
            const timeDifferenceHours = actualReturn.diff(expectedReturn, 'hour', true);
            const daysDifference = Math.max(0, actualReturn.diff(expectedReturn.startOf('day'), 'day'));

            violations.lateDuration = Math.max(0, timeDifferenceHours);
            violations.daysLate = daysDifference;

            console.log(`📊 ${record.name}: ${timeDifferenceHours.toFixed(2)}h difference, ${daysDifference} days late`);

            // 🔍 STEP 5: Permission-specific violation analysis
            if (violations.permissionType === 'leave') {
                // 📋 LEAVE TYPE VIOLATIONS

                if (daysDifference > 0) {
                    // 🚨 CRITICAL: Returned on later days
                    violations.isCritical = true;
                    violations.isLate = true;
                    violations.violationType = 'leave_critical';
                    console.log(`🚨 Leave Critical: ${record.name} returned ${daysDifference} days late`);

                } else if (daysDifference === 0) {
                    // Same day return - check time
                    const returnHour = actualReturn.hour();

                    if (timeDifferenceHours > 0 && returnHour >= 21) {
                        // ⚠️ LATE: Returned after 9 PM on same day
                        violations.isLate = true;
                        violations.isAfterHours = true;
                        violations.violationType = 'leave_late';
                        console.log(`⚠️ Leave Late: ${record.name} returned at ${actualReturn.format('HH:mm')} (after 9PM)`);

                    } else if (timeDifferenceHours > 0.25) {
                        // Minor late return (before 9 PM but late)
                        violations.isLate = true;
                        violations.violationType = 'leave_late';
                        console.log(`⏰ Leave Minor Late: ${record.name} ${Math.round(timeDifferenceHours * 60)}min late`);
                    }
                }

            } else if (violations.permissionType === 'outpass') {
                // 🎯 OUTPASS TYPE VIOLATIONS

                // Calculate requested duration more accurately
                let requestedDurationHours = 2; // Default

                if (record.time_out && record.time_in) {
                    // Calculate duration from time fields
                    const outTime = dayjs(`${record.date_from || record.date_to} ${record.time_out}`);
                    if (outTime.isValid()) {
                        requestedDurationHours = expectedReturn.diff(outTime, 'hour', true);
                    }
                } else if (record.duration) {
                    // Parse duration string if available (e.g., "2H 30M")
                    const durationMatch = record.duration.match(/(\d+)H.*?(\d+)M/);
                    if (durationMatch) {
                        requestedDurationHours = parseInt(durationMatch[1]) + (parseInt(durationMatch[2]) / 60);
                    }
                }

                violations.exceedDuration = Math.max(0, timeDifferenceHours);

                if (violations.exceedDuration > 0) {
                    violations.isLate = true;

                    // Check for extended duration (2+ hours over)
                    if (violations.exceedDuration >= 2.0) {
                        violations.isExtended = true;

                        // Check for after hours (9 PM+) on same day
                        const returnHour = actualReturn.hour();
                        const sameDay = actualReturn.format('YYYY-MM-DD') === expectedReturn.format('YYYY-MM-DD');

                        if (sameDay && returnHour >= 21) {
                            violations.isAfterHours = true;
                            violations.isCritical = true;
                            violations.violationType = 'outpass_critical';
                            console.log(`🚨 Outpass Critical: ${record.name} ${Math.round(violations.exceedDuration)}h over + after 9PM`);
                        } else {
                            violations.violationType = 'outpass_extended';
                            console.log(`🔥 Outpass Extended: ${record.name} ${Math.round(violations.exceedDuration)}h over`);
                        }
                    } else {
                        // Regular duration exceeded (less than 2 hours)
                        violations.violationType = 'outpass_duration';
                        console.log(`⏰ Outpass Duration: ${record.name} ${Math.round(violations.exceedDuration * 60)}min over`);
                    }

                    // Separate after hours check
                    if (!violations.isCritical && actualReturn.hour() >= 21) {
                        violations.isAfterHours = true;
                        console.log(`🌙 Outpass After Hours: ${record.name} returned after 9PM`);
                    }
                }

            } else {
                // 🔄 LEGACY/UNKNOWN TYPE - backward compatibility
                if (timeDifferenceHours > 0) {
                    violations.isLate = true;
                    violations.lateDuration = timeDifferenceHours;

                    if (timeDifferenceHours >= 2.0) {
                        violations.isExtended = true;
                    }

                    if (actualReturn.hour() >= 21) {
                        violations.isAfterHours = true;
                    }

                    if (violations.isExtended && violations.isAfterHours) {
                        violations.isCritical = true;
                    }

                    violations.violationType = 'legacy';
                    console.log(`🔄 Legacy: ${record.name} ${Math.round(timeDifferenceHours)}h late`);
                }
            }

            // 🔍 STEP 6: Final overdue check
            if (record.status === 'Accepted' && !record.entry_time && now.isAfter(expectedReturn)) {
                violations.isOverdue = true;
                violations.overdueDuration = now.diff(expectedReturn, 'hour', true);
                console.log(`📅 Overdue: ${record.name} ${Math.round(violations.overdueDuration)}h overdue`);
            }

        } catch (error) {
            console.error(`❌ Violation analysis error for ${record.name}:`, error);
        }

        violationCache.set(cacheKey, violations);
        return violations;
    }, []);

    // Unified fetch function following OutPassRequest pattern
    const fetchReportsData = useCallback(async () => {
        setLoading(true);
        try {
            // Try the unified endpoint first (matching OutPassRequest pattern)
            let res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);

            // Fallback to old endpoint if needed
            if (!res.ok) {
                res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);
            }

            if (!res.ok) throw new Error("Failed to fetch data");

            const result = await res.json();

            // Ensure unique records and add unique keys to prevent React key conflicts
            const uniqueRecords = result.reduce((acc, item, index) => {
                const uniqueKey = `${item.id}_${item.created_at}_${index}`;
                const recordWithUniqueKey = { ...item, uniqueKey };

                // Check if record with same ID already exists
                const existingIndex = acc.findIndex(existing => existing.id === item.id);
                if (existingIndex >= 0) {
                    // Keep the more recent record (with updated_at or created_at)
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

            // Sort: newest updated/created at the top - exactly like OutPassRequest
            const sorted = uniqueRecords.sort((a, b) => {
                const aTime = a.updated_at || a.created_at;
                const bTime = b.updated_at || b.created_at;
                return dayjs(bTime).valueOf() - dayjs(aTime).valueOf();
            });

            console.log('📊 Data loaded with enhanced Leave/Outpass violation analysis:', {
                originalRecords: result.length,
                uniqueRecords: sorted.length,
                duplicatesRemoved: result.length - sorted.length
            });

            // Clear violation cache on new data
            violationCache.clear();

            // Update states atomically
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

    // Fetch existing schedules
    const fetchSchedules = useCallback(async () => {
        setSchedulesLoading(true);
        try {
            console.log('📅 Fetching existing schedules...');

            // Try new API first, then fallback - like OutPassRequest
            let res = await fetch(`${API_BASE_URL}/reports-route/reports/schedules`);

            if (!res.ok) {
                res = await fetch(`${API_BASE_URL}/reports-route/reports/schedules`);
            }

            if (!res.ok) throw new Error('Failed to fetch schedules');

            const result = await res.json();

            if (result.success) {
                console.log('✅ Schedules loaded:', result.schedules.length);
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

    // Cancel/Delete schedule
    const cancelSchedule = async (scheduleId) => {
        setCancelScheduleLoading(true);
        try {
            console.log('🗑️ Cancelling schedule:', scheduleId);

            // Try new API first, then fallback - like OutPassRequest
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

                // Refresh schedules list
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

    useEffect(() => {
        fetchReportsData();
        const intervalId = setInterval(fetchReportsData, POLLING_INTERVAL);
        return () => clearInterval(intervalId);
    }, [fetchReportsData]);

    // Fetch schedules when management tab is opened
    useEffect(() => {
        if (activeTab === 'schedules') {
            fetchSchedules();
        }
    }, [activeTab, fetchSchedules]);

    // ✅ UPDATED: Statistics calculation with proper Leave/Outpass violation categorization
    const calculateAdvancedStatistics = useCallback((records) => {
        const stats = {
            total: records.length,
            pending: records.filter(r => r.status === 'Pending').length,
            accepted: records.filter(r => r.status === 'Accepted').length,
            rejected: records.filter(r => r.status === 'Rejected').length,
            violations: 0,
            lateEntries: 0,
            overdue: 0,
            // 🆕 UPDATED: Leave-specific violation counters
            leaveLateReturns: 0,
            leaveCriticalViolations: 0,
            // 🆕 UPDATED: Outpass-specific violation counters
            outpassDurationExceeded: 0,
            outpassExtended: 0,
            outpassAfterHours: 0,
            outpassCritical: 0
        };

        records.forEach(record => {
            const violationData = analyzeViolations(record);

            // Count basic violations (backward compatibility)
            if (violationData.isLate) {
                stats.lateEntries++;
                stats.violations++;
            }

            if (violationData.isOverdue) {
                stats.overdue++;
                stats.violations++;
            }

            // 🆕 NEW: Count specific violation types
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

            // Additional checks for outpass after hours (can be combined with other violations)
            if (violationData.permissionType === 'outpass' && violationData.isAfterHours) {
                stats.outpassAfterHours++;
            }
        });

        console.log('📈 Advanced Statistics Calculated:', stats);
        setStatistics(stats);
    }, [analyzeViolations]);

    // Extract hostels
    const extractHostels = (records) => {
        const uniqueHostels = [...new Set(records
            .map(r => r.hostel || r.display_course)
            .filter(Boolean)
        )].sort();
        setHostels(uniqueHostels);
    };

    // ✅ IMPROVED: Apply filters with reliable approach from reference code
    const applyFiltersToData = useCallback(() => {
        if (data.length === 0) {
            setFilteredData([]);
            calculateAdvancedStatistics([]);
            return;
        }

        let filtered = [...data];

        // 1. Search Filter
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

        // 2. Date Range Filter with robust date handling from reference
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

        // 3. Status Filter
        if (statusFilter && statusFilter !== "All") {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        // 4. Permission Filter
        if (permissionFilter && permissionFilter !== "All") {
            filtered = filtered.filter(item => item.permission === permissionFilter);
        }

        // 5. Hostel Filter
        if (hostelFilter && hostelFilter !== "All") {
            filtered = filtered.filter(item =>
                (item.hostel || item.display_course || item.course) === hostelFilter
            );
        }

        // ✅ UPDATED: Enhanced violation filter with proper Leave/Outpass categorization
        if (violationFilter && violationFilter !== "All") {
            filtered = filtered.filter(item => {
                const violationData = analyzeViolations(item);

                switch (violationFilter) {
                    case "Violations":
                        return violationData.isLate || violationData.isOverdue;

                    case "Clean":
                        return !violationData.isLate && !violationData.isOverdue;

                    case "LeaveCritical": // 🆕 NEW: Leave critical violations
                        return violationData.violationType === 'leave_critical';

                    case "LeaveLate": // 🆕 NEW: Leave late returns
                        return violationData.violationType === 'leave_late';

                    case "OutpassCritical": // 🆕 NEW: Outpass critical violations
                        return violationData.violationType === 'outpass_critical';

                    case "OutpassExtended": // 🆕 NEW: Outpass extended duration
                        return violationData.violationType === 'outpass_extended';

                    case "OutpassDuration": // 🆕 NEW: Outpass duration exceeded
                        return violationData.violationType === 'outpass_duration';

                    case "AfterHours": // After hours (both types)
                        return violationData.isAfterHours;

                    case "Late": // Any late entries
                        return violationData.isLate;

                    case "Overdue": // Overdue entries
                        return violationData.isOverdue;

                    // Legacy filters for backward compatibility
                    case "Extended":
                        return violationData.isExtended;

                    case "Critical":
                        return violationData.isCritical;

                    default:
                        return true;
                }
            });
        }

        // Update states atomically
        setFilteredData(filtered);
        calculateAdvancedStatistics(filtered);

    }, [data, search, dateRange, statusFilter, permissionFilter, hostelFilter, violationFilter, analyzeViolations, calculateAdvancedStatistics]);

    // Apply filters when dependencies change
    useEffect(() => {
        applyFiltersToData();
    }, [applyFiltersToData]);

    // Filter handlers - following OutPassRequest pattern with debugging
    const handleSearch = (value) => {
        setSearch(value);
    };

    const handleDateChange = (dates) => {
        setDateRange(dates);
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
    };

    const handlePermissionChange = (value) => {
        setPermissionFilter(value);
    };

    const handleHostelChange = (value) => {
        setHostelFilter(value);
    };

    const handleViolationChange = (value) => {
        setViolationFilter(value);
    };

    // Reset filters - exactly like OutPassRequest
    const resetFilters = () => {
        console.log('🔄 Resetting all filters');
        setSearch("");
        setDateRange([]);
        setStatusFilter("All");
        setPermissionFilter("All");
        setHostelFilter("All");
        setViolationFilter("All");
        toast.success("Filters reset successfully");
    };

    // Format time helper with AM/PM format
    const formatTime = (time) => {
        if (!time) return "N/A";
        try {
            // Handle both HH:mm format and full datetime
            if (time.includes('T') || time.includes(' ')) {
                // Full datetime - use dayjs directly
                return dayjs(time).format('hh:mm A');
            } else {
                // Just time string (HH:mm format)
                const [hour, minute] = time.split(":");
                const date = dayjs().set('hour', parseInt(hour)).set('minute', parseInt(minute));
                return date.format('hh:mm A');
            }
        } catch (error) {
            console.warn('Time formatting error:', error);
            return time; // Return original if formatting fails
        }
    };

    // ✨ COMPLETELY UPDATED: Enhanced violation status renderer with proper Leave/Outpass logic
    const getAdvancedViolationStatus = (record) => {


        const violationData = analyzeViolations(record);
        const violations = [];




        // 🆕 LEAVE TYPE VIOLATIONS
        if (violationData.permissionType === 'leave') {
            switch (violationData.violationType) {
                case 'leave_critical':
                    violations.push(
                        <Tag key="leave-critical" color="red" icon={<FireOutlined />} style={{ fontWeight: 'bold' }}>
                            LEAVE CRITICAL: {violationData.daysLate}d Late Return
                        </Tag>
                    );
                    break;

                case 'leave_late':
                    violations.push(
                        <Tag key="leave-late" color="volcano" icon={<MoonOutlined />}>
                            LEAVE LATE: After 9PM Return
                        </Tag>
                    );
                    break;
            }
        }

        // 🆕 OUTPASS TYPE VIOLATIONS  
        else if (violationData.permissionType === 'outpass') {
            switch (violationData.violationType) {
                case 'outpass_critical':
                    violations.push(
                        <Tag key="outpass-critical" color="red" icon={<FireOutlined />} style={{ fontWeight: 'bold' }}>
                            OUTPASS CRITICAL: {Math.round(violationData.exceedDuration)}h Over + After 9PM
                        </Tag>
                    );
                    break;

                case 'outpass_extended':
                    violations.push(
                        <Tag key="outpass-extended" color="volcano" icon={<ClockCircleFilled />}>
                            OUTPASS EXTENDED: +{Math.round(violationData.exceedDuration)}h Over Duration
                        </Tag>
                    );
                    break;

                case 'outpass_duration':
                    violations.push(
                        <Tag key="outpass-duration" color="orange" icon={<ClockCircleOutlined />}>
                            OUTPASS LATE: +{Math.round(violationData.exceedDuration * 60)}min Over
                        </Tag>
                    );
                    break;
            }

            // Additional after hours tag for outpass (if not already critical)
            if (violationData.isAfterHours && violationData.violationType !== 'outpass_critical') {
                violations.push(
                    <Tag key="outpass-afterhours" color="purple" icon={<MoonOutlined />}>
                        After Hours Return
                    </Tag>
                );
            }
        }

        // 🔄 LEGACY/UNKNOWN TYPE VIOLATIONS (backward compatibility)
        else {
            if (violationData.isCritical) {
                violations.push(
                    <Tag key="legacy-critical" color="red" icon={<FireOutlined />} style={{ fontWeight: 'bold' }}>
                        CRITICAL: Multiple Violations
                    </Tag>
                );
            } else if (violationData.isExtended) {
                violations.push(
                    <Tag key="legacy-extended" color="volcano" icon={<ClockCircleFilled />}>
                        Extended: {Math.round(violationData.lateDuration)}h late
                    </Tag>
                );
            } else if (violationData.isLate) {
                violations.push(
                    <Tag key="legacy-late" color="orange" icon={<WarningOutlined />}>
                        Late: {Math.round(violationData.lateDuration)}h
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

        // ✅ OVERDUE ENTRIES (all types)
        if (violationData.isOverdue) {
            violations.push(
                <Tag key="overdue" color="red" icon={<WarningOutlined />}>
                    Overdue: {Math.round(violationData.overdueDuration)}h
                </Tag>
            );
        }

        // ✅ CLEAN RECORD
        if (violations.length === 0) {
            return <Tag color="success" icon={<CheckCircleOutlined />}>Clean</Tag>;
        }

        return violations;
    };

    // Format schedule data for display
    const formatScheduleData = (schedule) => {
        try {
            const reportTypes = typeof schedule.report_types === 'string'
                ? JSON.parse(schedule.report_types)
                : schedule.report_types || [];

            const toEmails = typeof schedule.to_emails === 'string'
                ? JSON.parse(schedule.to_emails)
                : schedule.to_emails || [];

            return {
                ...schedule,
                reportTypes: reportTypes,
                emails: toEmails
            };
        } catch (error) {
            console.warn('Format schedule error:', error);
            return {
                ...schedule,
                reportTypes: [],
                emails: []
            };
        }
    };

    // Handle schedule details view
    const viewScheduleDetails = (schedule) => {
        setSelectedSchedule(formatScheduleData(schedule));
        setScheduleDetailsVisible(true);
    };

    // Handle export with proper filtered data validation
    const handleExport = async () => {
        try {
            const values = await exportForm.validateFields();

            if (!filteredData || filteredData.length === 0) {
                notification.warning({
                    message: 'No Data to Export',
                    description: 'There are no records matching your current filters. Please adjust your filters and try again.',
                });
                return;
            }

            setExportLoading(true);

            const exportData = {
                data: filteredData,
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
                // 🆕 NEW: Include enhanced Leave/Outpass violation analysis
                enhancedViolations: true
            };

            const endpoint = values.reportType === 'violations'
                ? '/reports-route/reports/export-violations'
                : '/reports-route/reports/export-full';

            // Try new API structure first, then fallback - like OutPassRequest
            let response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exportData)
            });

            if (!response.ok) {
                // Fallback to old API structure
                const oldEndpoint = endpoint.replace('/outpass-route/', '/outpass-route/');
                response = await fetch(`${API_BASE_URL}${oldEndpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(exportData)
                });
            }

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
                description: `${values.reportType} report with ${filteredData.length} records and enhanced Leave/Outpass violation analysis downloaded successfully.`
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

    // Handle schedule setup (keeping existing functionality)
    const handleScheduleSetup = async () => {
        try {
            const values = await scheduleForm.validateFields();

            // Validate emails
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

            // Validate scheduling options
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
                // Enhanced scheduling
                frequency: repeatType,
                scheduleRule: scheduleRule,
                time: values.time ? dayjs(values.time).format('HH:mm') : '09:00',

                // Report configuration
                reportType: values.reportType && values.reportType.length > 0 ? values.reportType : ['full'],
                formats: values.formats && values.formats.length > 0 ? values.formats : ['excel'],
                includeViolations: values.includeViolations || false,

                // Enhanced email recipients with BCC
                recipients: {
                    to: toEmails,
                    cc: ccEmails,
                    bcc: bccEmails
                },

                // Legacy format for backward compatibility
                toEmails: toEmails,
                ccEmails: ccEmails,
                bccEmails: bccEmails,

                // Custom message
                message: values.message || '',

                // Current filters
                filters: {
                    search,
                    dateRange,
                    statusFilter,
                    permissionFilter,
                    hostelFilter,
                    violationFilter
                },

                // 🆕 NEW: Include enhanced Leave/Outpass violation tracking
                enhancedViolations: true
            };

            console.log('📧 Sending enhanced schedule data with Leave/Outpass violations:', enhancedScheduleData);

            // Try new API first, then fallback
            let response = await fetch(`${API_BASE_URL}/outpass-route/reports/enhanced-schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enhancedScheduleData)
            });

            if (!response.ok) {
                // Fallback to regular schedule endpoint with adapted data
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
                    // Add enhanced schedule info as metadata
                    enhancedSchedule: enhancedScheduleData.scheduleRule,
                    enhancedViolations: true
                };

                response = await fetch(`${API_BASE_URL}/outpass-route/reports/schedule`, {
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
                    description: `${repeatSummary.charAt(0).toUpperCase() + repeatSummary.slice(1)} email reports with enhanced Leave/Outpass violation tracking scheduled for ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}.`,
                });

                setScheduleModalVisible(false);
                scheduleForm.resetFields();

                // Reset enhanced scheduling state
                setRepeatType("weekly");
                setRepeatInterval(1);
                setSelectedWeekdays([1, 2, 3, 4, 5]);
                setMonthlyDay(1);
                setEndsType("never");
                setEndDate("");
                setOccurrenceCount(10);

                // Refresh schedules if on schedules tab
                if (activeTab === 'schedules') {
                    fetchSchedules();
                }

                toast.success('🚀 Enhanced schedule created with Leave/Outpass violation tracking!');
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

    // Handle immediate email (keeping existing functionality)
    const handleImmediateEmail = async () => {
        try {
            const values = await immediateEmailForm.validateFields();

            if (!filteredData || filteredData.length === 0) {
                notification.warning({
                    message: 'No Data Available',
                    description: 'There are no records to send with the current filters. Please adjust your filters and try again.',
                });
                return;
            }

            setImmediateEmailLoading(true);

            const emailData = {
                data: filteredData,
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
                // 🆕 NEW: Include enhanced Leave/Outpass violation analysis in immediate emails
                enhancedViolations: true
            };

            // Try new API first, then fallback - like OutPassRequest
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
                    message: 'Email with Enhanced Leave/Outpass Analysis Sent! ✨',
                    description: `${values.reportType === 'violations' ? 'Violations' : 'Full'} report with enhanced Leave/Outpass violation tracking sent to ${values.toEmails.length} recipient${values.toEmails.length > 1 ? 's' : ''}.`,
                });
                setImmediateEmailModalVisible(false);
                immediateEmailForm.resetFields();
                toast.success(`📧 ${result.details?.recordsCount || filteredData.length} records with enhanced Leave/Outpass analysis sent!`);
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

    // Check if data has permission field to show permission filter - from OutPassRequest
    const hasPermissionData = data.some(item => item.permission);

    // ✨ UPDATED: Table columns with enhanced time display and proper Leave/Outpass violation status
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
                            color={record.permission === 'leave' ? 'blue' : 'green'}
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
                    {/* Show requested out time and return time */}
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
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => {
                const colors = {
                    'Pending': 'processing',
                    'Accepted': 'success',
                    'Rejected': 'error',
                    'Renewed': 'cyan',
                    'Completed': 'purple',
                    'Renewal Pending': 'warning'
                };
                return <Tag color={colors[status] || 'default'}>{status}</Tag>;
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

    // Schedule table columns (keeping existing functionality)
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
                    {record.is_enhanced && (
                        <Tag color="green" size="small">Enhanced</Tag>
                    )}
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
                    {/* ✨ ENHANCED: Show occurrence progress */}
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
    console.log("violation--->✝✝✝✝", filteredData);

  const EnhancedEmailSelect = ({
    value = [],
    onChange,
    placeholder = "Enter email addresses or select users...",
    loading = false,
    formInstance = null,  // 🆕 NEW: Pass form instance for Quick Add
    fieldName = 'toEmails'  // 🆕 NEW: Field name for Quick Add functionality
}) => {
    const [searchValue, setSearchValue] = useState('');

    // 🔧 FIXED: Improved filtering logic with better search matching
    const filteredUsers = useMemo(() => {
        if (!searchValue || searchValue.trim().length === 0) {
            return escalationUsers;
        }

        const searchTerm = searchValue.toLowerCase().trim();
        
        return escalationUsers.filter(user => {
            // 🔧 FIXED: Multiple search criteria with better matching
            const nameMatch = user.name.toLowerCase().includes(searchTerm);
            const emailMatch = user.email.toLowerCase().includes(searchTerm);
            const designationMatch = user.designation.toLowerCase().includes(searchTerm);
            
            // Also search in the combined searchText
            const combinedMatch = user.searchText.includes(searchTerm);
            
            return nameMatch || emailMatch || designationMatch || combinedMatch;
        });
    }, [searchValue, escalationUsers]);

    // Handle selection change
    const handleChange = (newValues) => {
        onChange?.(newValues);
    };

    // Handle search input
    const handleSearch = (searchText) => {
        setSearchValue(searchText);
    };

    // Custom option renderer
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

    // 🔧 FIXED: Improved options array generation
    const options = useMemo(() => {
        const userOptions = filteredUsers.map(user => ({
            key: `user_${user.id}`,
            value: user.email,
            label: renderOption(user),
            // 🆕 NEW: Add search metadata for better filtering
            searchable: true,
            userData: user
        }));

        // Manual entry option if search value looks like an email
        const manualOptions = [];
        if (searchValue && EMAIL_REGEX.test(searchValue.trim())) {
            const trimmedSearch = searchValue.trim();
            // 🔧 FIXED: Check if email already exists in users or current values
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

    // 🆕 NEW: Enhanced Quick Add function that works with any field
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
        
        // Update the current component if it's the target field
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
                filterOption={false} // We handle filtering manually
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
                // 🔧 FIXED: Better dropdown rendering
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
                        
                        {/* 🆕 NEW: Quick Add Buttons for all designations in dropdown */}
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
                    // Find user data for better tag display
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


useEffect(() => {
    if (scheduleModalVisible || immediateEmailModalVisible) {
        fetchEscalationUsers();
    }
}, [scheduleModalVisible, immediateEmailModalVisible, fetchEscalationUsers]);
    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
                        <LineChartOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                        Enhanced Leave/Outpass Reports & Analytics
                    </Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                        Comprehensive reports with proper Leave and Outpass violation tracking and insights
                    </Text>
                </div>

                {/* ✨ UPDATED: Enhanced Statistics Cards with proper Leave/Outpass breakdown */}
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

                {/* 🆕 NEW: Critical Violations Alert for both Leave and Outpass */}
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
                                        <div>🎯 Outpass Critical: {statistics.outpassCritical} students with 2h+ extension AND after 9 PM return</div>
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
                        {/* Reports Tab */}
                        <TabPane
                            tab={
                                <span>
                                    <LineChartOutlined />
                                    Enhanced Leave/Outpass Reports Data
                                </span>
                            }
                            key="reports"
                        >
                            {/* ✨ UPDATED: Filter Panel with enhanced Leave/Outpass violation filters */}
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

                                    {/* Permission Filter - only show if data has permission field */}
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

                                    {/* ✨ UPDATED: Enhanced Leave/Outpass Violation Filter */}
                                    <Select
                                        value={violationFilter}
                                        onChange={handleViolationChange}
                                        style={{ width: 200 }}
                                        placeholder="Leave/Outpass Violations"
                                    >
                                        <Option value="All">All Records</Option>
                                        <Option value="Violations">Any Violations</Option>
                                        <Option value="Clean">Clean Records</Option>

                                        <Option disabled style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                            📋 LEAVE VIOLATIONS
                                        </Option>
                                        <Option value="LeaveCritical" style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                            🚨 Leave Critical (Later Days)
                                        </Option>
                                        <Option value="LeaveLate" style={{ color: '#ff7a00' }}>
                                            ⏰ Leave Late (After 9PM)
                                        </Option>

                                        <Option disabled style={{ fontWeight: 'bold', color: '#52c41a' }}>
                                            🎯 OUTPASS VIOLATIONS
                                        </Option>
                                        <Option value="OutpassCritical" style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                            🚨 Outpass Critical (2h+ & 9PM+)
                                        </Option>
                                        <Option value="OutpassExtended" style={{ color: '#ff7a00' }}>
                                            🔥 Outpass Extended (2h+ Over)
                                        </Option>
                                        <Option value="OutpassDuration" style={{ color: '#faad14' }}>
                                            ⏰ Outpass Duration Exceeded
                                        </Option>

                                        <Option disabled style={{ fontWeight: 'bold', color: '#666' }}>
                                            🔄 GENERAL
                                        </Option>
                                        <Option value="AfterHours" style={{ color: '#722ed1' }}>
                                            🌙 After Hours (All Types)
                                        </Option>
                                        <Option value="Late">Regular Late</Option>
                                        <Option value="Overdue">Overdue</Option>
                                    </Select>

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
                                                toast.success("Data Refreshed with Enhanced Leave/Outpass Analysis!");
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
                                        <Tooltip title="Send filtered data immediately via email with enhanced Leave/Outpass violation analysis">
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

                                {/* ✨ UPDATED: Quick Filter Buttons for Leave/Outpass violations */}
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <Button
                                        size="small"
                                        type={violationFilter === "LeaveCritical" ? "primary" : "default"}
                                        danger={violationFilter === "LeaveCritical"}
                                        icon={<FireOutlined />}
                                        onClick={() => setViolationFilter("LeaveCritical")}
                                    >
                                        Leave Critical ({statistics.leaveCriticalViolations})
                                    </Button>
                                    <Button
                                        size="small"
                                        type={violationFilter === "OutpassCritical" ? "primary" : "default"}
                                        danger={violationFilter === "OutpassCritical"}
                                        icon={<FireOutlined />}
                                        onClick={() => setViolationFilter("OutpassCritical")}
                                    >
                                        Outpass Critical ({statistics.outpassCritical})
                                    </Button>
                                    <Button
                                        size="small"
                                        type={violationFilter === "OutpassExtended" ? "primary" : "default"}
                                        style={{
                                            backgroundColor: violationFilter === "OutpassExtended" ? "#ff7a00" : undefined,
                                            borderColor: violationFilter === "OutpassExtended" ? "#ff7a00" : undefined
                                        }}
                                        icon={<ClockCircleFilled />}
                                        onClick={() => setViolationFilter("OutpassExtended")}
                                    >
                                        Outpass Extended ({statistics.outpassExtended})
                                    </Button>
                                    <Button
                                        size="small"
                                        type={violationFilter === "LeaveLate" ? "primary" : "default"}
                                        style={{
                                            backgroundColor: violationFilter === "LeaveLate" ? "#faad14" : undefined,
                                            borderColor: violationFilter === "LeaveLate" ? "#faad14" : undefined
                                        }}
                                        icon={<MoonOutlined />}
                                        onClick={() => setViolationFilter("LeaveLate")}
                                    >
                                        Leave Late ({statistics.leaveLateReturns})
                                    </Button>
                                    <Button
                                        size="small"
                                        type={violationFilter === "Clean" ? "primary" : "default"}
                                        style={{
                                            backgroundColor: violationFilter === "Clean" ? "#52c41a" : undefined,
                                            borderColor: violationFilter === "Clean" ? "#52c41a" : undefined
                                        }}
                                        icon={<CheckCircleOutlined />}
                                        onClick={() => setViolationFilter("Clean")}
                                    >
                                        Clean Records
                                    </Button>
                                </div>
                            </Card>

                            {/* Data Table */}
                            <div>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Title level={4} style={{ margin: 0 }}>
                                        Enhanced Leave/Outpass Reports Data
                                        <Badge count={filteredData.length} style={{ marginLeft: '8px' }} />
                                    </Title>
                                    <div style={{ textAlign: 'right' }}>
                                        <Text type="secondary">
                                            Showing {filteredData.length} of {data.length} records
                                        </Text>
                                        <br />
                                        {violationFilter !== "All" && (
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                📊 Filtered by: <strong>{violationFilter}</strong>
                                            </Text>
                                        )}
                                    </div>
                                </div>

                                <Table
                                    columns={columns}
                                    dataSource={filteredData}
                                    rowKey={(record, index) => `${record.uniqueKey || record.id}_${index}`}
                                    loading={loading}
                                    pagination={{
                                        pageSize: 50,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) =>
                                            `${range[0]}-${range[1]} of ${total} records with enhanced Leave/Outpass violation analysis`,
                                        pageSizeOptions: ['25', '50', '100', '200']
                                    }}
                                    scroll={{ x: 1200 }}
                                    size="small"
                                    // ✨ UPDATED: Row styling for critical violations (both Leave and Outpass)
                                    rowClassName={(record) => {
                                        const violationData = analyzeViolations(record);
                                        if (violationData.violationType === 'leave_critical' ||
                                            violationData.violationType === 'outpass_critical') {
                                            return 'critical-violation-row';
                                        }
                                        return '';
                                    }}
                                />
                            </div>
                        </TabPane>

                        {/* Schedules Management Tab - keeping existing */}
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
                            {/* Keeping existing schedule management UI */}
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        Active Email Schedules
                                        <Badge count={schedules.length} style={{ marginLeft: '8px' }} />
                                    </Title>
                                    <Text type="secondary">
                                        Manage your automated report delivery schedules with enhanced Leave/Outpass violation tracking
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

                            {/* Schedules Table or Empty State */}
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
                                                    Create your first automated report schedule with enhanced Leave/Outpass violation tracking
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

                {/* All existing modals remain exactly the same... */}
                {/* Export Modal - UNCHANGED */}
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
                                <div>🏠 Hostel: {hostelFilter}</div>
                                <div>⚠️ Violations: {violationFilter}</div>
                                <div>📍 Records: {filteredData.length} entries</div>
                            </div>
                        </div>
                    </Form>
                </Modal>

                {/* Immediate Email Modal - UNCHANGED */}
                <Modal
                    title={
                        <span>
                            <SendOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                            Send Email Report
                        </span>
                    }
                    open={immediateEmailModalVisible}
                    onCancel={() => setImmediateEmailModalVisible(false)}
                    onOk={handleImmediateEmail}
                    confirmLoading={immediateEmailLoading}
                    width={700}
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
                            subject: `Hostel Management Report - ${dayjs().format('YYYY-MM-DD HH:mm')}`,
                            toEmails: [],
                            ccEmails: [],
                            message: ''
                        }}
                    >
                        <div style={{
                            backgroundColor: '#e6fffb',
                            padding: '12px',
                            borderRadius: '6px',
                            borderLeft: '3px solid #52c41a',
                            marginBottom: '16px'
                        }}>
                            <Text strong style={{ color: '#52c41a' }}>
                                <ThunderboltOutlined style={{ marginRight: '4px' }} />
                                Quick Send Preview:
                            </Text>
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                📧 Ready to send {filteredData.length} records immediately<br />
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

                        <Form.Item name="includeViolations" valuePropName="checked">
                            <Checkbox>Include detailed violation analysis in full reports</Checkbox>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Schedule Modal - keeping all existing functionality */}
                <Modal
                    title={
                        <span>
                            <ScheduleOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                            Schedule Email Reports
                        </span>
                    }
                    open={scheduleModalVisible}
                    onCancel={() => {
                        setScheduleModalVisible(false);
                        // Reset form and enhanced scheduling state
                        scheduleForm.resetFields();
                        setRepeatType("weekly");
                        setRepeatInterval(1);
                        setSelectedWeekdays([1, 2, 3, 4, 5]);
                        setMonthlyDay(1);
                        setEndsType("never");
                        setEndDate("");
                        setOccurrenceCount(10);
                    }}
                    onOk={handleScheduleSetup}
                    confirmLoading={scheduleLoading}
                    width={800}
                    okText="Create Schedule"
                    cancelText="Cancel"
                >
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f6f6f6', borderRadius: '6px' }}>
                        <Text type="secondary">
                            Configure automated email schedules for reports with enhanced Leave/Outpass violation tracking. Use <strong>Repeat</strong> to set daily/weekly/monthly cadence like Google Calendar.
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
                            includeViolations: true
                        }}
                    >
                        {/* Email Recipients Section */}
                        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                            <Title level={5} style={{ margin: '0 0 16px 0', color: '#1890ff' }}>
                                <MailOutlined style={{ marginRight: '8px' }} />
                                Enhanced Email Recipients
                                {loadingUsers && <Spin size="small" style={{ marginLeft: '8px' }} />}
                            </Title>

                            {/* User Directory Status */}
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

                            {/* Quick Add Buttons for Common Users */}
                          
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
                                <div>📊 <strong>Ends:</strong> {endsType === 'never' ? 'Never' : endsType === 'on' ? `On ${endDate}` : `After ${occurrenceCount} occurrences`}</div>
                                <div>📋 Reports will include enhanced Leave/Outpass violation analysis</div>
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
                            Schedule Details
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
                    width={600}
                >
                    {selectedSchedule && (
                        <div>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Card size="small" title="Schedule Information">
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Frequency:</Text> {selectedSchedule.frequency.charAt(0).toUpperCase() + selectedSchedule.frequency.slice(1)}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Delivery Time:</Text> {formatTime(selectedSchedule.delivery_time)}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Created:</Text> {dayjs(selectedSchedule.created_at).format('MMM D, YYYY HH:mm')}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Status:</Text> <Tag color="success">Active</Tag>
                                        </div>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card size="small" title="Delivery Stats">
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Total Sent:</Text> {selectedSchedule.total_sent || 0}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Last Sent:</Text> {selectedSchedule.last_sent ?
                                                dayjs(selectedSchedule.last_sent).format('MMM D, YYYY HH:mm') :
                                                'Not sent yet'}
                                        </div>
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
                                </Col>
                            </Row>

                            <Divider />

                            <Row gutter={16}>
                                <Col span={12}>
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
                                        <div>
                                            <Text strong>Include Violations:</Text> {selectedSchedule.include_violations ? 'Yes' : 'No'}
                                        </div>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card size="small" title="Email Recipients">
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>TO Recipients:</Text> {selectedSchedule.emails.length}
                                        </div>
                                        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                            {selectedSchedule.emails.map((email, index) => (
                                                <Tag key={index} style={{ margin: '2px' }}>{email}</Tag>
                                            ))}
                                        </div>
                                    </Card>
                                </Col>
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
            `}</style>
        </div>
    );
};

export default ReportsSection;