// backend/routes/logs.js
const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const User = require('../models/User');   // adjust path if needed
const Issue = require('../models/Issue'); // adjust path if needed

// GET /api/logs?limit=50
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const logs = await Log.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate({ path: 'actorId', select: 'username name email' }) // populate actorId (not `user`)
      .lean()
      .exec();

    const normalized = await Promise.all(
      logs.map(async (l) => {
        // determine friendly issue title
        let issueTitle = l.issueTitle;
        if (!issueTitle && l.issueId) {
          try {
            const issueObj = await Issue.findById(l.issueId).select('title').lean();
            if (issueObj) issueTitle = issueObj.title;
          } catch (e) {
            // ignore lookup failures
          }
        }

        // determine actor string: prefer stored actor, then populated actorId
        let actor =
          l.actor ||
          (l.actorId && (l.actorId.username || l.actorId.name || l.actorId.email)) ||
          'Unknown';

        return {
          _id: l._id,
          issueId: l.issueId || null,
          issueTitle: issueTitle || 'Untitled Issue',
          actor,
          actorId: l.actorId ? (l.actorId._id || l.actorId) : null,
          action: l.action || '',
          details: l.details || '',
          meta: l.meta || {},
          timestamp: l.timestamp || l.createdAt || null,
        };
      })
    );

    return res.json(normalized);
  } catch (err) {
    console.error('Error fetching logs:', err);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;