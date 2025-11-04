// const mongoose = require('mongoose');

// const issueSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   priority: { type: String, required: true },
//   priorityLevel: { type: String, required: true },
//   description: { type: String, required: true },
//   address: { type: String, required: true },
//   images: { type: [String], required: true },
//   username: { type: String, required: true },
//   latitude: { type: Number },
//   longitude: { type: Number },
//   status: { type: String, default: 'Open' },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Issue', issueSchema);

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    priority: { type: String, required: true },
    priorityLevel: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    images: { type: [String], required: true },
    username: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    status: { type: String, default: 'Open' },
    // Comments embedded as subdocuments so each issue can carry its own discussion
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String, required: true },
        avatar: { type: String, default: '' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        // Track users who liked/disliked so we can toggle
        likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        // Optional counts (kept for quick access)
        likes: { type: Number, default: 0 },
        dislikes: { type: Number, default: 0 },
        // Replies to this comment
        replies: [
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String, required: true },
            avatar: { type: String, default: '' },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },
  { timestamps: true } // ✅ Automatically adds createdAt + updatedAt
);

module.exports = mongoose.model('Issue', issueSchema);
