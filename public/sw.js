// DoseMate Service Worker for Smart Medicine Reminders
const CACHE_NAME = 'dosemate-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If action is Taken, Snooze, etc., broadcast to open tabs
      if (clientList.length > 0) {
        const client = clientList[0];
        client.focus();
        client.postMessage({
          type: 'DOSEMATE_NOTIFICATION_ACTION',
          action: action,
          reminderId: data.reminderId,
          medicineId: data.medicineId,
          medicineName: data.medicineName,
        });
      } else if (self.clients.openWindow) {
        return self.clients.openWindow(`/?action=${action || 'open'}&medicineId=${data.medicineId || ''}`);
      }
    })
  );
});

// Allow client window to communicate with Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      ...options,
    });
  }
});
