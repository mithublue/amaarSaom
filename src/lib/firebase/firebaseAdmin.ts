import admin from 'firebase-admin';

function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
        return null;
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        return null;
    }
}

export async function sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ success: number; failure: number }> {
    const app = getFirebaseAdmin();
    if (!app) return { success: 0, failure: 0 };

    const messaging = admin.messaging(app);

    try {
        const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
                title,
                body,
            },
            webpush: {
                notification: {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                },
                fcmOptions: {
                    link: '/',
                },
            },
            ...(data && { data }),
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log(`Push sent: ${response.successCount} success, ${response.failureCount} failure`);

        return {
            success: response.successCount,
            failure: response.failureCount,
        };
    } catch (error) {
        console.error('Push notification error:', error);
        return { success: 0, failure: 0 };
    }
}
