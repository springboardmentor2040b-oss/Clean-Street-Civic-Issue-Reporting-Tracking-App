import React from "react";
import "./AdminComplaintsTable.css";

const AdminComplaintsTable = ({ issues = [] }) => {
  const handleChangeStatus = (id, newStatus) => {
    // TODO: Replace with actual API call
    console.log("Change status", id, newStatus);
    alert(`Pretend we're updating ${id} => ${newStatus}`);
  };

  // Function to dynamically get badge class
  const getStatusClass = (status) => {
    if (!status) return "badge unknown";
    switch (status.toLowerCase()) {
      case "pending":
        return "badge pending";
      case "open":
        return "badge open";
      case "in review":
      case "in-review":
        return "badge review";
      case "resolved":
        return "badge resolved";
      case "closed":
        return "badge closed";
      default:
        return "badge unknown";
    }
  };

  return (
    <div className="complaints-table">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Location</th>
            <th>Date</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", color: "#666" }}>
                No complaints found
              </td>
            </tr>
          ) : (
            issues.map((it) => (
              <tr key={it._id}>
                <td>{it.title || "Untitled"}</td>
                <td>{it.address || "N/A"}</td>
                <td>
                  {new Date(it.createdAt || it.date || Date.now()).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </td>
                <td>
                  <span className={getStatusClass(it.status)}>
                    {it.status || "Unknown"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="action-btn review"
                    onClick={() => handleChangeStatus(it._id, "In Review")}
                  >
                    In Review
                  </button>
                  <button
                    className="action-btn resolve"
                    onClick={() => handleChangeStatus(it._id, "Resolved")}
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminComplaintsTable;
