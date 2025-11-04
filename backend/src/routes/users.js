import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { me, updateMe, listUsers, updateUserRole } from '../controllers/userController.js'
import { requireRoles } from '../middleware/roles.js'

const router = Router()
router.get('/me', authRequired, me)
router.put('/me', authRequired, updateMe)

// Admin: list all users
router.get('/', authRequired, requireRoles('admin'), listUsers)
// Admin: update a user's role
router.put('/:id/role', authRequired, requireRoles('admin'), updateUserRole)

export default router
