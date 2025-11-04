import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Dashboard() {
  const { token } = useAuth();
  const [items, setItems] = useState([]); // recent activity (global)
  const [all, setAll] = useState([]); // all complaints for global stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api("/complaints/recent", { token }),
      api("/complaints", { token }),
    ])
      .then(([recent, all]) => {
        if (!mounted) return;
        setItems(recent);
        setAll(all);
      })
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [token]);

  const counts = useMemo(() => {
    const src = all.length ? all : items;
    return {
      total: src.length,
      pending: src.filter((i) => i.status === "received").length,
      in_progress: src.filter((i) => i.status === "in_review").length,
      resolved: src.filter((i) => i.status === "resolved").length,
    };
  }, [all, items]);

  return (
    <section className="w-full max-w-none mx-auto px-6 md:px-10 py-6">
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <>
          {/* Top stats row (card style to match screenshot) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon="⚠️" value={counts.total} label="Total Issues" />
            <StatCard icon="⏳" value={counts.pending} label="Pending" />
            <StatCard
              icon="🔄"
              value={counts.in_progress}
              label="In Progress"
            />
            <StatCard icon="✅" value={counts.resolved} label="Resolved" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
            {/* Activity card */}
            <div className="rounded-2xl border border-gray-200 shadow-sm bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-medium">Activity</h2>
                <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-md px-2 py-0.5">
                  Live Updates
                </span>
              </div>
              <ul className="divide-y divide-gray-100">
                {items.map((i) => (
                  <li
                    key={i._id}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                        👤
                      </div>
                      <div>
                        <p className="font-medium">{i.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(i.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <StatusIcon status={i.status} />
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="px-4 py-6 text-center text-gray-500">
                    No complaints yet.
                  </li>
                )}
              </ul>
            </div>

            <aside className="space-y-4">
              {/* Quick Action */}
              <div className="rounded-2xl border border-gray-200 p-4 bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
                <h3 className="font-medium mb-2">Quick Action</h3>
                <div className="space-y-2">
                  <a href="/report" className="btn btn-primary w-full">
                    <span className="inline-flex items-center gap-3">
                      <PlusIcon className="w-4 h-4 text-white" />
                      Report New Issue
                    </span>
                  </a>
                  <a href="/complaints" className="btn btn-ghost w-full">
                    <span className="inline-flex items-center gap-3">
                      <ListIcon className="w-4 h-4 text-gray-500" />
                      View All Complaints
                    </span>
                  </a>
                </div>
              </div>
              {/* Support Team */}
              <div className="rounded-2xl border border-gray-200 p-4 bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
                <h3 className="font-medium mb-1">Support Team</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <span className="w-6 h-6 rounded-full bg-green-50 text-green-700 flex items-center justify-center border border-green-200">
                    ✓
                  </span>
                  <div>
                    <div>Clean Street Support</div>
                    <div className="text-xs text-gray-500">Available 24/7</div>
                  </div>
                </div>
                <button className="btn btn-ghost w-full">
                  Contact Support
                </button>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white shadow-sm p-4 md:p-6 min-h-[120px] md:min-h-[140px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
      <div className="flex flex-col items-center justify-center text-center h-full">
        <div className="text-2xl md:text-3xl text-gray-700 mb-2 transition-transform duration-200 group-hover:scale-110">{icon}</div>
        <div className="text-2xl md:text-3xl font-semibold leading-none transition-transform duration-200 group-hover:scale-[1.03]">
          {value}
        </div>
        <div className="text-xs md:text-sm text-gray-500 mt-2">{label}</div>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "resolved") {
    return (
      <span title="Resolved" className="text-green-600">
        ✔️
      </span>
    );
  }
  if (status === "in_review") {
    return (
      <span title="In progress" className="text-blue-600">
        ℹ️
      </span>
    );
  }
  // received / pending
  return (
    <span title="Pending" className="text-amber-600">
      ⚠️
    </span>
  );
}

function ListIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function PlusIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
