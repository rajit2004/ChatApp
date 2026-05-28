self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  const title = data.title || "New message";
  const options = {
    body: data.body || "You have a new message",
    icon: "/favicon.jpg",
    badge: "/favicon.jpg",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});