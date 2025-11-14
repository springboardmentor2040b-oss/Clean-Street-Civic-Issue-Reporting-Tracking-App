import React, { useState, useEffect } from "react";
import { FiTrendingUp, FiPieChart, FiBarChart2, FiActivity } from "react-icons/fi";
import { toast } from "react-hot-toast";

const COLORS = {
  primary: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
  status: {
    received: "#fbbf24",
    in_review: "#3b82f6",
    resolved: "#10b981",
    rejected: "#ef4444",
  },
  roles: {
    user: "#6b7280",
    volunteer: "#10b981",
    admin: "#ef4444",
  },
};

const AdminStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const backend_Url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backend_Url}/api/admin/detailed-stats`, {
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch statistics");
      }

      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching detailed stats:", err);
      toast.error(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg
            className="animate-spin mx-auto h-12 w-12 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading Statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  // Format data for charts
  const statusData = stats.complaintsByStatus.map((item) => ({
    name: formatStatusLabel(item._id),
    value: item.count,
    color: COLORS.status[item._id] || "#6b7280",
  }));

  const typeData = stats.complaintsByType.map((item, index) => ({
    name: item._id || "Unknown",
    value: item.count,
    color: COLORS.primary[index % COLORS.primary.length],
  }));

  const roleData = stats.usersByRole.map((item) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count,
    color: COLORS.roles[item._id] || "#6b7280",
  }));

  const complaintsTimeData = stats.complaintsOverTime.map((item) => ({
    date: formatDate(item._id),
    complaints: item.count,
  }));

  const monthlyData = stats.monthlyComplaints.map((item) => ({
    month: formatMonth(item._id),
    complaints: item.count,
  }));

  const userRegData = stats.userRegistrations.map((item) => ({
    date: formatDate(item._id),
    users: item.count,
  }));

  const topTypesData = stats.topComplaintTypes.map((item, index) => ({
    type: item._id || "Unknown",
    count: item.count,
    fill: COLORS.primary[index % COLORS.primary.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FiBarChart2 className="text-3xl text-indigo-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Statistics & Analytics</h2>
          <p className="text-sm text-gray-600">Visual insights into complaints and user data</p>
        </div>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Complaint Status Distribution" icon={<FiPieChart />}>
          <PieChart data={statusData} />
        </ChartCard>

        <ChartCard title="Complaint Types" icon={<FiPieChart />}>
          <PieChart data={typeData} />
        </ChartCard>

        <ChartCard title="User Roles" icon={<FiPieChart />}>
          <PieChart data={roleData} />
        </ChartCard>
      </div>

      {/* Line Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Complaints (Last 7 Days)" icon={<FiTrendingUp />}>
          <LineChart data={complaintsTimeData} dataKey="complaints" color="#6366f1" />
        </ChartCard>

        <ChartCard title="User Registrations (Last 30 Days)" icon={<FiTrendingUp />}>
          <LineChart data={userRegData} dataKey="users" color="#10b981" />
        </ChartCard>
      </div>

      {/* Bar Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Complaint Trends (6 Months)" icon={<FiBarChart2 />}>
          <BarChart data={monthlyData} dataKey="complaints" color="#8b5cf6" />
        </ChartCard>

        <ChartCard title="Top 5 Complaint Types" icon={<FiActivity />}>
          <HorizontalBarChart data={topTypesData} />
        </ChartCard>
      </div>
    </div>
  );
};

// Custom Chart Components
const PieChart = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...item, path, percentage, index };
  });

  return (
    <div className="relative">
      <svg viewBox="0 0 200 200" className="w-full h-64">
        {slices.map((slice) => (
          <g key={slice.index}>
            <path
              d={slice.path}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="transition-opacity cursor-pointer"
              opacity={hoveredIndex === null || hoveredIndex === slice.index ? 1 : 0.5}
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </g>
        ))}
      </svg>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-gray-700">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {item.value} ({slices[index].percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChart = ({ data, dataKey, color }) => {
  if (!data || data.length === 0) return <div className="text-center text-gray-500 py-10">No data available</div>;

  const maxValue = Math.max(...data.map((d) => d[dataKey]));
  const padding = 40;
  const width = 600;
  const height = 300;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (item[dataKey] / maxValue) * chartHeight;
    return { x, y, value: item[dataKey], label: item.date };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (i * chartHeight) / 4}
            x2={width - padding}
            y2={padding + (i * chartHeight) / 4}
            stroke="#e5e7eb"
            strokeDasharray="3,3"
          />
        ))}
        {/* Line */}
        <path d={pathData} fill="none" stroke={color} strokeWidth="2" />
        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="4" fill={color} className="cursor-pointer" />
            <title>{`${point.label}: ${point.value}`}</title>
          </g>
        ))}
        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={height - 10}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

const BarChart = ({ data, dataKey, color }) => {
  if (!data || data.length === 0) return <div className="text-center text-gray-500 py-10">No data available</div>;

  const maxValue = Math.max(...data.map((d) => d[dataKey]));
  const padding = 40;
  const width = 600;
  const height = 300;
  const chartHeight = height - padding * 2;
  const barWidth = (width - padding * 2) / data.length - 10;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
        {data.map((item, index) => {
          const barHeight = (item[dataKey] / maxValue) * chartHeight;
          const x = padding + index * ((width - padding * 2) / data.length);
          const y = padding + chartHeight - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <title>{`${item.month}: ${item[dataKey]}`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const HorizontalBarChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-center text-gray-500 py-10">No data available</div>;

  const maxValue = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-3 py-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-700 truncate" title={item.type}>
            {item.type}
          </div>
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-8 relative">
              <div
                className="h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all"
                style={{
                  width: `${(item.count / maxValue) * 100}%`,
                  backgroundColor: item.fill,
                }}
              >
                {item.count}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, icon, children }) => (
  <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-indigo-600 text-xl">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

// Helper Functions

const formatStatusLabel = (status) => {
  const labels = {
    received: "Pending",
    in_review: "In Review",
    resolved: "Resolved",
    rejected: "Rejected",
  };
  return labels[status] || status;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatMonth = (monthString) => {
  const [year, month] = monthString.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

export default AdminStatistics;
