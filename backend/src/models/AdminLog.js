import mongoose from 'mongoose'

const adminLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
)

adminLogSchema.index({ timestamp: -1 })

export default mongoose.model('AdminLog', adminLogSchema)
