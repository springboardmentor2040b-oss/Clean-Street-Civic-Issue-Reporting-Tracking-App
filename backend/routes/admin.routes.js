import express from "express";
import {
  getAllComplaintsAdmin,
  getAllUsersAdmin,
  updateUserRoleAdmin,
  updateComplaintStatusAdmin,
  getAdminStats,
  getDetailedStats,
} from "../controller/admin.controller.js";

import { getAllAdminLogs, recordAdminLog } from "../controller/adminLog.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// ✅ Require login for all routes
router.use(protect);

/**
 * @route   GET /api/admin/complaints
 * @desc    Get all complaints
 * @access  Private (Admin only)
 */
router.get("/complaints", authorize("admin"), getAllComplaintsAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get("/users", authorize("admin"), getAllUsersAdmin);

/**
 * @route   PATCH /api/admin/users/:userId/role
 * @desc    Update a user's role
 * @access  Private (Admin only)
 */
router.patch("/users/:userId/role", authorize("admin"), updateUserRoleAdmin);

/**
 * @route   PATCH /api/admin/complaints/:complaintId/status
 * @desc    Update a complaint's status
 * @access  Private (Admin only)
 */
router.patch("/complaints/:complaintId/status", authorize("admin"), updateComplaintStatusAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get("/stats", authorize("admin"), getAdminStats);

/**
 * @route   GET /api/admin/detailed-stats
 * @desc    Get detailed statistics for charts and graphs
 * @access  Private (Admin only)
 */
router.get("/detailed-stats", authorize("admin"), getDetailedStats);

/**
 * @route   GET /api/admin/logs
 * @desc    Get admin logs (Visible to all authenticated users)
 * @access  Private (User, Volunteer, Admin)
 */
router.get("/logs", getAllAdminLogs);

/**
 * @route   POST /api/admin/logs
 * @desc    Record admin action
 * @access  Private (Admin only)
 */
router.post("/logs", authorize("admin"), recordAdminLog);

export default router;
