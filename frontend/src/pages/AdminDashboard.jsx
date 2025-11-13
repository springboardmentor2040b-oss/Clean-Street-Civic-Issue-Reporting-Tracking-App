import { useEffect, useMemo, useState, useRef } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useAuth } from '../context/AuthContext'
import { api, fetchAdminLogs } from '../api/client'

export default function AdminDashboard() {
  const { token } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview') // 'overview' | 'reports' | 'users' | 'activities'
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const reportRef = useRef(null)

  const handleDownloadReport = async () => {
    try {
      const node = reportRef.current
      if (!node) return
      // Ensure charts are fully rendered
      await new Promise(r => setTimeout(r, 50))

      // Temporarily expand the scroll container so the full Reports content is captured
      const prev = { overflow: node.style.overflow, height: node.style.height }
      node.style.overflow = 'visible'
      node.style.height = 'auto'

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
        width: node.scrollWidth,
        height: node.scrollHeight
      })

      // Restore previous styles
      node.style.overflow = prev.overflow
      node.style.height = prev.height
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgProps = { width: canvas.width, height: canvas.height }
      const imgPdfWidth = pdfWidth
      const imgPdfHeight = (imgProps.height * imgPdfWidth) / imgProps.width
      let position = 0
      let heightLeft = imgPdfHeight

      pdf.addImage(imgData, 'PNG', 0, position, imgPdfWidth, imgPdfHeight)
      heightLeft -= pdfHeight
      while (heightLeft > 0) {
        position = heightLeft - imgPdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgPdfWidth, imgPdfHeight)
        heightLeft -= pdfHeight
      }
      const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
      pdf.save(`clean-street-report-${stamp}.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF', err)
      alert('Could not generate PDF. Please try again.')
    }
  }

  useEffect(() => {
    let mounted = true
    Promise.all([
      api('/complaints', { token }),
      api('/users', { token })
    ])
      .then(([allComplaints, allUsers]) => {
        if (!mounted) return
        setComplaints(allComplaints)
        setUsers(allUsers)
      })
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false))
    return () => (mounted = false)
  }, [token])

  // Lightweight polling to keep reports up-to-date while viewing the Reports tab
  useEffect(() => {
    if (tab !== 'reports') return
    let canceled = false
    async function refresh() {
      try {
        const [allComplaints, allUsers] = await Promise.all([
          api('/complaints', { token }),
          api('/users', { token })
        ])
        if (canceled) return
        setComplaints(allComplaints)
        setUsers(allUsers)
      } catch (e) {
        console.error(e)
      }
    }
    refresh()
    const id = setInterval(refresh, 30000)
    return () => { canceled = true; clearInterval(id) }
  }, [tab, token])

  const loadLogs = async () => {
    try {
      setLogsLoading(true)
      const data = await fetchAdminLogs(token)
      setLogs(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLogsLoading(false)
    }
  }

  // Load logs when switching to activities tab first time
  useEffect(() => {
    if (tab === 'activities' && logs.length === 0 && !logsLoading) {
      loadLogs()
    }
  }, [tab])

  const metrics = useMemo(() => {
    const total = complaints.length
    const pending = complaints.filter(c => c.status === 'received').length
    const inReview = complaints.filter(c => c.status === 'in_review').length
    const resolved = complaints.filter(c => c.status === 'resolved').length
    const today = new Date()
    const resolvedToday = complaints.filter(c => c.status === 'resolved' && c.updated_at && sameDay(new Date(c.updated_at), today)).length
    return { total, pending, users: users.length, resolvedToday, inReview, resolved }
  }, [complaints, users])

  return (
    <section className="w-full max-w-none mx-0 px-3 md:px-4 lg:px-6 py-6 min-h-[calc(100vh-80px)] md:h-[calc(100vh-80px)] md:overflow-hidden grid grid-cols-1 md:grid-cols-[220px,1fr] gap-6">
      {/* Left Sidebar */}
      <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 md:p-4 h-full md:self-stretch">
        <div className="text-sm font-semibold text-gray-700 mb-3">Admin Panel</div>
        <nav className="space-y-1 text-sm">
          <button type="button" onClick={() => setTab('overview')} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg ${tab==='overview' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
            <SidebarOverviewIcon className="w-4 h-4" />
            Overview
          </button>
          <a href="/complaints" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
            <SidebarManageIcon className="w-4 h-4" />
            Manage Complaints
          </a>
          <button type="button" onClick={() => setTab('users')} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg ${tab==='users' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
            <SidebarUsersIcon className="w-4 h-4" />
            Users
          </button>
          <button type="button" onClick={() => setTab('reports')} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg ${tab==='reports' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
            <SidebarReportIcon className="w-4 h-4" />
            Reports
          </button>
          <button type="button" onClick={() => setTab('activities')} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg ${tab==='activities' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
            <SidebarLogsIcon className="w-4 h-4" />
            Recent Activities
          </button>
        </nav>
      </aside>

      {/* Main content */}
  <div className="md:flex md:flex-col md:h-full md:overflow-hidden">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-display">{
            tab === 'overview' ? 'System Overview'
            : tab === 'reports' ? 'Reports'
            : tab === 'users' ? 'User Management'
            : tab === 'activities' ? 'Recent Activities'
            : 'Reports'
          }</h2>
          {tab === 'reports' && (
            <button type="button" onClick={handleDownloadReport} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50">
              <span>Download PDF</span>
            </button>
          )}
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <>
            {tab === 'overview' ? (
              <div className="md:flex-1 md:overflow-y-auto md:pr-2">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  <AdminStat icon={<DotsIcon/>} value={metrics.total} label="Total Complaints" />
                  <AdminStat icon={<PeopleIcon/>} value={metrics.inReview} label="Pending Review" />
                  <AdminStat icon={<BarIcon/>} value={metrics.users} label="Active Users" />
                  <AdminStat icon={<CheckIcon/>} value={metrics.resolvedToday} label="Resolved Today" />
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 min-h-[260px] flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-100">
                  <h3 className="font-medium mb-2">Community Impact</h3>
                  <p className="text-base text-gray-600 leading-relaxed">Thanks to citizen reports and community engagement, we&apos;re improving city cleanliness every day.</p>
                  <div className="mt-8">
                    <a href="/complaints" className="btn btn-ghost px-5 py-2 text-base">View All Complaints</a>
                  </div>
                </div>
              </div>
            ) : tab === 'reports' ? (
              <div ref={reportRef} className="md:flex-1 md:overflow-y-auto md:pr-2">
                <ReportsSection metrics={metrics} complaints={complaints} users={users} />
              </div>
            ) : tab === 'users' ? (
              <div className="md:flex-1 md:overflow-y-auto md:pr-2">
                <UsersSection users={users} token={token} onUserUpdated={(u) => setUsers(prev => prev.map(x => x._id === u._id ? u : x))} />
              </div>
            ) : tab === 'activities' ? (
              <div className="md:flex-1 md:overflow-y-auto md:pr-2">
                <RecentActivitiesSection logs={logs} loading={logsLoading} onRefresh={() => loadLogs()} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Reusable date-time formatter for tables
function formatDateTime(d) {
  if (!d) return '-'
  const date = new Date(d)
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function AdminStat({ icon, value, label }) {
  const formatted = typeof value === 'number' ? value.toLocaleString() : value
  return (
    <div className="group rounded-2xl ring-1 ring-gray-100 bg-white shadow-sm p-8 min-h-[220px] flex flex-col items-center justify-center text-center bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_60%)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-blue-100">
      <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 flex items-center justify-center mb-3 transition-colors duration-200 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600">
        {icon}
      </div>
      <div className="text-4xl font-semibold leading-tight transition-transform duration-200 group-hover:scale-105">{formatted}</div>
      <div className="text-base text-gray-500 mt-1 group-hover:text-gray-700">{label}</div>
    </div>
  )
}

function DotsIcon({ className = 'w-5 h-5' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>) }
function PeopleIcon({ className = 'w-5 h-5' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>) }
function BarIcon({ className = 'w-5 h-5' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round"><path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="7" /><rect x="12" y="6" width="3" height="11" /><rect x="17" y="13" width="3" height="4" /></svg>) }
function CheckIcon({ className = 'w-5 h-5' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>) }

// Sidebar icons
function SidebarOverviewIcon({ className = 'w-4 h-4' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round"><path d="M3 4h18" /><rect x="3" y="7" width="18" height="6" rx="1" /><path d="M7 18h10" /></svg>) }
function SidebarManageIcon({ className = 'w-4 h-4' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round"><path d="M3 7h18" /><path d="M3 12h18" /><path d="M3 17h18" /></svg>) }
function SidebarUsersIcon({ className = 'w-4 h-4' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3" /></svg>) }
function SidebarReportIcon({ className = 'w-4 h-4' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></svg>) }
function SidebarLogsIcon({ className = 'w-4 h-4' }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h18" /><path d="M3 9h12" /><path d="M3 14h18" /><path d="M3 19h12" /><circle cx="19" cy="9" r="1.5" /><circle cx="19" cy="19" r="1.5" /></svg>) }

// Reports section with simple SVG/CSS charts
function ReportsSection({ metrics, complaints = [], users = [] }) {
  // Helpers: date ranges
  const today = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysAgo = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
  const formatDayShort = (d) => d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
  const [hoverStatus, setHoverStatus] = useState(null);
  const [hoverRole, setHoverRole] = useState(null);

  // Complaints - last 7 days
  const last7Labels = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
  const complaintsByDay = last7Labels.map(d => {
    const s = startOfDay(d).getTime();
    const e = s + 24*60*60*1000;
    return complaints.filter(c => {
      const t = c.created_at ? new Date(c.created_at).getTime() : 0;
      return t >= s && t < e;
    }).length;
  });

  // User registrations - last 30 days
  const last30Labels = Array.from({ length: 30 }, (_, i) => daysAgo(29 - i));
  const registrationsByDay = last30Labels.map(d => {
    const s = startOfDay(d).getTime();
    const e = s + 24*60*60*1000;
    return users.filter(u => {
      const t = u.createdAt ? new Date(u.createdAt).getTime() : 0;
      return t >= s && t < e;
    }).length;
  });


  //  Top 5 complaint categories (fixed set, ordered) and real-time counts
  const textOf = (c) => `${c.title || ''} ${c.description || ''}`.toLowerCase();
  const CATEGORY_ORDER = [
    { key: 'streetlight', label: 'Streetlight', patterns: [/street\s?light|streetlight|lamp|lighting|light\s(out|down|broken)|bulb|pole\s*light/i] },
    { key: 'pothole', label: 'Pothole', patterns: [/pothole|road\s*hole|uneven\s*road|crater|broken\s*road|damaged\s*road/i] },
    { key: 'garbage', label: 'Garbage', patterns: [/garbage|trash|litter|waste|dumping|dumped|dustbin|bin\s*overflow|unclean|filth/i] },
    { key: 'water_logging', label: 'Water Logging', patterns: [/water\s*logging|waterlogging|water\s*loggging|standing\s*water|water\s*stagnant|flood|flooded|drainage\s*blocked/i] },
    { key: 'illegal_parking', label: 'Illegal Parking', patterns: [/illegal\s*parking|no\s*parking|double\s*parking|encroach(ed|ment).*parking|vehicle\s*blocking|blocked\s*road.*car|bike\s*parked\s*illegally/i] },
  ];
  const counts = CATEGORY_ORDER.map(() => 0);
  for (const c of complaints) {
    const txt = textOf(c);
    let matched = false;
    for (let i = 0; i < CATEGORY_ORDER.length && !matched; i++) {
      const cat = CATEGORY_ORDER[i];
      if (cat.patterns.some(rx => rx.test(txt))) {
        counts[i] += 1;
        matched = true;
      }
    }
  }
  const topTypesPretty = CATEGORY_ORDER.map((cat, i) => ({ label: cat.label, value: counts[i] }));

  // Summary bars from existing metrics and users breakdown
  const countUsers = users.filter(u => u.role === 'user').length;
  const countVolunteers = users.filter(u => u.role === 'volunteer').length;
  const countAdmins = users.filter(u => u.role === 'admin').length;
  const summaryBars = [
    { label: 'Users', value: countUsers, color: 'linear-gradient(180deg,#38bdf8,#0ea5e9)' },
    { label: 'Volunteers', value: countVolunteers, color: 'linear-gradient(180deg,#fb7185,#f43f5e)' },
    { label: 'Total Complaints', value: metrics.total, color: 'linear-gradient(180deg,#22d3ee,#0ea5e9)' },
    { label: 'Pending', value: metrics.inReview + metrics.pending, color: 'linear-gradient(180deg,#fb7185,#f97316)' },
    { label: 'Resolved Today', value: metrics.resolvedToday, color: 'linear-gradient(180deg,#a78bfa,#7c3aed)' }
  ];
  const maxSummary = Math.max(1, ...summaryBars.map(b => b.value));

  // Pie data (reuse existing distributions)
  const statusSlices = [
    { label: 'Received', value: metrics.pending, color: '#60a5fa' },
    { label: 'In Review', value: metrics.inReview, color: '#fbbf24' },
    { label: 'Resolved', value: metrics.resolved, color: '#e879f9' },
  ];
  const totalStatus = Math.max(1, statusSlices.reduce((a,b)=>a+(b.value||0),0));
  let accS = 0;
  const statusGradient = `conic-gradient(from 90deg, ${statusSlices.map(s=>{const from=(accS/totalStatus)*100; accS+=(s.value||0); const to=(accS/totalStatus)*100; return `${s.color} ${from}% ${to}%`;}).join(', ')})`;
  // Build ranges for hover detection on status donut
  let accS2 = 0;
  const statusRanges = statusSlices.map(s => {
    const from = (accS2 / totalStatus);
    accS2 += (s.value || 0);
    const to = (accS2 / totalStatus);
    return { ...s, from, to };
  });

  const roleSlices = [
    { label: 'Users', value: countUsers, color: '#38bdf8' },
    { label: 'Volunteers', value: countVolunteers, color: '#f43f5e' },
    { label: 'Admins', value: countAdmins, color: '#10b981' },
  ];
  const totalRoles = Math.max(1, roleSlices.reduce((a,b)=>a+(b.value||0),0));
  let accR = 0;
  const roleGradient = `conic-gradient(from 90deg, ${roleSlices.map(s=>{const from=(accR/totalRoles)*100; accR+=(s.value||0); const to=(accR/totalRoles)*100; return `${s.color} ${from}% ${to}%`;}).join(', ')})`;
  // Build ranges for hover detection on roles donut
  let accR2 = 0;
  const roleRanges = roleSlices.map(s => {
    const from = (accR2 / totalRoles);
    accR2 += (s.value || 0);
    const to = (accR2 / totalRoles);
    return { ...s, from, to };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Pie charts on top */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h4 className="font-medium mb-4">Complaint Status Distribution</h4>
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative w-[240px] h-[240px]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const dx = e.clientX - cx;
              const dy = e.clientY - cy;
              const r = Math.sqrt(dx*dx + dy*dy);
              const outerR = rect.width / 2;
              const hole = e.currentTarget.querySelector('.donut-hole-status');
              const innerR = hole ? hole.getBoundingClientRect().width / 2 : rect.width * 0.35;
              if (r < innerR || r > outerR) { setHoverStatus(null); return; }
              let angle = Math.atan2(dy, dx) * 180 / Math.PI;
              if (angle < 0) angle += 360;
              const ratio = angle / 360;
              const hit = statusRanges.find((rg, idx) => {
                const last = idx === statusRanges.length - 1;
                return (ratio >= rg.from && ratio < rg.to) || (last && ratio === 1);
              });
              setHoverStatus(hit || null);
            }}
            onMouseLeave={() => setHoverStatus(null)}
          >
            <div className="rounded-full w-full h-full" style={{ background: statusGradient }} />
            <div className="donut-hole-status absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white rounded-full shadow-inner flex items-center justify-center text-center">
              <div className="text-sm text-gray-700">
                {hoverStatus ? (
                  <>
                    <div className="font-medium">{hoverStatus.label}</div>
                    <div className="text-gray-600">{hoverStatus.value}</div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">Total</div>
                    <div className="text-gray-600">{metrics.total}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {statusSlices.map((s) => (
              <li key={s.label} className="flex items-center gap-2" title={`${s.label}: ${s.value}`}>
                <span className="inline-block w-3 h-3 rounded-sm" style={{background:s.color}} />
                <span className="text-gray-700">{s.label}</span>
                <span className="text-gray-500">({s.value})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h4 className="font-medium mb-4">User Roles Distribution</h4>
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative w-[240px] h-[240px]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const dx = e.clientX - cx;
              const dy = e.clientY - cy;
              const r = Math.sqrt(dx*dx + dy*dy);
              const outerR = rect.width / 2;
              const hole = e.currentTarget.querySelector('.donut-hole-roles');
              const innerR = hole ? hole.getBoundingClientRect().width / 2 : rect.width * 0.35;
              if (r < innerR || r > outerR) { setHoverRole(null); return; }
              let angle = Math.atan2(dy, dx) * 180 / Math.PI;
              if (angle < 0) angle += 360;
              const ratio = angle / 360;
              const hit = roleRanges.find((rg, idx) => {
                const last = idx === roleRanges.length - 1;
                return (ratio >= rg.from && ratio < rg.to) || (last && ratio === 1);
              });
              setHoverRole(hit || null);
            }}
            onMouseLeave={() => setHoverRole(null)}
          >
            <div className="rounded-full w-full h-full" style={{ background: roleGradient }} />
            <div className="donut-hole-roles absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white rounded-full shadow-inner flex items-center justify-center text-center">
              <div className="text-sm text-gray-700">
                {hoverRole ? (
                  <>
                    <div className="font-medium">{hoverRole.label}</div>
                    <div className="text-gray-600">{hoverRole.value}</div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">Total Users</div>
                    <div className="text-gray-600">{users.length}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {roleSlices.map((s) => (
              <li key={s.label} className="flex items-center gap-2" title={`${s.label}: ${s.value}`}>
                <span className="inline-block w-3 h-3 rounded-sm" style={{background:s.color}} />
                <span className="text-gray-700">{s.label}</span>
                <span className="text-gray-500">({s.value})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Line: Complaints last 7 days */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h4 className="font-medium mb-4">Complaints (Last 7 Days)</h4>
        <LineChart data={complaintsByDay} labels={last7Labels.map(formatDayShort)} height={160} />
      </div>

      {/* Line: Registrations last 30 days */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h4 className="font-medium mb-4">User Registrations (Last 30 Days)</h4>
        <LineChart data={registrationsByDay} labels={last30Labels.map((d,i)=> (i%5===0? formatDayShort(d): '') )} height={160} dense />
      </div>

      {/* Top 5 complaint types - horizontal pill bars */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h4 className="font-medium mb-4">Top 5 Complaint Types</h4>
        {topTypesPretty.length === 0 ? (
          <p className="text-sm text-gray-500">No complaints to analyze yet.</p>) : (
          <HorizontalBarList items={topTypesPretty} />
        )}
      </div>

      {/* Summary bar chart */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h4 className="font-medium mb-4">Summary</h4>
        <div className="flex items-end justify-around gap-8 h-64 px-4">
          {summaryBars.map((b) => (
            <div key={b.label} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
              <div className="w-20 rounded-md" style={{height:`${(b.value/maxSummary)*100}%`, minHeight: b.value > 0 ? 10 : 0, background: b.color}} title={`${b.label}: ${b.value}`} />
              <div className="text-sm text-center text-gray-600">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Tiny, dependency-free charts
function LineChart({ data = [], labels = [], height = 140, dense = false }) {
  const w = 640; // virtual width for path calculation
  const h = height;
  const max = Math.max(1, ...data);
  const stepX = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = h - (v / max) * (h - 20) - 10; // padding top/bottom
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[160px]">
        <defs>
          <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* area fill */}
        <polyline points={`0,${h} ${points} ${w},${h}`} fill="url(#lc)" stroke="none" />
        {/* line */}
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
        {labels.map((l, i) => (
          <div key={i} className={`text-[10px] text-gray-500 ${dense ? '' : 'truncate'}`}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data = [], labels = [] }) {
  const max = Math.max(1, ...data);
  return (
    <div className="w-full">
      <div className="flex items-end gap-4 h-64">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2">
            <div className="w-full max-w-[80px] rounded-md bg-gradient-to-b from-blue-400 to-blue-600" style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 10 : 0 }} title={`${labels[i]}: ${v}`} />
            <div className="text-[11px] text-center text-gray-600 truncate w-full max-w-[80px]" title={labels[i]}>{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarList({ items = [] }) {
  const max = Math.max(1, ...items.map(i => i.value || 0));
  return (
    <div className="w-full space-y-4">
      {items.map((it, idx) => {
        const percent = Math.round(((it.value || 0) / max) * 100);
        return (
          <div key={idx} className="flex items-center gap-4">
            <div className="w-40 text-sm text-gray-700 truncate" title={it.label}>{it.label}</div>
            <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" style={{ width: `${percent}%` }}>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-semibold grid place-items-center shadow">
                  {it.value}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UsersSection({ users = [], token, onUserUpdated }) {
  const [savingId, setSavingId] = useState(null)
  const [local, setLocal] = useState(users)
  const [editingId, setEditingId] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all') // all | user | volunteer | admin
  const [locationFilter, setLocationFilter] = useState('all')

  useEffect(() => { setLocal(users) }, [users])

  const changeRole = async (id, role) => {
    try {
      setSavingId(id)
      const updated = await api(`/users/${id}/role`, { method: 'PUT', body: { role }, token })
      setLocal(prev => prev.map(u => u._id === id ? updated : u))
      onUserUpdated && onUserUpdated(updated)
      setEditingId(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setSavingId(null)
    }
  }

  const RoleBadge = ({ role }) => {
    const styles = {
      admin: 'bg-red-100 text-red-700',
      volunteer: 'bg-emerald-100 text-emerald-700',
      user: 'bg-blue-100 text-blue-700'
    }[role] || 'bg-gray-100 text-gray-700'
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{role}</span>
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="font-medium">User Management</div>
        <div className="text-sm text-gray-500">Total: {local.length}</div>
      </div>
      {/* Filters */}
      <UsersFilters
        users={local}
        roleFilter={roleFilter}
        locationFilter={locationFilter}
        onChangeRole={setRoleFilter}
        onChangeLocation={setLocationFilter}
        onClear={() => { setRoleFilter('all'); setLocationFilter('all') }}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left font-medium px-6 py-3">Name</th>
              <th className="text-left font-medium px-6 py-3">Email</th>
              <th className="text-left font-medium px-6 py-3">Location</th>
              <th className="text-left font-medium px-6 py-3">Role</th>
              <th className="text-left font-medium px-6 py-3">Joined</th>
              <th className="text-left font-medium px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {local
              .filter(u => roleFilter === 'all' ? true : u.role === roleFilter)
              .filter(u => locationFilter === 'all' ? true : (u.location || '').trim().toLowerCase() === locationFilter)
              .map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{u.name}</td>
                  <td className="px-6 py-3 text-gray-700">{u.email}</td>
                  <td className="px-6 py-3 text-gray-600">{u.location || '-'}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <RoleBadge role={u.role} />
                      {editingId === u._id && (
                        <select
                          className="border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-700 bg-white hover:border-gray-300"
                          value={u.role}
                          onChange={(e) => changeRole(u._id, e.target.value)}
                          disabled={savingId === u._id}
                        >
                          <option value="user">user</option>
                          <option value="volunteer">volunteer</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                      {savingId === u._id && <span className="text-xs text-gray-500">Saving…</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{formatDateTime(u.createdAt)}</td>
                  <td className="px-6 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      onClick={() => setEditingId(editingId === u._id ? null : u._id)}
                      title={editingId === u._id ? 'Close' : 'Edit role'}
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span className="underline text-xs">{editingId === u._id ? 'Close' : 'Edit'}</span>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UsersFilters({ users = [], roleFilter, locationFilter, onChangeRole, onChangeLocation, onClear }) {
  const locations = Array.from(new Set((users || [])
    .map(u => (u.location || '').trim())
    .filter(Boolean)
    .map(s => s.toLowerCase()))).sort()
  const showingCount = (users || [])
    .filter(u => roleFilter === 'all' ? true : u.role === roleFilter)
    .filter(u => locationFilter === 'all' ? true : (u.location || '').trim().toLowerCase() === locationFilter)
    .length

  return (
    <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3 text-sm">
      <div className="text-gray-600 flex items-center gap-2 mr-2">
        <span className="inline-block">Filters:</span>
      </div>
      {/* Location */}
      <select
        className="px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        value={locationFilter}
        onChange={(e) => onChangeLocation(e.target.value)}
      >
        <option value="all">All Locations</option>
        {locations.map(loc => (
          <option key={loc} value={loc}>{capitalize(loc)}</option>
        ))}
      </select>
      {/* Role */}
      <select
        className="px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        value={roleFilter}
        onChange={(e) => onChangeRole(e.target.value)}
      >
        <option value="all">All Roles</option>
        <option value="user">user</option>
        <option value="volunteer">volunteer</option>
        <option value="admin">admin</option>
      </select>
      <button type="button" onClick={onClear} className="text-indigo-600 hover:underline ml-auto">Clear Filters</button>
      <div className="text-xs text-gray-500">Showing {showingCount} of {users.length}</div>
    </div>
  )
}

function capitalize(s='') { return s ? s[0].toUpperCase() + s.slice(1) : s }

function RecentActivitiesSection({ logs = [], loading, onRefresh }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="font-medium">Recent Activities</div>
        <button type="button" onClick={onRefresh} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">Refresh</button>
      </div>
      <div>
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading activities...</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No recent activities yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {logs.map((log) => (
              <li key={log._id} className="px-6 py-3 flex items-start justify-between gap-4">
                <div className="text-sm text-gray-800">
                  {log.actor && (
                    <>
                      <span className="font-medium">{log.actor.name}</span>
                      <span className="text-gray-500"> - </span>
                    </>
                  )}
                  <span>{log.action}</span>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function PencilIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}
