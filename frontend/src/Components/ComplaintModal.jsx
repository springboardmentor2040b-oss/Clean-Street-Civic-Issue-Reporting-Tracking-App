// src/Components/ComplaintModal.jsx
import React, { useEffect, useState, useRef } from "react";
// === ADDED Link for the login prompt ===
import { Link } from "react-router-dom"; 
import { FiX, FiMapPin, FiTag, FiAlertTriangle, FiCalendar, FiSend, FiThumbsUp, FiThumbsDown, FiMessageSquare, FiTrash2, FiImage, FiLoader } from "react-icons/fi";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon (Keep as is)
const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const ComplaintModal = ({ complaint, onClose, onCommentAdded }) => {
    // --- State Variables (Keep original logic) ---
    const [isOpen, setIsOpen] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";
    const [comments, setComments] = useState([]);
    const [commentCount, setCommentCount] = useState(complaint?.comments?.length || 0);
    const [newComment, setNewComment] = useState("");
    const [commentImage, setCommentImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const modalContentRef = useRef(null);

    // Get user (Keep original logic)
    const [currentUser, setCurrentUser] = useState(null);
     useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
        } catch (e) { console.error("Error parsing user from localStorage:", e); }
    }, []);


    // --- Core Logic (Keep original logic: useEffects, fetchComments, handlePostComment, handleLike, etc.) ---
    useEffect(() => {
        if (complaint) {
            setTimeout(() => setIsOpen(true), 10);
            setCommentCount(complaint.comments?.length || 0)
            fetchComments();
            setNewComment("");
            setCommentImage(null);
            setPreviewImage(null);
            setActiveReplyId(null);
            setIsPostingComment(false);
        } else {
            setIsOpen(false);
        }
    }, [complaint]);

     useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);


    const fetchComments = async () => { 
        if (!complaint) return;
        try {
            const res = await fetch(`${backendUrl}/api/comments/${complaint._id}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                setComments(data.data);
                const totalComments = data.data.reduce((acc, comment) => acc + 1 + (comment.replies ? comment.replies.length : 0), 0);
                setCommentCount(totalComments);
            }
        } catch (error) { console.error("Error fetching comments:", error); }
    };

    const handlePostComment = async (e, text, parentId = null, imageFile = null) => { 
        e.preventDefault();
        if (!text?.trim() || !currentUser) return; // Added !currentUser check
        setIsPostingComment(true);
        const formData = new FormData();
        formData.append("text", text);
        if (parentId) formData.append("parentCommentId", parentId);
        if (imageFile) formData.append("image", imageFile);
        try {
            const res = await fetch(`${backendUrl}/api/comments/${complaint._id}`, { method: 'POST', credentials: 'include', body: formData });
            const newCommentData = await res.json();
            if (res.ok) {
                fetchComments();
                if (onCommentAdded) { onCommentAdded(complaint._id, newCommentData.data); }
                setNewComment("");
                setCommentImage(null);
                setPreviewImage(null);
                setActiveReplyId(null);
            } else { throw new Error(newCommentData.message || "Failed to post comment"); }
        } catch (error) {
            console.error("Error adding comment:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleLike = async (commentId) => { 
         if (!currentUser) return; // Added !currentUser check
         try {
            const res = await fetch(`${backendUrl}/api/comments/${commentId}/like`, { method: 'POST', credentials: 'include' });
            if (res.ok) fetchComments();
        } catch (error) { console.error("Error liking comment:", error); }
    };
    const handleDislike = async (commentId) => { 
        if (!currentUser) return; // Added !currentUser check
        try {
            const res = await fetch(`${backendUrl}/api/comments/${commentId}/dislike`, { method: 'POST', credentials: 'include' });
            if (res.ok) fetchComments();
        } catch (error) { console.error("Error disliking comment:", error); }
    };
    const handleDelete = async (commentId) => { 
        if (!currentUser) return; // Added !currentUser check
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                const res = await fetch(`${backendUrl}/api/comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
                if (res.ok) fetchComments();
            } catch (error) { console.error("Error deleting comment:", error); }
        }
    };

    const handleImageChange = (e) => { 
        if (e.target.files && e.target.files[0]) {
             const file = e.target.files[0];
            setCommentImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };
    // --- End Core Logic ---

    if (!complaint) return null;

    const position = [complaint.location_coords.coordinates[1], complaint.location_coords.coordinates[0]];
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });


    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(8px)'}}
        >
            <div
                ref={modalContentRef}
                className={`bg-white w-full max-w-5xl max-h-[90vh] flex flex-col rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out transform border border-gray-200/50 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-5 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 truncate pr-4">{complaint.title}</h2>
                    <button onClick={onClose} className="flex-shrink-0 text-gray-400 rounded-full p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1" aria-label="Close modal">
                        <FiX size={20} />
                    </button>
                </header>

                <main className="flex-grow p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-gray-50/50">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                         {/* Left Column */}
                        <div className="space-y-6">
                            {complaint.photo && (
                                <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
                                    <img src={complaint.photo} alt={complaint.title} className="w-full h-auto max-h-[400px] object-contain bg-gray-100" />
                                </div>
                            )}
                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3">Details</h3>
                                <div className="space-y-3">
                                    <InfoItem icon={<FiTag />} label="Type" value={complaint.type} />
                                    <PriorityInfo priority={complaint.priority} />
                                    <InfoItem icon={<FiCalendar />} label="Reported On" value={formatDate(complaint.createdAt)} />
                                    <InfoItem icon={<FiMapPin />} label="Address" value={complaint.address} />
                                    {complaint.landmark && <InfoItem icon={<FiMapPin />} label="Landmark" value={complaint.landmark} />}
                                </div>
                            </div>
                             <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3">Description</h3>
                                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{complaint.description}</p>
                            </div>
                        </div>

                         {/* Right Column */}
                        <div className="space-y-6 flex flex-col">
                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3">Location</h3>
                                <div className="h-64 sm:h-72 w-full rounded-md overflow-hidden border border-gray-200 shadow-inner">
                                    <MapContainer center={position} zoom={16} className="h-full w-full" scrollWheelZoom={true}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                        <Marker position={position} icon={markerIcon} />
                                    </MapContainer>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex-grow flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex-shrink-0">Discussion ({commentCount})</h3>

                                <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2 -mr-2 mb-4 max-h-[400px]">
                                    {comments.length > 0 ? comments.map(comment => (
                                        <Comment
                                            key={comment._id}
                                            comment={comment}
                                            onLike={handleLike}
                                            onDislike={handleDislike}
                                            onDelete={handleDelete}
                                            onReplySubmit={handlePostComment}
                                            currentUser={currentUser} // Pass currentUser
                                            activeReplyId={activeReplyId}
                                            setActiveReplyId={setActiveReplyId}
                                        />
                                    )) : (
                                        <p className="text-sm text-gray-500 text-center py-4">No comments yet.</p>
                                    )}
                                </div>

                                 {/* === CONDITIONAL COMMENT FORM === */}
                                {currentUser ? (
                                    <form onSubmit={(e) => handlePostComment(e, newComment, null, commentImage)} className="mt-auto flex-shrink-0 pt-4 border-t border-gray-200">
                                        <div className="flex items-start gap-3">
                                            <UserAvatar user={currentUser} size="sm" />
                                            <div className="flex-1">
                                                <textarea
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="Add your comment..."
                                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition shadow-sm resize-none"
                                                    rows="2" />
                                                <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <label htmlFor="comment-image-upload" className="cursor-pointer text-gray-500 hover:text-indigo-600 p-1.5 rounded-full hover:bg-indigo-50 transition-colors" title="Attach image">
                                                            <FiImage size={18} />
                                                            <input type="file" id="comment-image-upload" accept="image/*" onChange={handleImageChange} className="hidden" />
                                                        </label>
                                                        {previewImage && (
                                                            <div className="relative group">
                                                                <img src={previewImage} alt="preview" className="rounded max-h-14 border border-gray-300" />
                                                                <button type="button" onClick={() => {setPreviewImage(null); setCommentImage(null);}} className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity" title="Remove image">
                                                                    <FiX size={10}/>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        className="flex items-center justify-center gap-1.5 w-24 bg-indigo-600 text-white font-semibold px-3 py-1.5 text-sm rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                                                        disabled={isPostingComment || !newComment.trim()}
                                                    >
                                                        {isPostingComment ? <FiLoader className="animate-spin" size={16}/> : <> <FiSend size={14}/> Post </>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="mt-auto flex-shrink-0 pt-4 border-t border-gray-200 text-center">
                                        <p className="text-sm text-gray-500">
                                            You must be <Link to="/login" className="text-indigo-600 hover:underline font-medium">logged in</Link> to comment or reply.
                                        </p>
                                    </div>
                                )}
                                {/* === END CONDITIONAL FORM === */}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

// **NEW**: Comment Component - Refined Styling & Layout
const Comment = ({ comment, onLike, onDislike, onDelete, onReplySubmit, currentUser, activeReplyId, setActiveReplyId }) => {
    // --- State Variables (Keep original logic) ---
    const isReplying = activeReplyId === comment._id;
    const [replyText, setReplyText] = useState("");
    const [isPostingReply, setIsPostingReply] = useState(false); 

    // --- Core Logic (Keep original logic: timeSince, handleReplyImageChange, submitReply) ---
    const timeSince = (date) => { 
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = Math.floor(seconds / 31536000); if (interval >= 1) return interval + (interval === 1 ? " year ago" : " years ago");
        interval = Math.floor(seconds / 2592000); if (interval >= 1) return interval + (interval === 1 ? " month ago" : " months ago");
        interval = Math.floor(seconds / 86400); if (interval >= 1) return interval + (interval === 1 ? " day ago" : " days ago");
        interval = Math.floor(seconds / 3600); if (interval >= 1) return interval + (interval === 1 ? " hour ago" : " hours ago");
        interval = Math.floor(seconds / 60); if (interval >= 1) return interval + (interval === 1 ? " minute ago" : " minutes ago");
        return Math.max(0, Math.floor(seconds)) + " seconds ago";
     };

    const submitReply = async (e) => {
        e.preventDefault();
        if(!currentUser) return; // Added check
        setIsPostingReply(true);
        await onReplySubmit(e, replyText, comment._id);
        setIsPostingReply(false);
    };

    const hasLiked = comment.likes?.includes(currentUser?.id);
    const hasDisliked = comment.dislikes?.includes(currentUser?.id);

    return (
        <div className="flex items-start gap-3 group"> 
            <UserAvatar user={comment.user} size="sm" /> 
            <div className="flex-1">
                <div className="bg-gray-100 p-3 rounded-lg border border-gray-200/80 mb-1 relative">
                     {/* Delete button (on hover) - ALREADY CONDITIONAL, NO CHANGE NEEDED */}
                     {currentUser?.id === comment.user?._id && (
                        <button
                            onClick={() => onDelete(comment._id)}
                            className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100/50 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            title="Delete Comment"
                        >
                            <FiTrash2 size={13} />
                        </button>
                    )}
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-gray-800 text-sm">{comment.user?.name || 'User'}</p>
                        <span className="text-xs text-gray-400">{timeSince(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 my-1 text-sm whitespace-pre-wrap">{comment.text}</p>
                    {comment.image && <img src={comment.image} alt="comment content" className="mt-2 rounded-md max-h-48 border border-gray-200" />}
                </div>
                
                {/* === HIDE ACTION BUTTONS IF NOT LOGGED IN === */}
                {currentUser && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 px-1">
                        <button onClick={() => onLike(comment._id)} className={`flex items-center gap-1 font-medium transition-colors ${hasLiked ? "text-blue-600" : "hover:text-blue-600"}`}>
                            <FiThumbsUp size={14} /> {comment.likes?.length || 0}
                        </button>
                        <button onClick={() => onDislike(comment._id)} className={`flex items-center gap-1 font-medium transition-colors ${hasDisliked ? "text-gray-700" : "hover:text-gray-700"}`}>
                            <FiThumbsDown size={14} /> {comment.dislikes?.length || 0}
                        </button>
                        <button onClick={() => setActiveReplyId(isReplying ? null : comment._id)} className="flex items-center gap-1 font-medium hover:text-gray-800 transition-colors">
                            <FiMessageSquare size={14} /> Reply
                        </button>
                    </div>
                )}
                {/* === END HIDE ACTION BUTTONS === */}

                {/* Reply Form - This is already conditional on 'isReplying', which can only be set if 'currentUser' is true */}
                {isReplying && (
                    <form onSubmit={submitReply} className="mt-3 ml-4 pl-3 border-l-2 border-gray-200 flex items-start gap-3">
                        <UserAvatar user={currentUser} size="sm" />
                        <div className="flex-1">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Replying to ${comment.user?.name}...`}
                                className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 transition shadow-sm resize-none"
                                rows="2" />
                            <div className="flex justify-end items-center mt-1.5 space-x-2">
                                <button type="button" onClick={() => setActiveReplyId(null)} className="text-xs text-gray-600 font-medium px-3 py-1 rounded-md hover:bg-gray-100 transition-colors">Cancel</button>
                                <button type="submit" className="text-xs bg-indigo-500 text-white font-semibold px-4 py-1 rounded-md hover:bg-indigo-600 transition-colors disabled:opacity-60" disabled={!replyText.trim() || isPostingReply}>
                                    {isPostingReply ? 'Replying...' : 'Reply'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
                 {/* Nested Replies */}
                <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-200 space-y-4">
                    {comment.replies && comment.replies.map(reply => (
                        <Comment
                            key={reply._id}
                            comment={reply}
                            onLike={onLike}
                            onDislike={onDislike}
                            onDelete={onDelete}
                            onReplySubmit={onReplySubmit}
                            currentUser={currentUser}
                            activeReplyId={activeReplyId}
                            setActiveReplyId={setActiveReplyId}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}


// --- Helper Components ---
const UserAvatar = ({ user, size = 'md' }) =>
     {
    const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
    const apiSize = size === 'sm' ? '32' : '40';
  const userName = user?.name || 'A';
    const userPhoto = user?.profilePhoto;

    return (<img src={userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=${apiSize}`} alt={userName} className={`${sizeClasses} rounded-full object-cover flex-shrink-0 border border-gray-200`} />);
};
const InfoItem = ({ icon, label, value, valueClassName = "text-gray-700" }) => 
    (
    <div className="flex items-center gap-2">
        <div className="text-gray-400 flex-shrink-0">{React.cloneElement(icon, { size: 16 })}</div>
        <div>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className={`text-sm font-medium ${valueClassName}`}>{value}</p>
        </div>
    </div>
);
const PriorityInfo = ({ priority }) =>
     {
    const styles = { High: "text-red-600", Medium: "text-orange-500", Low: "text-green-600" };
    return <InfoItem icon={<FiAlertTriangle />} label="Priority" value={priority} valueClassName={`${styles[priority] || 'text-gray-700'} font-semibold`} />;
};

export default ComplaintModal;