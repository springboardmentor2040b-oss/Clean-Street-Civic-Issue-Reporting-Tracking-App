import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
    role: { type: String, enum: ['user', 'volunteer', 'admin'], default: 'user' },
    profile_photo: { type: String, default: '' }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
