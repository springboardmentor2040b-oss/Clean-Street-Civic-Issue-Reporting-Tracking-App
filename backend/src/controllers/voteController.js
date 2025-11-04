import Vote from '../models/Vote.js'
import mongoose from 'mongoose'

export async function voteSummary(req, res) {
  const { complaintId } = req.params
  const agg = await Vote.aggregate([
    { $match: { complaint_id: new mongoose.Types.ObjectId(complaintId) } },
    { $group: { _id: '$vote_type', count: { $sum: 1 } } }
  ])
  const counts = { up: 0, down: 0 }
  for (const r of agg) counts[r._id] = r.count
  res.json(counts)
}

export async function setVote(req, res) {
  const { complaintId } = req.params
  const { vote_type } = req.body
  if (!['up', 'down', null, undefined].includes(vote_type)) {
    return res.status(400).json({ message: 'Invalid vote_type' })
  }
  // null vote_type will remove vote
  const existing = await Vote.findOne({ user_id: req.user.id, complaint_id: complaintId })
  if (!vote_type) {
    if (existing) await Vote.deleteOne({ _id: existing._id })
    const counts = await Vote.countDocuments({ complaint_id: complaintId, vote_type: 'up' })
    return res.json({ ok: true })
  }
  if (existing) {
    existing.vote_type = vote_type
    await existing.save()
    return res.json(existing)
  }
  const v = await Vote.create({ user_id: req.user.id, complaint_id: complaintId, vote_type })
  res.status(201).json(v)
}
