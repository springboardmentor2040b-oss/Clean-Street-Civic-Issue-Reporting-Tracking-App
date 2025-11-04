import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { requireRoles } from '../middleware/roles.js'
import { listLogs } from '../controllers/adminLogController.js'

const router = Router()

router.get('/', authRequired, requireRoles('admin'), listLogs)

export default router
