import React from "react";
import { NavLink } from "react-router-dom";

const AdminSidebar = ({ logo }) => {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <div className="brand-text">Clean Street</div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin" end className={({isActive}) => isActive ? "active" : ""}>
          Overview
        </NavLink>
        <NavLink to="/admin/users" className={({isActive}) => isActive ? "active" : ""}>
          Users
        </NavLink>
        <NavLink to="/admin/reports" className={({isActive}) => isActive ? "active" : ""}>
          Reports
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <small>Admin</small>
      </div>
    </aside>
  );
};

export default AdminSidebar;
