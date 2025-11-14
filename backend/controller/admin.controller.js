import Complaint from "../models/complaint.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { recordAdminLog } from "./adminLog.controller.js";

/**
 * @desc    Get all complaints for admin view
 * @route   GET /api/admin/complaints
 * @access  Private (Admin only)
 */
export const getAllComplaintsAdmin = async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .sort({ createdAt: -1 })
      .populate('user_id', 'name email location') // User who reported - include location
      .populate('assigned_to', 'name email'); // User assigned (volunteer/admin)

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    console.error("Error fetching all complaints for admin:", error);
    res.status(500).json({ message: "Server error fetching complaints." });
  }
};

/**
 * @desc    Get all users for admin view
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 }); // Exclude passwords
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("Error fetching all users for admin:", error);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

/**
 * @desc    Update user role by Admin
 * @route   PATCH /api/admin/users/:userId/role
 * @access  Private (Admin only)
 */
export const updateUserRoleAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const validRoles = ["user", "volunteer", "admin"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Prevent admin from changing their own role? (Optional safeguard)
    // if (user._id.toString() === req.user._id.toString() && user.role === 'admin' && role !== 'admin') {
    //   return res.status(400).json({ message: "Admins cannot change their own role." });
    // }

    user.role = role;
    await user.save();

    res.status(200).json({ success: true, message: `User role updated to ${role}.` });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Server error updating role." });
  }
};

/**
 * @desc    Get basic dashboard stats for Admin
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'received' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Server error fetching stats." });
  }


};

/**
 * @desc    Update complaint status by Admin
 * @route   PATCH /api/admin/complaints/:complaintId/status
 * @access  Private (Admin only)
 */
export const updateComplaintStatusAdmin = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({ message: "Invalid complaint ID." });
    }

    const validStatuses = ["received", "in_review", "resolved", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status specified. Valid options: received, in_review, resolved, rejected" });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }
    
    const oldStatus = complaint.status;
    complaint.status = status;
    await complaint.save();

    // log admin action

  const adminName = req.user?.name || "unknown Admin";
  const action = ` Updated complaint (${complaint.title}) status from ${oldStatus} to '${status}' `;

  
  
    // Record admin action
    await recordAdminLog(req.user?._id, action);

    res.status(200).json({ success: true, message: `Complaint status updated to ${status}!` });


  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({ message: "Server error updating complaint status." });
    console.error("Error updating complaint status:", error);
    res.status(500).json({ message: "Server error updating complaint status." });
  }
};

/**
 * @desc    Get detailed statistics for charts and graphs
 * @route   GET /api/admin/detailed-stats
 * @access  Private (Admin only)
 */
export const getDetailedStats = async (req, res) => {
  try {
    // Complaint status distribution
    const complaintsByStatus = await Complaint.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Complaint type distribution
    const complaintsByType = await Complaint.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    // User role distribution
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Complaints over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const complaintsOverTime = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Monthly complaint trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyComplaints = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // User registration over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Top complaint types
    const topComplaintTypes = await Complaint.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        complaintsByStatus,
        complaintsByType,
        usersByRole,
        complaintsOverTime,
        monthlyComplaints,
        userRegistrations,
        topComplaintTypes
      }
    });
  } catch (error) {
    console.error("Error fetching detailed stats:", error);
    res.status(500).json({ message: "Server error fetching detailed statistics." });
  }
};

// Add other admin functions here later (e.g., delete user, generate reports)