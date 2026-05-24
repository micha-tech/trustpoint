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

  return initializeAdminApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(
        /\\n/g,
        "\n"
      ),
    }),
  });
}

export const adminApp = getAdminApp();
export const adminAuth = getAdminAuth(adminApp);
