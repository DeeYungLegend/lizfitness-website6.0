const { getDb, json, emailKey, todayStr } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { email } = JSON.parse(event.body || "{}");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return json(400, { error: "A valid email is required." });
    }

    const db = getDb();
    const key = emailKey(email);
    await db.ref(`newsletter/subscribers/${key}`).set({
      email: email.trim().toLowerCase(),
      subscribedAt: todayStr(),
    });

    return json(200, { ok: true });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
