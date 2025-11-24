// backend/models/Log.js
const mongoose = require('mongoose');
// add these indexes for performance (place before module.exports)


const LogSchema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: false },
  issueTitle: { type: String, default: '' },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // optional
  actor: { type: String, required: true }, // e.g. 'volunteer_abc' or 'admin_john' or username
  action: { type: String, required: true }, // e.g. 'Resolved', 'In Review'
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // previousStatus, newStatus etc.
  timestamp: { type: Date, default: Date.now }
});

LogSchema.index({ timestamp: -1 });
LogSchema.index({ issueId: 1 });

module.exports = mongoose.model('Log', LogSchema);