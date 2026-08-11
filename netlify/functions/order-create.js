const { getDb, json } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { memberId, items } = JSON.parse(event.body || "{}");
    if (!memberId || !Array.isArray(items) || !items.length) {
      return json(400, { error: "memberId and at least one cart item are required." });
    }

    const db = getDb();
    const memberSnap = await db.ref(`members/${memberId}`).get();
    const member = memberSnap.val();
    if (!member) return json(400, { error: "Member not found. Please log in again." });

    const cleanItems = items.map((it) => ({
      category: String(it.category || "").slice(0, 120),
      plan: String(it.plan || "").slice(0, 120),
      price: Math.max(0, Number(it.price) || 0),
      qty: Math.max(1, Math.min(50, Math.floor(Number(it.qty) || 1))),
    }));
    const total = cleanItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    const createdAt = new Date().toISOString();

    const orderRef = db.ref("orders").push();
    const order = {
      memberId,
      memberName: member.name,
      memberEmail: member.email,
      items: cleanItems,
      total,
      status: "pending",
      createdAt,
    };
    await orderRef.set(order);

    await db.ref("notifications/admin").push({
      title: "New order placed",
      body: `${member.name} placed an order for ₦${total.toLocaleString("en-NG")}.`,
      type: "order",
      orderId: orderRef.key,
      read: false,
      createdAt,
    });

    return json(200, { id: orderRef.key, ...order });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
