const { getDb } = require("./utils/firebase");
const { confirmMembershipOrder } = require("./utils/membership");

// Opened directly in a browser (clicked from the order-alert email), so this
// returns a simple HTML page rather than JSON.
function page(title, message, ok) {
  return {
    statusCode: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body{background:#0b0b0a;color:#f3ede1;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;}
        .box{max-width:420px;}
        h1{color:${ok ? "#caa042" : "#d9776b"};font-size:22px;}
        p{color:rgba(243,237,225,0.7);line-height:1.6;}
        a{color:#e8cd8f;}
      </style>
      </head><body><div class="box"><h1>${title}</h1><p>${message}</p></div></body></html>`,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return page("Method not allowed", "", false);

  try {
    const params = event.queryStringParameters || {};
    const { orderId, token } = params;
    if (!orderId || !token) return page("Missing info", "This confirmation link is incomplete.", false);

    const db = getDb();
    const orderRef = db.ref(`orders/${orderId}`);
    const snap = await orderRef.get();
    if (!snap.exists()) return page("Order not found", "This order doesn't exist anymore.", false);

    const order = snap.val();
    if (order.confirmToken !== token) {
      return page("Link not valid", "This confirmation link doesn't match this order.", false);
    }

    if (order.status === "confirmed") {
      return page("Already confirmed", `${order.memberName}'s ${order.isMembershipOrder ? "membership was already activated" : "order was already confirmed"}. Nothing more to do.`, true);
    }

    await orderRef.update({ status: "confirmed" });
    if (order.isMembershipOrder) {
      await confirmMembershipOrder(db, orderId, order);
    } else {
      await db.ref(`notifications/${order.memberId}`).push({
        title: "Order update",
        body: `Your order for ₦${Number(order.total).toLocaleString("en-NG")} is now "confirmed".`,
        type: "order",
        orderId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return page(
      "Payment confirmed!",
      order.isMembershipOrder
        ? `${order.memberName}'s membership is now active, and they've been emailed automatically. You're all set.`
        : `${order.memberName}'s order is marked confirmed, and they've been notified in the app. You're all set.`,
      true
    );
  } catch (err) {
    return page("Something went wrong", err.message, false);
  }
};
