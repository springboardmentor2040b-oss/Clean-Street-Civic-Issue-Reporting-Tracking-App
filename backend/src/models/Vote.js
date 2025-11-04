import mongoose from 'mongoose'

const voteSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    vote_type: { type: String, enum: ['up', 'down'], required: true }
  }
)

voteSchema.index({ user_id: 1, complaint_id: 1 }, { unique: true })

export default mongoose.model('Vote', voteSchema)
