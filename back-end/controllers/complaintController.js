
import Complaint from "../models/complaintModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ☁️ Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Upload to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(fileBuffer);
  });

// =======================================================
// 🧾 CREATE COMPLAINT
// =======================================================
export const createComplaint = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { title, description, latitude, longitude, address, category } = req.body;

    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "cleanstreet_complaints");
        photoUrls.push(result.secure_url);
      }
    }

    const complaint = await Complaint.create({
      user: req.user._id || req.user.id,
      title,
      description,
      category: category || "",
      photos: photoUrls,
      location: address || "",
      latitude,
      longitude,
      status: "Pending",
    });

    io.emit("complaintCreated", complaint);
    res.status(201).json({ message: "Complaint created successfully", complaint });
  } catch (err) {
    console.error("❌ Error creating complaint:", err);
    res.status(500).json({ message: "Error creating complaint" });
  }
};

// =======================================================
// ✏️ EDIT COMPLAINT
// =======================================================
export const editComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (complaint.user.toString() !== (req.user._id || req.user.id))
      return res.status(403).json({ message: "Unauthorized" });

    let photoUrl = complaint.photo;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "cleanstreet_complaints");
      photoUrl = result.secure_url;
    }

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      { ...req.body, photo: photoUrl },
      { new: true }
    );

    res.json({ message: "Complaint updated successfully", complaint: updated });
  } catch (err) {
    console.error("❌ Error editing complaint:", err);
    res.status(500).json({ message: "Error editing complaint" });
  }
};

// =======================================================
// 🗑️ DELETE COMPLAINT
// =======================================================
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (complaint.user.toString() !== (req.user._id || req.user.id))
      return res.status(403).json({ message: "Unauthorized" });

    await complaint.deleteOne();
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting complaint:", err);
    res.status(500).json({ message: "Error deleting complaint" });
  }
};

// =======================================================
// 👤 USER COMPLAINTS
// =======================================================
export const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id || req.user.id }).sort({
      createdAt: -1,
    });
    res.json(complaints);
  } catch (err) {
    console.error("❌ Error fetching user complaints:", err);
    res.status(500).json({ message: "Error fetching user complaints" });
  }
};

// =======================================================
// 🧍 VOLUNTEER ASSIGNED COMPLAINTS
// =======================================================
export const getAssignedComplaints = async (req, res) => {
  try {
    const volunteerId = req.user._id || req.user.id;
    const complaints = await Complaint.find({ volunteer: volunteerId })
      .populate("user volunteer", "username email role")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error("❌ Error fetching assigned complaints:", err);
    res.status(500).json({ message: "Error fetching assigned complaints" });
  }
};

// =======================================================
// 📍 NEARBY COMPLAINTS (Volunteer — Fully Working)
// =======================================================
export const getNearbyComplaints = async (req, res) => {
  try {
    const lat = parseFloat(req.query.latitude);
    const lng = parseFloat(req.query.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Missing or invalid coordinates" });
    }

    const complaints = await Complaint.find({ volunteer: null });
    const toRad = (v) => (v * Math.PI) / 180;

    const nearby = complaints.filter((c) => {
      if (!c.latitude || !c.longitude) return false;
      const R = 6371;
      const dLat = toRad(c.latitude - lat);
      const dLng = toRad(c.longitude - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat)) * Math.cos(toRad(c.latitude)) * Math.sin(dLng / 2) ** 2;
      const distance = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return distance <= 50;
    });

    res.status(200).json(nearby);
  } catch (err) {
    console.error("⚠️ Error in getNearbyComplaints:", err);
    res.status(500).json({ message: "Server error fetching nearby complaints" });
  }
};

// =======================================================
// 🤝 ASSIGN COMPLAINT (✅ Moves instantly to My Complaints)
// =======================================================
export const assignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.body;
    const io = req.app.get("io");

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.volunteer = req.user._id || req.user.id;
    complaint.status = "Assigned";
    await complaint.save();

    // ✅ Emit real-time update for frontend (moves instantly)
    io.emit("complaintAssigned", complaint);

    res.json({ message: "Complaint assigned successfully", complaint });
  } catch (err) {
    console.error("❌ Error assigning complaint:", err);
    res.status(500).json({ message: "Error assigning complaint" });
  }
};

