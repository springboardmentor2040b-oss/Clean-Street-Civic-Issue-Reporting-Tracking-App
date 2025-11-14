// src/pages/VolunteerDashboard.jsx

import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import { useNavigate } from "react-router-dom";
import {
  FiClipboard,
  FiCheckCircle,
  FiLoader,
  FiMapPin,
  FiTool,
  FiAlertCircle,
  FiClock,
  FiXCircle,
  FiUserPlus,
  FiUserMinus,
  FiRotateCw,
  FiActivity,
} from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("nearby");
  const [nearbyComplaints, setNearbyComplaints] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    pendingAssignments: 0,
    inProgressAssignments: 0,
    resolvedAssignments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [volunteerLocation, setVolunteerLocation] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [activities, setActivities] = useState([]); // ✅ NEW STATE FOR ADMIN LOGS

  const user = JSON.parse(localStorage.getItem("user"));
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";

  useEffect(() => {
    if (user?.role !== "volunteer") {
      toast.error("Access denied. Volunteers only.");
      navigate("/UserDashboard");
      return;
    }
    fetchData();
  }, [navigate, user?.role]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const nearbyRes = await fetch(`${backendUrl}/api/volunteer/nearby-complaints?maxDistance=50`, {
        credentials: "include",
      });
      const nearbyData = await nearbyRes.json();
      if (nearbyRes.ok && nearbyData.success) {
        setNearbyComplaints(nearbyData.data || []);
        setVolunteerLocation(nearbyData.volunteerLocation || "Your Area");
      } else {
        throw new Error(nearbyData.message || "Failed to fetch nearby complaints.");
      }

      const assignmentsRes = await fetch(`${backendUrl}/api/volunteer/my-assignments`, {
        credentials: "include",
      });
      const assignmentsData = await assignmentsRes.json();
      if (assignmentsRes.ok && assignmentsData.success) {
        setMyAssignments(assignmentsData.data?.assignments || []);
        setStats(
          assignmentsData.data?.stats || {
            totalAssignments: 0,
            pendingAssignments: 0,
            inProgressAssignments: 0,
            resolvedAssignments: 0,
          }
        );
      } else {
        throw new Error(assignmentsData.message || "Failed to fetch assignments.");
      }

      // ✅ Fetch admin logs (Recent Updates)
      try {
        const logsRes = await fetch(`${backendUrl}/api/admin/logs`, { credentials: "include" });
        const logsData = await logsRes.json();
        if (logsRes.ok && logsData.success) {
          setActivities(logsData.data.slice(0, 5)); // Show top 5 logs
        }
      } catch (error) {
        console.error("Error fetching admin logs:", error);
      }
    } catch (error) {
      console.error("Error fetching volunteer data:", error);
      setError(error.message || "Could not load dashboard data. Please try again.");
      if (error.message.includes("401") || error.message.includes("403")) {
        toast.error("Session expired or unauthorized. Please log in again.");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType, complaintId, payload = null) => {
    setActionLoading((prev) => ({ ...prev, [complaintId]: true }));
    let url = `${backendUrl}/api/volunteer/${actionType}/${complaintId}`;
    let options = {
      method: "POST",
      credentials: "include",
      headers: {},
    };

    if (actionType === "update-status") {
      url = `${backendUrl}/api/volunteer/update-status/${complaintId}`;
      options.method = "PATCH";
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    } else if (actionType === "assign") {
      url = `${backendUrl}/api/volunteer/assign/${complaintId}`;
    } else if (actionType === "unassign") {
      url = `${backendUrl}/api/volunteer/unassign/${complaintId}`;
    }

    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(data.message || `${actionType.replace("-", " ")} successful!`);
        fetchData();
      } else {
        throw new Error(data.message || `Failed to perform action: ${actionType}`);
      }
    } catch (error) {
      console.error(`Error performing action ${actionType}:`, error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  const handleAssignToSelf = (complaintId) => handleAction("assign", complaintId);
  const handleUpdateStatus = (complaintId, newStatus) =>
    handleAction("update-status", complaintId, { status: newStatus });

  const handleUnassign = (complaintId) => {
    toast(
      (t) => (
        <span>
          Are you sure you want to unassign this task?
          <div className="mt-2 flex gap-2">
            <button
              className="px-3 py-1 bg-gray-200 rounded text-gray-700 text-xs font-semibold"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 bg-red-600 rounded text-white text-xs font-semibold"
              onClick={() => {
                toast.dismiss(t.id);
                handleAction("unassign", complaintId);
              }}
            >
              Unassign
            </button>
          </div>
        </span>
      ),
      { duration: 6000 }
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      received: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      in_review: "bg-blue-600 text-white border border-blue-600",
      resolved: "bg-green-100 text-green-800 border border-green-200",
      rejected: "bg-red-100 text-red-800 border border-red-200",
    };
    const labels = {
      received: "Pending",
      in_review: "In Progress",
      resolved: "Resolved",
      rejected: "Rejected",
    };
    return (
      <span
        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
          styles[status] || "bg-gray-100 text-gray-800 border-gray-200"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      Low: "bg-gray-100 text-gray-700 border border-gray-200",
      Medium: "bg-orange-100 text-orange-700 border border-orange-200",
      High: "bg-red-100 text-red-700 border border-red-200",
    };
    return (
      <span
        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
          styles[priority] || styles.Medium
        }`}
      >
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col transition-colors duration-300">
        <Toaster position="top-right" reverseOrder={false} />
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <svg
              className="animate-spin mx-auto h-12 w-12 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-600">Loading Volunteer Dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col transition-colors duration-300">
        <Toaster position="top-right" reverseOrder={false} />
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center bg-red-50 p-6 rounded-lg shadow border border-red-200 max-w-lg w-full">
            <FiAlertCircle className="mx-auto text-red-500 text-4xl mb-3" />
            <p className="font-semibold text-red-800 text-lg">Error Loading Dashboard</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col transition-colors duration-300">
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-grow">
        <div className="animate-fade-in-up">
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
              Volunteer Dashboard
            </h1>
            <p className="text-gray-600 mt-1 text-base">
              Manage complaints {volunteerLocation && `in ${volunteerLocation}`}
            </p>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard icon={<FiTool className="text-blue-500" />} value={stats.totalAssignments} label="Total Assignments" />
            <StatCard icon={<FiClock className="text-yellow-500" />} value={stats.pendingAssignments} label="Pending Pickup" />
            <StatCard icon={<FiRotateCw className="text-orange-500" />} value={stats.inProgressAssignments} label="In Progress" />
            <StatCard icon={<FiCheckCircle className="text-green-500" />} value={stats.resolvedAssignments} label="Resolved" />
          </section>

          {/* ✅ Recent Updates Section (Admin Logs) */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FiActivity className="text-indigo-500" /> Recent Updates
            </h2>
            {activities.length === 0 ? (
              <div className="bg-white rounded-xl shadow border border-gray-100 p-6 text-center">
                <p className="text-gray-500 text-sm">No recent updates from admin yet.</p>
              </div>
            ) : (
              <ul className="bg-white rounded-xl shadow border border-gray-100">
                {activities.map((log) => (
                  <li key={log._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 text-sm">
                        {log.action}
                      </p>
                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* === Tabs Section === */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px space-x-6" aria-label="Tabs">
              <TabButton id="nearby" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FiMapPin />}>
                Nearby ({nearbyComplaints.length})
              </TabButton>
              <TabButton id="myAssignments" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FiClipboard />}>
                My Assignments ({myAssignments.length})
              </TabButton>
            </nav>
          </div>

          <div>
            {activeTab === "nearby" ? (
              <section>
                {nearbyComplaints.length === 0 ? (
                  <div className="text-center bg-white rounded-xl shadow border border-gray-100 p-12">
                    <FiMapPin className="mx-auto text-5xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      No unassigned complaints found nearby.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nearbyComplaints.map((complaint) => (
                      <NearbyComplaintCard
                        key={complaint._id}
                        complaint={complaint}
                        formatDate={formatDate}
                        getStatusBadge={getStatusBadge}
                        getPriorityBadge={getPriorityBadge}
                        handleAssignToSelf={handleAssignToSelf}
                        isLoading={actionLoading[complaint._id]}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <section>
                {myAssignments.length === 0 ? (
                  <div className="text-center bg-white rounded-xl shadow border border-gray-100 p-12">
                    <FiClipboard className="mx-auto text-5xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      You don't have any assigned complaints currently.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Check the "Nearby" tab to pick up tasks.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myAssignments.map((complaint) => (
                      <AssignedComplaintCard
                        key={complaint._id}
                        complaint={complaint}
                        formatDate={formatDate}
                        getStatusBadge={getStatusBadge}
                        getPriorityBadge={getPriorityBadge}
                        handleUpdateStatus={handleUpdateStatus}
                        handleUnassign={handleUnassign}
                        isLoading={actionLoading[complaint._id]}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const StatCard = ({ icon, value, label }) => (
  <div className="bg-white p-5 rounded-xl shadow border border-gray-100 flex items-center gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:border-indigo-100 transform hover:-translate-y-1">
    <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-blue-100 text-2xl flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800 capitalize">{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  </div>
);

const TabButton = ({ id, activeTab, setActiveTab, icon, children }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none focus-visible:bg-indigo-50/50 rounded-t whitespace-nowrap ${
      activeTab === id
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
  >
    {React.cloneElement(icon, { size: 16 })}
    <span>{children}</span>
  </button>
);

const NearbyComplaintCard = ({
  complaint,
  formatDate,
  getStatusBadge,
  getPriorityBadge,
  handleAssignToSelf,
  isLoading,
}) => (
  <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 group flex flex-col">
    {complaint.photo && (
      <div className="h-40 bg-gray-100 overflow-hidden">
        <img
          src={complaint.photo}
          alt={complaint.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    )}
    <div className="p-4 flex flex-col flex-grow">
      <div className="flex justify-between items-start gap-2 mb-2">
        {getStatusBadge(complaint.status)}
        {getPriorityBadge(complaint.priority)}
      </div>
      <h3 className="font-semibold text-base text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
        {complaint.title}
      </h3>
      <div className="space-y-1 text-xs text-gray-500 mb-3">
        <p>
          <span className="font-medium text-gray-600">Type:</span> {complaint.type}
        </p>
        <p>
          <span className="font-medium text-gray-600">Reported:</span> {formatDate(complaint.createdAt)}
        </p>
        {complaint.distance && (
          <p>
            <span className="font-medium text-gray-600">Distance:</span> ≈{complaint.distance} km
          </p>
        )}
      </div>
      <div className="flex items-start text-xs text-gray-500 mb-4">
        <FiMapPin className="mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" size={12} />
        <span className="line-clamp-2 leading-snug">{complaint.address}</span>
      </div>
      <button
        onClick={() => handleAssignToSelf(complaint._id)}
        disabled={complaint.assigned_to || isLoading}
        className={`w-full mt-auto py-2 px-4 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
          complaint.assigned_to
            ? "bg-gray-200 text-black cursor-not-allowed"
            : isLoading
            ? "bg-indigo-300 text-white cursor-wait"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {isLoading ? <FiLoader className="animate-spin" /> : <FiUserPlus size={16} />}
        {complaint.assigned_to ? "Assigned" : isLoading ? "Assigning..." : "Assign to Me"}
      </button>
    </div>
  </div>
);

const AssignedComplaintCard = ({
  complaint,
  formatDate,
  getStatusBadge,
  getPriorityBadge,
  handleUpdateStatus,
  handleUnassign,
  isLoading,
}) => (
  <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 group flex flex-col">
    {complaint.photo && (
      <div className="h-40 bg-gray-100 overflow-hidden">
        <img
          src={complaint.photo}
          alt={complaint.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    )}
    <div className="p-4 flex flex-col flex-grow">
      <div className="flex justify-between items-start gap-2 mb-2">
        {getStatusBadge(complaint.status)}
        {getPriorityBadge(complaint.priority)}
      </div>
      <h3 className="font-semibold text-base text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
        {complaint.title}
      </h3>
      <div className="space-y-1 text-xs text-gray-500 mb-3">
        <p>
          <span className="font-medium text-gray-600">Type:</span> {complaint.type}
        </p>
        <p>
          <span className="font-medium text-gray-600">Reported:</span> {formatDate(complaint.createdAt)}
        </p>
      </div>
      <div className="flex items-start text-xs text-gray-500 mb-4">
        <FiMapPin className="mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" size={12} />
        <span className="line-clamp-2 leading-snug">{complaint.address}</span>
      </div>
      <div className="mt-auto space-y-2 pt-3 border-t border-gray-100">
        <label className="text-xs font-semibold text-gray-500 block mb-1">
          Update Status:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {complaint.status !== "in_review" && (
            <StatusButton
              onClick={() => handleUpdateStatus(complaint._id, "in_review")}
              isLoading={isLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              In Progress
            </StatusButton>
          )}
          {complaint.status !== "resolved" && (
            <StatusButton
              onClick={() => handleUpdateStatus(complaint._id, "resolved")}
              isLoading={isLoading}
              className="bg-green-100 text-green-700 hover:bg-green-200"
            >
              Resolved
            </StatusButton>
          )}
          {complaint.status !== "rejected" && (
            <StatusButton
              onClick={() => handleUpdateStatus(complaint._id, "rejected")}
              isLoading={isLoading}
              className="bg-red-100 text-red-700 hover:bg-red-200"
            >
              Reject
            </StatusButton>
          )}
          <StatusButton
            onClick={() => handleUnassign(complaint._id)}
            isLoading={isLoading}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <FiUserMinus size={14} className="inline mr-1" /> Unassign
          </StatusButton>
        </div>
      </div>
    </div>
  </div>
);

const StatusButton = ({ onClick, children, className = "", isLoading = false }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors duration-150 w-full flex items-center justify-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
  >
    {isLoading ? <FiLoader className="animate-spin" size={14} /> : children}
  </button>
);

export default VolunteerDashboard;
