import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Complaints() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [summaries, setSummaries] = useState({});
  const [myVotes, setMyVotes] = useState({});
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    api("/complaints", { token })
      .then((data) => mounted && setItems(data))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [token]);

  useEffect(() => setPhotoIndex(0), [selected?._id]);

  const remove = async (id) => {
    try {
      setBusy(true);
      await api(`/complaints/${id}`, { method: "DELETE", token });
      setItems((prev) => prev.filter((x) => x._id !== id));
      setSelected(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const canDelete = (c) => user && c && String(c.user_id) === String(user.id);
  const canUpdateStatus = () =>
    user && (user.role === "admin" || user.role === "volunteer");

  const updateStatus = async (c, nextStatus) => {
    if (!c || !nextStatus) return;
    try {
      setStatusBusy(c._id);
      const body = { status: nextStatus };
      if (user && user.name) body.assigned_to = user.name;
      const updated = await api(`/complaints/${c._id}/status`, {
        method: "PATCH",
        token,
        body,
      });
      setItems((prev) =>
        prev.map((x) => (x._id === updated._id ? updated : x))
      );
      if (selected && selected._id === c._id) setSelected(updated);
    } catch (e) {
      alert(e.message);
    } finally {
      setStatusBusy(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadExtras = async () => {
      try {
        const entries = await Promise.all(
          items.map(async (c) => {
            try {
              const [v, comments] = await Promise.all([
                api(`/votes/${c._id}/summary`, { token }),
                api(`/comments/${c._id}`, { token }),
              ]);
              return [
                c._id,
                {
                  up: v.up || 0,
                  down: v.down || 0,
                  comments: Array.isArray(comments) ? comments.length : 0,
                },
              ];
            } catch {
              return [c._id, { up: 0, down: 0, comments: 0 }];
            }
          })
        );
        if (!mounted) return;
        const next = {};
        for (const [id, v] of entries) next[id] = v;
        setSummaries(next);
      } catch {}
    };
    if (items.length) loadExtras();
    return () => (mounted = false);
  }, [items, token]);

  const toggleVote = async (c, type) => {
    if (!c) return;
    try {
      const current = myVotes[c._id] || null;
      const nextType = current === type ? null : type;
      await api(`/votes/${c._id}`, {
        method: "POST",
        token,
        body: { vote_type: nextType },
      });
      setMyVotes((prev) => ({ ...prev, [c._id]: nextType }));
      setSummaries((prev) => {
        const s = prev[c._id] || { up: 0, down: 0, comments: 0 };
        let { up, down } = s;
        if (current === "up") up = Math.max(0, up - 1);
        if (current === "down") down = Math.max(0, down - 1);
        if (nextType === "up") up += 1;
        if (nextType === "down") down += 1;
        return { ...prev, [c._id]: { ...s, up, down } };
      });
    } catch (e) {
      alert(e.message);
    }
  };

  const loadComments = async (c) => {
    setComments([]);
    setCommentsLoading(true);
    try {
      const list = await api(`/comments/${c._id}`, { token });
      setComments(Array.isArray(list) ? list : []);
    } catch {
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    const content = (commentText || "").trim();
    if (!selected || !content) return;
    try {
      setCommentBusy(true);
      const created = await api(`/comments/${selected._id}`, {
        method: "POST",
        token,
        body: { content },
      });
      setComments((prev) => [...prev, created]);
      setCommentText("");
      setSummaries((prev) => {
        const s = prev[selected._id] || { up: 0, down: 0, comments: 0 };
        return {
          ...prev,
          [selected._id]: { ...s, comments: (s.comments || 0) + 1 },
        };
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setCommentBusy(false);
    }
  };

  const canDeleteComment = (com) =>
    user && (String(com.user_id) === String(user.id) || user.role === "admin");

  const removeComment = async (com) => {
    if (!com || !com._id) return;
    try {
      setCommentBusy(true);
      await api(`/comments/${com._id}`, { method: "DELETE", token });
      setComments((prev) => prev.filter((x) => x._id !== com._id));
      setSummaries((prev) => {
        const s = prev[selected._id] || { up: 0, down: 0, comments: 0 };
        return {
          ...prev,
          [selected._id]: {
            ...s,
            comments: Math.max(0, (s.comments || 0) - 1),
          },
        };
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setCommentBusy(false);
    }
  };

  const timeAgo = (iso) => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const progressFromStatus = (status) => {
    if (status === "received") return 25;
    if (status === "in_review") return 60;
    if (status === "resolved") return 100;
    return 0;
  };

  return (
    <section className="max-w-6xl mx-auto px-3 py-5">
      <h1 className="text-xl font-semibold mb-4">All Complaints</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((c) => {
            const s = summaries[c._id] || { up: 0, down: 0, comments: 0 };
            const progress = progressFromStatus(c.status);
            return (
              <div
                key={c._id}
                className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {c.photos && c.photos.length > 0 ? (
                  <img
                    src={c.photos[0]}
                    alt={c.title}
                    className="w-full h-28 object-contain"
                  />
                ) : (
                  <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                    No Image
                  </div>
                )}
                <div className="p-3">
                  <div className="flex justify-between items-center">
                    {canUpdateStatus() ? (
                      <select
                        className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700"
                        value={c.status}
                        disabled={statusBusy === c._id}
                        onChange={(e) => updateStatus(c, e.target.value)}
                      >
                        <option value="received">Received</option>
                        <option value="in_review">In Review</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    ) : (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {prettyStatus(c.status)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mt-2 text-sm">
                    {c.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {c.description}
                  </p>
                  {c.address && (
                    <p className="text-xs text-gray-500 mt-1">📍 {c.address}</p>
                  )}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Progress: {progress}%
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        className={`px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${
                          myVotes[c._id] === "up"
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200"
                        }`}
                        onClick={() => toggleVote(c, "up")}
                      >
                        👍 {s.up}
                      </button>
                      <button
                        className={`px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${
                          myVotes[c._id] === "down"
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200"
                        }`}
                        onClick={() => toggleVote(c, "down")}
                      >
                        👎 {s.down}
                      </button>
                      <button className="px-2 py-0.5 text-xs rounded border border-gray-200">
                        💬 {s.comments}
                      </button>
                    </div>
                    <button
                      className="text-blue-600 text-xs font-medium hover:underline"
                      onClick={() => {
                        setSelected(c);
                        loadComments(c);
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* View Modal with Comments */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !busy && setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col"
          >
            {selected.photos && selected.photos.length > 0 && (
              <img
                src={selected.photos[photoIndex]}
                alt="complaint"
                className="w-full h-44 object-contain"
              />
            )}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <h2 className="text-lg font-semibold">{selected.title}</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selected.description}
              </p>
              {selected.address && (
                <p className="text-xs text-gray-500">📍 {selected.address}</p>
              )}
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${progressFromStatus(selected.status)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Progress: {progressFromStatus(selected.status)}%
                </p>
              </div>

              {/* Comments Section */}
              <div className="mt-3 border-t pt-3">
                <h3 className="text-sm font-semibold mb-2">Comments</h3>
                {commentsLoading ? (
                  <p className="text-xs text-gray-500">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-gray-500">No comments yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {comments.map((com) => (
                      <li key={com._id} className="border-b pb-1">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-700">{com.content}</p>
                          {canDeleteComment(com) && (
                            <button
                              onClick={() => removeComment(com)}
                              disabled={commentBusy}
                              className="text-[10px] text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {timeAgo(com.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1 text-xs"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={submitComment}
                    disabled={commentBusy}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-between">
              {canDelete(selected) && (
                <button
                  className="text-red-500 text-xs"
                  disabled={busy}
                  onClick={() => remove(selected._id)}
                >
                  Delete
                </button>
              )}
              <button
                className="px-4 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function prettyStatus(s) {
  if (s === "in_review") return "In Review";
  return s ? s[0].toUpperCase() + s.slice(1).replace("_", " ") : "";
}
