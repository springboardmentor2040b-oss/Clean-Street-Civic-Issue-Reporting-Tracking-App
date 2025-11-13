import AdminLog from '../models/AdminLog.js'
import User from '../models/User.js'

export async function listLogs(_req, res) {
  const items = await AdminLog.find({})
    .sort({ timestamp: -1 })
    .limit(200)
    .lean()

  // Attach actor basic info
  const userIds = [...new Set(items.map(i => String(i.user_id)))]
  const users = await User.find({ _id: { $in: userIds } })
    .select('name email')
    .lean()
  const byId = Object.fromEntries(users.map(u => [String(u._id), u]))

  const enriched = items.map(i => ({
    _id: i._id,
    action: i.action,
    timestamp: i.timestamp,
    actor: byId[String(i.user_id)] || null
  }))
  res.json(enriched)
}

export async function recordLog(user_id, action) {
  try {
    await AdminLog.create({ user_id, action })
  } catch (_) {
    // best-effort
  }
}
