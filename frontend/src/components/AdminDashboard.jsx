import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import AdminSidebar from "./AdminSidebar";
import AdminStatsCard from "./AdminStatsCard";
import AdminComplaintsTable from "./AdminComplaintsTable";
import logo from "../assets/logo.jpeg";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/issues/all", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch complaints");

        let data = await res.json();

        // 🧹 Normalize status field and capitalization (e.g., "pending" -> "Pending")
        data = data.map((item) => ({
          ...item,
          status: item.status
            ? item.status.trim().replace(/\b\w/g, (c) => c.toUpperCase())
            : "Unknown",
        }));

        setIssues(data);
      } catch (err) {
        console.error("Error fetching complaints:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [token]);

  const handleGoToReport = () => navigate("/report");

  // 🧮 Dynamically count statuses (handles any type automatically)
  const statusCounts = issues.reduce((acc, issue) => {
    const s = issue.status || "Unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div>Loading complaints...</div>;

  return (
    <div className="admin-page">
      <AdminSidebar logo={logo} />
      <div className="admin-main">
        <header className="admin-top">
          <h1>Admin Dashboard</h1>
          <div className="admin-top-actions">
            <button className="btn" onClick={handleGoToReport}>
              Report Issue
            </button>
          </div>
        </header>

        <section className="admin-stats-row">
          {/* Total Issues */}
          <AdminStatsCard title="Total Issues" value={issues.length} />

          {/* Dynamically render cards for all statuses */}
          {Object.entries(statusCounts).map(([status, count]) => (
            <AdminStatsCard key={status} title={status} value={count} />
          ))}
        </section>

        <section className="admin-content">
          <div className="admin-left-panel">
            <div className="card">
              <h3>Community Reports</h3>
              <p>Latest activity overview and quick controls.</p>
            </div>
          </div>

          <div className="admin-right-panel">
            <h2>All Complaints</h2>
            <AdminComplaintsTable issues={issues} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;