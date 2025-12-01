import React, { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Maximize2 } from "lucide-react";
import "../styles/Dashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// blue palette
const BLUE_COLORS = [
  "#0d47a1",
  "#1565c0",
  "#1976d2",
  "#1e88e5",
  "#42a5f5",
  "#90caf9",
];

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // which chart is in "enhanced" view
  const [expandedChart, setExpandedChart] = useState(null);
  // expandedChart = { panelKey: "outpass" | "leave", chartKey: "status" | "hostel" | "timeline" | "duration" | "institution" | "purposes" }

  // fetch outpass + leave data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/outpass-route/getinfo/outpass`
        );
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openExpanded = (panelKey, chartKey) => {
    setExpandedChart({ panelKey, chartKey });
  };

  const closeExpanded = () => setExpandedChart(null);

  // helper: build full datetime from date + time
  const buildDateTime = (dateValue, timeStr) => {
    if (!dateValue) return null;
    const base = dayjs(dateValue);
    if (!timeStr) return base;
    const [h = 0, m = 0, s = 0] = String(timeStr).split(":").map(Number);
    return base.hour(h).minute(m).second(s);
  };

  // helper: aggregate stats for a given subset of rows
  const buildStats = (items) => {
    if (!items || items.length === 0) {
      return {
        totalRequests: 0,
        statusCounts: [],
        hostelCounts: [],
        institutionCounts: [],
        purposeCounts: [],
        timelineCounts: [],
        avgDurationByCourse: [],
      };
    }

    const statusMap = {};
    const hostelMap = {};
    const instMap = {};
    const purposeMap = {};
    const timeMap = {};
    const durationByCourseMap = {};

    items.forEach((item) => {
      const status = item.status || "Unknown";
      const hostel = item.hostel || "Unknown";
      const inst = item.inst_name || "Unknown";
      const purpose = item.purpose || "Other";

      // 1) status counts
      statusMap[status] = (statusMap[status] || 0) + 1;

      // 2) hostel counts
      hostelMap[hostel] = (hostelMap[hostel] || 0) + 1;

      // 3) institution counts
      instMap[inst] = (instMap[inst] || 0) + 1;

      // 4) purpose counts
      purposeMap[purpose] = (purposeMap[purpose] || 0) + 1;

      // 5) timeline counts (by created_at date)
      if (item.created_at) {
        const day = dayjs(item.created_at).format("YYYY-MM-DD");
        timeMap[day] = (timeMap[day] || 0) + 1;
      }

      // 6) average duration by course (in minutes)
      const course = item.course || "Unknown";
      const start = buildDateTime(item.date_from, item.time_out);
      const end = buildDateTime(item.date_to, item.time_in);

      if (start && end && end.isAfter(start)) {
        const diffMinutes = end.diff(start, "minute");
        if (!durationByCourseMap[course]) {
          durationByCourseMap[course] = { total: 0, count: 0 };
        }
        durationByCourseMap[course].total += diffMinutes;
        durationByCourseMap[course].count += 1;
      }
    });

    const toArray = (obj, labelKey = "name", valueKey = "value") =>
      Object.entries(obj).map(([k, v]) => ({ [labelKey]: k, [valueKey]: v }));

    const statusCountsArr = toArray(statusMap, "status", "count");
    const hostelCountsArr = toArray(hostelMap, "hostel", "count");
    const instCountsArr = toArray(instMap, "institution", "count");
    const purposeCountsArr = toArray(purposeMap, "purpose", "count");
    const timelineCountsArr = Object.entries(timeMap)
      .map(([day, count]) => ({ date: day, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const avgDurationArr = Object.entries(durationByCourseMap).map(
      ([course, { total, count }]) => ({
        course,
        avgHours: +(total / count / 60).toFixed(2), // average hours
      })
    );

    // top 8 purposes, with blue fills
    const topPurposes = purposeCountsArr
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((p, index) => ({
        ...p,
        fill: BLUE_COLORS[index % BLUE_COLORS.length],
      }));

    return {
      totalRequests: items.length,
      statusCounts: statusCountsArr,
      hostelCounts: hostelCountsArr,
      institutionCounts: instCountsArr,
      purposeCounts: topPurposes,
      timelineCounts: timelineCountsArr,
      avgDurationByCourse: avgDurationArr,
    };
  };

  const { outpassStats, leaveStats } = useMemo(() => {
    const outpassData = (data || []).filter(
      (item) => item.is_outpass_request || item.request_type === "outpass"
    );
    const leaveData = (data || []).filter(
      (item) => item.is_leave_request || item.request_type === "leave"
    );

    return {
      outpassStats: buildStats(outpassData),
      leaveStats: buildStats(leaveData),
    };
  }, [data]);

  const buildSummaryCards = (stats) => {
    const { totalRequests, statusCounts } = stats;

    const getStatusCount = (status) =>
      statusCounts.find((s) => s.status === status)?.count || 0;

    const approved = getStatusCount("Accepted");
    const rejected = getStatusCount("Rejected");
    const renewed = getStatusCount("Renewed");
    const total = totalRequests;

    const toPercent = (value) =>
      total ? Math.round((value / total) * 100) : 0;

    // Order they asked for: Rejected, Renewed, Approved, Total Requests
    return [
      {
        key: "rejected",
        label: "Rejected",
        value: rejected,
        percent: toPercent(rejected),
        hint: "Not approved requests",
        barBg: "linear-gradient(90deg, #fdd835, #f9a825)", // Yellow
        pillBg: "rgba(253, 216, 53, 0.2)",
        pillBorder: "rgba(253, 216, 53, 0.6)",
        pillColor: "#f9a825",
        valueColor: "#f9a825",
      },
      {
        key: "renewed",
        label: "Renewed",
        value: renewed,
        percent: toPercent(renewed),
        hint: "Extended time requests",
        barBg: "linear-gradient(90deg, #ffb74d, #fb8c00)", // Orange
        pillBg: "rgba(251, 140, 0, 0.16)",
        pillBorder: "rgba(251, 140, 0, 0.6)",
        pillColor: "#fb8c00",
        valueColor: "#fb8c00",
      },
      {
        key: "approved",
        label: "Approved",
        value: approved,
        percent: toPercent(approved),
        hint: "Accepted requests",
        barBg: "linear-gradient(90deg, #66bb6a, #2e7d32)", // Green
        pillBg: "rgba(102, 187, 106, 0.15)",
        pillBorder: "rgba(46, 125, 50, 0.6)",
        pillColor: "#2e7d32",
        valueColor: "#2e7d32",
      },
      {
        key: "total",
        label: "Total Requests",
        value: total,
        percent: 100,
        hint: "All recorded entries",
        barBg: "linear-gradient(90deg, #42a5f5, #1e88e5)", // Blue
        pillBg: "rgba(33, 150, 243, 0.15)",
        pillBorder: "rgba(33, 150, 243, 0.6)",
        pillColor: "#1e88e5",
        valueColor: "#1565c0",
      },
    ];
  };

  const renderPanel = (panelKey, panelTitle, panelSubtitle, stats) => {
    const {
      statusCounts,
      hostelCounts,
      timelineCounts,
      avgDurationByCourse,
      institutionCounts,
      purposeCounts,
    } = stats;

    const cards = buildSummaryCards(stats);

    return (
      <section>
        <div className="dashboard-container-header">
          <div>
            <h2 className="dashboard-container-title">{panelTitle}</h2>
          </div>
          <div>
            <p className="dashboard-container-subtitle">({panelSubtitle})</p>
          </div>
        </div>

        {/* summary cards for this panel */}
        <div className="dashboard-container-summary-row">
          {cards.map((card, index) => (
            <div
              key={card.key}
              className="dashboard-container-summary-card"
              style={{
                "--accent-index": index,
                "--percent": `${card.percent}%`,
              }}
            >
              <div className="dashboard-container-summary-top">
                <span className="dashboard-container-summary-label">
                  {card.label}
                </span>
                <span
                  className="dashboard-container-summary-pill"
                  style={{
                    background: card.pillBg,
                    borderColor: card.pillBorder,
                    color: card.pillColor,
                  }}
                >
                  {card.percent}% of total
                </span>
              </div>

              <div className="dashboard-container-summary-main">
                <span
                  className="dashboard-container-summary-value"
                  style={{ color: card.valueColor }}
                >
                  {card.value}
                </span>
                <span className="dashboard-container-summary-hint">
                  {card.hint}
                </span>
              </div>

              <div className="dashboard-container-summary-progress">
                <div
                  className="dashboard-container-summary-progress-bar"
                  style={{
                    width: `${card.percent}%`,
                    background: card.barBg,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* charts for this panel */}
        <div className="dashboard-container-grid">
          {/* 1️⃣ Bar Chart – Requests by Status */}
          <div className="dashboard-container-card">
            <div className="dashboard-card-header-row">
              <h3 className="dashboard-container-card-title">
                Requests by Status
              </h3>
              <button
                type="button"
                className="dashboard-card-enhance-btn"
                onClick={() => openExpanded(panelKey, "status")}
                aria-label="Open enhanced view"
                title="Enhanced view"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusCounts}>
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill={BLUE_COLORS[2]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 2️⃣ Pie Chart – Requests by Hostel */}
          <div className="dashboard-container-card">
            <div className="dashboard-card-header-row">
              <h3 className="dashboard-container-card-title">
                Requests by Hostel
              </h3>
              <button
                type="button"
                className="dashboard-card-enhance-btn"
                onClick={() => openExpanded(panelKey, "hostel")}
                aria-label="Open enhanced view"
                title="Enhanced view"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={hostelCounts}
                  dataKey="count"
                  nameKey="hostel"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {hostelCounts.map((entry, index) => (
                    <Cell
                      key={`cell-hostel-${entry.hostel}`}
                      fill={BLUE_COLORS[index % BLUE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 3️⃣ Line Chart – Requests over Time */}
          <div className="dashboard-container-card">
            <div className="dashboard-card-header-row">
              <h3 className="dashboard-container-card-title">
                Requests Over Time
              </h3>
              <button
                type="button"
                className="dashboard-card-enhance-btn"
                onClick={() => openExpanded(panelKey, "timeline")}
                aria-label="Open enhanced view"
                title="Enhanced view"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timelineCounts}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={BLUE_COLORS[3]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 4️⃣ Area Chart – Avg Duration by Course */}
          <div className="dashboard-container-card">
            <div className="dashboard-card-header-row">
              <h3 className="dashboard-container-card-title">
                Average Duration by Course (Hours)
              </h3>
              <button
                type="button"
                className="dashboard-card-enhance-btn"
                onClick={() => openExpanded(panelKey, "duration")}
                aria-label="Open enhanced view"
                title="Enhanced view" 
              >
                <Maximize2 size={14} />
              </button>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={avgDurationByCourse}>
                {(() => {
                  const gradientId = `durationArea-${panelTitle.replace(
                    /\s+/g,
                    ""
                  )}`;
                  return (
                    <>
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={BLUE_COLORS[4]}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={BLUE_COLORS[4]}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>

                      <XAxis dataKey="course" />
                      <YAxis />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="avgHours"
                        stroke={BLUE_COLORS[4]}
                        fill={`url(#${gradientId})`}
                        strokeWidth={2}
                      />
                    </>
                  );
                })()}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 5️⃣ Radar Chart – Requests by Institution */}
          <div className="dashboard-container-card">
            <div className="dashboard-card-header-row">
              <h3 className="dashboard-container-card-title">
                Requests by Institution
              </h3>
              <button
                type="button"
                className="dashboard-card-enhance-btn"
                onClick={() => openExpanded(panelKey, "institution")}
                aria-label="Open enhanced view"
                title="Enhanced view"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={institutionCounts}>
                <PolarGrid />
                <PolarAngleAxis dataKey="institution" />
                <PolarRadiusAxis />
                <Radar
                  name="Requests"
                  dataKey="count"
                  stroke={BLUE_COLORS[0]}
                  fill={BLUE_COLORS[1]}
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 6️⃣ Top Purposes – simple list */}
          <div className="dashboard-container-card">
            <div className="dashboard-card-header-row">
              <h3 className="dashboard-container-card-title">Top Purposes</h3>
              <button
                type="button"
                className="dashboard-card-enhance-btn"
                onClick={() => openExpanded(panelKey, "purposes")}
                aria-label="Open enhanced view"
                title="Enhanced view"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <ul className="dashboard-top-purpose-list">
              {purposeCounts.map((p) => (
                <li key={p.purpose} className="dashboard-top-purpose-item">
                  <span className="dashboard-top-purpose-dot" />
                  <span className="dashboard-top-purpose-label">
                    {p.purpose}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  };

  const renderExpandedModal = () => {
    if (!expandedChart) return null;

    const stats =
      expandedChart.panelKey === "outpass" ? outpassStats : leaveStats;
    const panelLabel =
      expandedChart.panelKey === "outpass"
        ? "Outpass Dashboard"
        : "Leave Dashboard";

    const titleMap = {
      status: "Requests by Status",
      hostel: "Requests by Hostel",
      timeline: "Requests Over Time",
      duration: "Average Duration by Course (Hours)",
      institution: "Requests by Institution",
      purposes: "Top Purposes",
    };

    const chartTitle = `${titleMap[expandedChart.chartKey]} – ${panelLabel}`;

    return (
      <div className="dashboard-modal-backdrop" onClick={closeExpanded}>
        <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
          <div className="dashboard-modal-header">
            <h3 className="dashboard-modal-title">{chartTitle}</h3>
            <button
              type="button"
              className="dashboard-modal-close"
              onClick={closeExpanded}
            >
              ✕
            </button>
          </div>

          <div className="dashboard-modal-body">
            {/* big charts */}
            {expandedChart.chartKey === "status" && (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={stats.statusCounts}>
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill={BLUE_COLORS[2]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}

            {expandedChart.chartKey === "hostel" && (
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={stats.hostelCounts}
                    dataKey="count"
                    nameKey="hostel"
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    label
                  >
                    {stats.hostelCounts.map((entry, index) => (
                      <Cell
                        key={`modal-hostel-${entry.hostel}`}
                        fill={BLUE_COLORS[index % BLUE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {expandedChart.chartKey === "timeline" && (
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={stats.timelineCounts}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={BLUE_COLORS[3]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {expandedChart.chartKey === "duration" && (
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={stats.avgDurationByCourse}>
                  {(() => {
                    const gradientId = `durationAreaModal-${panelLabel.replace(
                      /\s+/g,
                      ""
                    )}`;
                    return (
                      <>
                        <defs>
                          <linearGradient
                            id={gradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={BLUE_COLORS[4]}
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="95%"
                              stopColor={BLUE_COLORS[4]}
                              stopOpacity={0.15}
                            />
                          </linearGradient>
                        </defs>

                        <XAxis dataKey="course" />
                        <YAxis />
                        <Tooltip />
                        <Legend />

                        <Area
                          type="monotone"
                          dataKey="avgHours"
                          stroke={BLUE_COLORS[4]}
                          fill={`url(#${gradientId})`}
                          strokeWidth={3}
                        />
                      </>
                    );
                  })()}
                </AreaChart>
              </ResponsiveContainer>
            )}

            {expandedChart.chartKey === "institution" && (
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={stats.institutionCounts}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="institution" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Requests"
                    dataKey="count"
                    stroke={BLUE_COLORS[0]}
                    fill={BLUE_COLORS[1]}
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            )}

            {expandedChart.chartKey === "purposes" && (
              <div className="dashboard-modal-purpose-wrapper">
                <ul className="dashboard-top-purpose-list">
                  {stats.purposeCounts.map((p) => (
                    <li key={p.purpose} className="dashboard-top-purpose-item">
                      <span className="dashboard-top-purpose-dot" />
                      <span className="dashboard-top-purpose-label">
                        {p.purpose}{" "}
                        <span className="dashboard-top-purpose-count">
                          ({p.count} requests)
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {loading ? (
        <div className="dashboard-container-loading">Loading analytics…</div>
      ) : (
        <>
          <div
            className="dashboard-split-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "24px",
              alignItems: "flex-start",
            }}
          >
            {renderPanel(
              "outpass",
              "Outpass Dashboard",
              "Analytics for all outpass requests",
              outpassStats
            )}
            {renderPanel(
              "leave",
              "Leave Dashboard",
              "Analytics for all leave requests",
              leaveStats
            )}
          </div>

          {renderExpandedModal()}
        </>
      )}
    </div>
  );
}

export default Dashboard;