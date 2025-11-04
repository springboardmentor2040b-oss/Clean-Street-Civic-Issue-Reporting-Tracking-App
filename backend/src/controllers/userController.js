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
  const updated = await User.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true }
  ).select('-password')
  if (!updated) return res.status(404).json({ message: 'User not found' })
  await recordLog(req.user.id, 'update_user_role')
  res.json(updated)
}
