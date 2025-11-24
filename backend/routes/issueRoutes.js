const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const Log = require('../models/Log');


// Small helper: best-effort log creation
async function createLogEntry({ issueId, issueTitle, actor, action, meta = {} }) {
  try {
    const log = new Log({
      issueId,
      issueTitle: issueTitle || '',
      actor: actor || 'Unknown',
      action: action || '',
      meta,
      timestamp: new Date()
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to create log entry:', err);
    // don't throw — logging is best-effort
    return null;
  }
}

// Create new issue (Cloudinary upload handled by frontend)
router.post('/create', async (req, res) => {
  try {
    const {
      title,
      priority,
      priorityLevel,
      description,
      address,
      images,
      username,
      latitude,
      longitude,
      status,
    } = req.body;

    if (!title || !priority || !priorityLevel || !description || !address || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newIssue = new Issue({
      title,
      priority,
      priorityLevel,
      description,
      address,
      images,
      username,
      latitude,
      longitude,
      status: status || 'Open',
    });

    await newIssue.save();

// create an initial 'Created' log (best-effort)
createLogEntry({
  issueId: newIssue._id,
  issueTitle: newIssue.title,
  actor: newIssue.username || 'Anonymous',
  action: 'Created',
  meta: { initialStatus: newIssue.status || 'Open' }
});

res.status(201).json({ message: 'Issue created successfully', issue: newIssue });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Error creating issue', error });
  }
});

// Get all issues
// router.get('/all', async (req, res) => {
//   try {
//     const issues = await Issue.find();
//     const formattedIssues = issues.map((issue) => ({
//       _id: issue._id,
//       title: issue.title,
//       description: issue.description,
//       status: issue.status || issue.priority,
//       location: issue.address,
//       date: issue.createdAt.toISOString().split('T')[0],
//       images: issue.images,
//     }));
//     res.status(200).json(formattedIssues);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching issues', error });
//   }
// });

router.get('/all', async (req, res) => {
  try {
    const issues = await Issue.find();
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching issues', error });
  }
});

// Add a comment to an issue
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid issue id' });

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const comment = {
      user: req.user._id,
      username: req.user.username, // Ensure username is populated from req.user
      avatar: req.user.avatar || '',
      text: text.trim(),
      createdAt: new Date(),
    };

    issue.comments = issue.comments || [];
    issue.comments.push(comment);
    await issue.save();

    // Return the newly added comment (last element)
    res.status(201).json({ message: 'Comment added', comment: issue.comments[issue.comments.length - 1] });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error });
  }
});

// Get comments for an issue
router.get('/:id/comments', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid issue id' });

    const issue = await Issue.findById(id).select('comments');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    res.status(200).json(issue.comments || []);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments', error });
  }
});

// Like/unlike a comment (toggle)
router.post('/:issueId/comments/:commentId/like', authMiddleware, async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) return res.status(400).json({ message: 'Invalid issue id' });
    if (!commentId) return res.status(400).json({ message: 'Invalid comment id' });
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const comment = issue.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user._id.toString();

    // If already liked -> remove like
    const likedIndex = (comment.likedBy || []).findIndex(id => id.toString() === userId);
    if (likedIndex !== -1) {
      comment.likedBy.splice(likedIndex, 1);
    } else {
      // add like
      comment.likedBy = comment.likedBy || [];
      comment.likedBy.push(req.user._id);
      // If previously disliked, remove dislike
      const disIdx = (comment.dislikedBy || []).findIndex(id => id.toString() === userId);
      if (disIdx !== -1) comment.dislikedBy.splice(disIdx, 1);
    }

    // update counts
    comment.likes = (comment.likedBy || []).length;
    comment.dislikes = (comment.dislikedBy || []).length;

    await issue.save();
    res.status(200).json({ message: 'Toggled like', comment });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like', error });
  }
});

// Dislike/un-dislike a comment (toggle)
router.post('/:issueId/comments/:commentId/dislike', authMiddleware, async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) return res.status(400).json({ message: 'Invalid issue id' });
    if (!commentId) return res.status(400).json({ message: 'Invalid comment id' });
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const comment = issue.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user._id.toString();

    const disIdx = (comment.dislikedBy || []).findIndex(id => id.toString() === userId);
    if (disIdx !== -1) {
      comment.dislikedBy.splice(disIdx, 1);
    } else {
      comment.dislikedBy = comment.dislikedBy || [];
      comment.dislikedBy.push(req.user._id);
      // remove like if present
      const likeIdx = (comment.likedBy || []).findIndex(id => id.toString() === userId);
      if (likeIdx !== -1) comment.likedBy.splice(likeIdx, 1);
    }

    // update counts
    comment.likes = (comment.likedBy || []).length;
    comment.dislikes = (comment.dislikedBy || []).length;

    await issue.save();
    res.status(200).json({ message: 'Toggled dislike', comment });
  } catch (error) {
    console.error('Error toggling dislike:', error);
    res.status(500).json({ message: 'Error toggling dislike', error });
  }
});

