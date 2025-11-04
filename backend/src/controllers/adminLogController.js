import AdminLog from '../models/AdminLog.js'

export async function listLogs(_req, res) {
  const items = await AdminLog.find({}).sort({ timestamp: -1 }).limit(200)
  res.json(items)
}

export async function recordLog(user_id, action) {
  try {
    await AdminLog.create({ user_id, action })
  } catch (_) {
    // best-effort
  }
}
