const { getDb, json } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { scope, notifId, markAll } = JSON.parse(event.body || "{}");
    if (!scope) return json(400, { error: "scope is required." });

    const db = getDb();

    if (markAll) {
      const snap = await db.ref(`notifications/${scope}`).get();
      const obj = snap.exists() ? snap.val() : {};
      const updates = {};
      Object.keys(obj).forEach((id) => { updates[`${id}/read`] = true; });
      if (Object.keys(updates).length) await db.ref(`notifications/${scope}`).update(updates);
      return json(200, { ok: true });
    }

    if (!notifId) return json(400, { error: "notifId is required (or set markAll)." });
    await db.ref(`notifications/${scope}/${notifId}`).update({ read: true });
    return json(200, { ok: true });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
