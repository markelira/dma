import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Use HTTP/1.1 REST API instead of gRPC for faster cold starts
// See: https://firebase.google.com/docs/functions/tips
admin.firestore().settings({
  preferRest: true
});

export const auth = admin.auth();
export const firestore = admin.firestore();