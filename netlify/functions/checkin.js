const { getDb, json, todayStr } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { memberId } = JSON.parse(event.body || "{}");
    if (!memberId) return json(400, { error: "memberId is required." });

    const db = getDb();
    const today = todayStr();

    // Using the date itself as the key makes this naturally idempotent —
    // checking in twice on the same day just overwrites the same entry.
    await db.ref(`attendance/${memberId}/${today}`).set(true);

    const snap = await db.ref(`attendance/${memberId}`).get();
    const dates = snap.exists() ? Object.keys(snap.val()).sort() : [];

    return json(200, { dates });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
