
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/check`,
          { withCredentials: true } // ✅ include cookies/JWT
        );

        console.log("✅ Authenticated user:", response.data.user);
        setIsLoggedIn(true);
      } catch (error) {
        console.log("❌ Not authenticated");
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center text-white">
      {/* 🌆 Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/hbg.jpg')",
        }}
      ></div>

      {/* 🌙 Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* 💎 Glass UI Box */}
      <div className="relative z-10 p-10 rounded-3xl max-w-lg mx-4 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl text-center">
        {/* 🧹 Logo */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <img src="/logo.png" alt="logo" className="w-12 h-12" />
          <span className="text-3xl font-bold text-white">CleanStreet</span>
        </div>

        {/* ✨ Title */}
        <h1 className="text-4xl font-bold mb-2 text-white">
          Welcome to CleanStreet
        </h1>

        {/* 🌟 Slogan */}
        <h2 className="text-xl mb-4 font-bold text-amber-300/90">
          Snap it. Share it. Solve it.
        </h2>

        {/* 🏙️ Description */}
        <p className="text-lg mb-8 px-2 text-white/90">
          Report issues, track progress, and help us keep our city clean.
        </p>

        {/* 🟩 Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 rounded-full bg-green-700 text-white hover:bg-green-800 transition transform hover:scale-105"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 rounded-full bg-green-600 text-white hover:bg-green-700 transition transform hover:scale-105"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-3 rounded-full bg-green-700 text-white hover:bg-green-800 transition transform hover:scale-105"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
