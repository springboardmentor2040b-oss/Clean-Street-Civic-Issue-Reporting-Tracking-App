import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import TopNav from "./components/TopNav/TopNav";



const stats = [
  { label: "Total issues", value: 24, icon: (<svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 10.5a1 1 0 0 1-1-1V7.75a1 1 0 1 1 2 0V12.5a1 1 0 0 1-1 1zm0 3.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" fill="currentColor"/></svg>) },
  { label: "Open", value: 9, icon: (<svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M12 2 3.5 20.5h17L12 2zm0 4.2 5.38 11.3H6.62L12 6.2zm-.9 3.8v4.5h1.8V10h-1.8zm0 5.6v1.8h1.8v-1.8h-1.8z" fill="currentColor"/></svg>) },
  { label: "In Review", value: 11, icon: (<svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5v11.88l-4.24-3.24H6.5A1.5 1.5 0 0 1 5 12.64V5.5A1.5 1.5 0 0 1 6.5 4zm.5 2v6.64h7.02L17 15.7V6H7z" fill="currentColor"/></svg>) },
  { label: "Resolved", value: 4, icon: (<svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M19 5.5 9.75 14.74l-4.5-4.49L5.66 9l4.09 4.1L17.59 5.2 19 5.5z" fill="currentColor"/></svg>) },
];

const renderLogMessage = (log) => {
  const actor = log.actor || (log.user && (log.user.username || log.user.name || log.user.email)) || 'Someone';
  const prev = log.meta && (log.meta.previousStatus || log.meta.oldStatus);
  const next = log.meta && (log.meta.newStatus || log.meta.newStatus) || log.action || log.status;
  const issueLabel = log.issueTitle || (log.issue && (log.issue.title || String(log.issue._id))) || (log.issueId ? `Issue ${String(log.issueId)}` : 'an issue');
  const time = log.timestamp || log.createdAt || log.date || null;

  let text;
  if (prev && next) text = `${actor} updated the Status of ${issueLabel} from ${prev} to ${next}`;
  else if (typeof log.details === 'string' && log.details.trim().length) text = log.details;
  else text = `${actor} changed status to ${next || 'updated'} on ${issueLabel}`;

  return { text, time };
};

const quickActions = [
  { label: "Report issues here", primary: true, action: "/report" },
  { label: "View all the Complaints", primary: false, action: "/complaints" },
];

const Dashboard = () => {
  const [issues, setIssues] = useState([]);
  const [logs, setLogs] = useState([]);
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

    const fetchLogs = async () => {
      try {
        // Adjust endpoint as per your backend (eg: /api/logs or /api/issues/logs)
        const res = await fetch("http://localhost:5001/api/logs");
        if (!res.ok) throw new Error("Failed to fetch logs");
        const logData = await res.json();
        console.log("Fetched logs:", logData);
        setLogs(Array.isArray(logData) ? logData : []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };

    fetchIssues();
    fetchLogs();
  }, []);

  const handleQuickAction = (action) => {
    navigate(action);
  };

  const handleProfileClick = () => {
  navigate("/profile");
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
      <TopNav activePath="/dashboard" onProfileClick={handleProfileClick} />

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
              {logs.length === 0 ? (
                <li className="no-logs">No recent activity.</li>
              ) : (
                logs.map((log) => {
                  const { text, time } = renderLogMessage(log);
                  const key = log._id || log.id || `${log.issue?._id||log.issueId||'unknown'}-${time}`;

                  return (
                    <li key={key} className="log-entry">
                      <div className="log-text">{text}</div>
                      <div className="log-time">{time ? formatDate(time) : ''}</div>
                    </li>
                  );
                })
              )}
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
              <p className="complaints-empty">No complaints found.</p>
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

                // Normalize status display
                const normalizeStatus = (status) => {
                  const s = status.toLowerCase();
                  if (s.includes("close") || s.includes("resolve")) return "Close";
                  if (s.includes("pending")) return "Pending";
                  if (s.includes("open")) return "Open";
                  return status;
                };

                const displayStatus = normalizeStatus(status);

                const imageList =
                  Array.isArray(images) && images.length > 0
                    ? images
                    : ["https://via.placeholder.com/100?text=No+Image"];

                return (
                  <div className="complaint-card" key={_id}>
                    <h4>{title}</h4>
                    <p className="desc">{description}</p>
                    <div className={`status-badge ${displayStatus.toLowerCase().replace(" ", "-")}`}>
                      {displayStatus}
                    </div>
                    <div className="card-footer">
                      <span>{location}</span>
                      <span>{formatDate(date)}</span>
                    </div>
                    <div className="complaint-card__images">
                      {imageList.slice(0, 3).map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt="Issue"
                          className="complaint-card__image"
                        />
                      ))}
                      {imageList.length > 3 && (
                        <span className="complaint-card__more">+{imageList.length - 3} more</span>
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
