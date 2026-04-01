import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App;
let db: Firestore;

function getAdminApp(): App {
  if (!app) {
    const existing = getApps().find((a) => a.name === "admin");
    if (existing) {
      app = existing;
    } else {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        app = initializeApp(
          { credential: cert(serviceAccount) },
          "admin"
        );
      } else {
        // Fallback — project-id only (will work if running in Google Cloud / with ADC)
        app = initializeApp(
          {
            projectId:
              process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "leadcrm-e6bd5",
          },
          "admin"
        );
      }
    }
  }
  return app;
}

export function getAdminFirestore(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp());
  }
  return db;
}
