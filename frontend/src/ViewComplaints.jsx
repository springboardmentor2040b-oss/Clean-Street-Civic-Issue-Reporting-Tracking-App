import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import "./ViewComplaints.css";
import TopNav from "./components/TopNav/TopNav";

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
      <TopNav activePath="/complaints" />

      <main className={`dashboard-content complaints-content ${selectedComplaint ? "modal-open" : ""}`}>
        <div className="content">
          <h2 className="view-complaints-title">Reported Complaints</h2>
          {complaints.length === 0 ? (
            <div>No complaints reported yet.</div>
          ) : (
            <div className="view-complaints-grid">
              {complaints.map((issue) => (
                <div
                  key={issue._id}
                  className="view-complaint-card"
                  onClick={() => setSelectedComplaint(issue)}
                >
                  <h3 className="view-complaint-card__title">{issue.title}</h3>
                  <p className="view-complaint-card__text"><b>Priority:</b> {issue.priority} (Level {issue.priorityLevel ?? 'N/A'})</p>
                  <p className="view-complaint-card__text"><b>Description:</b> {issue.description}</p>
                  <p className="view-complaint-card__text"><b>Address:</b> {issue.address}</p>
                  <div className="view-complaint-card__status">
                    <b>Status:</b>
                    {role === 'volunteer' || role === 'admin' ? (
                      <select
                        value={issue.status || ''}
                        onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={updatingStatus === issue._id}
                        className={`view-complaint-card__status-select ${updatingStatus === issue._id ? 'is-loading' : ''}`}
                      >
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                      </select>
                    ) : (
                      <span>{issue.status}</span>
                    )}
                    {updatingStatus === issue._id && (
                      <span className="view-complaint-card__status-hint">Updating...</span>
                    )}
                  </div>
                  <p className="view-complaint-card__text"><b>Date Reported:</b> {formatDate(issue.createdAt)}</p>

                  {issue.images && issue.images.length > 0 && (
                    <div className="view-complaint-card__images">
                      {issue.images.map((img, i) => (
                        <img key={i} src={img} alt="Issue" className="view-complaint-card__image" />
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
        <div
          className="complaint-modal-backdrop"
          onClick={() => {
            setSelectedComplaint(null);
            setReplyOpen({});
            setReplyTexts({});
          }}
        >
          <div
            className="complaint-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="complaint-modal-close"
              onClick={() => {
                setSelectedComplaint(null);
                setReplyOpen({});
                setReplyTexts({});
              }}
            >
              ×
            </button>
            <div className="complaint-modal-content">
              <div className="complaint-modal-details">
                <div className="complaint-modal-scroll">
                  <h2 className="complaint-modal-title">{selectedComplaint.title}</h2>
                  {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                    <div className="complaint-modal-section complaint-modal-images">
                      {selectedComplaint.images.map((img, i) => (
                        <div key={i} className="complaint-modal-image-wrapper">
                          <img
                            src={img}
                            alt={`Evidence ${i + 1}`}
                            className="complaint-modal-image"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="complaint-modal-section complaint-detail-card">
                    <div className="complaint-modal-section-title">Details</div>

                    <div className="complaint-detail-list">
                      <div className="complaint-detail-row">
                        <div className="complaint-detail-label">
                          <span className="complaint-detail-icon" role="img" aria-label="Priority">🏷️</span>
                          <span>Priority</span>
                        </div>
                        <span className="complaint-detail-value">
                          {selectedComplaint.priority} (Level {selectedComplaint.priorityLevel ?? 'N/A'})
                        </span>
                      </div>

                      <div className="complaint-detail-row">
                        <div className="complaint-detail-label">
                          <span className="complaint-detail-icon" role="img" aria-label="Location">📍</span>
                          <span>Location</span>
                        </div>
                        <span className="complaint-detail-text">
                          {selectedComplaint.address}
                        </span>
                      </div>

                      <div className="complaint-detail-row">
                        <div className="complaint-detail-label">
                          <span className="complaint-detail-icon" role="img" aria-label="Status">🔄</span>
                          <span>Status</span>
                        </div>
                        <span className={`complaint-detail-status ${selectedComplaint.status === 'Open' ? 'status-open' : 'status-closed'}`}>
                          {selectedComplaint.status}
                        </span>
                      </div>

                      <div className="complaint-detail-row">
                        <div className="complaint-detail-label">
                          <span className="complaint-detail-icon" role="img" aria-label="Date reported">📅</span>
                          <span>Date Reported</span>
                        </div>
                        <span className="complaint-detail-text">{formatDate(selectedComplaint.createdAt)}</span>
                      </div>

                      <div className="complaint-detail-description">
                        <div className="complaint-detail-label">
                          <span className="complaint-detail-icon" role="img" aria-label="Description">📝</span>
                          <div>Description</div>
                        </div>
                        <div className="complaint-detail-text">
                          {selectedComplaint.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="complaint-modal-comments">
                <h3 className="complaint-modal-comments-title">Comments</h3>
                <div className="complaint-modal-comments-scroll">
                  {selectedComplaint.comments && selectedComplaint.comments.length > 0 ? (
                    selectedComplaint.comments.map((comment, i) => (
                      <div key={i} className="complaint-comment-card">
                        <div className="complaint-comment-header">
                          <img
                            src={comment.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username)}&background=2d5a3d&color=fff&size=32`}
                            alt={comment.username}
                            className="complaint-comment-avatar"
                          />
                          <div className="complaint-comment-meta">
                            <span className="complaint-comment-author">{comment.username}</span>
                            <span className="complaint-comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="complaint-comment-body">{comment.text}</p>
                        <div className="complaint-comment-actions">
                          <button
                            className="complaint-comment-action"
                            onClick={async (e) => { e.stopPropagation(); await handleLike(comment._id); }}
                          >
                            👍 {comment.likedBy ? comment.likedBy.length : (comment.likes || 0)}
                          </button>
                          <button
                            className="complaint-comment-action"
                            onClick={async (e) => { e.stopPropagation(); await handleDislike(comment._id); }}
                          >
                            👎 {comment.dislikedBy ? comment.dislikedBy.length : (comment.dislikes || 0)}
                          </button>
                          <button
                            className="complaint-comment-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyOpen(prev => ({ ...prev, [comment._id]: !prev[comment._id] }));
                            }}
                          >
                            Reply
                          </button>
                        </div>
                        {replyOpen[comment._id] && (
                          <div className="complaint-reply-form" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              value={replyTexts[comment._id] || ''}
                              onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))}
                              placeholder={`Reply to ${comment.username}`}
                              className="complaint-reply-textarea"
                            />
                            <div className="complaint-reply-buttons">
                              <button
                                className="complaint-reply-submit"
                                onClick={async () => { await handleAddReply(comment._id); }}
                                disabled={!(replyTexts[comment._id] && replyTexts[comment._id].trim())}
                              >
                                Reply
                              </button>
                              <button
                                className="complaint-reply-cancel"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyOpen(prev => ({ ...prev, [comment._id]: false }));
                                  setReplyTexts(prev => ({ ...prev, [comment._id]: '' }));
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="complaint-comment-replies">
                            {comment.replies.map((reply, ri) => (
                              <div key={ri} className="complaint-comment-reply">
                                <div className="complaint-comment-reply-header">
                                  <img
                                    src={reply.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.username)}&background=2d5a3d&color=fff&size=24`}
                                    alt={reply.username}
                                    className="complaint-comment-reply-avatar"
                                  />
                                  <span className="complaint-comment-reply-author">{reply.username}</span>
                                  <span className="complaint-comment-reply-date">{new Date(reply.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="complaint-comment-reply-body">{reply.text}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="complaint-modal-no-comments">No comments yet.</p>
                  )}
                </div>
                <div className="complaint-modal-add-comment">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="complaint-modal-textarea"
                  />
                  <button
                    className="complaint-modal-submit"
                    onClick={handleAddComment}
                    disabled={addingComment || !newComment.trim()}
                  >
                    {addingComment ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars