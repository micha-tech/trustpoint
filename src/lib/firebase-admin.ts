import "server-only";

import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  cert,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

function getAdminApp() {
  const existing = getAdminApps();
  if (existing.length) return existing[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Missing Firebase Admin env vars: projectId=${!!projectId} clientEmail=${!!clientEmail} privateKey=${!!privateKey}`
    );
  }

  return initializeAdminApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _adminAuth: ReturnType<typeof getAdminAuth> | undefined;

export function getAdminAuthInstance() {
  if (!_adminAuth) {
    _adminAuth = getAdminAuth(getAdminApp());
  }
  return _adminAuth;
}