// =======================================================
// 🚫 UNASSIGN COMPLAINT
// =======================================================
export const unassignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.body;
    const io = req.app.get("io");

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.volunteer = null;
    complaint.status = "Pending";
    await complaint.save();

    // ✅ Emit update to move back to Nearby list
    io.emit("complaintUnassigned", complaint);

    res.json({ message: "Complaint unassigned successfully", complaint });
  } catch (err) {
    console.error("❌ Error unassigning complaint:", err);
    res.status(500).json({ message: "Error unassigning complaint" });
  }
};

// =======================================================
// 🔄 UPDATE COMPLAINT STATUS
// =======================================================
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.status = status;
    await complaint.save();

    res.json({ message: "Status updated successfully", complaint });
  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(500).json({ message: "Error updating status" });
  }
};

// =======================================================
// 🧮 DASHBOARD STATS
// =======================================================
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    let total = 0, pending = 0, resolved = 0, inProgress = 0;

    if (role === "user") {
      total = await Complaint.countDocuments({ user: userId });
      pending = await Complaint.countDocuments({ user: userId, status: "Pending" });
      resolved = await Complaint.countDocuments({ user: userId, status: "Resolved" });
      inProgress = await Complaint.countDocuments({ user: userId, status: "In Progress" });
    } else if (role === "volunteer") {
      total = await Complaint.countDocuments({ volunteer: userId });
      pending = await Complaint.countDocuments({ volunteer: userId, status: "Assigned" });
      resolved = await Complaint.countDocuments({ volunteer: userId, status: "Resolved" });
      inProgress = await Complaint.countDocuments({ volunteer: userId, status: "In Progress" });
    } else if (role === "admin") {
      total = await Complaint.countDocuments();
      pending = await Complaint.countDocuments({ status: "Pending" });
      resolved = await Complaint.countDocuments({ status: "Resolved" });
      inProgress = await Complaint.countDocuments({ status: "In Progress" });
    }

    res.json({ total, pending, resolved, inProgress });
  } catch (err) {
    console.error("❌ Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

// =======================================================
// 💬 ADD COMMENT
// =======================================================
export const addComment = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.comments.push({ user: req.user._id || req.user.id, text: req.body.text });
    await complaint.save();

    res.json({ message: "Comment added", comments: complaint.comments });
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};

// =======================================================
// 👍 UPVOTE COMPLAINT
// =======================================================
export const upvoteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const userId = req.user._id || req.user.id;

    if (complaint.upvotes.includes(userId)) {
      complaint.upvotes.pull(userId);
    } else {
      complaint.upvotes.push(userId);
      complaint.downvotes.pull(userId);
    }

    await complaint.save();
    res.json({ upvotes: complaint.upvotes.length, downvotes: complaint.downvotes.length });
  } catch (err) {
    console.error("❌ Error upvoting complaint:", err);
    res.status(500).json({ message: "Error upvoting complaint" });
  }
};

// =======================================================
// 👎 DOWNVOTE COMPLAINT
// =======================================================
export const downvoteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const userId = req.user._id || req.user.id;

    if (complaint.downvotes.includes(userId)) {
      complaint.downvotes.pull(userId);
    } else {
      complaint.downvotes.push(userId);
      complaint.upvotes.pull(userId);
    }

    await complaint.save();
    res.json({ upvotes: complaint.upvotes.length, downvotes: complaint.downvotes.length });
  } catch (err) {
    console.error("❌ Error downvoting complaint:", err);
    res.status(500).json({ message: "Error downvoting complaint" });
  }
};

// =======================================================
// 🧾 ADMIN: GET ALL COMPLAINTS
// =======================================================
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user volunteer", "username email role")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error("❌ Error fetching all complaints:", err);
    res.status(500).json({ message: "Error fetching complaints" });
  }
};
