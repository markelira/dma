const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  projectId: 'dmaapp-477d4'
});

const auth = admin.auth();

async function deleteUser(uid, email) {
  try {
    await auth.deleteUser(uid);
    console.log('✅ Törölve: ' + email + ' (UID: ' + uid + ')');
  } catch (error) {
    console.log('❌ Hiba: ' + error.message);
  }
}

async function main() {
  // toth.karoly.w@gmail.com
  await deleteUser('qs8YCIv3OtNlWFVqyzprnDywyCk2', 'toth.karoly.w@gmail.com');

  // wok2boxoffice@gmail.com
  await deleteUser('luM8mwVFvcXr8Ra55h6iTekWySV2', 'wok2boxoffice@gmail.com');

  console.log('\nKész! Mindkét felhasználó újra regisztrálhat.');
  process.exit(0);
}

main().catch(console.error);
