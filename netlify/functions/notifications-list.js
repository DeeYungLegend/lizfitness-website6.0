const { getDb, json } = require("./utils/firebase");

// scope is either "admin" (owner's notification feed) or a memberId (that
// member's own feed) — both live under the same notifications/{scope} node.
exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const scope = event.queryStringParameters && event.queryStringParameters.scope;
    if (!scope) return json(400, { error: "scope query parameter is required." });

    const db = getDb();
    const snap = await db.ref(`notifications/${scope}`).get();
    const obj = snap.exists() ? snap.val() : {};
    const notifications = Object.entries(obj)
      .map(([id, n]) => ({ id, ...n }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return json(200, { notifications });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
