const { getDb, json } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const db = getDb();
    const snap = await db.ref("announcements").get();
    const obj = snap.exists() ? snap.val() : {};
    const announcements = Object.entries(obj)
      .map(([id, a]) => ({ id, ...a }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return json(200, { announcements });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
