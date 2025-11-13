import Comment from '../models/Comment.js'
import User from '../models/User.js'
import ImageKit from 'imagekit'

export async function listByComplaint(req, res) {
  const { complaintId } = req.params
  const items = await Comment.find({ complaint_id: complaintId }).sort({ created_at: 1 }).lean()
  const userIds = [...new Set(items.map(i => String(i.user_id)))]
  const users = await User.find({ _id: { $in: userIds } }).select('name email profile_photo').lean()
  const byId = Object.fromEntries(users.map(u => [String(u._id), u]))
  const enriched = items.map(i => ({
    ...i,
    author: byId[String(i.user_id)] || null,
    likeCount: (i.likes || []).length,
    dislikeCount: (i.dislikes || []).length,
    myLike: i.likes?.some(u => String(u) === String(req.user.id)) || false,
    myDislike: i.dislikes?.some(u => String(u) === String(req.user.id)) || false
  }))
  res.json(enriched)
}

export async function addComment(req, res) {
  const { complaintId } = req.params
  const { content = '', parent_id = null } = req.body
  let photo_url = ''
  try {
    const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env
    const imagekit = (IMAGEKIT_PUBLIC_KEY && IMAGEKIT_PRIVATE_KEY && IMAGEKIT_URL_ENDPOINT)
      ? new ImageKit({ publicKey: IMAGEKIT_PUBLIC_KEY, privateKey: IMAGEKIT_PRIVATE_KEY, urlEndpoint: IMAGEKIT_URL_ENDPOINT })
      : null
    if (req.file && imagekit) {
      const safeName = (req.file.originalname || 'comment_photo').replace(/[^a-zA-Z0-9._-]/g, '') || 'photo.jpg'
      const uploaded = await imagekit.upload({ file: req.file.buffer, fileName: `comment_${Date.now()}_${safeName}`, folder: 'clean_street/comments' })
      photo_url = uploaded.url
    }
  } catch (e) {
    return res.status(500).json({ message: 'Photo upload failed' })
  }
  if (!photo_url && !content.trim()) return res.status(400).json({ message: 'Content or photo required' })
  const c = await Comment.create({ user_id: req.user.id, complaint_id: complaintId, content: content.trim(), parent_id: parent_id || null, photo_url, likes: [], dislikes: [] })
  res.status(201).json(c)
}

export async function deleteComment(req, res) {
  const { id } = req.params
  const c = await Comment.findById(id)
  if (!c) return res.status(404).json({ message: 'Not found' })
  const isOwner = String(c.user_id) === String(req.user.id)
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' })
  await Comment.deleteOne({ _id: id })
  res.json({ ok: true })
}

export async function reactComment(req, res) {
  const { id } = req.params // comment id
  const { action } = req.body // 'like' | 'dislike' | null
  const c = await Comment.findById(id)
  if (!c) return res.status(404).json({ message: 'Not found' })
  const uid = String(req.user.id)
  c.likes = (c.likes || []).filter(u => String(u) !== uid)
  c.dislikes = (c.dislikes || []).filter(u => String(u) !== uid)
  if (action === 'like') c.likes.push(req.user.id)
  if (action === 'dislike') c.dislikes.push(req.user.id)
  await c.save()
  res.json({ likeCount: c.likes.length, dislikeCount: c.dislikes.length, myLike: action === 'like', myDislike: action === 'dislike' })
}
