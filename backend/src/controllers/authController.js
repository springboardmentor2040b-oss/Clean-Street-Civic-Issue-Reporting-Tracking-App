import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export async function register(req, res) {
  try {
    const { name, email, password, location, phone, role, admin_code } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' })
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already in use' })
    const hash = await bcrypt.hash(password, 10)
    // Allow 'admin' only if admin_code matches env; otherwise only 'user' or 'volunteer'
    let safeRole = 'user'
    if (role === 'volunteer') safeRole = 'volunteer'
    if (role === 'admin') {
      const expected = process.env.ADMIN_SIGNUP_CODE || ''
      if (!expected || admin_code !== expected) {
        return res.status(403).json({ message: 'Invalid admin access code' })
      }
      safeRole = 'admin'
    }
    const user = await User.create({ name, email, password: hash, location: location || '', phone: phone || '', role: safeRole })
    const token = signToken(user)
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location, profile_photo: user.profile_photo } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    const token = signToken(user)
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location, profile_photo: user.profile_photo } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
