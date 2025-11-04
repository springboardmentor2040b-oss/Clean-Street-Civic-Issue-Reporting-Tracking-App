import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.post('/change', authRequired, async (req, res) => {
  const { current_password, new_password } = req.body
  if (!current_password || !new_password) return res.status(400).json({ message: 'Missing fields' })
  const user = await User.findById(req.user.id)
  const ok = await bcrypt.compare(current_password, user.password)
  if (!ok) return res.status(400).json({ message: 'Current password is incorrect' })
  user.password = await bcrypt.hash(new_password, 10)
  await user.save()
  res.json({ message: 'Password updated' })
})

export default router
