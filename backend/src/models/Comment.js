import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    content: { type: String, required: true, trim: true }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

commentSchema.index({ complaint_id: 1, created_at: 1 })

export default mongoose.model('Comment', commentSchema)
