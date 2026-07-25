const admin = require("firebase-admin");

// Reuses the same initialized app across warm function calls instead of
// re-initializing (and re-parsing the service account key) on every request.
function getDb() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const dbUrl = process.env.FIREBASE_DB_URL;

    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set in Netlify environment variables");
    if (!dbUrl) throw new Error("FIREBASE_DB_URL is not set in Netlify environment variables");

    const serviceAccount = JSON.parse(raw);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: dbUrl,
    });
  }
  return admin.database();
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Realtime Database keys can't contain '.', '#', '$', '[', ']', '/'
// Email addresses contain '.' and sometimes other odd characters, so we
// store a sanitized version to safely use as a lookup key.
function emailKey(email) {
  return email.trim().toLowerCase().replace(/[.#$/\[\]]/g, "_");
}

module.exports = { getDb, json, todayStr, emailKey };
