const bcrypt = require("bcryptjs");
const { getDb, json, todayStr, emailKey } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { name, email, phone, password } = JSON.parse(event.body || "{}");

    if (!name || !name.trim() || !email || !email.trim() || !phone || !phone.trim() || !password || password.length < 4) {
      return json(400, { error: "Name, email, phone number, and a password (4+ characters) are required." });
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
      phone: phone.trim(),
      passwordHash,
      joined: todayStr(),
      role: "member",
    };

    await newRef.set(doc);
    await db.ref(`emailIndex/${eKey}`).set(memberId);

    return json(200, {
      id: memberId,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      joined: doc.joined,
      role: doc.role,
    });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
