import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiClipboard, FiAlertCircle, FiCheckCircle, FiEdit, FiSave, FiX, FiLoader, FiActivity, FiUserCheck, FiClock } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalComplaints: 0, pendingComplaints: 0, resolvedComplaints: 0 });
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [editingComplaintId, setEditingComplaintId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [activities, setActivities] = useState([]);


  const currentUser = JSON.parse(localStorage.getItem("user"));
  const backend_Url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";

  useEffect(() => {
    if (currentUser?.role !== "admin") {
      toast.error("Access Denied: Admins only.");
      navigate("/UserDashboard");
      return;
    }
    fetchData();
  }, [navigate, currentUser?.role]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, usersRes, complaintsRes,logsRes] = await Promise.all([
        fetch(`${backend_Url}/api/admin/stats`, { credentials: "include" }),
        fetch(`${backend_Url}/api/admin/users`, { credentials: "include" }),
        fetch(`${backend_Url}/api/admin/complaints`, { credentials: "include" }),
        fetch(`${backend_Url}/api/admin/logs`,{credentials: "include"})
      ]);

      if (!statsRes.ok || !usersRes.ok || !complaintsRes.ok ) {
         const errorData = await (statsRes.ok ? usersRes.ok ? complaintsRes : usersRes : statsRes).json();
         throw new Error(errorData.message || 'Failed to fetch admin data. Ensure you are logged in as admin.');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const complaintsData = await complaintsRes.json();
      const logsData = await logsRes.json()

      if (statsData.success) setStats(statsData.data);
      if (usersData.success) setUsers(usersData.data);
      if (complaintsData.success) setComplaints(complaintsData.data);
  if (logsData.success) setActivities(logsData.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(err.message || "Failed to load data. Please try again.");
       if (err.message.includes('403') || err.message.includes('401') || err.message.includes('logged in')) {
           toast.error("Authentication failed or forbidden access. Please log in as an admin.");
           navigate('/login');
       }
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user) => {
    setEditingUserId(user._id);
    setSelectedRole(user.role);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setSelectedRole("");
  };

  const handleSaveRole = async (userId) => {
    if (!selectedRole || !editingUserId || userId !== editingUserId) return;
    setIsSavingRole(true);
    try {
      const res = await fetch(`${backend_Url}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('User role updated successfully!');
        setEditingUserId(null);
        fetchData();
      } else {
        throw new Error(data.message || 'Failed to update role.');
      }
    } catch (err) {
      console.error("Error updating role:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
        setIsSavingRole(false);
    }
  };

  const handleEditStatus = (complaint) => {
    setEditingComplaintId(complaint._id);
    setSelectedStatus(complaint.status);
  };

  const handleCancelStatusEdit = () => {
    setEditingComplaintId(null);
    setSelectedStatus("");
  };

  const handleSaveStatus = async (complaintId) => {
    if (!selectedStatus || !editingComplaintId || complaintId !== editingComplaintId) return;
    setIsSavingStatus(true);
    try {
      const res = await fetch(`${backend_Url}/api/admin/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: selectedStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Complaint status updated successfully!');
        setEditingComplaintId(null);
        fetchData();
      } else {
        throw new Error(data.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
        setIsSavingStatus(false);
    }
  };


   const getStatusBadge = (status) => {
    const styles = {
      received: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      in_review: "bg-blue-100 text-blue-800 border border-blue-200",
      resolved: "bg-green-100 text-green-800 border border-green-200",
      rejected: "bg-red-100 text-red-800 border border-red-200",
    };
    const labels = { received: "Pending", in_review: "In Review", resolved: "Resolved", rejected: "Rejected" };
    return <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>{labels[status] || status}</span>;
   };

   const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
        <Toaster position="bottom-center" reverseOrder={false} />
        <Navbar />
         <div className="flex-grow flex items-center justify-center">
             <div className="text-center">
                 <svg className="animate-spin mx-auto h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <p className="mt-4 text-lg font-medium text-gray-600">Loading Admin Dashboard...</p>
             </div>
        </div>
        <Footer />
      </div>
    );
  }

   if (error) {
    return (
       <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
        <Toaster position="bottom-center" reverseOrder={false} />
        <Navbar />
         <div className="flex-grow flex items-center justify-center p-4">
           <div className="text-center bg-red-50 p-6 rounded-lg shadow border border-red-200 max-w-lg w-full">
               <FiAlertCircle className="mx-auto text-red-500 text-4xl mb-3"/>
               <p className="font-semibold text-red-800 text-lg">Error Loading Dashboard</p>
               <p className="text-red-700 text-sm mt-1">{error}</p>
               <button onClick={() => navigate('/login')} className="mt-5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 transition-colors">
                 Go to Login
               </button>
           </div>
        </div>
        <Footer/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
      <Toaster position="bottom-center" reverseOrder={false} />
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-grow">
        <header className="mb-8 animate-fade-in-down">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1 text-base">Overview and management tools.</p>
        </header>

        <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px space-x-6" aria-label="Tabs">
               <TabButton id="overview" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FiActivity />}>Overview</TabButton>
               <TabButton id="users" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FiUsers />}>Manage Users ({stats.totalUsers})</TabButton>
               <TabButton id="complaints" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FiClipboard />}>View Complaints ({stats.totalComplaints})</TabButton>
               <TabButton id="recent activities" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FiClipboard />}>Recent activities</TabButton>

             </nav>
         </div>


        <div className="animate-fade-in-up">
          {activeTab === 'overview' && (         
<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<FiUsers className="text-purple-500" />} value={stats.totalUsers} label="Total Users" />
              <StatCard icon={<FiClipboard className="text-blue-500" />} value={stats.totalComplaints} label="Total Complaints" />
              <StatCard icon={<FiClock className="text-yellow-500" />} value={stats.pendingComplaints} label="Pending Complaints" />
              <StatCard icon={<FiCheckCircle className="text-green-500" />} value={stats.resolvedComplaints} label="Resolved Complaints" />
            </section> 
          )}

          {activeTab === 'users' && (
            <section className="bg-white p-5 sm:p-6 rounded-xl shadow border border-gray-100">
               <h2 className="text-xl font-semibold text-gray-800 mb-5">User Management</h2>
               <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th scope="col" className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {users.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                           <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                           <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{user.location || 'N/A'}</td>
                           <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingUserId === user._id ? (
                              <select
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isSavingRole}
                              >
                                <option value="user">User</option>
                                <option value="volunteer">Volunteer</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'volunteer' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {user.role}
                              </span>
                            )}
                           </td>
                           <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                           <td className="px-5 py-4 whitespace-nowrap text-center text-sm font-medium">
                            {editingUserId === user._id ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleSaveRole(user._id)}
                                    className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSavingRole}
                                    title="Save Role"
                                >
                                    {isSavingRole ? <FiLoader className="animate-spin" size={16}/> : <FiSave size={16} />}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded disabled:opacity-50"
                                    disabled={isSavingRole}
                                    title="Cancel Edit"
                                >
                                    <FiX size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditRole(user)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded disabled:opacity-50 disabled:text-gray-400 disabled:hover:bg-transparent"
                                disabled={currentUser._id === user._id}
                                title={currentUser._id === user._id ? "Cannot edit own role" : "Edit Role"}
                              >
                                  <FiEdit size={16} />
                              </button>
                            )}
                           </td>
                        </tr>
                       ))}
                    </tbody>
                </table>
               </div>
            </section>
          )}

          {activeTab === 'complaints' && (
            <section className="bg-white p-5 sm:p-6 rounded-xl shadow border border-gray-100">
               <h2 className="text-xl font-semibold text-gray-800 mb-5">All Complaints</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                       <thead className="bg-gray-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {complaints.map(complaint => (
                            <tr key={complaint._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.title}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.user_id?.name || 'Unknown User'}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.type}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm">
                                  {editingComplaintId === complaint._id ? (
                                    <select
                                      value={selectedStatus}
                                      onChange={e => setSelectedStatus(e.target.value)}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                      disabled={isSavingStatus}
                                    >
                                      <option value="received">Pending</option>
                                      <option value="in_review">In Review</option>
                                      <option value="resolved">Resolved</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                  ) : (
                                    getStatusBadge(complaint.status)
                                  )}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.assigned_to?.name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(complaint.createdAt)}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-center text-sm font-medium">
                                  {editingComplaintId === complaint._id ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                          onClick={() => handleSaveStatus(complaint._id)}
                                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={isSavingStatus}
                                          title="Save Status"
                                      >
                                          {isSavingStatus ? <FiLoader className="animate-spin" size={16}/> : <FiSave size={16} />}
                                      </button>
                                      <button
                                          onClick={handleCancelStatusEdit}
                                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded disabled:opacity-50"
                                          disabled={isSavingStatus}
                                          title="Cancel Edit"
                                      >
                                          <FiX size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleEditStatus(complaint)}
                                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded"
                                      title="Edit Status"
                                    >
                                        <FiEdit size={16} />
                                    </button>
                                  )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
               </div>
               {complaints.length === 0 && (
                 <p className="text-center text-gray-500 py-6">No complaints found.</p>
               )}
            </section>
          )}
          
          {activeTab === 'recent activities' && ( 
           
                   <div className="bg-white rounded-xl shadow p-4">
  <h2 className="text-xl font-semibold mb-3">Recent Activities</h2>
  <ul className="space-y-2 ">
    {activities.map((log) => (
      <li key={log._id} className=" rounded-lg hover:bg-gray-100   px-2 py-3">
        <span className="font-medium text-gray-800">{log.user_id?.name || "Unknown Admin"}</span>
        {" "}- {log.action}
        <div className="text-xs text-gray-500">
          {new Date(log.timestamp).toLocaleString()}
        </div>
      </li>
    ))}
  </ul>
</div>

          
          )}
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
      className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none focus-visible:bg-indigo-50 rounded-t
        ${activeTab === id
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
    >
      {React.cloneElement(icon, { size: 16 })}
      <span>{children}</span>
   </button>
 );


export default AdminDashboard;