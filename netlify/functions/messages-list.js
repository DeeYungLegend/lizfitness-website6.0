const { getDb, json } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const params = event.queryStringParameters || {};
    const memberId = params.memberId;
    if (!memberId) return json(400, { error: "memberId query parameter is required." });

    const db = getDb();
    const ref = db.ref(`messages/${memberId}`);
    const snap = await ref.get();
    const obj = snap.exists() ? snap.val() : {};
    const messages = Object.entries(obj)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    // Viewing the thread as "admin" marks the member's messages read, and vice versa.
    if (params.viewerRole === "admin" || params.viewerRole === "member") {
      const otherFrom = params.viewerRole === "admin" ? "member" : "admin";
      const updates = {};
      messages.forEach((m) => { if (m.from === otherFrom && !m.read) updates[`${m.id}/read`] = true; });
      if (Object.keys(updates).length) await ref.update(updates);
    }

    return json(200, { messages });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
