import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { setVote, voteSummary } from '../controllers/voteController.js'

const router = Router()

router.get('/:complaintId/summary', authRequired, voteSummary)
router.post('/:complaintId', authRequired, setVote)

export default router
