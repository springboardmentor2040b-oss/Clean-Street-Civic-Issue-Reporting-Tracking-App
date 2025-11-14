import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import { FiUser, FiMail, FiMapPin, FiLock, FiCamera, FiEdit3, FiSave, FiShield, FiX, FiEye, FiEyeOff, FiLoader, FiCheckCircle, FiAlertCircle, FiUserCheck } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

const FormMessage = ({ type, message }) => {
    if (!message) return null;
    const isError = type === 'error';
    return (
        <div className={`p-3 rounded-md text-sm mb-4 flex items-center gap-2 ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {isError ? <FiAlertCircle /> : <FiCheckCircle />}
            {message}
        </div>
    );
};

const backend_Url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";

export default function Profilepage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", location: "" });
  const [saveStatus, setSaveStatus] = useState({ saving: false, error: "", success: "" });
  const [uploadStatus, setUploadStatus] = useState({ uploading: false, error: "", success: "" });
  const [passwordStatus, setPasswordStatus] = useState({ submitting: false, error: "", success: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordVisibility, setPasswordVisibility] = useState({ current: false, new: false, confirm: false });
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setForm({ name: parsed.name || "", email: parsed.email || "", location: parsed.location || "" });
        setPreviewUrl(parsed.profilePhoto || "");
      } else { navigate("/login"); }
    } catch { navigate("/login"); }
  }, [navigate]);

  const togglePasswordVisibility = (field) => setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  const getInitials = (name) => (name ? name.trim().charAt(0).toUpperCase() : "U");
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Add size limit check (e.g., 5MB)
          setUploadStatus({ uploading: false, error: "Image size should be less than 5MB", success: "" });
          return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setUploadStatus({ uploading: false, error: "", success: "" });
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;
    setUploadStatus({ uploading: true, error: "", success: "" });
    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);
      const res = await fetch(`${backend_Url}/api/user/profile/photo`, { method: "POST", credentials: "include", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload photo");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSelectedFile(null);
      setUploadStatus({ uploading: false, error: "", success: "Photo updated!" });
    } catch (e) {
      setUploadStatus({ uploading: false, error: e.message, success: "" });
      setPreviewUrl(user?.profilePhoto || "");
    }
  };

  const handleSave = async () => {
    setSaveStatus({ saving: true, error: "", success: "" });
    try {
      const res = await fetch(`${backend_Url}/api/user/profile`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      const updatedUserData = { ...user, ...data };
      setUser(updatedUserData);
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      setIsEditing(false);
      setSaveStatus({ saving: false, error: "", success: "Profile updated!" });
    } catch (e) {
      setSaveStatus({ saving: false, error: e.message, success: "" });
    }
  };


  const handleCancel = () => {
    setForm({ name: user?.name || "", email: user?.email || "", location: user?.location || "" });
    setIsEditing(false);
    setSaveStatus({ saving: false, error: "", success: "" });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ submitting: false, error: "", success: "" });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordStatus({ submitting: false, error: "New passwords don't match.", success: "" }); return;
    }
    if (passwordForm.newPassword.length < 6) {
        setPasswordStatus({ submitting: false, error: "Password must be at least 6 characters.", success: "" }); return;
    }
    setPasswordStatus({ submitting: true, error: "", success: "" });
    try {
      const res = await fetch(`${backend_Url}/api/user/profile/password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus({ submitting: false, error: "", success: "Password updated successfully!" });
    } catch (e) {
      setPasswordStatus({ submitting: false, error: e.message, success: "" });
    }
  };

  if (!user) {
     return (
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'
        }`}>
            <FiLoader className="animate-spin text-4xl text-indigo-600"/>
        </div>
      );
   }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'
    }`}>
      <Navbar />
      <main className="container mx-auto pt-10 pb-16 px-4 sm:px-6 lg:px-8 flex-grow">

        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Account Settings</h1>
          <p className="text-gray-600 mt-1 text-base">Manage your profile details and security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          <div className="lg:col-span-4 animate-fade-in-up animation-delay-200">
            <div className={`p-6 sm:p-8 rounded-xl shadow border text-center flex flex-col items-center sticky top-28 ${
              isDarkMode ? 'bg-[#001D3D] border-[#003566]' : 'bg-white border-gray-100'
            }`}>
              <div className="relative mb-4 group">
                <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md">
                    {previewUrl ?
                      <img src={previewUrl} alt={user.name} className="w-full h-full rounded-full object-cover border-4 border-white" /> :
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500 border-4 border-white">{getInitials(user.name)}</div>
                    }
                </div>
                <label htmlFor="profile-photo-input" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FiCamera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="profile-photo-input" />
                </label>
              </div>

              <div className="h-10 flex flex-col items-center justify-center mb-2 text-center w-full">
                    {uploadStatus.error && <FormMessage type="error" message={uploadStatus.error} />}
                    {uploadStatus.success && <FormMessage type="success" message={uploadStatus.success} />}
                    {selectedFile && !uploadStatus.success && !uploadStatus.error && (
                        <button
                            onClick={handleUploadPhoto}
                            disabled={uploadStatus.uploading}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 mt-1"
                        >
                            {uploadStatus.uploading ? <><FiLoader className="animate-spin"/> Uploading...</> : "Save New Photo"}
                        </button>
                    )}
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mt-1 truncate w-full px-2">{user.name}</h2>
              <p className="text-gray-500 text-sm mt-0.5 truncate w-full px-2">{user.email}</p>
              <span className="mt-4 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full capitalize border border-indigo-200">{user.role || "user"}</span>
            </div>
          </div>

          <div className="lg:col-span-8 animate-fade-in-up animation-delay-300">
            <div className={`rounded-xl shadow border overflow-hidden ${
              isDarkMode ? 'bg-[#001D3D] border-[#003566]' : 'bg-white border-gray-100'
            }`}>
              <div className="border-b border-gray-200 bg-gray-50/50">
                <nav className="flex space-x-1 px-4 sm:px-6 pt-1">
                  <TabButton id="personal" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FiUser />}>Personal Details</TabButton>
                  <TabButton id="security" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FiShield />}>Security</TabButton>
                </nav>
              </div>

              <div className="p-6 sm:p-8 min-h-[400px] relative">

                <div className={`transition-opacity duration-300 ease-in-out ${activeTab === 'personal' ? 'opacity-100' : 'opacity-0 absolute inset-0 p-6 sm:p-8 pointer-events-none'}`}>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Your Information</h3>
                        {!isEditing ?
                          <button onClick={() => { setIsEditing(true); setSaveStatus({ saving: false, error: "", success: "" }); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-100 text-indigo-700 font-semibold text-xs hover:bg-indigo-200 transition-all duration-200 transform hover:scale-105"><FiEdit3 size={14}/> Edit</button> :
                          <div className="flex items-center gap-2">
                              <button onClick={handleCancel} disabled={saveStatus.saving} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 font-semibold text-xs transition-colors disabled:opacity-50">Cancel</button>
                              <button onClick={handleSave} disabled={saveStatus.saving} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 text-white font-semibold text-xs hover:bg-green-700 disabled:opacity-60 transition-colors min-w-[70px]">
                                  {saveStatus.saving ? <FiLoader className="animate-spin"/> : <><FiSave size={14}/> Save</>}
                              </button>
                          </div>
                        }
                      </div>
                      {saveStatus.error && <FormMessage type="error" message={saveStatus.error} />}
                      {saveStatus.success && <FormMessage type="success" message={saveStatus.success} />}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        <InputField label="Full Name" icon={<FiUser />} name="name" value={form.name} onChange={handleChange} isEditing={isEditing} />
                        <InputField label="Email Address" icon={<FiMail />} name="email" value={form.email} onChange={handleChange} isEditing={isEditing} type="email" />
                        <InputField label="Location" icon={<FiMapPin />} name="location" value={form.location} onChange={handleChange} isEditing={isEditing} placeholder="e.g., Salem, Tamil Nadu"/>
                        <InputField label="Role" icon={<FiUserCheck />} name="role" value={user.role || 'user'} isEditing={false} readOnly />
                      </div>
                  </div>

                  <div className={`transition-opacity duration-300 ease-in-out ${activeTab === 'security' ? 'opacity-100' : 'opacity-0 absolute inset-0 p-6 sm:p-8 pointer-events-none'}`}>
                       <h3 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h3>
                       {passwordStatus.error && <FormMessage type="error" message={passwordStatus.error} />}
                       {passwordStatus.success && <FormMessage type="success" message={passwordStatus.success} />}

                      <form onSubmit={handlePasswordChange} className="space-y-5">
                        <PasswordField label="Current Password" icon={<FiLock />} name="oldPassword" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))} isVisible={passwordVisibility.current} onToggleVisibility={() => togglePasswordVisibility('current')} required />
                        <PasswordField label="New Password" icon={<FiLock />} name="newPassword" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} isVisible={passwordVisibility.new} onToggleVisibility={() => togglePasswordVisibility('new')} required />
                        <PasswordField label="Confirm New Password" icon={<FiLock />} name="confirmPassword" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} isVisible={passwordVisibility.confirm} onToggleVisibility={() => togglePasswordVisibility('confirm')} required />
                        <div className="flex justify-end pt-2">
                          <button type="submit" disabled={passwordStatus.submitting} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm min-w-[150px]">
                            {passwordStatus.submitting ? <><FiLoader className="animate-spin"/> Updating...</> : "Update Password"}
                          </button>
                        </div>
                      </form>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const TabButton = ({ id, activeTab, setActiveTab, icon, children }) => {
    const isActive = activeTab === id;
    const label = children; // Store original children for logic if needed
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`relative flex items-center gap-2 py-2.5 px-4 font-medium transition-colors duration-200 border-b-2 focus:outline-none focus-visible:bg-indigo-50/50 rounded-t text-sm sm:text-base
                ${isActive ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
            {React.cloneElement(icon, { size: 18 })}
            <span className="hidden sm:inline">{children}</span>
             <span className="sm:hidden">{children === 'Personal Details' ? 'Details' : 'Security'}</span>
        </button>
    );
};

const InputField = ({ label, icon, name, value, onChange, isEditing, type = "text", readOnly = false, placeholder = "" }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide uppercase">{label}</label>
    <div className="relative group">
      <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none transition-colors duration-200 ${isEditing && !readOnly ? 'group-focus-within:text-indigo-600' : ''}`}>
        {React.cloneElement(icon, { size: 18 })}
      </span>
      <input
        type={type}
        id={name} name={name} value={value || ""} onChange={isEditing ? onChange : undefined} readOnly={!isEditing || readOnly} placeholder={placeholder}
        className={`w-full pl-10 pr-3 py-2.5 border rounded-md transition duration-200 ease-in-out text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent ${
            isEditing && !readOnly
            ? "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
            : "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
        }`}
      />
    </div>
  </div>
);

const PasswordField = ({ label, icon, name, value, onChange, isVisible, onToggleVisibility, required }) => (
   <div>
    <label htmlFor={name} className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide uppercase">{label}</label>
    <div className="relative group">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none transition-colors duration-200 group-focus-within:text-indigo-600">
         {React.cloneElement(icon, { size: 18 })}
      </span>
      <input
        type={isVisible ? 'text' : 'password'}
        id={name} name={name} value={value || ""} onChange={onChange}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md transition duration-200 ease-in-out text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-white text-gray-800 placeholder-gray-400"
        required={required}
        placeholder="••••••••"
      />
      <button type="button" onClick={onToggleVisibility} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none">
        {isVisible ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
      </button>
    </div>
  </div>
);