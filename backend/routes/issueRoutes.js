const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');

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
    const formattedIssues = issues.map((issue) => ({
      _id: issue._id,
      title: issue.title,
      description: issue.description,
      status: issue.status || issue.priority,
      location: issue.address,
      date: issue.createdAt
        ? issue.createdAt.toISOString().split('T')[0]
        : 'N/A',
      images: issue.images,
    }));

    res.status(200).json(formattedIssues);
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
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid issue id' });
    }

    if (!status || !['Open', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Fix role-based access control logic
    if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.status = status;
    await issue.save();

    res.status(200).json({ message: 'Status updated successfully', issue });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status', error });
  }
});


module.exports = router;