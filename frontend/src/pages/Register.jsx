// src/pages/Register.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiMapPin, FiLock, FiBriefcase, FiEye, FiEyeOff } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

export default function Register() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [form, setForm] = useState({
    name: "",
    location: "",
    role: "user",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const backend_Url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${backend_Url}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Registration successful!");

      setTimeout(() => {
        if (data.user.role === "admin") {
          navigate("/AdminDashboard");
        } else if (data.user.role === "volunteer") {
          navigate("/VolunteerDashboard");
        } else {
          navigate("/UserDashboard");
        }
      }, 100);

    } catch (err) {
      setError(err.message || "An error occurred during registration.");
      toast.error(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex transition-colors duration-300">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Left Column - Image and Welcome Text */}
      <div className="hidden lg:flex w-1/2 bg-cover bg-center relative group overflow-hidden" style={{ backgroundImage: "url('/images/street1.png')" }}>
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110" style={{ backgroundImage: "url('/images/street1.png')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-16 text-center space-y-6">
          <Link to="/" className="block mb-6 transform transition-transform duration-300 hover:scale-105">
            <img 
              src={isDarkMode ? "/images/logo.png" : "/images/white_logo.png"} 
              alt="Clean Street Logo" 
              className={`w-64 animate-fade-in-down ${isDarkMode ? 'brightness-0 invert' : ''}`}
            />
          </Link>
          <h1 className="text-4xl font-bold tracking-tight animate-fade-in-up animation-delay-200">Join the Movement</h1>
          <p className="text-lg text-gray-200 leading-relaxed animate-fade-in-up animation-delay-300">
            Create an account to start making a real difference in your community.
          </p>
        </div>
      </div>

      {/* Right Column - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 animate-fade-in-up">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">Create Your Account</h2>
            <p className="text-gray-500 mt-2">Let's get you started!</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Name & Location Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none transition-colors group-focus-within:text-indigo-600"><FiUser size={18} /></span>
                  <input id="name" type="text" name="name" placeholder="John Doe" className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out placeholder-gray-400" value={form.name} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none transition-colors group-focus-within:text-indigo-600"><FiMapPin size={18} /></span>
                  <input id="location" type="text" name="location" placeholder="Your City, State" className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out placeholder-gray-400" value={form.location} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* Role Select */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">I want to register as a...</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none transition-colors group-focus-within:text-indigo-600"><FiBriefcase size={18} /></span>
                <select id="role" name="role" className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out appearance-none text-gray-700" value={form.role} onChange={handleChange} required>
                  <option value="user">Community User (Report issues)</option>
                  <option value="volunteer">Volunteer (Help resolve issues)</option>
                  <option value="admin">Admin</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 pointer-events-none">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.24a.75.75 0 011.06 0L10 15.147l2.7-2.907a.75.75 0 111.06 1.06l-3.25 3.5a.75.75 0 01-1.06 0l-3.25-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none transition-colors group-focus-within:text-indigo-600"><FiMail size={18} /></span>
                <input id="email" type="email" name="email" placeholder="you@example.com" className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out placeholder-gray-400" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none transition-colors group-focus-within:text-indigo-600"><FiLock size={18} /></span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 6 characters"
                  className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out placeholder-gray-400"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-600 text-sm text-center bg-red-50 p-2.5 rounded-md border border-red-200">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
