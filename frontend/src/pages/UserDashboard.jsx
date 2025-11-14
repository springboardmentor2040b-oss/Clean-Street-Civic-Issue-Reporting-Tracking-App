// src/pages/UserDashboard.jsx

import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaCheckCircle,
  FaSpinner,
  FaUserShield,
  FaArrowLeft,
  FaTrashAlt,
  FaPlusCircle,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";
import { FiActivity } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [showAllReports, setShowAllReports] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    complaints: [],
    stats: {
      totalReports: 0,
      resolvedReports: 0,
      pendingReports: 0,
      inProgressReports: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const backend_Url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      toast.error("Session expired or unauthorized. Please log in again.");
      navigate("/login");
      return;
    }
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${backend_Url}/api/complaints/my-reports`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const complaints = data.data.complaints || [];
          const stats = {
            totalReports: complaints.length,
            resolvedReports: complaints.filter((c) => c.status === "resolved").length,
            pendingReports: complaints.filter((c) => c.status === "received").length,
            inProgressReports: complaints.filter((c) => c.status === "in_review").length,
          };
          setDashboardData({ complaints, stats });
        } else {
          if (res.status === 401 || res.status === 403) {
            toast.error("Session expired or unauthorized. Please log in again.");
            navigate("/login");
          } else {
            toast.error(data.message || "Failed to fetch dashboard data.");
          }
        }

        // === Fetch recent admin logs ===
        try {
          const logsRes = await fetch(`${backend_Url}/api/admin/logs`, { credentials: "include" });
          const logsData = await logsRes.json();
          if (logsRes.ok && logsData.success) {
            setActivities(logsData.data.slice(0, 5));
          }
        } catch (error) {
          console.error("Error fetching admin logs:", error);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Could not load dashboard data. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const handleDelete = async (complaintId) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`${backend_Url}/api/complaints/${complaintId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Report deleted successfully!");
        setDashboardData((prevData) => {
          const updatedComplaints = prevData.complaints.filter((c) => c._id !== complaintId);
          const updatedStats = {
            totalReports: updatedComplaints.length,
            resolvedReports: updatedComplaints.filter((c) => c.status === "resolved").length,
            pendingReports: updatedComplaints.filter((c) => c.status === "received").length,
            inProgressReports: updatedComplaints.filter((c) => c.status === "in_review").length,
          };
          return {
            complaints: updatedComplaints,
            stats: updatedStats,
          };
        });
      } else {
        toast.error(data.message || "Failed to delete report.");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("An error occurred while deleting the report.");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      received: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      in_review: "bg-blue-100 text-blue-800 border border-blue-200",
      resolved: "bg-green-100 text-green-800 border border-green-200",
      rejected: "bg-red-100 text-red-800 border border-red-200",
    };
    const labels = {
      received: "Pending",
      in_review: "In Review",
      resolved: "Resolved",
      rejected: "Rejected",
    };
    return (
      <span
        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
          styles[status] || "bg-gray-100 text-gray-800 border border-gray-200"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (loading) {
    return (
      <>
        <Navbar />
        <Toaster position="bottom-center" reverseOrder={false} />
        <div className="min-h-[calc(100vh-theme(space.20))] bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center transition-colors duration-300">
          <div className="text-center">
            <svg
              className="animate-spin mx-auto h-12 w-12 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-600">Loading Your Dashboard...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col transition-colors duration-300">
      <Toaster position="bottom-center" reverseOrder={false} />
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-grow">
        {!showAllReports ? (
          <div className="animate-fade-in-up">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
                  Welcome, <span className="text-indigo-600">{user?.name || "User"}</span>!
                </h1>
                <p className="text-gray-600 mt-1 text-base">Here's an overview of your reports.</p>
              </div>
              <button
                onClick={() => navigate("/ReportIssue")}
                className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <FaPlusCircle /> Report New Issue
              </button>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard icon={<FaClipboardList className="text-blue-500" />} value={dashboardData.stats.totalReports} label="Total Reports" />
              <StatCard icon={<FaExclamationTriangle className="text-yellow-500" />} value={dashboardData.stats.pendingReports} label="Pending" />
              <StatCard icon={<FaSyncAlt className="text-orange-500" />} value={dashboardData.stats.inProgressReports} label="In Progress" />
              <StatCard icon={<FaCheckCircle className="text-green-500" />} value={dashboardData.stats.resolvedReports} label="Resolved" />
            </section>

            {/* === Complaint Status Log Section === */}


            {/* === Recent Updates Section === */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                  <FiActivity className="text-indigo-500" /> Recent Updates
                </h2>
              </div>
              {activities.length === 0 ? (
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6 text-center">
                  <p className="text-gray-500 text-sm">No recent updates from admin yet.</p>
                </div>
              ) : (
                <ul className="bg-white rounded-xl shadow">
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

            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                  <FaClipboardList className="text-indigo-500" /> Complaint Status Log
                </h2>
              </div>
              {dashboardData.complaints.length === 0 ? (
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6 text-center">
                  <p className="text-gray-500 text-sm">No complaints to display status for.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {dashboardData.complaints.slice(0, 5).map((complaint) => {
                      const statusText = 
                        complaint.status === "resolved" ? "Resolved" :
                        complaint.status === "in_review" ? "In Review" :
                        complaint.status === "rejected" ? "Rejected" :
                        "Pending";
                      
                      const statusColor = 
                        complaint.status === "resolved" ? "text-green-600" :
                        complaint.status === "in_review" ? "text-blue-600" :
                        complaint.status === "rejected" ? "text-red-600" :
                        "text-yellow-600";

                      return (
                        <div key={complaint._id} className="p-5 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-grow min-w-0">
                              <p className="text-xs text-gray-500 mb-1">
                                {formatDate(complaint.updatedAt)} at {new Date(complaint.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-sm text-gray-800">
                                Complaint <span className="font-semibold text-gray-900">"{complaint.title}"</span> status changed to <span className={`font-semibold ${statusColor}`}>{statusText}</span>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Type: {complaint.type} • Priority: {complaint.priority} • Reported: {formatDate(complaint.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {dashboardData.complaints.length > 5 && (
                    <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-200">
                      <button
                        onClick={() => setShowAllReports(true)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                      >
                        View All {dashboardData.complaints.length} Reports
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* === Recent Reports === */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-700">Recent Reports</h2>
                {dashboardData.complaints.length > 3 && (
                  <button
                    onClick={() => setShowAllReports(true)}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  >
                    View All ({dashboardData.complaints.length})
                  </button>
                )}
              </div>
              {dashboardData.complaints.length === 0 ? (
                <div className="text-center bg-white rounded-xl shadow border border-gray-100 p-12">
                  <FaClipboardList className="mx-auto text-5xl text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4 text-lg font-medium">You haven't reported any issues yet.</p>
                  <button
                    onClick={() => navigate("/ReportIssue")}
                    className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    <FaPlusCircle /> Report Your First Issue
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.complaints
                    .slice(0, 3)
                    .map((c) => (
                      <ReportCard key={c._id} complaint={c} formatDate={formatDate} getStatusBadge={getStatusBadge} handleDelete={handleDelete} />
                    ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="animate-fade-in">
            <header className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setShowAllReports(false)}
                className="flex items-center justify-center bg-white shadow hover:shadow-md text-gray-700 hover:text-indigo-600 p-2.5 rounded-full transition-all duration-300"
                title="Back to Overview"
              >
                <FaArrowLeft className="text-lg" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">All My Reports</h1>
                <p className="text-gray-500 text-base">
                  A complete history of your submissions ({dashboardData.complaints.length}).
                </p>
              </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dashboardData.complaints.map((c) => (
                <ReportCard key={c._id} complaint={c} formatDate={formatDate} getStatusBadge={getStatusBadge} handleDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const StatCard = ({ icon, value, label }) => (
  <div className="bg-white p-5 rounded-xl shadow border border-gray-100 flex items-center gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:border-indigo-100 transform hover:-translate-y-1">
    <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-blue-100 text-2xl flex-shrink-0">{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-800 capitalize">{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  </div>
);

const ReportCard = ({ complaint, formatDate, getStatusBadge, handleDelete }) => (
  <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 group flex flex-col">
    <div className="relative h-40 bg-gray-100 overflow-hidden">
      {complaint.photo ? (
        <img src={complaint.photo} alt={complaint.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <FaMapMarkerAlt size={40} />
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(complaint._id);
        }}
        className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black/50"
        title="Delete Report"
      >
        <FaTrashAlt size={14} />
      </button>
    </div>
    <div className="p-4 flex flex-col flex-grow">
      <div className="flex justify-between items-center mb-2">{getStatusBadge(complaint.status)}</div>
      <h3 className="font-semibold text-base text-gray-800 mb-2 line-clamp-2 flex-grow group-hover:text-indigo-700 transition-colors">
        {complaint.title}
      </h3>
      <div className="space-y-1 text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
        <p className="line-clamp-1">
          <span className="font-medium text-gray-600">Type:</span> {complaint.type}
        </p>
        <p className="line-clamp-1">
          <span className="font-medium text-gray-600">Reported:</span> {formatDate(complaint.createdAt)}
        </p>
        <div className="flex items-start pt-1">
          <FaMapMarkerAlt className="mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" size={12} />
          <span className="line-clamp-2 leading-snug">{complaint.address}</span>
        </div>
      </div>
    </div>
  </div>
);

export default UserDashboard;
