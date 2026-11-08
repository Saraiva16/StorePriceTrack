// Service Worker para notificações Web Push no Store Price Track
self.addEventListener('push', function(event) {
  let data = {
    title: 'Nova Nota Fiscal Recebida',
    body: 'Uma nova nota fiscal foi adicionada e está aguardando curadoria.',
    url: '/admin/curation'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const title = data.title || 'Store Price Track';
  const options = {
    body: data.body || data.message || 'Nova nota disponível.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [250, 100, 250, 100, 250], // Padrão de vibração/apito no celular
    data: {
      url: data.url || '/admin/curation',
      referenceId: data.referenceId
    },
    actions: [
      { action: 'open_curation', title: 'Ver Nota' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/admin/curation';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
