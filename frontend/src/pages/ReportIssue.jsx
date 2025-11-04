import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const mapContainerStyle = {
  width: "100%",
  height: "320px",
  borderRadius: "0.75rem",
};

export default function ReportIssue() {
  const { token } = useAuth();
  // form fields
  const [title, setTitle] = useState("");
  const [issueType, setIssueType] = useState("");
  const [priority, setPriority] = useState("");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [photos, setPhotos] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // string[] object URLs
  const [dragOver, setDragOver] = useState(false);

  const [center, setCenter] = useState({ lat: 20.2961, lng: 85.8245 }); // Odisha default

  // File select helpers
  const revokeAllPreviews = () => {
    previews.forEach((p) => {
      try {
        URL.revokeObjectURL(p);
      } catch (_) {}
    });
  };
  const handleAddFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const max = 6;
    const current = photos.length;
    const available = Math.max(0, max - current);
    const incoming = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
    );
    const toAdd = incoming.slice(0, available);
    if (toAdd.length === 0) return;
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };
  const removeAt = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      const url = prev[idx];
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      const details = [
        description?.trim() || "",
        issueType ? `\nType: ${issueType}` : "",
        priority ? `\nPriority: ${priority}` : "",
        landmark ? `\nLandmark: ${landmark}` : "",
      ]
        .filter(Boolean)
        .join("");

      const coords = `${Number(center.lat).toFixed(6)},${Number(
        center.lng
      ).toFixed(6)}`;
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", details);
      fd.append("address", address || "");
      fd.append("location_coords", coords);
      if (photos.length > 0) {
        photos.forEach((f) => fd.append("photos", f, f.name || "photo.jpg"));
      }

      await api("/complaints", { method: "POST", token, body: fd });
      setOk("Reported successfully");
      // reset
      setTitle("");
      setIssueType("");
      setPriority("");
      setLandmark("");
      setDescription("");
      setAddress("");
      setSuggestions([]);
      setSuggestOpen(false);
      setActiveIndex(-1);
      revokeAllPreviews();
      setPhotos([]);
      setPreviews([]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const q = address?.trim();
    if (!q || q.length < 3) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setSuggestOpen(true);
        setSuggestions(data);
        if (Array.isArray(data) && data.length > 0) {
          const r = data[0];
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lon);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            setCenter({ lat, lng });
          }
        } else {
          setSuggestions([]);
          setSuggestOpen(false);
        }
      } catch {
        // silent fail to avoid noisy UI
      }
    }, 600);
    return () => clearTimeout(id);
  }, [address]);

  const selectSuggestion = (r) => {
    if (!r) return;
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setCenter({ lat, lng });
    }
    if (r.display_name) setAddress(r.display_name);
    setSuggestOpen(false);
    setActiveIndex(-1);
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-display mb-4">Report a Civic Issue</h1>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <form className="p-4 space-y-4" onSubmit={submit}>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {ok && <div className="text-green-600 text-sm">{ok}</div>}

          {/* Top grid: Title / Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Issue Title</label>
              <input
                className="input"
                placeholder="Brief description of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Issue Type</label>
              <select
                className="input"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
              >
                <option value="">Select issue type</option>
                <option>Pothole</option>
                <option>Streetlight</option>
                <option>Garbage</option>
                <option>Water Logging</option>
                <option>Illegal Parking</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Grid: Priority / Address */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Priority Level</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">Select priority</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
            <div className="relative">
              <label className="block mb-1 text-sm">Address</label>
              <input
                className="input"
                placeholder="Enter street address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setActiveIndex(-1);
                }}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={(e) => {
                  if (!suggestOpen || suggestions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((i) =>
                      Math.min(i + 1, suggestions.length - 1)
                    );
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  }
                  if (e.key === "Enter" && activeIndex >= 0) {
                    e.preventDefault();
                    const r = suggestions[activeIndex];
                    selectSuggestion(r);
                  }
                  if (e.key === "Escape") {
                    setSuggestOpen(false);
                  }
                }}
              />
              {suggestOpen && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-xl shadow-sm divide-y">
                  {suggestions.map((r, idx) => (
                    <li
                      key={`${r.place_id}-${idx}`}
                      className={`p-2 text-sm cursor-pointer hover:bg-gray-50 ${
                        activeIndex === idx ? "bg-gray-50" : ""
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      onClick={() => selectSuggestion(r)}
                    >
                      <div className="truncate">{r.display_name}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm">
              Nearby Landmark (Optional)
            </label>
            <input
              className="input"
              placeholder="e.g., Near City Hall"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Description</label>
            <textarea
              className="input min-h-32"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Photo upload (optional, up to 6) */}
          <div>
            <label className="block mb-1 text-sm">Photos</label>
            <div
              className={`rounded-xl border-2 border-dashed p-6 text-sm flex flex-col items-center justify-center gap-2 text-center select-none transition-colors ${
                dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleAddFiles(e.dataTransfer.files);
              }}
              onClick={() =>
                document.getElementById("complaint-photo-input")?.click()
              }
            >
              {previews.length > 0 ? (
                <div className="w-full">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {previews.map((src, idx) => (
                      <div
                        key={src}
                        className="relative group border border-gray-200 rounded-md overflow-hidden"
                      >
                        <img
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-28 object-cover"
                        />
                        <button
                          type="button"
                          title="Remove"
                          className="absolute top-1 right-1 hidden group-hover:block bg-black/60 text-white rounded px-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAt(idx);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <div>{photos.length} / 6 selected</div>
                    <div>
                      Drag&Drop more or{" "}
                      <span className="underline">Browse</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <CloudIcon className="w-8 h-8 text-gray-400" />
                  <div className="text-gray-700 font-medium">
                    Drag&Drop files here
                  </div>
                  <div className="text-xs text-gray-400">or</div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("complaint-photo-input")?.click();
                    }}
                  >
                    Browse
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 5MB
                  </div>
                </>
              )}
              <input
                id="complaint-photo-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleAddFiles(e.target.files || []);
                }}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm">Location on Map</label>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <LeafletMap
                center={center}
                onCenterChange={(c) => setCenter({ lat: c.lat, lng: c.lng })}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Move the map or pick an address; coordinates are detected
              automatically.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block mb-1 text-sm">Coordinates</label>
                <input
                  className="input"
                  value={`${Number(center.lat).toFixed(6)}, ${Number(
                    center.lng
                  ).toFixed(6)}`}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button className="btn btn-primary block mx-auto" type="submit">
              <span className="inline-flex items-center gap-2">
                <SendIcon className="w-4 h-4 text-white" />
                Submit Report
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

// Leaflet map

function LeafletMap({ center, onCenterChange }) {
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [18, 30],
    iconAnchor: [9, 30],
    shadowSize: [30, 30],
    shadowAnchor: [9, 30],
  });

  return (
    <MapContainer
      style={mapContainerStyle}
      center={center}
      zoom={12}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <RecenterOnChange center={center} />
      <Marker position={center} icon={DefaultIcon} keyboard={false} />
      <CenterTracker onMove={onCenterChange} />
    </MapContainer>
  );
}

function RecenterOnChange({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center);
  }, [center]);
  return null;
}

function CloudIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
      <path d="M16 16l-4-4-4 4" />
      <path d="M12 12v9" />
    </svg>
  );
}

function SendIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

// Hook component to track map center on move and expose it up if needed
function CenterTracker({ onMove }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      if (onMove) onMove(c);
    },
  });
  return null;
}