// Add a reply to a comment
router.post('/:issueId/comments/:commentId/replies', authMiddleware, async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Reply text is required' });
    if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) return res.status(400).json({ message: 'Invalid issue id' });
    if (!commentId) return res.status(400).json({ message: 'Invalid comment id' });

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const comment = issue.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const reply = {
      user: req.user._id,
      username: req.user.username || req.user.name || 'Unknown',
      avatar: req.user.avatar || '',
      text: text.trim(),
      createdAt: new Date(),
    };

    comment.replies = comment.replies || [];
    comment.replies.push(reply);
    await issue.save();

    res.status(201).json({ message: 'Reply added', comment });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Error adding reply', error });
  }
});

// Update complaint status (volunteer-only)
// router.patch('/:id/status', authMiddleware, async (req, res) => {
//   try {
//     const { status } = req.body;
//     const id = req.params.id;

//     if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid issue id' });
//     }

//     if (!status || !['Open', 'Closed'].includes(status)) {
//       return res.status(400).json({ message: 'Invalid status value' });
//     }

//     // Fix role-based access control logic
//     if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Permission denied' });
//     }

//     const issue = await Issue.findById(id);
//     if (!issue) {
//       return res.status(404).json({ message: 'Issue not found' });
//     }

//     issue.status = status;
//     await issue.save();

//     res.status(200).json({ message: 'Status updated successfully', issue });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     res.status(500).json({ message: 'Error updating status', error });
//   }
// });

// router.patch('/:id/status', authMiddleware, async (req, res) => {
//   try {
//     const { status } = req.body;
//     const id = req.params.id;

//     // basic id validation
//     if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid issue id' });
//     }

//     // validate status value (adjust allowed values as needed)
//     if (!status || !['Open', 'Closed'].includes(status)) {
//       return res.status(400).json({ message: 'Invalid status value' });
//     }

//     // role-based access control
//     if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Permission denied' });
//     }

//     const issue = await Issue.findById(id);
//     if (!issue) {
//       return res.status(404).json({ message: 'Issue not found' });
//     }

//     // capture previous status before change
//     const previousStatus = issue.status;

//     // set transient actor info (not persisted unless schema saved with this field)
//     const actorId = req.user ? req.user._id : undefined;
//     const actorName = req.user ? (req.user.username || req.user.name || req.user.email) : (req.body.actor || 'Unknown');

//     // apply the status change
//     issue.status = status;
//     // transient helper for potential model hooks or later auditing
//     issue._modifiedBy = actorName;

//     await issue.save();

//     // Best-effort log creation (fire-and-forget so logging failures don't block response)
//     (async () => {
//       try {
//         const Log = require('../models/Log'); // require here so top-of-file change isn't required
//         const logDoc = new Log({
//           issueId: issue._id,
//           issueTitle: issue.title || '',
//           actorId: actorId,
//           actor: actorName,
//           action: status,
//           meta: { previousStatus, newStatus: status },
//           timestamp: new Date()
//         });
//         await logDoc.save();
//       } catch (logErr) {
//         // never fail the main request because logging failed
//         console.error('Failed to create log entry for issue status change:', logErr);
//       }
//     })();

//     return res.status(200).json({ message: 'Status updated successfully', issue });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     return res.status(500).json({ message: 'Error updating status', error });
//   }
// });

// at top of file (if not already present)
// const Log = require('../models/Log');

// handler
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid issue id' });
    }

    // adjust allowed statuses if you need more values
    if (!status || !['Open', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // RBAC
    if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const previousStatus = issue.status;
    issue.status = status;

    // Save the change
    await issue.save();

    // Build friendly actor name from authenticated user
    const actorName = req.user?.username || req.user?.name || req.user?.email || 'Unknown';

    // Create a log entry with friendly fields (best-effort)
    (async () => {
      try {
        const logDoc = new Log({
          issueId: issue._id,
          issueTitle: issue.title || '',     // <-- friendly issue title stored here
          actorId: req.user?._id || null,
          actor: actorName,                  // <-- friendly actor string stored here
          action: 'Status Update',
          details: `${actorName} changed status to ${status} for issue ID: ${issue._id}`,
          meta: { previousStatus, newStatus: status },
          timestamp: new Date()
        });
        await logDoc.save();
      } catch (logErr) {
        console.error('Failed to create log entry:', logErr);
      }
    })();

    return res.status(200).json({ message: 'Status updated successfully', issue });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ message: 'Error updating status', error });
  }
});


module.exports = router;