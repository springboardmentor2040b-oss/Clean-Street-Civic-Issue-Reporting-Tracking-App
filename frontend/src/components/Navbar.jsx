import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import { useState } from 'react'

function getInitials(nameOrEmail = '') {
  if (!nameOrEmail) return 'A';
  const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
  const parts = base.split(/\s+/).filter(Boolean);
  return parts[0][0].toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <header className="w-full py-3 border-b border-gray-100 bg-white sticky top-0 z-10 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="CleanStreet logo" className="w-8 h-8 object-contain" />
          <span className="font-display text-2xl tracking-wide">CleanStreet</span>
        </Link>
  {/* Desktop links (lg and up) */}
  <div className="hidden lg:flex items-center gap-2 text-sm">
          {user?.role !== 'admin' && (
            <NavLink to="/dashboard" className={({isActive}) => `px-4 py-2 rounded-full border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>🏠 Dashboard</NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({isActive}) => `px-4 py-2 rounded-full border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>🛡️ Admin</NavLink>
          )}
          {user?.role !== 'admin' && (
            <NavLink to="/report" className={({isActive}) => `px-4 py-2 rounded-full border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>📝 Report Issue</NavLink>
          )}
          <NavLink to="/complaints" className={({isActive}) => `px-4 py-2 rounded-full border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>📋 View Complaints</NavLink>
          {user?.role === 'volunteer' && (
            <NavLink to="/nearby-complaints" className={({isActive}) => `px-4 py-2 rounded-full border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>📍 Nearby Complaints</NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/profile" className="px-2 py-2 rounded-full flex items-center">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt="avatar" className="w-8 h-8 rounded-full object-cover" style={{background: 'transparent'}} />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-lg">
                    {getInitials(user.name || user.email)}
                  </span>
                )}
              </NavLink>
              <button onClick={logout} className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-full bg-brand-600 text-white hover:bg-brand-700">Login</Link>
              <Link to="/register" className="px-4 py-2 rounded-full bg-brand-500 text-white hover:bg-brand-600">Register</Link>
            </>
          )}
        </div>
        {/* Mobile hamburger */}
        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            {open ? (
              <path fillRule="evenodd" d="M6.225 4.811a1 1 0 0 1 1.414 0L12 9.172l4.361-4.361a1 1 0 1 1 1.414 1.414L13.414 10.586l4.361 4.361a1 1 0 0 1-1.414 1.414L12 12l-4.361 4.361a1 1 0 0 1-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 0 1 0-1.414z" clipRule="evenodd" />
            ) : (
              <>
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </nav>
      {/* Mobile menu panel */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
            {user?.role !== 'admin' && (
              <NavLink to="/dashboard" onClick={() => setOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>🏠 Dashboard</NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" onClick={() => setOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>🛡️ Admin</NavLink>
            )}
            {user?.role !== 'admin' && (
              <NavLink to="/report" onClick={() => setOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>📝 Report Issue</NavLink>
            )}
            <NavLink to="/complaints" onClick={() => setOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>📋 View Complaints</NavLink>
            {user?.role === 'volunteer' && (
              <NavLink to="/nearby-complaints" onClick={() => setOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md border ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>📍 Nearby Complaints</NavLink>
            )}
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <NavLink to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2">
                  {user.profile_photo ? (
                    <img src={user.profile_photo} alt="avatar" className="w-8 h-8 rounded-full object-cover" style={{background: 'transparent'}} />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-lg">
                      {getInitials(user.name || user.email)}
                    </span>
                  )}
                  <span className="text-sm">Profile</span>
                </NavLink>
                <button onClick={() => { setOpen(false); logout(); }} className="px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50">Sign out</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md bg-brand-600 text-white text-center hover:bg-brand-700">Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md bg-brand-500 text-white text-center hover:bg-brand-600">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
