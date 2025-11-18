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
  RadialBarChart,
  RadialBar,
} from "recharts";
import "../styles/Dashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// blue palette
const BLUE_COLORS = ["#0d47a1", "#1565c0", "#1976d2", "#1e88e5", "#42a5f5", "#90caf9"];

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch outpass data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/outpass-route/getinfo/outpass`);
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

  // helper: build full datetime from date + time
  const buildDateTime = (dateValue, timeStr) => {
    if (!dateValue) return null;
    const base = dayjs(dateValue);
    if (!timeStr) return base;
    const [h = 0, m = 0, s = 0] = String(timeStr).split(":").map(Number);
    return base.hour(h).minute(m).second(s);
  };

  // preprocess + aggregate data
  const {
    totalRequests,
    statusCounts,
    hostelCounts,
    institutionCounts,
    purposeCounts,
    timelineCounts,
    avgDurationByCourse,
  } = useMemo(() => {
    if (!data || data.length === 0) {
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

    data.forEach((item) => {
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

    const avgDurationArr = Object.entries(durationByCourseMap).map(([course, { total, count }]) => ({
      course,
      avgHours: +(total / count / 60).toFixed(2), // average hours
    }));

    // top 8 purposes, with blue fills
    const topPurposes = purposeCountsArr
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((p, index) => ({
        ...p,
        fill: BLUE_COLORS[index % BLUE_COLORS.length],
    }));

    return {
      totalRequests: data.length,
      statusCounts: statusCountsArr,
      hostelCounts: hostelCountsArr,
      institutionCounts: instCountsArr,
      purposeCounts: topPurposes,
      timelineCounts: timelineCountsArr,
      avgDurationByCourse: avgDurationArr,
    };
  }, [data]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-container-header">
        <h2 className="dashboard-container-title">Outpass Analytics Dashboard</h2>
        <p className="dashboard-container-subtitle">
          Cumulative overview of hostel outpass activity
        </p>
      </div>

      {/* summary cards */}
      <div className="dashboard-container-summary-row">
        {(() => {
          const accepted =
            statusCounts.find((s) => s.status === "Accepted")?.count || 0;
          const rejected =
            statusCounts.find((s) => s.status === "Rejected")?.count || 0;
          const renewed =
            statusCounts.find((s) => s.status === "Renewed")?.count || 0;

          const toPercent = (value) =>
            totalRequests ? Math.round((value / totalRequests) * 100) : 0;

          const cards = [
            {
              key: "total",
              label: "Total Requests",
              value: totalRequests,
              percent: 100,
              hint: "All recorded outpass entries",
            },
            {
              key: "accepted",
              label: "Accepted",
              value: accepted,
              percent: toPercent(accepted),
              hint: "Approved outpasses",
            },
            {
              key: "rejected",
              label: "Rejected",
              value: rejected,
              percent: toPercent(rejected),
              hint: "Not approved",
            },
            {
              key: "renewed",
              label: "Renewed",
              value: renewed,
              percent: toPercent(renewed),
              hint: "Extended check-in time",
            },
          ];

          return cards.map((card, index) => (
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
                <span className="dashboard-container-summary-pill">
                  {card.percent}% of total
                </span>
              </div>

              <div className="dashboard-container-summary-main">
                <span className="dashboard-container-summary-value">
                  {card.value}
                </span>
                <span className="dashboard-container-summary-hint">
                  {card.hint}
                </span>
              </div>

              <div className="dashboard-container-summary-progress">
                <div className="dashboard-container-summary-progress-bar" />
              </div>
            </div>
          ));
        })()}
      </div>

      {loading ? (
        <div className="dashboard-container-loading">Loading analytics…</div>
      ) : (
        <div className="dashboard-container-grid">
          {/* 1️⃣ Bar Chart – Requests by Status */}
          <div className="dashboard-container-card">
            <h3 className="dashboard-container-card-title">Requests by Status</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusCounts}>
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={BLUE_COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 2️⃣ Pie Chart – Requests by Hostel */}
          <div className="dashboard-container-card">
            <h3 className="dashboard-container-card-title">Requests by Hostel</h3>
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
            <h3 className="dashboard-container-card-title">Requests Over Time</h3>
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
            <h3 className="dashboard-container-card-title">Average Duration by Course (Hours)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={avgDurationByCourse}>
                <defs>
                  <linearGradient id="durationArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE_COLORS[4]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={BLUE_COLORS[4]} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="avgHours"
                  stroke={BLUE_COLORS[4]}
                  fill="url(#durationArea)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 5️⃣ Radar Chart – Requests by Institution */}
          <div className="dashboard-container-card">
            <h3 className="dashboard-container-card-title">Requests by Institution</h3>
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

          {/* 6️⃣ Radial Bar Chart – Top Purposes */}
        <div className="dashboard-container-card">
        <h3 className="dashboard-container-card-title">Top Purposes</h3>
        <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart
            data={purposeCounts}
            innerRadius="20%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            cx="30%"               // move chart LEFT
            cy="50%"
            margin={{ top: 10, right: 80, bottom: 10, left: 0 }} // extra space for legend
            >
            <RadialBar
                dataKey="count"
                minAngle={8}
                background
                clockWise
                label={{
                position: "insideEnd",
                fill: "#ffffff",
                fontSize: 10,
                }}
            />
            <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                fontSize: 11,
                lineHeight: "18px",
                }}
                formatter={(_, entry) => entry?.payload?.purpose || ""}
            />
            <Tooltip
                formatter={(value, _name, entry) => [
                `${value} request${value === 1 ? "" : "s"}`,
                entry?.payload?.purpose || "Purpose",
                ]}
            />
            </RadialBarChart>
        </ResponsiveContainer>
        </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;