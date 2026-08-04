const { getDb, json } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const memberId = event.queryStringParameters && event.queryStringParameters.memberId;
    if (!memberId) return json(400, { error: "memberId query parameter is required." });

    const db = getDb();
    const snap = await db.ref(`attendance/${memberId}`).get();
    const dates = snap.exists() ? Object.keys(snap.val()).sort() : [];

    return json(200, { dates });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
