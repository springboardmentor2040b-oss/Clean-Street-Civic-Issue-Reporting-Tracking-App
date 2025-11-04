import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", required: true },
    photos: { type: [String], default: [], required: true },
    location_coords: { type: String, default: "" },
    address: { type: String, default: "", required: true },
    assigned_to: { type: String, default: "" },
    status: {
      type: String,
      enum: ["received", "in_review", "resolved"],
      default: "received",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Complaint", complaintSchema);
