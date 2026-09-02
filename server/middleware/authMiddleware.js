import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

const getCookie = (req, name) => {
  const header = req.headers.cookie || "";
  const prefix = `${name}=`;
  const part = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : null;
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = getCookie(req, "edubot_session");

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    if (!decoded?.userId || !mongoose.isValidObjectId(decoded.userId)) {
      return res.status(401).json({ success: false, message: "Invalid authentication token" });
    }

    // Re-check account state and role so a deactivated user immediately loses access.
    const user = await User.findById(decoded.userId)
      .select("_id name email role isActive avatar")
      .lean();

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Account is inactive or no longer exists" });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    };

    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
};

export default authMiddleware;
