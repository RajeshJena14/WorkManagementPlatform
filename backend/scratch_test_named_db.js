const admin = require('firebase-admin');
const serviceAccount = require('./src/config/firebaseServiceAccount.json');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

try {
  const db = getFirestore('rajesh-work-sync');
  db.collection('users').limit(1).get().then(snapshot => {
    console.log('Successfully connected and queried named database!');
    console.log('Docs found:', snapshot.size);
    process.exit(0);
  }).catch(e => {
    console.error('Query error:', e.message);
    process.exit(1);
  });
} catch (e) {
  console.error('Init error:', e.message);
  process.exit(1);
}
