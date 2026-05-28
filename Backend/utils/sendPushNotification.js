import webpush from "web-push";
import { PushSubscription } from "../models/PushSubscription.js";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendPushToUser(userId, payload) {
  try {
    const subs = await PushSubscription.find({ userId });
    if (!subs.length) return;

    const promises = subs.map(async (doc) => {
      try {
        await webpush.sendNotification(doc.subscription, JSON.stringify(payload));
      } catch (err) {
        // ✅ Remove invalid/expired subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: doc._id });
        }
      }
    });

    await Promise.all(promises);
  } catch (err) {
    console.error("Push notification error:", err.message);
  }
}