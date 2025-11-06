import React from "react";

const AdminStatsCard = ({ title, value }) => {
  return (
    <div className="admin-stat-card">
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
};

export default AdminStatsCard;
