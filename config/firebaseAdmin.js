const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    if (admin.apps.length === 0) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
            });
            console.log('Firebase Admin initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase Admin:', error);
            throw error;
        }
    }
    return admin;
};

// Get Firestore instance
const getFirestore = () => {
    const adminInstance = initializeFirebase();
    return adminInstance.firestore();
};

module.exports = {
    initializeFirebase,
    getFirestore,
    admin,
};
