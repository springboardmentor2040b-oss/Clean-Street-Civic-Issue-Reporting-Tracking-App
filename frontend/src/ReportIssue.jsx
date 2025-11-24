import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Dashboard.css";
import "./ReportIssue.css";
import { useNavigate } from "react-router-dom";
import TopNav from "./components/TopNav/TopNav";

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
        status: "Open",
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
    <div className="dashboard">
      <TopNav activePath="/report" />

      <main className="dashboard-content report-content">
        <div className="report-card">
          <h2 className="report-title">Report a Civic Issue</h2>
          <p className="report-subtitle">Please fill out this form to raise your issue.</p>

          <form className="report-form" onSubmit={handleSubmit}>
          {/* Title + Priority (Row 1) */}
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
          </div>

          {/* Priority Level + Nearby Landmark (Row 2) */}
          <div className="form-row">
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
          <div className="image-upload-box">
            <div className="image-upload-preview">
              {images.length === 0 && (
                <p className="image-upload-placeholder">Drop or upload photos to help describe the issue.</p>
              )}
              {images.slice(0, 3).map((img, i) => (
                <div key={i} className="image-upload-item">
                  <img
                    src={img instanceof File ? URL.createObjectURL(img) : img}
                    alt={`Uploaded evidence ${i + 1}`}
                    className="image-upload-thumb"
                  />
                  <button
                    type="button"
                    className="image-upload-delete"
                    aria-label={`Remove image ${i + 1}`}
                    onClick={() =>
                      setImages((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length > 3 && (
                <span className="image-upload-overflow">+{images.length - 3} more</span>
              )}
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
              onChange={(e) =>
                setImages((prev) => [
                  ...prev,
                  ...Array.from(e.target.files || [])
                ])
              }
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
                className="report-map"
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
      </main>
    </div>
  );
}
