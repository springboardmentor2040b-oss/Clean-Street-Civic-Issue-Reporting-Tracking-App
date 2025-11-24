import React, { useEffect, useMemo, useState, useRef } from "react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from "chart.js";
import "./AdminDashboard.css";
import AdminSidebar from "./AdminSidebar";
import logo from "../assets/logo.jpeg";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

function normalizeStatus(statusRaw) {
  const status = String(statusRaw || "").trim().toLowerCase();
  if (status === "closed" || status.includes("resolve")) return "Closed";
  if (status === "open") return "Open";
  return "Unknown";
}

function isDateToday(d) {
  try {
    const dt = new Date(d);
    const today = new Date();
    return (
      dt.getFullYear() === today.getFullYear() &&
      dt.getMonth() === today.getMonth() &&
      dt.getDate() === today.getDate()
    );
  } catch (e) {
    return false;
  }
}

const AdminReports = () => {
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeView, setTimeView] = useState("daily"); // 'daily' or 'monthly'
  const [usersLoaded, setUsersLoaded] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch issues
        const issuesRes = await fetch("http://localhost:5001/api/issues/all", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!issuesRes.ok) throw new Error("Failed to fetch issues");
        const issuesData = await issuesRes.json();
        setIssues(Array.isArray(issuesData) ? issuesData : []);

        // Try to fetch users (optional - backend may not be ready)
        try {
          const usersRes = await fetch("http://localhost:5001/api/users", {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(Array.isArray(usersData) ? usersData : []);
            setUsersLoaded(true);
          } else {
            console.warn("Users endpoint not available yet - using placeholder data");
            // Use placeholder data for demo
            setUsers([
              { role: "user" },
              { role: "user" },
              { role: "user" },
              { role: "user" },
              { role: "user" },
              { role: "volunteer" },
              { role: "volunteer" },
              { role: "admin" },
            ]);
            setUsersLoaded(false);
          }
        } catch (userError) {
          console.warn("Users endpoint not available - using placeholder data");
          // Use placeholder data for demo
          setUsers([
            { role: "user" },
            { role: "user" },
            { role: "user" },
            { role: "user" },
            { role: "user" },
            { role: "volunteer" },
            { role: "volunteer" },
            { role: "admin" },
          ]);
          setUsersLoaded(false);
        }
      } catch (e) {
        setError(e.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const { statusCounts, priorityCounts, total, open, closed, closedToday } = useMemo(() => {
    const statuses = { Open: 0, Closed: 0, Unknown: 0 };
    const priorities = {};
    let totalCount = 0;
    let openCount = 0;
    let closedCount = 0;
    let closedTodayCount = 0;

    for (const issue of issues) {
      totalCount += 1;
      
      const bucket = normalizeStatus(issue?.status);
      statuses[bucket] = (statuses[bucket] || 0) + 1;
      if (bucket === "Open") openCount += 1;
      if (bucket === "Closed") {
        closedCount += 1;
        if (isDateToday(issue?.createdAt)) closedTodayCount += 1;
      }

      const priority = issue?.priority || "Unknown";
      priorities[priority] = (priorities[priority] || 0) + 1;
    }

    return {
      statusCounts: statuses,
      priorityCounts: priorities,
      total: totalCount,
      open: openCount,
      closed: closedCount,
      closedToday: closedTodayCount,
    };
  }, [issues]);

  // User role distribution
  const userRoleCounts = useMemo(() => {
    const counts = { users: 0, volunteers: 0 };
    for (const user of users) {
      if (user.role === "volunteer" || user.role === "admin") {
        counts.volunteers += 1;
      } else {
        counts.users += 1;
      }
    }
    return counts;
  }, [users]);

  // Time-based complaints data
  const timeBasedData = useMemo(() => {
    if (timeView === "daily") {
      // Last 7 days
      const daysMap = {};
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        daysMap[key] = 0;
      }

      for (const issue of issues) {
        try {
          const date = new Date(issue.createdAt);
          const key = date.toISOString().split('T')[0];
          if (daysMap.hasOwnProperty(key)) {
            daysMap[key] += 1;
          }
        } catch (e) {
          // skip invalid dates
        }
      }

      return {
        labels: Object.keys(daysMap).map(d => {
          const date = new Date(d);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        data: Object.values(daysMap),
      };
    } else {
      // Last 6 months
      const monthsMap = {};
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthsMap[key] = 0;
      }

      for (const issue of issues) {
        try {
          const date = new Date(issue.createdAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthsMap.hasOwnProperty(key)) {
            monthsMap[key] += 1;
          }
        } catch (e) {
          // skip invalid dates
        }
      }

      return {
        labels: Object.keys(monthsMap).map(m => {
          const [year, month] = m.split('-');
          const date = new Date(year, parseInt(month) - 1);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        data: Object.values(monthsMap),
      };
    }
  }, [issues, timeView]);

  // Status Distribution Doughnut Chart
  const statusDoughnutData = useMemo(() => {
    const labels = Object.keys(statusCounts).filter(k => statusCounts[k] > 0);
    const values = labels.map(k => statusCounts[k]);
    const colors = {
      Open: "#e76f51",
      Closed: "#2a9d8f",
      Unknown: "#94a3b8"
    };
    
    return {
      labels: labels,
      datasets: [
        {
          label: "Complaints",
          data: values,
          backgroundColor: labels.map(l => colors[l] || "#94a3b8"),
          borderWidth: 0,
        },
      ],
    };
  }, [statusCounts]);

  // Priority Distribution Doughnut Chart
  const priorityDoughnutData = useMemo(() => {
    const labels = Object.keys(priorityCounts).filter(k => priorityCounts[k] > 0);
    const values = labels.map(k => priorityCounts[k]);
    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
    
    return {
      labels: labels,
      datasets: [
        {
          label: "Priority",
          data: values,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [priorityCounts]);

  // User Role Distribution Pie Chart
  const userRolePieData = useMemo(() => {
    return {
      labels: ["Users", "Volunteers"],
      datasets: [
        {
          label: "Count",
          data: [userRoleCounts.users, userRoleCounts.volunteers],
          backgroundColor: ["#3b82f6", "#8b5cf6"],
          borderWidth: 0,
        },
      ],
    };
  }, [userRoleCounts]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "right",
        labels: {
          font: { size: 12 },
          padding: 12
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: "60%",
  };

  // Summary Bar Chart
  const barData = useMemo(() => {
    return {
      labels: ["Total", "Open", "Closed", "Closed Today"],
      datasets: [
        {
          label: "Count",
          data: [total, open, closed, closedToday],
          backgroundColor: ["#3b82f6", "#e76f51", "#2a9d8f", "#8b5cf6"],
          borderRadius: 6,
          barThickness: 40,
        },
      ],
    };
  }, [total, open, closed, closedToday]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { 
          precision: 0,
          font: { size: 11 }
        },
        grid: {
          color: "#f1f5f9"
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 }
        }
      }
    },
  };

  // Line Chart Data
  const lineChartData = useMemo(() => {
    return {
      labels: timeBasedData.labels,
      datasets: [
        {
          label: `${timeView === 'daily' ? 'Daily' : 'Monthly'} Complaints`,
          data: timeBasedData.data,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [timeBasedData, timeView]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: { 
          precision: 0,
          font: { size: 11 }
        },
        grid: {
          color: "#f1f5f9"
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 }
        }
      }
    },
  };

  // PDF Export Handler
  const handleExportPDF = () => {
    // Create a simple HTML content for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Clean Street Reports</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2f4b32; }
            h2 { color: #3d6b3c; margin-top: 20px; }
            .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
            .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; min-width: 150px; }
            .stat-label { color: #667; font-size: 12px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1a2a1a; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f8faf8; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 12px; color: #667; }
          </style>
        </head>
        <body>
          <h1>Clean Street - Reports & Analytics</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          
          <h2>Summary Statistics</h2>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total Complaints</div>
              <div class="stat-value">${total}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Open</div>
              <div class="stat-value" style="color: #e76f51;">${open}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Closed</div>
              <div class="stat-value" style="color: #2a9d8f;">${closed}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Closed Today</div>
              <div class="stat-value" style="color: #8b5cf6;">${closedToday}</div>
            </div>
          </div>

          <h2>Status Distribution</h2>
          <table>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
            ${Object.entries(statusCounts).map(([status, count]) => `
              <tr>
                <td>${status}</td>
                <td>${count}</td>
                <td>${total > 0 ? ((count / total) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
          </table>

          <h2>Priority Distribution</h2>
          <table>
            <tr>
              <th>Priority</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
            ${Object.entries(priorityCounts).map(([priority, count]) => `
              <tr>
                <td>${priority}</td>
                <td>${count}</td>
                <td>${total > 0 ? ((count / total) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
          </table>

          <h2>Key Insights</h2>
          <ul>
            <li>Resolution Rate: ${total > 0 ? ((closed / total) * 100).toFixed(1) : 0}%</li>
            <li>Total Users: ${users.length}</li>
            <li>Average Priority Level: ${issues.length > 0 ? (issues.reduce((sum, i) => sum + (i.priorityLevel || 0), 0) / issues.length).toFixed(1) : 'N/A'}</li>
          </ul>

          <div class="footer">
            <p>This report was automatically generated by Clean Street Admin Dashboard</p>
          </div>
        </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clean-street-reports-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <AdminSidebar logo={logo} />
        <div className="admin-main">
          <div style={{ padding: 24 }}>Loading reports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <AdminSidebar logo={logo} />
        <div className="admin-main">
          <div style={{ padding: 24, color: "red" }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar logo={logo} />
      <div className="admin-main">
        <header className="admin-top">
          <h1>Reports & Analytics</h1>
          <button 
            onClick={handleExportPDF}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: "#3d6b3c",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14
            }}
          >
            📥 Export PDF
          </button>
        </header>

        {/* Summary Stats */}
        <section className="admin-stats-row">
          <div className="admin-stat-card">
            <div className="stat-label">Total Complaints</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-label">Open</div>
            <div className="stat-value" style={{ color: "#e76f51" }}>{open}</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-label">Closed</div>
            <div className="stat-value" style={{ color: "#2a9d8f" }}>{closed}</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-label">Closed Today</div>
            <div className="stat-value" style={{ color: "#8b5cf6" }}>{closedToday}</div>
          </div>
        </section>

        {/* Charts Grid - Row 1: Three Doughnut/Pie Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 10 }}>
          {/* Status Distribution */}
          <div className="card" style={{ minHeight: 320 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#1a2a1a" }}>
              Status Distribution
            </h3>
            <div style={{ height: 260 }}>
              <Doughnut data={statusDoughnutData} options={{...doughnutOptions, plugins: {...doughnutOptions.plugins, title: undefined}}} />
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="card" style={{ minHeight: 320 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#1a2a1a" }}>
              Priority Distribution
            </h3>
            <div style={{ height: 260 }}>
              <Doughnut data={priorityDoughnutData} options={{...doughnutOptions, plugins: {...doughnutOptions.plugins, title: undefined}}} />
            </div>
          </div>

          {/* User Role Distribution */}
          <div className="card" style={{ minHeight: 320, position: "relative" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#1a2a1a" }}>
              Users vs Volunteers
              {!usersLoaded && (
                <span style={{ 
                  fontSize: 11, 
                  color: "#f59e0b", 
                  marginLeft: 8,
                  fontWeight: 400,
                  background: "#fef3c7",
                  padding: "2px 8px",
                  borderRadius: 4
                }}>
                  Demo Data
                </span>
              )}
            </h3>
            <div style={{ height: 260 }}>
              <Doughnut data={userRolePieData} options={{...doughnutOptions, plugins: {...doughnutOptions.plugins, title: undefined}}} />
            </div>
          </div>
        </div>

        {/* Charts Grid - Row 2: Bar Chart and Line Chart */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20, marginTop: 20 }}>
          {/* Summary Bar Chart */}
          <div className="card" style={{ minHeight: 320 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#1a2a1a" }}>
              Summary Overview
            </h3>
            <div style={{ height: 260 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Complaints Timeline Line Chart */}
          <div className="card" style={{ minHeight: 320 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1a2a1a" }}>
                Complaints Timeline
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setTimeView("daily")}
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: timeView === "daily" ? 600 : 400,
                    color: timeView === "daily" ? "#fff" : "#667",
                    backgroundColor: timeView === "daily" ? "#3b82f6" : "#f1f5f9",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeView("monthly")}
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: timeView === "monthly" ? 600 : 400,
                    color: timeView === "monthly" ? "#fff" : "#667",
                    backgroundColor: timeView === "monthly" ? "#3b82f6" : "#f1f5f9",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div style={{ height: 260 }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600, color: "#1a2a1a" }}>
            Insights
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            <div style={{ padding: 12, background: "#f8faf8", borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: "#667", marginBottom: 4 }}>Resolution Rate</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {total > 0 ? ((closed / total) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div style={{ padding: 12, background: "#f8faf8", borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: "#667", marginBottom: 4 }}>Open Complaints</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{open}</div>
            </div>
            <div style={{ padding: 12, background: "#f8faf8", borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: "#667", marginBottom: 4 }}>Total Users</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {users.length}
                {!usersLoaded && <span style={{ fontSize: 11, color: "#f59e0b", marginLeft: 4 }}>*</span>}
              </div>
            </div>
            <div style={{ padding: 12, background: "#f8faf8", borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: "#667", marginBottom: 4 }}>Avg. Priority Level</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {issues.length > 0 
                  ? (issues.reduce((sum, i) => sum + (i.priorityLevel || 0), 0) / issues.length).toFixed(1)
                  : "N/A"}
              </div>
            </div>
          </div>
          {!usersLoaded && (
            <div style={{ 
              marginTop: 12, 
              padding: 8, 
              background: "#fef3c7", 
              borderRadius: 6,
              fontSize: 12,
              color: "#92400e"
            }}>
              * Users data is placeholder. Backend team needs to add GET /api/users endpoint.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
