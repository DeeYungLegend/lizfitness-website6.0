const { getDb, json } = require("./utils/firebase");
const { sendEmail } = require("./utils/email");

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
      memberPhone: member.phone || "",
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

    // Best-effort email straight to the owner's personal inbox so she finds
    // out without opening the site — skipped silently if ADMIN_NOTIFY_EMAIL
    // or RESEND_API_KEY aren't set (same graceful-degradation as everywhere else).
    const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL;
    if (notifyEmail) {
      const itemsHtml = cleanItems
        .map((it) => `${it.qty}&times; ${it.plan} (${it.category}) &mdash; &#8358;${(it.price * it.qty).toLocaleString("en-NG")}`)
        .join("<br>");
      // Awaited on purpose — a serverless function's background work isn't
      // guaranteed to finish once the response is returned, so this has to
      // complete (or fail) before we respond. .catch keeps an email hiccup
      // from failing the order itself, which has already been saved above.
      await sendEmail({
        to: notifyEmail,
        subject: `New order — ${member.name} — ₦${total.toLocaleString("en-NG")}`,
        html: `
          <h2>New order placed</h2>
          <p><b>Customer:</b> ${member.name}<br>
          <b>Phone:</b> ${member.phone || "not provided"}<br>
          <b>Email:</b> ${member.email}</p>
          <p><b>Order:</b><br>${itemsHtml}</p>
          <p><b>Total: &#8358;${total.toLocaleString("en-NG")}</b></p>
          <p style="color:#888;font-size:12px;">Status is "pending" until you confirm payment in the Admin Dashboard's Orders tab.</p>
        `,
      }).catch(() => {});
    }

    return json(200, { id: orderRef.key, ...order });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
