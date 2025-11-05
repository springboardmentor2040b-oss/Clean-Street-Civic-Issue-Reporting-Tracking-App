import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios"; 

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.status === 200) {
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert(error.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/login.jpg')" }}
    >
      {/* 🌟 Fully Transparent Glass Box */}
      <div
        className="p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md
        backdrop-blur-xs bg-transparent border border-white/30
        hover:border-green-400 transition-all duration-500"
      >
        {/* 🌟 Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Clean Street Logo"
            className="h-14 w-14 drop-shadow-xl"
          />
        </div>

        {/* 🧾 Title */}
        <h2 className="text-2xl font-bold text-center text-white drop-shadow-md mb-6">
          Login to Clean Street
        </h2>

        {/* 🧩 Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-white/40 rounded-lg 
            bg-transparent text-white placeholder-white/70 
            focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-white/40 rounded-lg 
            bg-transparent text-white placeholder-white/70 
            focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />

          {/* 🔘 Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg 
            hover:bg-green-700 transition disabled:opacity-50 shadow-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* 🔗 Register Link */}
        <p className="text-center text-sm text-white/90 mt-4">
          Don’t have an account?{" "}
          <Link to="/register" className="text-green-300 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
