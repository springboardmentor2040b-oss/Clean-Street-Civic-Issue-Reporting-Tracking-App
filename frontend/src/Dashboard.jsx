import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import logo from "./assets/logo.jpeg";
import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Total issues", value: 24, icon: (<svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 10.5a1 1 0 0 1-1-1V7.75a1 1 0 1 1 2 0V12.5a1 1 0 0 1-1 1zm0 3.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" fill="currentColor"/></svg>) },
  { label: "Open", value: 9, icon: (<svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M12 2 3.5 20.5h17L12 2zm0 4.2 5.38 11.3H6.62L12 6.2zm-.9 3.8v4.5h1.8V10h-1.8zm0 5.6v1.8h1.8v-1.8h-1.8z" fill="currentColor"/></svg>) },
  { label: "In Review", value: 11, icon: (<svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5v11.88l-4.24-3.24H6.5A1.5 1.5 0 0 1 5 12.64V5.5A1.5 1.5 0 0 1 6.5 4zm.5 2v6.64h7.02L17 15.7V6H7z" fill="currentColor"/></svg>) },
  { label: "Resolved", value: 4, icon: (<svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M19 5.5 9.75 14.74l-4.5-4.49L5.66 9l4.09 4.1L17.59 5.2 19 5.5z" fill="currentColor"/></svg>) },
];

const activities = [
  "New streetlight issue reported",
  "Garbage dumped complaint",
  "Problem on main street",
];

const quickActions = [
  { label: "Report issues here", primary: true, action: "/report" },
  { label: "View all the Complaints", primary: false, action: "/complaints" },
];

const Dashboard = () => {
  const [issues, setIssues] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/issues/all");
        if (!response.ok) throw new Error("Failed to fetch issues");
        const data = await response.json();
        console.log("Fetched issues:", data);
        setIssues(data);
      } catch (error) {
        console.error("Error fetching issues:", error);
      }
    };

    fetchIssues();
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleQuickAction = (action) => {
    navigate(action);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="dashboard">
      {/* Top Navbar */}
      <header className="top-nav">
        <div className="brand">
          <img src={logo} alt="Clean Street Logo" className="brand-logo" />
        </div>
        <nav className="nav-links">
          <a href="/dashboard" className="active">Dashboard</a>
          <a href="/report">Report Issue</a>
          <a href="/complaints">View Complaints</a>
          {localStorage.getItem('role') === 'admin' && (
  <a href="/admin">Admin</a>
)}
        </nav>
        <button type="button" className="profile" onClick={handleProfileClick}>
          <span className="sr-only">Account</span>
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path
              d="M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 8.5c3.35 0 6 2.22 6 4.96V19.5H6v-1.54C6 15.22 8.65 13 12 13z"
              fill="currentColor"
            />
          </svg>
        </button>
      </header>

      {/* Dashboard Main Content */}
      <main className="dashboard-content">
        <section className="hero">
          <div className="hero-illustration" aria-hidden />
        </section>

        {/* Stats */}
        <section className="stats-grid">
          {stats.map(({ label, value, icon }) => (
            <div className="stat-card" key={label}>
              <div className="stat-icon">{icon}</div>
              <div className="stat-details">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Bottom panels */}
        <section className="bottom-panels">
          <aside className="recent-activity">
            <header>
              <span>Recent Activity</span>
              <button type="button" className="activity-cta">{'>'}</button>
            </header>
            <ul>
              {activities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>

          <aside className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions">
              {quickActions.map(({ label, primary, action }) => (
                <button
                  key={label}
                  type="button"
                  className={primary ? "primary" : "secondary"}
                  onClick={() => handleQuickAction(action)}
                >
                  {label}
                </button>
              ))}
            </div>
          </aside>
        </section>

        {/* Complaints Section */}
        <section className="complaints-section">
          <h2>Recent Complaints</h2>
          <div className="complaints-grid">
            {issues.length === 0 ? (
              <p style={{ color: "#666" }}>No complaints found.</p>
            ) : (
              issues.map((issue) => {
                const {
                  _id,
                  title = "Untitled Issue",
                  description = "No description provided",
                  status = "Open",
                  location = "Not specified",
                  date,
                  images = [],
                } = issue;

                const imageList =
                  Array.isArray(images) && images.length > 0
                    ? images
                    : ["https://via.placeholder.com/100?text=No+Image"];

                return (
                  <div className="complaint-card" key={_id}>
                    <h4>{title}</h4>
                    <p className="desc">{description}</p>
                    <div className={`status-badge ${status.toLowerCase().replace(" ", "-")}`}>
                      {status}
                    </div>
                    <div className="card-footer">
                      <span>{location}</span>
                      <span>{formatDate(date)}</span>
                    </div>
                    <div className="images">
                      {imageList.slice(0, 3).map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt="Issue"
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      ))}
                      {imageList.length > 3 && (
                        <span>+{imageList.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
