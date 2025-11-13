import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { requireRoles } from '../middleware/roles.js'
import { listLogs } from '../controllers/adminLogController.js'

const router = Router()

// Admin full logs endpoint
router.get('/', authRequired, requireRoles('admin'), listLogs)

// Recent updates (limited set) visible to any authenticated user
router.get('/recent', authRequired, async (req, res) => {
	try {
		// Reuse listLogs logic partially: fetch latest 25 and enrich actors
		// Inline minimal implementation to avoid exposing full history.
		const { default: AdminLog } = await import('../models/AdminLog.js')
		const { default: User } = await import('../models/User.js')
		const items = await AdminLog.find({}).sort({ timestamp: -1 }).limit(25).lean()
		const userIds = [...new Set(items.map(i => String(i.user_id)))]
		const users = await User.find({ _id: { $in: userIds } }).select('name email').lean()
		const byId = Object.fromEntries(users.map(u => [String(u._id), u]))
		const enriched = items.map(i => ({
			_id: i._id,
			action: i.action,
			timestamp: i.timestamp,
			actor: byId[String(i.user_id)] || null
		}))
		res.json(enriched)
	} catch (e) {
		res.status(500).json({ message: 'Unable to fetch recent updates' })
	}
})

export default router
