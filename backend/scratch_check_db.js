const { GoogleAuth } = require('google-auth-library');
const path = require('path');

const auth = new GoogleAuth({
  keyFilename: path.join(__dirname, 'src', 'config', 'firebaseServiceAccount.json'),
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

async function main() {
  const client = await auth.getClient();
  const projectId = 'worksync-aa1e4';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;
  
  try {
    const res = await client.request({ url });
    console.log("Databases found:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error fetching databases:', err.message);
  }
}

main();
