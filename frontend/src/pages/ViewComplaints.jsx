// src/pages/ViewComplaints.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import ComplaintModal from "../Components/ComplaintModal";
// === ADDED FiLogIn FOR THE NEW PROMPT ===
import { FaRegComment, FaSpinner, FaMapMarkerAlt, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi"; // Added icon
import { Link } from "react-router-dom"; // Added Link

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [user, setUser] = useState(null);
  const backend_Url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }

    const fetchComplaints = async () => {
      try {
        const res = await fetch(`${backend_Url}/api/complaints/community`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {

          const complaintsWithComments = data.data.map(c => ({ ...c, comments: Array.isArray(c.comments) ? c.comments : [] }));

          const sortedComplaints = complaintsWithComments.sort((a, b) => {
            const netVotesA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
            const netVotesB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
            return netVotesB - netVotesA;
          });
          setComplaints(sortedComplaints);
        } else if (res.status === 401) {
           console.warn("User not logged in, vote/comment will be disabled.");
        } else {
          throw new Error(data.message || "Failed to fetch complaints");
        }
      } catch (err) {
         if (err.message !== "You must be logged in to view complaints.") {
            setError(err.message);
         }
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []); 

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleCloseModal = () => {
    setSelectedComplaint(null);
  };


  const updateCommentCount = (complaintId, newComment) => {
    setComplaints(complaints.map(complaint =>
      complaint._id === complaintId
        ? { ...complaint, comments: [...(Array.isArray(complaint.comments) ? complaint.comments : []), newComment] }
        : complaint
    ));
  };


  const handleUpvote = async (complaintId) => {
    if (!user) {
        setError("You must be logged in to vote.");
        return;
    }
    try {
      const res = await fetch(`${backend_Url}/api/complaints/${complaintId}/upvote`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        // Update the complaint with new vote counts and user's vote status
        const updatedComplaints = complaints.map(complaint => {
          if (complaint._id === complaintId) {
            // Build arrays with proper length based on backend response
            const newUpvotes = data.data.hasUpvoted 
              ? [...(complaint.upvotes || []).filter(id => {
                  const idStr = typeof id === 'object' ? id._id : id;
                  return idStr?.toString() !== user._id?.toString();
                }), user._id]
              : (complaint.upvotes || []).filter(id => {
                  const idStr = typeof id === 'object' ? id._id : id;
                  return idStr?.toString() !== user._id?.toString();
                });
            
            const newDownvotes = (complaint.downvotes || []).filter(id => {
              const idStr = typeof id === 'object' ? id._id : id;
              return idStr?.toString() !== user._id?.toString();
            });
            
            return {
              ...complaint,
              upvotes: newUpvotes,
              downvotes: newDownvotes
            };
          }
          return complaint;
        });

        const sortedComplaints = updatedComplaints.sort((a, b) => {
          const netVotesA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
          const netVotesB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
          return netVotesB - netVotesA;
        });
        setComplaints(sortedComplaints);
      } else { throw new Error(data.message || 'Failed to upvote'); }
    } catch (error) {
      console.error("Error upvoting complaint:", error);
       setError(error.message || "Could not record vote. Please try again.");
    }
  };


  const handleDownvote = async (complaintId) => {
    if (!user) {
        setError("You must be logged in to vote.");
        return;
    }
    try {
      const res = await fetch(`${backend_Url}/api/complaints/${complaintId}/downvote`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        // Update the complaint with new vote counts and user's vote status
        const updatedComplaints = complaints.map(complaint => {
          if (complaint._id === complaintId) {
            // Build arrays with proper length based on backend response
            const newUpvotes = (complaint.upvotes || []).filter(id => {
              const idStr = typeof id === 'object' ? id._id : id;
              return idStr?.toString() !== user._id?.toString();
            });
            
            const newDownvotes = data.data.hasDownvoted 
              ? [...(complaint.downvotes || []).filter(id => {
                  const idStr = typeof id === 'object' ? id._id : id;
                  return idStr?.toString() !== user._id?.toString();
                }), user._id]
              : (complaint.downvotes || []).filter(id => {
                  const idStr = typeof id === 'object' ? id._id : id;
                  return idStr?.toString() !== user._id?.toString();
                });
            
            return {
              ...complaint,
              upvotes: newUpvotes,
              downvotes: newDownvotes
            };
          }
          return complaint;
        });

        const sortedComplaints = updatedComplaints.sort((a, b) => {
          const netVotesA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
          const netVotesB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
          return netVotesB - netVotesA;
        });
        setComplaints(sortedComplaints);
      } else { throw new Error(data.message || 'Failed to downvote'); }
    } catch (error) {
      console.error("Error downvoting complaint:", error);
      setError(error.message || "Could not record vote. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex justify-center items-center min-h-screen transition-colors duration-300">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-5xl mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading Community Reports...</p>
        </div>
      </div>
    );
  }

  return (
    // === MODIFIED: Set background to gradient like admin panel ===
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 flex-grow">
        <div className="text-center mb-12 animate-fade-in-down">
          <h1 className="text-4xl font-bold text-theme-primary">Community Reports</h1>
          <p className="text-theme-secondary mt-2">Browse issues reported by the community and track their status.</p>
        </div>

        {error && ( 
          <div className="mb-4 text-center bg-red-50 text-red-700 rounded-xl shadow-md p-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* === MODIFIED: card-theme makes cards white/dark blue === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.length > 0 ? (
            complaints.map((complaint) => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                onClick={() => handleComplaintClick(complaint)}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                user={user} 
              />
            ))
          ) : (
            <div className="text-center card-theme rounded-xl shadow-md p-12 lg:col-span-3">
              <p className="text-lg text-theme-secondary">No community reports have been filed yet.</p>
            </div>
          )}
        </div>

      </main>
      <Footer />
      {selectedComplaint && (
        <ComplaintModal
          complaint={selectedComplaint}
          onClose={handleCloseModal}
          onCommentAdded={updateCommentCount}
        />
      )}
    </div>
  );
};

const ComplaintCard = ({ complaint, onClick, onUpvote, onDownvote, user }) => {
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  
  // Check if current user has upvoted or downvoted
  const hasUpvoted = user && complaint.upvotes?.some(vote => {
    const voteId = typeof vote === 'object' ? vote._id : vote;
    return voteId?.toString() === user._id?.toString();
  });
  const hasDownvoted = user && complaint.downvotes?.some(vote => {
    const voteId = typeof vote === 'object' ? vote._id : vote;
    return voteId?.toString() === user._id?.toString();
  });

  const getStatusBadge = (status) => {
    // ... (This function remains the same)
    const styles = {
      received: "bg-yellow-100 text-yellow-800",
      in_review: "bg-blue-200 text-blue-900",
      resolved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    const labels = {
      received: "Pending", in_review: "In Review", resolved: "Resolved", rejected: "Rejected",
    };
    return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status]}`}>{labels[status] || 'Unknown'}</span>;
  };

  const getProgressPercentage = (status) => {
    // ... (This function remains the same)
    const progressMap = {
      received: 25,
      in_review: 50,
      resolved: 100,
      rejected: 0,
    };
    return progressMap[status] || 0;
  };

  const getProgressColor = (status) => {
    // ... (This function remains the same)
    const colorMap = {
      received: "bg-yellow-500",
      in_review: "bg-blue-500",
      resolved: "bg-green-500",
      rejected: "bg-red-500",
    };
    return colorMap[status] || "bg-gray-500";
  };

  return (
    // === MODIFIED: Use card-theme class ===
    <div
      className="card-theme rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fade-in-up cursor-pointer flex flex-col"
      onClick={onClick}
    >
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-3">
            {getStatusBadge(complaint.status)}
            <div className="flex items-center gap-2">
                <UserAvatar user={complaint.user_id} size="sm" />
                <div className="text-right">
                    <p className="text-sm font-medium text-theme-primary truncate max-w-[120px]">{complaint.user_id?.name || 'Anonymous'}</p>
                    <p className="text-xs text-theme-tertiary">{formatDate(complaint.createdAt)}</p>
                </div>
            </div>
        </div>
        
        {complaint.photo && (
          <img src={complaint.photo} alt={complaint.title} className="w-full h-48 object-cover rounded-lg mb-4" />
        )}
        <h2 className="text-xl font-bold text-theme-primary mb-2">{complaint.title}</h2>
        <p className="text-theme-secondary mb-4 line-clamp-2">{complaint.description}</p>
        <div className="flex items-center text-sm text-theme-secondary mb-4">
            <FaMapMarkerAlt className="mr-2 flex-shrink-0" />
            <span>{complaint.address}</span>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-theme-secondary">Progress</span>
            <span className="text-xs font-semibold text-theme-primary">{getProgressPercentage(complaint.status)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getProgressColor(complaint.status)}`}
              style={{ width: `${getProgressPercentage(complaint.status)}%` }}
            ></div>
          </div>
        </div>
      </div>
      {/* === THIS IS THE MAIN CHANGED SECTION === */}
      <div className="mt-auto pt-4 border-t border-theme-light">
        <div className="flex items-center justify-between">
            {user ? (
              // === LOGGED-IN VIEW (As before) ===
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpvote(complaint._id);
                  }}
                  className={`flex items-center gap-1 transition-colors ${
                    hasUpvoted 
                      ? 'text-green-600 font-bold' 
                      : 'text-theme-secondary hover:text-green-600'
                  }`}
                  aria-label={`Upvote this complaint currently having ${complaint.upvotes?.length || 0} upvotes`}
                >
                  <FaThumbsUp className="text-sm" />
                  <span className="text-sm font-semibold">{complaint.upvotes?.length || 0}</span>
                  <p className="lg:block hidden text-sm">Upvote</p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownvote(complaint._id);
                  }}
                  className={`flex items-center gap-1 transition-colors ${
                    hasDownvoted 
                      ? 'text-red-600 font-bold' 
                      : 'text-theme-secondary hover:text-red-600'
                  }`}
                  aria-label={`Downvote this complaint currently having ${complaint.downvotes?.length || 0} downvotes`}
                >
                  <FaThumbsDown className="text-sm" />
                  <span className="text-sm font-semibold">{complaint.downvotes?.length || 0}</span>
                  <p className="lg:block hidden text-sm">Downvote</p>
                </button>
                <div className="flex items-center gap-1.5 text-theme-secondary text-sm" aria-label={`${complaint.comments?.length || 0} comments`}>
                  <FaRegComment />
                  <span>{complaint.comments?.length || 0}</span>
                </div>
              </div>
            ) : (
              // === LOGGED-OUT VIEW (New change) ===
              <div className="flex items-center gap-2">
                <Link to="/login" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-sm font-medium text-theme-secondary hover:text-theme-accent transition-colors">
                  <FiLogIn size={14} />
                  <span>Login to interact</span>
                </Link>
              </div>
            )}
          {/* This "View Details" link is always visible */}
          <span className="text-blue-600 font-semibold text-sm hover:underline flex-shrink-0">View Details</span>
        </div>
      </div>
      {/* === END OF CHANGED SECTION === */}
    </div>
  );
};

const UserAvatar = ({ user, size = 'sm' }) => {
    // ... (This function remains the same)
    const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
    const apiSize = size === 'sm' ? '32' : '40';
    const userName = user?.name || 'A';
    const userPhoto = user?.profilePhoto;

    return (<img src={userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=${apiSize}`} alt={userName || 'User'} className={`${sizeClasses} rounded-full object-cover flex-shrink-0 border border-gray-200`} />);
};

export default ViewComplaints;