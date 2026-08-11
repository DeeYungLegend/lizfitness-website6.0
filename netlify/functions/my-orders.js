const { getDb, json } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const memberId = event.queryStringParameters && event.queryStringParameters.memberId;
    if (!memberId) return json(400, { error: "memberId query parameter is required." });

    const db = getDb();
    const snap = await db.ref("orders").orderByChild("memberId").equalTo(memberId).get();
    const ordersObj = snap.exists() ? snap.val() : {};
    const orders = Object.entries(ordersObj)
      .map(([id, o]) => ({ id, ...o }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return json(200, { orders });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
