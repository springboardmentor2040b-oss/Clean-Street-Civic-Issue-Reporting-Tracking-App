import { Router } from 'express'
import multer from 'multer'
import { authRequired } from '../middleware/auth.js'
import { addComment, deleteComment, listByComplaint, reactComment } from '../controllers/commentController.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.get('/:complaintId', authRequired, listByComplaint)
// multipart comment with optional photo (field name 'photo') and optional parent_id
router.post('/:complaintId', authRequired, upload.single('photo'), addComment)
router.delete('/:id', authRequired, deleteComment)
// like/dislike toggle on a comment
router.patch('/:id/react', authRequired, reactComment)

export default router
