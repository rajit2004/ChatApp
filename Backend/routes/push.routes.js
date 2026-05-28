import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { PushSubscription } from "../models/PushSubscription.js";

const router = express.Router();

// Save subscription
router.post("/subscribe", protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user._id;

    // ✅ Upsert — avoid duplicates
    await PushSubscription.findOneAndUpdate(
      { userId, "subscription.endpoint": subscription.endpoint },
      { userId, subscription },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove subscription on logout
router.post("/unsubscribe", protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({
      userId: req.user._id,
      "subscription.endpoint": endpoint,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;