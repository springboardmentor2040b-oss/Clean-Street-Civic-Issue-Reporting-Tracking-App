import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import { recordLog } from './adminLogController.js'
import ImageKit from "imagekit";

// Helper: safe regex from string
function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build a Mongo filter based on the caller's role/location
async function buildFilterForUser(req) {
  // Admin can see all
  if (req.user?.role === "admin") {
    return {};
  }

  // Volunteers: restrict to their configured location
  if (req.user?.role === "volunteer") {
    // Fetch latest user document to get location (not present in JWT)
    const me = await User.findById(req.user.id).select("location");
    const myLoc = (me?.location || "").trim();
    if (!myLoc) {
      // No location set for volunteer -> show nothing
      return { _id: { $in: [] } };
    }
    return { address: { $regex: escapeRegex(myLoc), $options: "i" } };
  }

  // Default: existing behavior (return all)
  return {};
}

export async function listRecent(req, res) {
  const filter = await buildFilterForUser(req);
  const items = await Complaint.find(filter).sort({ created_at: -1 }).limit(5);
  res.json(items);
}

export async function listAll(_req, res) {
  // Unrestricted list: show all complaints regardless of role
  const items = await Complaint.find({}).sort({ created_at: -1 });
  res.json(items);
}

// Nearby for volunteers/admins: filter to volunteer's configured location
export async function listNearby(req, res) {
  const filter = await buildFilterForUser(req);
  const items = await Complaint.find(filter).sort({ created_at: -1 });
  res.json(items);
}

export async function createComplaint(req, res) {
  const { title, description, address } = req.body;
  // location_coords may come as string "lat,lng"
  let { location_coords } = req.body;
  if (!title) return res.status(400).json({ message: "Title required" });

  // Handle optional photos upload to ImageKit
  let photoUrls = [];
  try {
    const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } =
      process.env;
    if (
      !IMAGEKIT_PUBLIC_KEY ||
      !IMAGEKIT_PRIVATE_KEY ||
      !IMAGEKIT_URL_ENDPOINT
    ) {
      if (req.files && (req.files.photo || req.files.photos)) {
        return res.status(500).json({ message: "ImageKit not configured" });
      }
    }

    const imagekit =
      IMAGEKIT_PUBLIC_KEY && IMAGEKIT_PRIVATE_KEY && IMAGEKIT_URL_ENDPOINT
        ? new ImageKit({
            publicKey: IMAGEKIT_PUBLIC_KEY,
            privateKey: IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: IMAGEKIT_URL_ENDPOINT,
          })
        : null;

    const files = Array.isArray(req.files) ? req.files : [];

    for (const f of files) {
      const safeName =
        (f.originalname || "photo").replace(/[^a-zA-Z0-9._-]/g, "") ||
        "photo.jpg";
      if (imagekit) {
        const result = await imagekit.upload({
          file: f.buffer,
          fileName: `complaint_${Date.now()}_${safeName}`,
          folder: "clean_street/complaints",
        });
        photoUrls.push(result.url);
      }
    }
  } catch (e) {
    return res.status(500).json({ message: "Photo upload failed" });
  }

  const c = await Complaint.create({
    user_id: req.user.id,
    title,
    description,
    photos: photoUrls,
    location_coords: location_coords || "",
    address,
  });
  res.status(201).json(c);
}

export async function updateComplaintStatus(req, res) {
  const { id } = req.params
  const { status, assigned_to } = req.body
  const allowed = ["received", "in_review", "resolved"]
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" })
  }

  // Fetch first so we know previous status for logging
  const doc = await Complaint.findById(id)
  if (!doc) return res.status(404).json({ message: 'Complaint not found' })

  const prevStatus = doc.status
  let statusChanged = false
  if (status && status !== prevStatus) {
    doc.status = status
    statusChanged = true
  }
  if (typeof assigned_to === 'string') {
    doc.assigned_to = assigned_to
  }

  const updated = await doc.save()

  // Construct richer log message
  let action
  if (statusChanged) {
    action = `complaint "${updated.title}" status updated from ${prevStatus} to ${updated.status}`
  } else {
    action = `complaint "${updated.title}" status unchanged (still ${updated.status})`
  }
  await recordLog(req.user.id, action)
  res.json(updated)
}

export async function deleteComplaint(req, res) {
  const { id } = req.params
  const doc = await Complaint.findById(id)
  if (!doc) return res.status(404).json({ message: 'Complaint not found' })
  if (String(doc.user_id) !== String(req.user.id)) {
    return res.status(403).json({ message: 'You can delete only your own complaint' })
  }
  await Complaint.deleteOne({ _id: id })
  await recordLog(req.user.id, 'delete_complaint')
  res.json({ ok: true })
}
