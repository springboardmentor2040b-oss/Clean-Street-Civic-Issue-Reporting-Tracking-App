import { useEffect, useMemo, useState, useRef } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function AdminDashboard() {
  const { token } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview') // 'overview' | 'reports' | 'users'
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
        </nav>
      </aside>

      {/* Main content */}
  <div className="md:flex md:flex-col md:h-full md:overflow-hidden">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-display">{tab === 'overview' ? 'System Overview' : tab === 'reports' ? 'Reports' : 'User Management'}</h2>
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
            ) : (
              <div className="md:flex-1 md:overflow-y-auto md:pr-2">
                <UsersSection users={users} token={token} onUserUpdated={(u) => setUsers(prev => prev.map(x => x._id === u._id ? u : x))} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
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

// Reports section with simple SVG/CSS charts
function ReportsSection({ metrics, complaints = [], users = [] }) {
  const [hoverSlice, setHoverSlice] = useState(null)
  const [hoverU, setHoverU] = useState(null)
  const chartData = [
    { label: 'Received', value: metrics.pending, color: '#60a5fa' },
    { label: 'In Review', value: metrics.inReview, color: '#fbbf24' },
    { label: 'Resolved', value: metrics.resolved, color: '#e879f9' }
  ]
  const total = Math.max(1, chartData.reduce((a, b) => a + (b.value || 0), 0))
  let acc = 0
  const gradient = `conic-gradient(from 90deg, ${chartData.map(s => { const from = (acc / total) * 100; acc += (s.value || 0); const to = (acc / total) * 100; return `${s.color} ${from}% ${to}%`; }).join(', ')})`

  // Build ranges for hover detection on the donut
  let acc2 = 0
  const ranges = chartData.map(s => {
    const from = (acc2 / total)
    acc2 += (s.value || 0)
    const to = (acc2 / total)
    return { ...s, from, to }
  })

  // Users donut data (compute early so bars can use counts)
  const countUsers = users.filter(u => u.role === 'user').length
  const countVolunteers = users.filter(u => u.role === 'volunteer').length
  const countAdmins = users.filter(u => u.role === 'admin').length
  const totalUsers = Math.max(1, users.length)
  const userChartData = [
    { label: 'Users', value: countUsers, color: '#38bdf8' },
    { label: 'Volunteers', value: countVolunteers, color: '#f43f5e' },
    { label: 'Admins', value: countAdmins, color: '#10b981' }
  ]
  let accU = 0
  const gradientU = `conic-gradient(from 90deg, ${userChartData.map(s => { const from = (accU / totalUsers) * 100; accU += (s.value || 0); const to = (accU / totalUsers) * 100; return `${s.color} ${from}% ${to}%`; }).join(', ')})`
  let accU2 = 0
  const rangesU = userChartData.map(s => { const from = (accU2 / totalUsers); accU2 += (s.value || 0); const to = (accU2 / totalUsers); return { ...s, from, to } })

  const bars = [
    { label: 'Users', value: countUsers, color: 'linear-gradient(180deg,#38bdf8,#0ea5e9)' },
    { label: 'Volunteers', value: countVolunteers, color: 'linear-gradient(180deg,#fb7185,#f43f5e)' },
    { label: 'Total Complaints', value: metrics.total, color: 'linear-gradient(180deg,#22d3ee,#0ea5e9)' },
    { label: 'Pending', value: metrics.inReview + metrics.pending, color: 'linear-gradient(180deg,#fb7185,#f97316)' },
    { label: 'Resolved Today', value: metrics.resolvedToday, color: 'linear-gradient(180deg,#a78bfa,#7c3aed)' }
  ]
  const maxBar = Math.max(1, ...bars.map(b => b.value))


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-100">
        <h4 className="font-medium mb-4">Complaint Status Distribution</h4>
        <div className="flex flex-col items-center gap-6">
          <div
            className="relative w-[260px] h-[260px] lg:w-[320px] lg:h-[320px]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const cx = rect.left + rect.width / 2
              const cy = rect.top + rect.height / 2
              const dx = e.clientX - cx
              const dy = e.clientY - cy
              const r = Math.sqrt(dx*dx + dy*dy)
              const outerR = rect.width / 2
              const hole = e.currentTarget.querySelector('.donut-hole')
              const innerR = hole ? hole.getBoundingClientRect().width / 2 : rect.width * 0.35
              if (r < innerR || r > outerR) { setHoverSlice(null); return }
              let angle = Math.atan2(dy, dx) * 180 / Math.PI
              if (angle < 0) angle += 360
              const ratio = angle / 360
              const hit = ranges.find((rg, idx) => {
                const last = idx === ranges.length - 1
                return (ratio >= rg.from && ratio < rg.to) || (last && ratio === 1)
              })
              setHoverSlice(hit || null)
            }}
            onMouseLeave={() => setHoverSlice(null)}
          >
            <div className="rounded-full w-full h-full" style={{ background: gradient }} />
            <div className="donut-hole absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-full shadow-inner flex items-center justify-center text-center">
              <div className="text-sm text-gray-700">
                {hoverSlice ? (
                  <>
                    <div className="font-medium">{hoverSlice.label}</div>
                    <div className="text-gray-600">{hoverSlice.value}</div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">Total Complaints</div>
                    <div className="text-gray-600">{metrics.total}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {chartData.map((s) => (
              <li key={s.label} className="flex items-center gap-2" title={`${s.label}: ${s.value}`}>
                <span className="inline-block w-3 h-3 rounded-sm" style={{background:s.color}} title={`${s.label}: ${s.value}`} />
                <span className="text-gray-700">{s.label}</span>
                <span className="text-gray-500">({s.value})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-100">
        <h4 className="font-medium mb-4">User Roles Distribution</h4>
        <div className="flex flex-col items-center gap-6">
          <div
            className="relative w-[260px] h-[260px] lg:w-[300px] lg:h-[300px]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const cx = rect.left + rect.width / 2
              const cy = rect.top + rect.height / 2
              const dx = e.clientX - cx
              const dy = e.clientY - cy
              const r = Math.sqrt(dx*dx + dy*dy)
              const outerR = rect.width / 2
              const hole = e.currentTarget.querySelector('.donut-hole-users')
              const innerR = hole ? hole.getBoundingClientRect().width / 2 : rect.width * 0.35
              if (r < innerR || r > outerR) { setHoverU(null); return }
              let angle = Math.atan2(dy, dx) * 180 / Math.PI
              if (angle < 0) angle += 360
              const ratio = angle / 360
              const hit = rangesU.find((rg, idx) => {
                const last = idx === rangesU.length - 1
                return (ratio >= rg.from && ratio < rg.to) || (last && ratio === 1)
              })
              setHoverU(hit || null)
            }}
            onMouseLeave={() => setHoverU(null)}
          >
            <div className="rounded-full w-full h-full" style={{ background: gradientU }} />
            <div className="donut-hole-users absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 lg:w-44 lg:h-44 bg-white rounded-full shadow-inner flex items-center justify-center text-center">
              <div className="text-sm text-gray-700">
                {hoverU ? (
                  <>
                    <div className="font-medium">{hoverU.label}</div>
                    <div className="text-gray-600">{hoverU.value}</div>
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
            {userChartData.map((s) => (
              <li key={s.label} className="flex items-center gap-2" title={`${s.label}: ${s.value}`}>
                <span className="inline-block w-3 h-3 rounded-sm" style={{background:s.color}} />
                <span className="text-gray-700">{s.label}</span>
                <span className="text-gray-500">({s.value})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Summary spans full width on second row */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 lg:col-span-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-100">
        <h4 className="font-medium mb-4">Summary</h4>
        <div className="flex items-end justify-around gap-8 h-64 px-4">
          {bars.map((b) => (
            <div key={b.label} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
              <div className="w-20 rounded-md" style={{height:`${(b.value/maxBar)*100}%`, minHeight: b.value > 0 ? 10 : 0, background: b.color}} title={`${b.label}: ${b.value}`} />
              <div className="text-sm text-center text-gray-600">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsersSection({ users = [], token, onUserUpdated }) {
  const [savingId, setSavingId] = useState(null)
  const [local, setLocal] = useState(users)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { setLocal(users) }, [users])

  const formatDateTime = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    return date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

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
            {local.map(u => (
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

function PencilIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}
