self.addEventListener('push', e => {
  let data = {};
  try { data = JSON.parse(e.data?.text() || '{}'); } catch(_) {}
  e.waitUntil(self.registration.showNotification(data.title || 'New message', {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || 'https://everythingmarket.co.za' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || 'https://everythingmarket.co.za'));
});
