// Firebase Messaging Service Worker
// Merged with PWA worker to avoid conflicts
importScripts('/sw.js');

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDE_xFL36AlFB-3ZhhP6eia_4LCfGpUzc4",
    authDomain: "nuzul-d2161.firebaseapp.com",
    projectId: "nuzul-d2161",
    storageBucket: "nuzul-d2161.firebasestorage.app",
    messagingSenderId: "1057782250848",
    appId: "1:1057782250848:web:fc5af5057bf7f43f877205",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message:', payload);

    // DEDUPLICATION STRATEGY:
    // We always show the notification manually. By using a constant 'tag',
    // the browser will automatically deduplicate and replace any existing 
    // notification with the same tag, effectively fixing the "double push" 
    // issue without risking "zero notifications".
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Nuzul';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'nuzul-notification', // This handles deduplication at the OS level
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
