const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications(api: any) {
  try {
    // ✅ Check support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push not supported");
      return;
    }

    // ✅ Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");

    // ✅ Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Push permission denied");
      return;
    }

    // ✅ Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    });

    // ✅ Save to backend
    await api.post("/push/subscribe", { subscription });

    console.log("✅ Push notifications enabled");
  } catch (err) {
    console.error("Push registration failed:", err);
  }
}

export async function unregisterPushNotifications(api: any) {
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await api.post("/push/unsubscribe", { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  } catch (err) {
    console.error("Push unregister failed:", err);
  }
}