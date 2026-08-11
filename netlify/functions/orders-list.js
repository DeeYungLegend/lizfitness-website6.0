const { getDb, json } = require("./utils/firebase");

// NOTE: same caveat as members.js — no access control on this endpoint yet.
// Fine for a small private deployment, worth locking down before wide launch.
exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const db = getDb();
    const snap = await db.ref("orders").get();
    const ordersObj = snap.exists() ? snap.val() : {};
    const orders = Object.entries(ordersObj)
      .map(([id, o]) => ({ id, ...o }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return json(200, { orders });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
