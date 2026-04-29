const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production (Railway): Read from the environment variable string
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    // Local Development: Read from the local file
    serviceAccount = require('./firebaseServiceAccount.json');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore('rajesh-work-sync');

module.exports = { admin, db };