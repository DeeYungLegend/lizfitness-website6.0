const bcrypt = require("bcryptjs");
const { getDb, json, todayStr, emailKey } = require("./utils/firebase");

// Same as signup.js, but requires ADMIN_SIGNUP_CODE (set in Netlify env vars)
// and creates the account with role:"admin" instead of "member". This is the
// only way to create an admin account from the site itself — no manual
// Firebase editing needed. Keep the code private; only share it with staff.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { name, email, password, adminCode } = JSON.parse(event.body || "{}");

    if (!name || !name.trim() || !email || !email.trim() || !password || password.length < 4) {
      return json(400, { error: "Name, email, and a password (4+ characters) are required." });
    }

    const expected = process.env.ADMIN_SIGNUP_CODE;
    if (!expected) {
      return json(500, { error: "Admin signup isn't set up yet — the site owner needs to set ADMIN_SIGNUP_CODE in Netlify environment variables." });
    }
    if (!adminCode || adminCode !== expected) {
      return json(403, { error: "That admin code isn't right." });
    }

    const db = getDb();
    const eKey = emailKey(email);

    const existingSnap = await db.ref(`emailIndex/${eKey}`).get();
    if (existingSnap.exists()) {
      return json(400, { error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newRef = db.ref("members").push();
    const memberId = newRef.key;

    const doc = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      joined: todayStr(),
      role: "admin",
    };

    await newRef.set(doc);
    await db.ref(`emailIndex/${eKey}`).set(memberId);

    return json(200, {
      id: memberId,
      name: doc.name,
      email: doc.email,
      joined: doc.joined,
      role: doc.role,
    });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
