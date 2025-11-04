import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  const login = async (email, password) => {
    const { token: t, user: u } = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(t)
    setUser(u)
    return u
  }

  const register = async (payload) => {
    const { token: t, user: u } = await api('/auth/register', { method: 'POST', body: payload })
    setToken(t)
    setUser(u)
    return u
  }

  const logout = () => {
    setToken('')
    setUser(null)
  }

  const updateUser = (patch) => {
    setUser((prev) => ({ ...(prev || {}), ...(typeof patch === 'function' ? patch(prev) : patch) }))
  }

  const value = useMemo(() => ({ token, user, login, register, logout, setUser, updateUser }), [token, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
