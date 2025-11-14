// src/pages/ReportIssue.jsx

import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar"; // Assuming updated Navbar
import Footer from "../Components/Footer"; // Assuming updated Footer
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
// === ICON UPDATE: Using consistent icons ===
import { FiArrowLeft, FiUpload, FiXCircle, FiMapPin, FiInfo, FiImage, FiLoader, FiCheckCircle, FiAlertCircle } from "react-icons/fi"; // Replaced Fa with Fi
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTheme } from "../context/ThemeContext";

// Marker icon setup (Keep original)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png", //
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png', //
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', //
  iconSize: [25, 41], //
  iconAnchor: [12, 41], //
});


// LocationMarker Component (Keep original)
const LocationMarker = ({ setPosition }) => {
  useMapEvents({
    click(e) { //
      setPosition(e.latlng); //
    },
  });
  return null;
};

// === NEW COMPONENT: For displaying form status messages ===
const FormStatus = ({ message, type }) => {
    if (!message) return null;
    const isError = type === 'error';
    return (
        <div className={`mt-4 p-3 rounded-md text-sm flex items-center gap-2 ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {isError ? <FiAlertCircle /> : <FiCheckCircle />}
            <span>{message}</span>
        </div>
    );
};


const ReportIssue = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [position, setPosition] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // State for image preview URL
  const [form, setForm] = useState({
    title: "", type: "", priority: "", address: "", landmark: "", description: "", //
  });
  const [loading, setLoading] = useState(false); //
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' }); // For success/error messages
const backend_Url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";
  // --- Core Logic (Keep original logic, add preview handling) ---
  useEffect(() => {
    // Attempt to get user's current location
    if (navigator.geolocation) { //
      navigator.geolocation.getCurrentPosition( //
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }), //
        (err) => {
            console.error("Geolocation error:", err); //
            setStatusMessage({ type: 'error', text: 'Could not get current location. Please select on map.' });
            // Set a default view if location fails, e.g., center of Salem
            setPosition({ lat: 11.6643, lng: 78.1460 });
        }
      );
    } else {
        setStatusMessage({ type: 'error', text: 'Geolocation is not supported. Please select on map.' });
        // Set a default view
        setPosition({ lat: 11.6643, lng: 78.1460 });
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value }); //

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation (optional)
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
         setStatusMessage({ type: 'error', text: 'Image size exceeds 10MB limit.' });
         return;
      }
      setPhoto(file); //
      setPreviewUrl(URL.createObjectURL(file)); // Create preview URL
      setStatusMessage({ type: '', text: '' }); // Clear previous errors
    }
  };

   const removePhoto = () => {
        setPhoto(null);
        setPreviewUrl(null);
        // Reset file input if needed (can be tricky across browsers)
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
    };

  const handleSubmit = async (e) => {
    e.preventDefault(); //
    if (!position) { //
      setStatusMessage({ type: 'error', text: "Please select a location on the map." }); //
      return; //
    }
    setLoading(true); //
    setStatusMessage({ type: '', text: '' }); // Clear previous messages
    const formData = new FormData(); //
    Object.keys(form).forEach(key => formData.append(key, form[key])); //
    formData.append("latitude", position.lat); //
    formData.append("longitude", position.lng); //
    if (photo) formData.append("photo", photo); //

    try {
      const res = await fetch(`${backend_Url}/api/complaints/create`, { //
        method: "POST", credentials: "include", body: formData, //
      });
      const data = await res.json(); //
      if (res.ok) { //
        setStatusMessage({ type: 'success', text: "Report submitted successfully! Redirecting..." }); //
        setTimeout(() => navigate("/UserDashboard"), 1500); // Redirect after message
      } else {
         throw new Error(data.message || "Failed to submit report."); //
      }
    } catch (error) {
      console.error(error); //
      setStatusMessage({ type: 'error', text: error.message || "An unexpected error occurred." });
    } finally {
      setLoading(false); //
    }
  };
  // --- End Core Logic ---

  return (
    // === STYLE UPDATE: Consistent gradient background ===
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col transition-colors duration-300">
      <Navbar />
      {/* === STYLE UPDATE: Adjusted padding === */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-grow">

        {/* Back Button */}
        <div className="relative mb-6">
            {/* === STYLE UPDATE: Consistent back button style === */}
            <button
                onClick={() => navigate(-1)} // Go back to previous page
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-700 transition-colors group"
            >
                <FiArrowLeft className="transform transition-transform group-hover:-translate-x-1" size={16}/>
                Back
            </button>
        </div>

        {/* Main Content Card */}
        {/* === STYLE UPDATE: Card styling, subtle animation === */}
        <div className="card-theme rounded-xl shadow-lg p-6 sm:p-10 animate-fade-in-up">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-theme-primary tracking-tight">Report an Issue</h1>
                <p className="text-theme-secondary mt-2 text-base">Help improve our community by reporting problems.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">

                {/* Left Column: Form Fields */}
                <div className="space-y-6"> {/* Reduced space-y-8 to space-y-6 */}
                    {/* Issue Details Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2"><FiInfo className="text-theme-accent" /> Issue Details</h2>
                        <div className="space-y-5"> {/* Reduced space-y-6 to space-y-5 */}
                            <InputField label="Issue Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Overflowing bin on Park Ave" required />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <SelectField label="Issue Type" name="type" value={form.type} onChange={handleChange} required options={["Garbage", "Road Damage", "Street Light", "Water Leakage"]} />
                                <SelectField label="Priority Level" name="priority" value={form.priority} onChange={handleChange} required options={["Low", "Medium", "High"]} />
                            </div>
                            <InputField label="Full Address / Location Description" name="address" value={form.address} onChange={handleChange} placeholder="e.g., 123 Main St, near the bus stop" required />
                            <InputField label="Nearby Landmark (Optional)" name="landmark" value={form.landmark} onChange={handleChange} placeholder="e.g., Opposite the corner shop" />
                            <TextareaField label="Detailed Description" name="description" value={form.description} onChange={handleChange} placeholder="Provide details like time observed, specific damage, etc." required />
                        </div>
                    </div>

                    {/* Photo Upload Section */}
                    {/* === STYLE UPDATE: Enhanced upload area styling === */}
                    <div>
                      <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2"><FiImage className="text-theme-accent"/> Attach Photo (Optional)</h2>
                      <div className={`mt-1 flex flex-col justify-center items-center px-6 py-8 border-2 border-gray-300 border-dashed rounded-lg transition-colors duration-200 ${previewUrl ? 'bg-gray-50' : 'bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
                        {previewUrl ? (
                          <div className="relative group text-center w-full max-w-xs mx-auto">
                            <img src={previewUrl} alt="Preview" className="mx-auto max-h-40 rounded-md object-contain shadow-sm border border-gray-200 mb-3" />
                            <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full shadow transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" title="Remove image">
                              <FiXCircle className="h-4 w-4" />
                            </button>
                            <p className="text-xs text-gray-500 font-medium truncate">{photo?.name || 'Uploaded Image'}</p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-center">
                            <FiUpload className="mx-auto h-10 w-10 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-2 py-1">
                                <span>Upload a file</span>
                                <input id="file-upload" name="photo" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                              </label>
                              <p className="pl-1">or drag and drop</p> {/* Basic DnD text, no functionality added */}
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                </div> {/* End Left Column */}

                {/* Right Column: Map */}
                <div className="mt-8 lg:mt-0">
                  <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2"><FiMapPin className="text-theme-accent" /> Pinpoint Location*</h2>
                  {/* === STYLE UPDATE: Cleaner map container === */}
                  <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
                    {position ? (
                      <MapContainer center={[position.lat, position.lng]} zoom={15} className="h-full w-full" scrollWheelZoom={true}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                        <Marker position={position} icon={markerIcon}></Marker>
                        <LocationMarker setPosition={setPosition} />
                      </MapContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">
                        <FiLoader className="animate-spin text-2xl mr-2"/> Loading Map...
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center font-medium">Click on the map to set the exact issue location.</p>
                </div> {/* End Right Column */}

                {/* Submit Area */}
                <div className="lg:col-span-2 mt-8 lg:mt-10 text-center">
                     {/* Display Status Message */}
                    <FormStatus message={statusMessage.text} type={statusMessage.type} />

                    {/* === STYLE UPDATE: Consistent submit button === */}
                    <button type="submit" className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-bold px-10 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-70 disabled:cursor-wait" disabled={loading}>
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </>
                        ) : (
                           "Submit Report"
                        )}
                    </button>
                </div>
            </form> {/* End Form */}
        </div> {/* End Main Content Card */}
      </div> {/* End Container */}
      <Footer />
    </div>
  );
};

// --- Reusable Form Field Components ---
// === STYLE UPDATE: Consistent input styling ===
const InputField = ({ label, name, required, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-theme-primary mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
        id={name} name={name} required={required}
        {...props}
        className="input-theme w-full rounded-md p-2.5 text-sm shadow-sm transition duration-200"
    />
  </div>
);

const SelectField = ({ label, name, options, required, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-theme-primary mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
        id={name} name={name} required={required}
        {...props}
        className="input-theme w-full rounded-md p-2.5 text-sm shadow-sm transition duration-200 appearance-none"
    >
      <option value="">-- Select --</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const TextareaField = ({ label, name, required, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-theme-primary mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
        id={name} name={name} required={required}
        {...props}
        rows="4"
        className="input-theme w-full rounded-md p-2.5 text-sm shadow-sm transition duration-200 resize-vertical"
    ></textarea>
  </div>
);


export default ReportIssue;