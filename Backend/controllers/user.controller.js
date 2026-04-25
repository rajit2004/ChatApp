import { User } from "../models/User.js";

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query; // /api/users/search?query=john

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      _id: { $ne: req.user._id }, // exclude logged in user
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    }).select("username email phone");

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};