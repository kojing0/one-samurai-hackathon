import * as admin from 'firebase-admin';

let app: admin.app.App;

export function getFirebaseApp(): admin.app.App {
  if (app) return app;

  app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  return app;
}

export function getFirestore(): admin.firestore.Firestore {
  return getFirebaseApp().firestore();
}

export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const auth = getFirebaseApp().auth();
  return auth.verifyIdToken(idToken);
}
