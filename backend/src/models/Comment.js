import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    content: { type: String, trim: true },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    photo_url: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

commentSchema.index({ complaint_id: 1, created_at: 1 })
commentSchema.index({ parent_id: 1 })

export default mongoose.model('Comment', commentSchema)
