import Comment from '../models/Comment.js'

export async function listByComplaint(req, res) {
  const { complaintId } = req.params
  const items = await Comment.find({ complaint_id: complaintId }).sort({ created_at: 1 })
  res.json(items)
}

export async function addComment(req, res) {
  const { complaintId } = req.params
  const { content } = req.body
  if (!content || !content.trim()) return res.status(400).json({ message: 'Content required' })
  const c = await Comment.create({ user_id: req.user.id, complaint_id: complaintId, content: content.trim() })
  res.status(201).json(c)
}

export async function deleteComment(req, res) {
  const { id } = req.params
  const c = await Comment.findById(id)
  if (!c) return res.status(404).json({ message: 'Not found' })
  const isOwner = String(c.user_id) === String(req.user.id)
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' })
  await Comment.deleteOne({ _id: id })
  res.json({ ok: true })
}
