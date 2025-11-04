import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Profile() {
  const { token, user, logout, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    bio: "",
    profile_photo: "",
  });
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");
  const [pwd, setPwd] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [pwdMsg, setPwdMsg] = useState("");
  const fileInputRef = useRef(null);
  const [showPwd, setShowPwd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getInitials = () => {
    const source = (form.name || user?.name || user?.email || "").trim();
    if (!source) return "U";
    // Prefer name words, else use email prefix
    const base = source.includes("@") ? source.split("@")[0] : source;
    const parts = base.split(/\s+/).filter(Boolean);
    const letters =
      (parts[0]?.[0] || "") + (parts[1]?.[0] || parts[0]?.[1] || "");
    return letters.toUpperCase();
  };

  useEffect(() => {
    if (user)
      setForm({
        name: user.name || "",
        location: user.location || "",
        phone: user.phone || "",
        bio: user.bio || "",
        profile_photo: user.profile_photo || "",
      });
  }, [user]);

  // Ensure we have full user (with createdAt) for "Member since"
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!token) return;
      try {
        const me = await api("/users/me", { token });
        if (!ignore) updateUser(me);
      } catch {
        /* ignore */
      }
    };
    if (!user?.createdAt) load();
    return () => {
      ignore = true;
    };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setOk("");
    try {
      const { name, location, phone, bio, profile_photo } = form;
      const updated = await api("/users/me", {
        method: "PUT",
        token,
        body: { name, location, phone, bio, profile_photo },
      });
      setOk("Saved");
      updateUser(updated);
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () =>
    setForm({
      name: user?.name || "",
      location: user?.location || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      profile_photo: user?.profile_photo || "",
    });

  const onCancel = () => {
    resetForm();
    setIsEditing(false);
    setOk("");
  };

  const onPickFile = () => fileInputRef.current?.click();
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await api("/users/me/photo", {
        method: "POST",
        token,
        body: fd,
      });
      setForm((f) => ({ ...f, profile_photo: res.url }));
      updateUser(res.user);
      setOk("Photo updated");
    } catch (err) {
      alert(err.message);
    } finally {
      e.target.value = "";
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    if (pwd.new_password !== pwd.confirm) {
      setPwdMsg("Passwords do not match");
      return;
    }
    try {
      const res = await api("/users/change", {
        method: "POST",
        token,
        body: {
          current_password: pwd.current_password,
          new_password: pwd.new_password,
        },
      });
      setPwdMsg(res.message || "Password updated");
      setPwd({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPwdMsg(err.message);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[320px,1fr] gap-6">
      {/* Left card: Profile summary + avatar uploader */}
      <aside className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            {form.profile_photo ? (
              <img
                src={form.profile_photo}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="w-24 h-24 rounded-full ring-2 ring-white shadow bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-2xl select-none">
                {getInitials()}
              </div>
            )}
            <button
              type="button"
              onClick={onPickFile}
              className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-50"
              title="Change photo"
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
          <div>
            <div className="font-display text-xl">
              {form.name || "Your Name"}
            </div>
            <div className="text-sm text-gray-500">
              {user?.email ? `@${user.email.split("@")[0]}` : "@username"}
            </div>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Citizen
            </span>
          </div>
          <p className="text-sm text-gray-600 max-w-xs">
            {form.bio ||
              "Active citizen helping to improve our community through CleanStreet reporting."}
          </p>
          <div className="text-xs text-gray-500">
            Member since{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-display">Security Settings</h3>
          <button
            className="btn btn-ghost w-full"
            onClick={() => setShowPwd((s) => !s)}
          >
            🔒 Change Password
          </button>
          <button className="btn btn-ghost w-full">⚙️ Privacy Setting</button>
        </div>
        <button onClick={logout} className="btn btn-ghost w-full">
          Sign out
        </button>
      </aside>

      {/* Right card: Account Information form */}
      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-display">Account Information</h1>
            <p className="text-sm text-gray-500">
              Update your personal details
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit
            </button>
          )}
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {ok && <div className="text-green-600 text-sm">{ok}</div>}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Username</label>
              <input
                className="input bg-gray-100"
                value={user?.email ? user.email.split("@")[0] : ""}
                disabled
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Email</label>
              <input
                className="input bg-gray-100"
                value={user?.email || ""}
                disabled
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Full Name</label>
              <input
                className={`input ${!isEditing ? "bg-gray-100" : ""}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Phone Number</label>
              <input
                className={`input ${!isEditing ? "bg-gray-100" : ""}`}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm">Location</label>
              <input
                className={`input ${!isEditing ? "bg-gray-100" : ""}`}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm">Bio</label>
            <textarea
              className={`input min-h-[96px] ${
                !isEditing ? "bg-gray-100" : ""
              }`}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={!isEditing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !isEditing}
            >
              {saving ? "Saving…" : "Save Change"}
            </button>
          </div>
        </form>

        {showPwd && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-display mb-2">Change Password</h2>
            <form className="space-y-3" onSubmit={changePassword}>
              {pwdMsg && (
                <div
                  className={`text-sm ${
                    pwdMsg.includes("updated")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {pwdMsg}
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-sm">Current Password</label>
                  <input
                    className="input"
                    type="password"
                    value={pwd.current_password}
                    onChange={(e) =>
                      setPwd({ ...pwd, current_password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">New Password</label>
                  <input
                    className="input"
                    type="password"
                    value={pwd.new_password}
                    onChange={(e) =>
                      setPwd({ ...pwd, new_password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">
                    Confirm New Password
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={pwd.confirm}
                    onChange={(e) =>
                      setPwd({ ...pwd, confirm: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
