const getAuthHeaders = () => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getNotifications(page = 0, size = 20) {
  const res = await fetch(`/api/notifications?page=${page}&size=${size}`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Falha ao carregar notificações.');
  return await res.json();
}

export async function getUnreadCount() {
  const res = await fetch('/api/notifications/unread-count', {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data?.unreadCount || 0;
}

export async function markAsRead(id) {
  await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders() }
  });
}

export async function markAllAsRead() {
  await fetch('/api/notifications/read-all', {
    method: 'PATCH',
    headers: { ...getAuthHeaders() }
  });
}

export async function sendTestPush() {
  const res = await fetch('/api/notifications/test-push', {
    method: 'POST',
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Falha ao disparar teste de notificação.');
  return await res.json();
}

export async function getVapidPublicKey() {
  const res = await fetch('/api/notifications/vapid-public-key', {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Chave VAPID indisponível.');
  const data = await res.json();
  return data?.publicKey;
}

export async function subscribeToWebPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Web Push não é suportado por este navegador.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificação negada pelo usuário.');
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) {
    throw new Error('Chave pública VAPID não configurada no servidor.');
  }

  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey
  });

  const res = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(subscription.toJSON())
  });

  if (!res.ok) throw new Error('Falha ao registrar inscrição no servidor.');

  return subscription;
}
