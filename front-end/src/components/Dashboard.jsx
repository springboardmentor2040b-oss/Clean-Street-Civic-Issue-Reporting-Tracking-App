
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCcw,
  UserCircle,
  XCircle,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { io } from "socket.io-client";
import api from "../api/axios"; // ✅ centralized axios instance

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    inProgress: 0,
  });
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [nearbyComplaints, setNearbyComplaints] = useState([]);
  const [viewingComplaint, setViewingComplaint] = useState(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

  // ✅ Real-time updates via Socket.IO
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => console.log("🟢 Connected to socket server"));
    socket.on("complaintUpdated", fetchDashboardData);
    socket.on("newComplaint", fetchDashboardData);
    socket.on("complaintDeleted", fetchDashboardData);
    socket.on("disconnect", () => console.log("🔴 Socket disconnected"));

    return () => socket.disconnect();
  }, []);

  // ✅ Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/profile");
        setUser(data);
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  // ✅ Fetch dashboard data dynamically
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const { data: dataStats } = await api.get("/complaints/stats");
      setStats({
        total: dataStats.total || 0,
        pending: dataStats.pending || 0,
        resolved: dataStats.resolved || 0,
        inProgress: dataStats.inProgress || 0,
      });

      if (user.role === "admin") {
        const { data } = await api.get("/complaints/all");
        setAllComplaints(data || []);
      } else if (user.role === "volunteer") {
        const { data: assigned } = await api.get("/complaints/assigned");
        setActivities(assigned);

        // ✅ Fetch nearby complaints
        let lat = user.lat;
        let lng = user.lng;
        if (!lat || !lng) {
          await new Promise((resolve) =>
            navigator.geolocation.getCurrentPosition((pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            })
          );
        }

        const { data: nearby } = await api.get(
          `/complaints/nearby?latitude=${lat}&longitude=${lng}`
        );
        setNearbyComplaints(nearby || []);
      } else {
        const { data } = await api.get("/complaints/my");
        setActivities(data || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      sessionStorage.clear();
      localStorage.clear();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // ✅ Volunteer Action (In Progress / Resolved)
  const handleVolunteerAction = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      setViewingComplaint(null);
      fetchDashboardData();
    } catch (err) {
      console.error("Volunteer action error:", err);
    }
  };

  // ✅ Volunteer Assign Complaint (fixed to match backend controller)
  const handleAssignComplaint = async (id) => {
    try {
      const res = await api.put(`/complaints/${id}/assign`);
      if (res.status === 200) {
        alert(res.data.message || "Complaint assigned successfully!");
        setViewingComplaint(null);
        fetchDashboardData();
      } else {
        alert("Failed to assign complaint.");
      }
    } catch (err) {
      console.error("Error assigning complaint:", err);
      alert(
        err.response?.data?.message ||
          "Error assigning complaint. Maybe already assigned."
      );
    }
  };

  // ✅ Generate Admin PDF Report
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("CleanStreet - Complaint Report", 14, 15);
    const tableData = allComplaints.map((c) => [
      c.title,
      c.status,
      c.user?.username || "N/A",
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    doc.autoTable({
      head: [["Title", "Status", "User", "Date"]],
      body: tableData,
      startY: 25,
    });
    doc.save("Complaint_Report.pdf");
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      Resolved: "bg-green-200 text-green-800",
      "In Progress": "bg-yellow-200 text-yellow-800",
      Pending: "bg-blue-200 text-blue-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          colors[status] || "bg-gray-200 text-gray-800"
        }`}
      >
        {status?.toUpperCase()}
      </span>
    );
  };

  const isActive = (path) =>
    location.pathname?.toLowerCase().includes(path.toLowerCase());

  if (!user)
    return (
      <div className="text-center mt-10 font-semibold">
        Loading Dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      {/* Navbar */}
      <header className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2 mb-2 md:mb-0">
          <img src="/logo.png" alt="logo" className="w-6 h-6" />
          <span className="font-bold text-xl">CleanStreet</span>
        </div>
        <nav className="flex flex-wrap justify-center md:justify-start space-x-4 md:space-x-8 text-gray-700 mb-2 md:mb-0">
          <Link
            to="/dashboard"
            className={`hover:underline font-medium ${
              isActive("/dashboard") ? "text-blue-600 font-bold" : ""
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/report"
            className={`hover:underline font-medium ${
              isActive("/report") ? "text-blue-600 font-bold" : ""
            }`}
          >
            Report Issue
          </Link>
          <Link
            to="/complaints"
            className={`hover:underline font-medium ${
              isActive("/complaints") ? "text-blue-600 font-bold" : ""
            }`}
          >
            View Complaints
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt="profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <UserCircle className="w-8 h-8" />
            )}
            <span className="font-medium">{user?.username || "Guest"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-1 rounded-full bg-blue-500 text-white font-semibold hover:bg-red-600 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Hero */}
      <div
        className="w-full h-40 rounded-2xl mt-4 mx-6 bg-cover bg-center flex flex-col justify-center px-6 text-white"
        style={{ backgroundImage: "url('/dashboard-bg.png')" }}
      >
        <h2 className="text-2xl font-semibold">Keep Our City Clean Together</h2>
        <p className="text-sm">
          Report issues, track progress, and help maintain our community
        </p>
      </div>

      {/* Stats Section */}
      <main className="flex flex-col items-center justify-start w-full mt-6 px-4 md:px-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
          {[
            {
              label: "Total",
              count: stats.total,
              icon: AlertTriangle,
              color: "text-red-500",
            },
            {
              label: "Pending",
              count: stats.pending,
              icon: Clock,
              color: "text-blue-500",
            },
            {
              label: "Resolved",
              count: stats.resolved,
              icon: CheckCircle,
              color: "text-green-500",
            },
            {
              label: "In Progress",
              count: stats.inProgress,
              icon: RefreshCcw,
              color: "text-yellow-500",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg flex flex-col items-center py-6"
            >
              <p className="text-sm">{item.label}</p>
              <p className="text-3xl font-bold">{item.count}</p>
              <item.icon className={`${item.color} w-6 h-6 mt-2`} />
            </div>
          ))}
        </div>

        {/* Admin / Volunteer / User Views */}
        {user.role === "admin" ? (
          <div className="bg-white rounded-2xl shadow-lg w-full p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Complaint Overview</h3>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FileText className="w-4 h-4" /> Generate PDF
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: "Pending", value: stats.pending },
                  { name: "In Progress", value: stats.inProgress },
                  { name: "Resolved", value: stats.resolved },
                ]}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg w-full p-6">
            <h3 className="font-semibold text-lg mb-4">
              {user.role === "volunteer"
                ? "My Assigned Complaints"
                : "My Reported Complaints"}
            </h3>
            {activities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((a) => (
                  <div
                    key={a._id}
                    className="bg-gray-50 rounded-xl shadow-md border border-gray-200 p-4 flex flex-col"
                  >
                    {a.photo && (
                      <img
                        src={a.photo}
                        alt="complaint"
                        className="w-full h-56 object-cover rounded-lg mb-3"
                      />
                    )}
                    <p className="font-semibold text-lg">{a.title}</p>
                    <p className="text-sm text-gray-600">{a.description}</p>
                    <div className="mt-2">
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center">
                No complaints yet
              </p>
            )}
          </div>
        )}

        {/* Volunteer - Nearby Complaints */}
        {user.role === "volunteer" && (
          <div className="bg-white rounded-2xl shadow-lg w-full p-6">
            <h3 className="font-semibold text-lg mb-4">Nearby Complaints</h3>
            {nearbyComplaints.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyComplaints.map((c) => (
                  <div
                    key={c._id}
                    className="bg-gray-50 rounded-xl shadow-md border border-gray-200 p-4 flex flex-col"
                  >
                    <p className="font-semibold text-lg">{c.title}</p>
                    <p className="text-sm text-gray-600">{c.description}</p>
                    {c.photo && (
                      <img
                        src={c.photo}
                        alt="complaint"
                        className="w-full h-48 object-cover rounded mt-3"
                      />
                    )}
                    <button
                      onClick={() => setViewingComplaint(c)}
                      className="mt-3 px-3 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center">
                No nearby complaints
              </p>
            )}
          </div>
        )}
      </main>

      {/* View Complaint Modal */}
      {viewingComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setViewingComplaint(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-semibold mb-2">
              {viewingComplaint.title}
            </h3>
            <p className="text-gray-700 mb-2">{viewingComplaint.description}</p>
            <p className="text-gray-500 mb-2">
              <strong>Location:</strong>{" "}
              {viewingComplaint.location?.address || "Not specified"}
            </p>
            {viewingComplaint.photo && (
              <img
                src={viewingComplaint.photo}
                alt="complaint"
                className="w-full h-64 object-cover rounded mb-4"
              />
            )}
            <StatusBadge status={viewingComplaint.status} />
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                className="px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-600"
                onClick={() =>
                  handleVolunteerAction(viewingComplaint._id, "In Progress")
                }
              >
                In Progress
              </button>
              <button
                className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                onClick={() =>
                  handleVolunteerAction(viewingComplaint._id, "Resolved")
                }
              >
                Resolve
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => handleAssignComplaint(viewingComplaint._id)}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
