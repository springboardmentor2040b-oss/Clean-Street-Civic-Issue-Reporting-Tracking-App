import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./ReportIssue.css";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.jpeg";

const priorityOptions = ["Low", "Medium", "High"];
const priorityLevelOptions = ["1", "2", "3"];

export default function ReportIssue() {
  const [issueTitle, setIssueTitle] = useState("");
  const [issuePriority, setIssuePriority] = useState("");
  const [issuePriorityLevel, setIssuePriorityLevel] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [nearbyLandmark, setNearbyLandmark] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 11.025, lng: 77.02 });
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ Upload to Cloudinary
  const uploadImagesToCloudinary = async () => {
    const uploadedImageUrls = [];

    for (const img of images) {
      if (img instanceof File) {
        const formData = new FormData();
        formData.append("file", img);
        formData.append("upload_preset", "unsigned_issues"); // your unsigned preset name

        try {
          const res = await fetch(
            "https://api.cloudinary.com/v1_1/dchdfdaqy/image/upload",
            { method: "POST", body: formData }
          );
          const data = await res.json();

          if (data.secure_url) {
            uploadedImageUrls.push(data.secure_url);
          } else {
            console.error("Cloudinary upload failed:", data);
          }
        } catch (error) {
          console.error("Error uploading to Cloudinary:", error);
        }
      } else {
        uploadedImageUrls.push(img);
      }
    }
    return uploadedImageUrls;
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!issueTitle || !issueDescription || !address) {
      alert("⚠️ Please fill all required fields before submitting.");
      return;
    }

    try {
      setUploading(true);
      const uploadedImageUrls = await uploadImagesToCloudinary();

      const issueData = {
        title: issueTitle,
        priority: issuePriority,
        priorityLevel: issuePriorityLevel,
        description: issueDescription,
        nearbyLandmark,
        address,
        images: uploadedImageUrls,
        username: localStorage.getItem("username") || "Anonymous",
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        dateReported: new Date().toISOString(),
        status: "Pending",
      };

      const response = await fetch("http://localhost:5001/api/issues/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Server error");
      }

      alert("✅ Issue submitted successfully!");

      // reset form
      setIssueTitle("");
      setIssuePriority("");
      setIssuePriorityLevel("");
      setIssueDescription("");
      setNearbyLandmark("");
      setAddress("");
      setImages([]);
    } catch (error) {
      console.error("❌ Error submitting issue:", error);
      alert("❌ Error submitting issue. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Navbar */}
      <header className="top-nav">
        <div className="brand">
          <img src={logo} alt="Clean Street Logo" className="brand-logo" />
        </div>
        <nav className="nav-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/report" className="active">Report Issue</a>
          <a href="/complaints">View Complaints</a>
        </nav>
        <button type="button" className="profile" onClick={() => navigate("/profile")}>
          <span className="sr-only">Account</span>
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path
              d="M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 8.5c3.35 0 6 2.22 6 4.96V19.5H6v-1.54C6 15.22 8.65 13 12 13z"
              fill="currentColor"
            />
          </svg>
        </button>
      </header>

      {/* Form */}
      <div className="container">
        {/* Back Button */}
        <div className="back-btn-container">
          <div className="back-btn" onClick={() => navigate(-1)} style={{
            cursor: "pointer",
            fontSize: "1rem",
            color: "#5f7f47",
            fontWeight: "600",
            marginBottom: "1rem"
          }}>
            ← BACK
          </div>
        </div>

        <h2>Report a Civic Issue</h2>
        <div className="subtitle">Please fill out this form to raise your issue.</div>

        <form onSubmit={handleSubmit}>
          {/* Title + Priority */}
          <div className="form-row">
            <div className="form-group">
              <label>Issue Title:</label>
              <input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Issue Priority:</label>
              <select
                value={issuePriority}
                onChange={(e) => setIssuePriority(e.target.value)}
              >
                <option value="" disabled>Select priority</option>
                {priorityOptions.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Priority Level:</label>
              <select
                value={issuePriorityLevel}
                onChange={(e) => setIssuePriorityLevel(e.target.value)}
              >
                <option value="" disabled>Select level</option>
                {priorityLevelOptions.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nearby Landmark:</label>
              <input
                value={nearbyLandmark}
                onChange={(e) => setNearbyLandmark(e.target.value)}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="image-upload-box" style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div className="image-upload-preview" style={{ display: "flex", gap: "10px" }}>
              {images.slice(0, 3).map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={img instanceof File ? URL.createObjectURL(img) : img}
                    alt=""
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "5px",
                      border: "1px solid #c0cec6",
                    }}
                  />
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      backgroundColor: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="image-upload-note">
              Upload images less than 3MB (jpg, png, jpeg)
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              id="hidden-file-input"
              className="image-upload-input"
              onChange={(e) => setImages([...images, ...Array.from(e.target.files)])}
            />

            <button
              type="button"
              className="image-upload-btn"
              onClick={() => document.getElementById("hidden-file-input").click()}
            >
              Upload
            </button>
          </div>

          {/* Description + Address */}
          <div className="form-group">
            <label>Issue Description:</label>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Address:</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {/* Map */}
          <div className="map-section">
            <div className="form-group">
              <label>Location:</label>
              <MapContainer
                style={{
                  height: "260px",
                  width: "100%",
                  borderRadius: "13px",
                  border: "1px solid #c9d9c2",
                }}
                center={mapCenter}
                zoom={10}
                scrollWheelZoom={false}
                whenCreated={(map) => {
                  map.on("move", () => setMapCenter(map.getCenter()));
                }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </MapContainer>
            </div>
          </div>

          {/* Confirmation */}
          <div className="checkbox-row">
            <input type="checkbox" id="confirm" required />
            <label htmlFor="confirm">
              I confirm that the information provided above is true.
            </label>
          </div>

          <button className="submit-btn" disabled={uploading}>
            {uploading ? "Uploading..." : "SUBMIT"}
          </button>
        </form>
      </div>
    </>
  );
}
