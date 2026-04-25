import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { searchUsers } from "../controllers/user.controller.js";
import { User } from "../models/User.js";

const router = express.Router();

router.get("/search", protect, searchUsers);


router.get("/:userId/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("lastSeen");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ lastSeen: user.lastSeen });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;