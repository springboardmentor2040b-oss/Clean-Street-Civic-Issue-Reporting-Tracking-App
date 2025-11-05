
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const verifyToken = async (req, res, next) => {
  try {
    // 🔹 Extract token from cookie or Authorization header
    let token =
      req.cookies?.token ||
      req.headers["authorization"]?.split(" ")[1] || 
      null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    // 🔹 Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Fetch user (excluding password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 Attach user to request for next middleware/controllers
    req.user = user;

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);

    // 🔹 Handle token expiration separately
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
