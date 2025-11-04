import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import multer from "multer";
import ImageKit from "imagekit";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import complaintRoutes from "./routes/complaints.js";
import commentRoutes from "./routes/comments.js";
import voteRoutes from "./routes/votes.js";
import adminLogRoutes from "./routes/adminLogs.js";
import passwordRoutes from "./routes/password.js";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Initialize ImageKit SDK
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", passwordRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/admin-logs", adminLogRoutes);

// Multer memory storage for uploading to ImageKit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Profile photo upload endpoint
import { authRequired } from "./middleware/auth.js";
import User from "./models/User.js";
app.post(
  "/api/users/me/photo",
  authRequired,
  upload.single("photo"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
      const {
        IMAGEKIT_PUBLIC_KEY,
        IMAGEKIT_PRIVATE_KEY,
        IMAGEKIT_URL_ENDPOINT,
      } = process.env;
      if (
        !IMAGEKIT_PUBLIC_KEY ||
        !IMAGEKIT_PRIVATE_KEY ||
        !IMAGEKIT_URL_ENDPOINT
      ) {
        return res.status(500).json({ message: "ImageKit not configured" });
      }
      const safeName =
        (req.file.originalname || "photo").replace(/[^a-zA-Z0-9._-]/g, "") ||
        `photo${path.extname(req.file.originalname || ".jpg")}`;
      const result = await imagekit.upload({
        file: req.file.buffer,
        fileName: `profile_${Date.now()}_${safeName}`,
        folder: "clean_street/profiles",
      });
      const publicUrl = result.url;
      const updated = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { profile_photo: publicUrl } },
        { new: true }
      ).select("-password");
      res.json({ message: "Uploaded", url: publicUrl, user: updated });
    } catch (err) {
      next(err);
    }
  }
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});

app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
