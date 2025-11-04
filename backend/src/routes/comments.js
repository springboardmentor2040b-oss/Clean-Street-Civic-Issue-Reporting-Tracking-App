import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { addComment, deleteComment, listByComplaint } from '../controllers/commentController.js'

const router = Router()

router.get('/:complaintId', authRequired, listByComplaint)
router.post('/:complaintId', authRequired, addComment)
router.delete('/:id', authRequired, deleteComment)

export default router
