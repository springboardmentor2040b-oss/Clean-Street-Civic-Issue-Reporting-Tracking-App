import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import logo from "./assets/logo.jpeg";

export default function ViewComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [replyOpen, setReplyOpen] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const role = localStorage.getItem('role'); // Fetch user role from localStorage
  const navigate = useNavigate();

  useEffect(() => {
    // When a complaint is selected, fetch its comments so we display the most up-to-date list
    const fetchCommentsForSelected = async () => {
      if (!selectedComplaint) return;
      if (!selectedComplaint._id) return;
      try {
        const res = await fetch(`http://localhost:5001/api/issues/${selectedComplaint._id}/comments`);
        if (!res.ok) throw new Error('Failed to fetch comments');
        const comments = await res.json();
        setSelectedComplaint(prev => ({ ...prev, comments }));
      } catch (err) {
        console.error('Error fetching comments for selected complaint:', err);
      }
    };

    fetchCommentsForSelected();
  }, [selectedComplaint]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/issues/all", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch complaints");
        }
        const data = await res.json();
        setComplaints(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
  };

  fetchComplaints();
  }, [token]);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    setUpdatingStatus(complaintId);

    try {
      const response = await fetch(`http://localhost:5001/api/issues/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update the local state
      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint._id === complaintId
            ? { ...complaint, status: newStatus }
            : complaint
        )
      );

      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setAddingComment(true);
    try {
      const response = await fetch(`http://localhost:5001/api/issues/${selectedComplaint._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();
      // backend returns { message: 'Comment added', comment }
      const added = data.comment;
      setSelectedComplaint(prev => ({ ...prev, comments: prev.comments ? [...prev.comments, added] : [added] }));
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setAddingComment(false);
    }
  };

  // Like a comment
  const handleLike = async (commentId) => {
    if (!selectedComplaint) return;
    try {
      const res = await fetch(`http://localhost:5001/api/issues/${selectedComplaint._id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to like comment');
      const data = await res.json();
      const updated = data.comment;
      setSelectedComplaint(prev => ({ ...prev, comments: prev.comments.map(c => c._id === updated._id ? updated : c) }));
      // also update complaints list to reflect counts where needed
      setComplaints(prev => prev.map(issue => issue._id === selectedComplaint._id ? { ...issue, comments: (issue.comments || []).map(c => c._id === updated._id ? updated : c) } : issue));
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  // Dislike a comment
  const handleDislike = async (commentId) => {
    if (!selectedComplaint) return;
    try {
      const res = await fetch(`http://localhost:5001/api/issues/${selectedComplaint._id}/comments/${commentId}/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to dislike comment');
      const data = await res.json();
      const updated = data.comment;
      setSelectedComplaint(prev => ({ ...prev, comments: prev.comments.map(c => c._id === updated._id ? updated : c) }));
      setComplaints(prev => prev.map(issue => issue._id === selectedComplaint._id ? { ...issue, comments: (issue.comments || []).map(c => c._id === updated._id ? updated : c) } : issue));
    } catch (err) {
      console.error('Error disliking comment:', err);
    }
  };

  // Add a reply to a comment
  const handleAddReply = async (commentId) => {
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;
    try {
      const res = await fetch(`http://localhost:5001/api/issues/${selectedComplaint._id}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed to add reply');
      const data = await res.json();
      const updated = data.comment;
      setSelectedComplaint(prev => ({ ...prev, comments: prev.comments.map(c => c._id === updated._id ? updated : c) }));
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
      setReplyOpen(prev => ({ ...prev, [commentId]: false }));
    } catch (err) {
      console.error('Error adding reply:', err);
      alert('Failed to add reply.');
    }
  };

  // Replace existing formatDate with this
const formatDate = (dateInput) => {
  if (!dateInput) return "Not available";

  try {
    let dateString = dateInput;

    // Handle nested MongoDB style: { $date: "..." }
    if (typeof dateInput === "object" && dateInput.$date) {
      dateString = dateInput.$date;
    }
    // Handle accidentally double-stringified date values: "\"2025-...\""
    else if (typeof dateInput === "string" && dateInput.startsWith('"')) {
      dateString = JSON.parse(dateInput);
    }

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Invalid Date";

    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    console.error("Error parsing date:", err);
    return "Invalid Date";
  }
};


  if (loading) return <div>Loading complaints...</div>;

  if (complaints.length === 0)
    return <div>No complaints reported yet.</div>;

  return (
    <div className="dashboard">
      <header className="top-nav">
        <div className="brand">
          <img src={logo} alt="Clean Street Logo" className="brand-logo" />
        </div>
        <nav className="nav-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/report">Report Issue</a>
          <a href="/complaints" className="active">View Complaints</a>
        </nav>
        <button type="button" className="profile" onClick={handleProfileClick}>
          <span className="sr-only">Account</span>
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path
              d="M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 8.5c3.35 0 6 2.22 6 4.96V19.5H6v-1.54C6 15.22 8.65 13 12 13z"
              fill="currentColor"
            />
          </svg>
        </button>
      </header>

      {/* Back Button - Top Left Corner */}
      <div className="back-btn-container" style={{
        position: "absolute",
        top: "100px",
        left: "2rem",
        zIndex: "1000"
      }}>
        <div className="back-btn" onClick={() => navigate(-1)} style={{
          cursor: "pointer",
          fontSize: "1rem",
          color: "#5f7f47",
          fontWeight: "600"
        }}>
          ← BACK
        </div>
      </div>

      <main className="dashboard-content" style={selectedComplaint ? {filter: 'blur(5px)', pointerEvents: 'none'} : {}}>
        <div className="content">
          <h2>Reported Complaints</h2>
          {complaints.length === 0 ? (
            <div>No complaints reported yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {complaints.map((issue) => (
                <div key={issue._id} style={{border: "1px solid #ccc", marginBottom: "10px", padding: "10px", borderRadius: "12px", cursor: "pointer"}} onClick={() => setSelectedComplaint(issue)}>
                  <h3 style={{fontSize: "1.4rem", fontWeight: "700", color: "#2d5a3d", marginBottom: "0.8rem"}}>{issue.title}</h3>
                  <p><b>Priority:</b> {issue.priority} (Level {issue.priorityLevel ?? 'N/A'})</p>
                  <p><b>Description:</b> {issue.description}</p>
                  <p><b>Address:</b> {issue.address}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <b>Status:</b>
                    {role === 'volunteer' || role === 'admin' ? (
                      <select
                        value={issue.status || ''}
                        onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={updatingStatus === issue._id}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          fontSize: '0.9rem',
                          backgroundColor: updatingStatus === issue._id ? '#f0f0f0' : 'white',
                        }}
                      >
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                      </select>
                    ) : (
                      <span>{issue.status}</span>
                    )}
                    {updatingStatus === issue._id && (
                      <span style={{ fontSize: "0.8rem", color: "#666" }}>Updating...</span>
                    )}
                  </div>
                  <p><b>Date Reported:</b> {formatDate(issue.createdAt)}</p>

                  {issue.images && issue.images.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      {issue.images.map((img, i) => (
                        <img key={i} src={img} alt="Issue" style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedComplaint && (
        <div onClick={() => { setSelectedComplaint(null); setReplyOpen({}); setReplyTexts({}); }} style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div onClick={(e) => e.stopPropagation()} style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '70%', maxHeight: '80%', overflow: 'hidden', width: '70%', height: '80%', position: 'relative', display: 'flex'}}>
            <button onClick={() => { setSelectedComplaint(null); setReplyOpen({}); setReplyTexts({}); }} style={{position: 'absolute', top: '10px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#2d5a3d'}}>×</button>
            <div style={{flex: 1, paddingRight: '20px', display: 'flex', flexDirection: 'column', height: '100%'}}>
              <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
                <h2 style={{textAlign: 'center', margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '700', color: '#2d5a3d'}}>{selectedComplaint.title}</h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                  <div style={{
                    padding: '15px',
                    borderRadius: '12px',
                    backgroundColor: '#f9f9f9',
                    boxShadow: '0 4px 12px rgba(45, 90, 61, 0.15)'
                  }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#2d5a3d',
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      {selectedComplaint.images.map((img, i) => (
                        <div key={i} style={{
                          width: '100%',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          backgroundColor: 'white'
                        }}>
                          <img
                            src={img}
                            alt={`Evidence ${i + 1}`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '250px',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{
                  border: '1px solid #e0e0e0',
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <div style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#2d5a3d',
                    marginBottom: '20px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    Details
                  </div>

                  <div style={{display: 'flex', flexDirection: 'column', gap: '3px'}}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{fontSize: '1rem'}}>🏷️</span>
                        <span style={{fontSize: '0.95rem', color: '#666', fontWeight: '500'}}>Priority</span>
                      </div>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#2d5a3d',
                        backgroundColor: '#f0f8f0',
                        padding: '4px 12px',
                        borderRadius: '20px'
                      }}>
                        {selectedComplaint.priority} (Level {selectedComplaint.priorityLevel ?? 'N/A'}
)
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{fontSize: '1rem'}}>📍</span>
                        <span style={{fontSize: '0.95rem', color: '#666', fontWeight: '500'}}>Location</span>
                      </div>
                      <span style={{fontSize: '0.95rem', color: '#333'}}>
                        {selectedComplaint.address}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{fontSize: '1rem'}}>🔄</span>
                        <span style={{fontSize: '0.95rem', color: '#666', fontWeight: '500'}}>Status</span>
                      </div>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: selectedComplaint.status === 'Open' ? '#d32f2f' : '#2e7d32',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {selectedComplaint.status}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{fontSize: '1rem'}}>📅</span>
                        <span style={{fontSize: '0.95rem', color: '#666', fontWeight: '500'}}>Date Reported</span>
                      </div>
                      <span style={{fontSize: '0.9rem', color: '#555'}}>
                       {formatDate(selectedComplaint.createdAt)}
                      </span>
                    </div>

                    <div style={{
                      padding: '12px 0'
                    }}>
                      <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                        <span style={{fontSize: '1rem', marginTop: '2px'}}>📝</span>
                        <div>
                          <div style={{fontSize: '0.95rem', color: '#666', fontWeight: '500', marginBottom: '6px'}}>Description</div>
                          <div style={{fontSize: '1rem', lineHeight: '1.5', color: '#333'}}>
                            {selectedComplaint.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
            <div style={{flex: 1, paddingLeft: '20px', borderLeft: '1px solid #e0e0e0', height: '100%', display: 'flex', flexDirection: 'column'}}>
              <h3 style={{fontSize: '1.4rem', fontWeight: '600', color: '#2d5a3d', marginBottom: '15px'}}>Comments</h3>
              <div style={{maxHeight: '400px', overflowY: 'auto', marginBottom: '20px'}}>
                {selectedComplaint.comments && selectedComplaint.comments.length > 0 ? (
                  selectedComplaint.comments.map((comment, i) => (
                    <div key={i} style={{border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#f8f9fa'}}>
                      <div style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                        <img
                          src={comment.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username)}&background=2d5a3d&color=fff&size=32`}
                          alt={comment.username}
                          style={{width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px', objectFit: 'cover'}}
                        />
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span style={{fontWeight: 'bold', fontSize: '1rem', color: '#2d5a3d'}}>{comment.username}</span>
                            <span style={{fontSize: '0.85rem', color: '#2d5a3d'}}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p style={{margin: '4px 0', fontSize: '1rem', lineHeight: '1.4', color: '#2d5a3d'}}>{comment.text}</p>
                          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px'}}>
                            <button onClick={async (e) => { e.stopPropagation(); await handleLike(comment._id); }} style={{background: 'none', border: 'none', color: '#2d5a3d', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'}}>
                              👍 {comment.likedBy ? comment.likedBy.length : (comment.likes || 0)}
                            </button>
                            <button onClick={async (e) => { e.stopPropagation(); await handleDislike(comment._id); }} style={{background: 'none', border: 'none', color: '#2d5a3d', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'}}>
                              👎 {comment.dislikedBy ? comment.dislikedBy.length : (comment.dislikes || 0)}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setReplyOpen(prev => ({ ...prev, [comment._id]: !prev[comment._id] })); }} style={{background: 'none', border: 'none', color: '#2d5a3d', fontSize: '0.85rem', cursor: 'pointer'}}>
                              Reply
                            </button>
                          </div>
                          {/* Reply box */}
                          {replyOpen[comment._id] && (
                            <div style={{marginTop: '8px'}} onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={replyTexts[comment._id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                placeholder={`Reply to ${comment.username}`}
                                style={{width: '100%', height: '70px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '8px'}}
                              />
                              <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                                <button onClick={async () => { await handleAddReply(comment._id); }} disabled={! (replyTexts[comment._id] && replyTexts[comment._id].trim())} style={{padding: '6px 12px', backgroundColor: '#2d5a3d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Reply</button>
                                <button onClick={(e) => { e.stopPropagation(); setReplyOpen(prev => ({ ...prev, [comment._id]: false })); setReplyTexts(prev => ({ ...prev, [comment._id]: '' })); }} style={{padding: '6px 12px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Cancel</button>
                              </div>
                            </div>
                          )}
                          {/* Render replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div style={{marginTop: '10px', marginLeft: '40px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                              {comment.replies.map((reply, ri) => (
                                <div key={ri} style={{background: '#f1f6f1', padding: '8px', borderRadius: '6px'}}>
                                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <img src={reply.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.username)}&background=2d5a3d&color=fff&size=24`} alt={reply.username} style={{width: '24px', height: '24px', borderRadius: '50%'}} />
                                    <strong style={{color: '#2d5a3d'}}>{reply.username}</strong>
                                    <span style={{fontSize: '0.8rem', color: '#666', marginLeft: '8px'}}>{new Date(reply.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div style={{marginTop: '6px', color: '#333'}}>{reply.text}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{fontSize: '1rem', color: '#2d5a3d'}}>No comments yet.</p>
                )}
              </div>
              <div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{width: '100%', height: '100px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px'}}
                />
                <button
                  onClick={handleAddComment}
                  disabled={addingComment || !newComment.trim()}
                  style={{padding: '10px 20px', backgroundColor: '#2d5a3d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  {addingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars