const bcrypt = require("bcryptjs");
const { getDb, json, emailKey } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { email, password } = JSON.parse(event.body || "{}");
    if (!email || !password) return json(400, { error: "Email and password are required." });

    const db = getDb();
    const eKey = emailKey(email);

    const idSnap = await db.ref(`emailIndex/${eKey}`).get();
    if (!idSnap.exists()) return json(401, { error: "No account found with that email." });

    const memberId = idSnap.val();
    const memberSnap = await db.ref(`members/${memberId}`).get();
    const member = memberSnap.val();

    if (!member) return json(401, { error: "No account found with that email." });

    const ok = await bcrypt.compare(password, member.passwordHash);
    if (!ok) return json(401, { error: "Incorrect password." });

    return json(200, {
      id: memberId,
      name: member.name,
      email: member.email,
      joined: member.joined,
      role: member.role || "member",
    });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
