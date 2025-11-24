import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import AdminSidebar from "./AdminSidebar";
import AdminStatsCard from "./AdminStatsCard";
import AdminComplaintsTable from "./AdminComplaintsTable";
import logo from "../assets/logo.jpeg";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
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

  const handleGoBack = () => navigate("/dashboard");

  // Apply filters
  useEffect(() => {
    let filtered = issues;

    if (filterLocation) {
      filtered = filtered.filter((issue) =>
        issue.address?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((issue) =>
        issue.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    setFilteredIssues(filtered);
  }, [issues, filterLocation, filterStatus]);

  // 🧮 Dynamically count statuses (handles any type automatically)
  const statusCounts = issues.reduce((acc, issue) => {
    const s = issue.status || "Unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const handleClearFilters = () => {
    setFilterLocation("");
    setFilterStatus("");
  };

  if (loading) return <div>Loading complaints...</div>;

  return (
    <div className="admin-page">
      <AdminSidebar logo={logo} />
      <div className="admin-main">
        <header className="admin-top">
          <div className="admin-top-left">
            <button className="btn-back" onClick={handleGoBack}>
              ← Back
            </button>
            <h1>Admin Dashboard</h1>
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
          
          <div className="admin-right-panel">
            <div className="admin-complaints-header">
              <h2>All Complaints</h2>
              <button 
                className="btn-filter"
                onClick={() => setShowFilter(!showFilter)}
                title="Toggle filter"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>

            {showFilter && (
              <div className="filter-panel">
                <div className="filter-group">
                  <label>Location:</label>
                  <input
                    type="text"
                    placeholder="Search by location..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {Object.keys(statusCounts).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  className="btn-clear-filter"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
            )}

            <AdminComplaintsTable issues={filteredIssues.length > 0 ? filteredIssues : issues} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
