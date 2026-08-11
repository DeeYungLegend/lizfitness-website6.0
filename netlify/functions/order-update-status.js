const { getDb, json } = require("./utils/firebase");

const ALLOWED = ["pending", "confirmed", "cancelled"];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { orderId, status } = JSON.parse(event.body || "{}");
    if (!orderId || !ALLOWED.includes(status)) {
      return json(400, { error: "orderId and a valid status (pending, confirmed, cancelled) are required." });
    }

    const db = getDb();
    const orderRef = db.ref(`orders/${orderId}`);
    const snap = await orderRef.get();
    if (!snap.exists()) return json(404, { error: "Order not found." });

    await orderRef.update({ status });

    const order = snap.val();
    await db.ref(`notifications/${order.memberId}`).push({
      title: "Order update",
      body: `Your order for ₦${Number(order.total).toLocaleString("en-NG")} is now "${status}".`,
      type: "order",
      orderId,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return json(200, { id: orderId, status });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
