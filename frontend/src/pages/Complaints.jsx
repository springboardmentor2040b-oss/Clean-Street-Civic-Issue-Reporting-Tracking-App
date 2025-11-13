import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, fetchComments, postComment, reactComment } from "../api/client";

export default function Complaints() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Filters
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userLocations, setUserLocations] = useState([]); // registered locations (admin only fetch)
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [summaries, setSummaries] = useState({});
  const [myVotes, setMyVotes] = useState({});
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentFile, setCommentFile] = useState(null);
  const fileInputRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null); // parent comment id
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    api("/complaints", { token })
      .then((data) => {
        if (!mounted) return;
        setItems(data);
        // Default location filter to user's registered location if available
        if (user?.location) {
          setLocationFilter((user.location || "").trim().toLowerCase());
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [token]);

  // Load registered user locations for admins (to mirror User Management filters)
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (user?.role !== "admin") return; // listing users is admin-only
        const list = await api("/users", { token });
        if (!mounted) return;
        const locs = Array.from(
          new Set(
            (list || [])
              .map((u) => (u.location || "").trim())
              .filter(Boolean)
              .map((s) => s.toLowerCase())
          )
        ).sort();
        setUserLocations(locs);
      } catch {
        // ignore if not allowed
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [token, user?.role]);

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
  // In the general view, only admins can change status
  const canUpdateStatus = () => user && user.role === "admin";

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
      const list = await fetchComments(c._id, token);
      setComments(Array.isArray(list) ? list : []);
    } catch {
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    const content = (commentText || "").trim();
    if (!selected || (!content && !commentFile)) return;
    try {
      setCommentBusy(true);
      const created = await postComment({
        complaintId: selected._id,
        token,
        content,
        parentId: replyTo,
        file: commentFile,
      });
      setComments((prev) => [...prev, created]);
      setCommentText("");
      setCommentFile(null);
      // clear native file input element if present
      if (fileInputRef.current) fileInputRef.current.value = "";
      setReplyTo(null);
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

  const toggleReact = async (comment, type) => {
    if (!comment) return;
    try {
      const currentLike = comment.myLike;
      const currentDislike = comment.myDislike;
      const nextAction =
        type === "like"
          ? currentLike
            ? null
            : "like"
          : currentDislike
          ? null
          : "dislike";
      await reactComment(comment._id, nextAction, token);
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== comment._id) return c;
          let likeCount = c.likeCount || 0;
          let dislikeCount = c.dislikeCount || 0;
          let myLike = c.myLike || false;
          let myDislike = c.myDislike || false;
          // remove previous
          if (myLike) likeCount = Math.max(0, likeCount - 1);
          if (myDislike) dislikeCount = Math.max(0, dislikeCount - 1);
          // apply new
          if (nextAction === "like") {
            likeCount += 1;
            myLike = true;
            myDislike = false;
          } else if (nextAction === "dislike") {
            dislikeCount += 1;
            myLike = false;
            myDislike = true;
          } else {
            myLike = false;
            myDislike = false;
          }
          return { ...c, likeCount, dislikeCount, myLike, myDislike };
        })
      );
    } catch (e) {
      /* ignore temporary errors */
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

  // Helpers: get city-like token from address and classify complaint category
  const cityFromAddress = (addr = "") => {
    const s = (addr || "").trim();
    if (!s) return "";
    const parts = s
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : s;
    // normalize
    return last.toLowerCase();
  };

  const CATEGORY_PATTERNS = [
    {
      key: "illegal_parking",
      label: "Illegal parking",
      patterns: [
        /illegal\s*parking|no\s*parking|double\s*parking|encroach(ed|ment).*parking|vehicle\s*blocking|blocked\s*road.*(car|bike)/i,
      ],
    },
    {
      key: "water_logging",
      label: "Water logging",
      patterns: [
        /water\s*logging|waterlogging|standing\s*water|water\s*stagnant|flood(ed)?|drainage\s*blocked/i,
      ],
    },
    {
      key: "garbage",
      label: "Garbage",
      patterns: [
        /garbage|trash|litter|waste|dumping|dumped|dustbin|bin\s*overflow|unclean|filth/i,
      ],
    },
    {
      key: "pothole",
      label: "Pothole",
      patterns: [
        /pothole|road\s*hole|uneven\s*road|crater|broken\s*road|damaged\s*road/i,
      ],
    },
    {
      key: "light",
      label: "Light",
      patterns: [
        /street\s?light|streetlight|lamp|lighting|light\s*(out|down|broken)|bulb|pole\s*light/i,
      ],
    },
  ];

  const classifyType = (c) => {
    const text = `${c?.title || ""} ${c?.description || ""}`;
    for (const cat of CATEGORY_PATTERNS) {
      if (cat.patterns.some((rx) => rx.test(text))) return cat.label;
    }
    return "Other";
  };

  const userLocNorm = (user?.location || "").trim().toLowerCase();
  const fallbackLocs = Array.from(
    new Set(items.map((it) => cityFromAddress(it.address)).filter(Boolean))
  );
  const baseLocs =
    userLocations && userLocations.length ? userLocations : fallbackLocs;
  const distinctLocations = Array.from(
    new Set([...baseLocs, ...(userLocNorm ? [userLocNorm] : [])])
  ).sort();
  const distinctTypes = Array.from(
    new Set(items.map((it) => classifyType(it)).filter(Boolean))
  ).sort((a, b) =>
    a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)
  );

  const filteredItems = items.filter((c) => {
    const city = cityFromAddress(c.address);
    const type = classifyType(c);
    const okLoc = locationFilter === "all" ? true : city === locationFilter;
    const okType = typeFilter === "all" ? true : type === typeFilter;
    return okLoc && okType;
  });

  return (
    <section className="max-w-6xl mx-auto px-3 py-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-xl font-semibold">All Complaints</h1>
        {/* Filters on the right */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="text-gray-600 flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
            >
              <path
                d="M3 4h18l-7 8v6l-4 2v-8L3 4z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="inline-block">Filters:</span>
          </div>
          {/* Location */}
          <select
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {distinctLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc.charAt(0).toUpperCase() + loc.slice(1)}
              </option>
            ))}
          </select>
          {/* Type */}
          <select
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Assignments</option>
            {distinctTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setLocationFilter("all");
              setTypeFilter("all");
            }}
            className="text-indigo-600 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((c) => {
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
              <div className="relative w-full h-56 bg-gray-50 flex items-center justify-center">
                <img
                  src={selected.photos[photoIndex]}
                  alt="complaint"
                  className="max-h-full max-w-full object-contain"
                />
                {selected.photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow"
                      onClick={() =>
                        setPhotoIndex(
                          (i) =>
                            (i - 1 + selected.photos.length) %
                            selected.photos.length
                        )
                      }
                      aria-label="Previous image"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                      >
                        <path
                          d="M15 18l-6-6 6-6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow"
                      onClick={() =>
                        setPhotoIndex((i) => (i + 1) % selected.photos.length)
                      }
                      aria-label="Next image"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                      >
                        <path
                          d="M9 6l6 6-6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] px-2 py-0.5 rounded bg-black/60 text-white">
                      {photoIndex + 1} / {selected.photos.length}
                    </div>
                  </>
                )}
              </div>
            )}
            {selected.photos && selected.photos.length > 1 && (
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {selected.photos.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      className={`flex-shrink-0 w-16 h-12 rounded border ${
                        idx === photoIndex
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200"
                      } bg-white overflow-hidden`}
                      onClick={() => setPhotoIndex(idx)}
                      aria-label={`Show image ${idx + 1}`}
                    >
                      <img
                        src={url}
                        alt="thumb"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
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
                  <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {comments.map((com) => (
                      <li
                        key={com._id}
                        className={`rounded-lg border border-gray-200 bg-gray-50 p-3 ${
                          com.parent_id ? "ml-8" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-semibold">
                            {com.author?.name
                              ? com.author.name.slice(0, 2).toUpperCase()
                              : "US"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-semibold">
                                {com.author?.name || "User"}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {timeAgo(com.created_at)}
                              </div>
                            </div>
                            {com.content && (
                              <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-wrap">
                                {com.content}
                              </p>
                            )}
                            {com.photo_url && (
                              <div className="mt-2">
                                <img
                                  src={com.photo_url}
                                  alt="comment"
                                  className="max-h-48 rounded-md border border-gray-200"
                                />
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-600">
                              <button
                                onClick={() => toggleReact(com, "like")}
                                className={`inline-flex items-center gap-1 ${
                                  com.myLike ? "text-gray-900 font-medium" : ""
                                }`}
                              >
                                👍 <span>{com.likeCount || 0}</span>
                              </button>
                              <button
                                onClick={() => toggleReact(com, "dislike")}
                                className={`inline-flex items-center gap-1 ${
                                  com.myDislike
                                    ? "text-gray-900 font-medium"
                                    : ""
                                }`}
                              >
                                👎 <span>{com.dislikeCount || 0}</span>
                              </button>
                              <button
                                onClick={() => setReplyTo(com._id)}
                                className="hover:underline"
                              >
                                Reply
                              </button>
                              {canDeleteComment(com) && (
                                <button
                                  onClick={() => removeComment(com)}
                                  className="text-red-500 hover:underline"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  {replyTo && (
                    <div className="mb-2 text-[11px] text-gray-600">
                      Replying to a comment •{" "}
                      <button
                        className="underline"
                        onClick={() => setReplyTo(null)}
                      >
                        cancel
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 border rounded px-2 py-2 text-xs"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCommentFile(e.target.files?.[0] || null)
                      }
                      className="text-[10px]"
                    />
                    <button
                      className="px-3 py-2 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50"
                      onClick={submitComment}
                      disabled={commentBusy}
                    >
                      Post
                    </button>
                  </div>
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
