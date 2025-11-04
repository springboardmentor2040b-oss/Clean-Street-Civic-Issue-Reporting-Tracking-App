import { Router } from "express";
import multer from "multer";
import { authRequired } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roles.js";
import {
  createComplaint,
  listRecent,
  listAll,
} from "../controllers/complaintController.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.get("/", authRequired, listAll);
router.get("/recent", authRequired, listRecent);
// Accept multiple photos under the 'photos' field (up to 6)
router.post("/", authRequired, upload.array("photos", 6), createComplaint);

// Admin or Volunteer can update complaint status
import { updateComplaintStatus } from "../controllers/complaintController.js";
router.patch(
  "/:id/status",
  authRequired,
  requireRoles("admin", "volunteer"),
  updateComplaintStatus
);

// Owner can delete their own complaint
import { deleteComplaint } from "../controllers/complaintController.js";
router.delete(
  "/:id",
  authRequired,
  deleteComplaint
);

export default router;
