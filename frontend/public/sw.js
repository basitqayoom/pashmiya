/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

interface PushMessageData {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data: PushMessageData = event.data.json();
    
    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'pashmiya-notification',
      data: data.data,
      vibrate: [100, 50, 100],
      actions: data.actions,
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Pashmiya', options)
    );
  } catch (err) {
    console.error('Push notification error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

export {};
