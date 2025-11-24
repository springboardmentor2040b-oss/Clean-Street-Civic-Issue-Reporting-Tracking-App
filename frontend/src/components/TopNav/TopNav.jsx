import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.jpeg";
import "./TopNav.css";

const BASE_NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Report Issue", path: "/report" },
  { label: "View Complaints", path: "/complaints" },
];

const TopNav = ({ activePath, onProfileClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentPath = activePath || location.pathname;

  // Detect admin user — change this if you store admin elsewhere
  const isAdmin =
    localStorage.getItem("role") === "admin" ||
    localStorage.getItem("isAdmin") === "true";

  // Build nav list dynamically (adds Admin only for admins)
  const navItems = isAdmin
    ? [...BASE_NAV_ITEMS, { label: "Admin", path: "/admin" }]
    : BASE_NAV_ITEMS;

  const handleNavigate = (path) => {
    setMenuOpen(false);
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const handleProfile = () => {
    setMenuOpen(false);
    if (onProfileClick) {
      onProfileClick();
      return;
    }
    navigate("/profile");
  };

  return (
    <header
      className={`top-nav ${menuOpen ? "nav-open" : ""}`}
    >
      <button
        type="button"
        className="brand"
        onClick={() => handleNavigate("/dashboard")}
      >
        <span className="sr-only">Go to dashboard</span>
        <img src={logo} alt="Clean Street" className="brand-logo" />
      </button>

      <button
        type="button"
        className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-label="Toggle navigation menu"
      >
        {menuOpen ? (
          <svg
            className="nav-toggle-icon nav-toggle-icon--close"
            viewBox="0 0 24 24"
            aria-hidden
            focusable="false"
          >
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            className="nav-toggle-icon nav-toggle-icon--grid"
            viewBox="0 0 24 24"
            aria-hidden
            focusable="false"
          >
            <rect x="4" y="4" width="6" height="6" rx="2" fill="currentColor" />
            <rect x="14" y="4" width="6" height="6" rx="2" fill="currentColor" />
            <rect x="4" y="14" width="6" height="6" rx="2" fill="currentColor" />
            <rect x="14" y="14" width="6" height="6" rx="2" fill="currentColor" />
          </svg>
        )}
      </button>

      <nav className={`nav-links ${menuOpen ? "is-open" : ""}`}>
        {navItems.map(({ label, path }) => (
          <a
            key={path}
            href={path}
            className={`nav-link ${currentPath === path ? "active" : ""}`}
            onClick={(event) => {
              event.preventDefault();
              handleNavigate(path);
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <button type="button" className="profile" onClick={handleProfile}>
        <span className="sr-only">Profile</span>
        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
          <path
            d="M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 8.5c3.35 0 6 2.22 6 4.96V19.5H6v-1.54C6 15.22 8.65 13 12 13z"
            fill="currentColor"
          />
        </svg>
      </button>
    </header>
  );
};

export default TopNav;
