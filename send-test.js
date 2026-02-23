
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
    process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const token = "c9diw0tK7j2vd7Mk0_Mzhr:APA91bGuRaJ-D1Hp0tErjAMxw2VC-a3izP9nBh6VxPIPK66oDq9X_XNMJl4";

async function sendTest() {
    const message = {
        token: token,
        notification: {
            title: 'Nuzul Debug 🛠️',
            body: 'Is this reaching you? Testing from script.',
        },
        webpush: {
            notification: {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                tag: 'nuzul-notification',
            },
            fcmOptions: {
                link: '/',
            },
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

sendTest();
