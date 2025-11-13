import User from '../models/User.js'
import { recordLog } from './adminLogController.js'

export async function me(req, res) {
  const user = await User.findById(req.user.id).select('-password')
  res.json(user)
}

export async function updateMe(req, res) {
  const { name, location, profile_photo, phone, bio } = req.body
  const updated = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { name, location, profile_photo, phone, bio } },
    { new: true }
  ).select('-password')
  res.json(updated)
}

export async function listUsers(_req, res) {
  const users = await User.find({}).select('-password')
  res.json(users)
}

export async function updateUserRole(req, res) {
  const { id } = req.params
  const { role } = req.body
  const allowed = ['user', 'volunteer', 'admin']
  if (!allowed.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' })
  }
  // Optional: prevent self-demotion lockouts
  if (String(req.user.id) === String(id) && req.user.role === 'admin' && role !== 'admin') {
    return res.status(400).json({ message: 'Admins cannot demote themselves' })
  }
  // Fetch current to detect role change for logging
  const current = await User.findById(id).select('-password')
  if (!current) return res.status(404).json({ message: 'User not found' })

  const prevRole = current.role
  const updated = await User.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true }
  ).select('-password')
  if (!updated) return res.status(404).json({ message: 'User not found' })
  // Always log the attempt; distinguish between change and noop
  const actor = req.user?.name || req.user?.email || String(req.user.id)
  const target = current?.name || current?.email || String(id)
  let action
  if (prevRole !== role) {
    action = `role_change: admin='${actor}' changed '${target}' from '${prevRole}' to '${role}'`
  } else {
    action = `role_change_noop: admin='${actor}' kept '${target}' at '${role}'`
  }
  // Debug trace (can remove later)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[adminLog]', action)
  }
  await recordLog(req.user.id, action)
  res.json(updated)
}
