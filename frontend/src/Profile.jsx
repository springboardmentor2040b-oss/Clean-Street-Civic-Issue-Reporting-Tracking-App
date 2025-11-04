import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";

function Profile() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState({
    name: "",
    username: "",
    email: "",
    location: "",
    citizenId: "",
    resolved: 0,
    totalIssues: 0,
    avatar: "",
  });
  const [formData, setFormData] = useState({ ...user });
  const [uploading, setUploading] = useState(false);
  const token = localStorage.getItem("token");
  const fileInputRef = useRef();

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5001/api/users/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setUser(data);
        setFormData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [token]);

  // Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload avatar to Cloudinary
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formDataCloud = new FormData();
    formDataCloud.append("file", file);
    formDataCloud.append("upload_preset", "unsigned_avatar"); // replace with your preset

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dchdfdaqy/image/upload", // replace with your cloud name
        {
          method: "POST",
          body: formDataCloud,
        }
      );
      const data = await res.json();
      setFormData((prev) => ({ ...prev, avatar: data.secure_url }));
      setUser((prev) => ({ ...prev, avatar: data.secure_url })); // preview
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setUser(updated);
      setFormData(updated);
      setEditMode(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Profile update failed");
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <div className="profile-container">
      {!editMode ? (
        <>
          <div className="back-btn" onClick={() => navigate(-1)}>
            ← BACK
          </div>
          <div className="profile-header">
            <div className="avatar-box">
              <img
                src={user.avatar || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"}
                  alt="User Avatar"
                  className="avatar-large"
              />
              <button 
               className="camera-btn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "📷"}
                  </button>
            </div>
            <div className="profile-info">
              <h2>{user.name}</h2>
              <p>Citizen Id: {user.citizenId}</p>
            </div>
            <button className="primary-btn" onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
            <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
          </div>
          <div className="account-info">
            <h3>Account Information</h3>
            <p className="info-sub">
              The information below is private and helps us personalize your
              experience on the platform.
            </p>
            <div className="info-row">
              <label>Email :</label>
              <span>{user.email}</span>
            </div>
            <div className="info-row">
              <label>Location :</label>
              <span>{user.location}</span>
            </div>
            <div className="info-row">
              <label>Password :</label>
              <span>•••••••</span>
            </div>
          </div>
          <div className="reports-card">
            <div className="circle-chart">
              <svg viewBox="0 0 36 36">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${user.resolved}, 100`}
                  d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="circle-text">{user.resolved}%</div>
            </div>
            <div className="report-info">
              <h4>Total issues: {user.totalIssues}</h4>
              <p>Recent Activity:</p>
              <ul>
                <li>Raised issue on street light fault near main road</li>
                <li>Raised issue on water quality due to impurities</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="topbar">
            <div
              className="logo"
              onClick={() => handleNavClick("/dashboard")}
            >
              CLEAN STREET
            </div>
            <nav>
              <span onClick={() => handleNavClick("/dashboard")}>Dashboard</span>
              <span onClick={() => handleNavClick("/report")}>Report Issue</span>
              <span onClick={() => handleNavClick("/complaints")}>
                View Complaints
              </span>
              <span
                onClick={() => handleNavClick("/profile")}
                className="profile-icon"
              >
                👤
              </span>
            </nav>
          </div>
          <div className="edit-profile-container">
            <h2>Profile Information</h2>
            <div className="edit-form">
              <div className="avatar-box">
                <img
                  src={user.avatar || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"}
                  alt="User Avatar"
                  className="avatar-large"
                />
                <button
                  className="camera-btn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "📷"}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="form-fields">
                <label>
                  Full Name:
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Username:
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Email:
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Location:
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Password:
                  <input
                    type="password"
                    name="password"
                    placeholder="Change Password"
                  />
                </label>
                <label>
                  Confirm Password:
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                  />
                </label>
              </div>
            </div>
            <div className="button-row">
              <button className="primary-btn" onClick={handleSave}>
                Save
              </button>
              <button
                className="secondary-btn"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
