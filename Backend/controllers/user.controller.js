import { User } from "../models/User.js";

// GET /api/users/search
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.json({ users: [] });
    }

    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const substringRegex = new RegExp(escaped, "i"); 

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: substringRegex } },
        { phone: { $regex: substringRegex } },
      ],
    }).select("-password");

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users/upload-profile-pic
export const uploadProfilePic = async (req, res) => {
  try {
    const imageUrl = req.file?.path;
    if (!imageUrl) return res.status(400).json({ message: "No image uploaded" });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: imageUrl },
      { new: true }
    ).select("-password");

    res.json({ user, message: "Profile picture updated!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/remove-profile-pic
export const removeProfilePic = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: null },
      { new: true }
    ).select("-password");

    res.json({ user, message: "Profile picture removed!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};