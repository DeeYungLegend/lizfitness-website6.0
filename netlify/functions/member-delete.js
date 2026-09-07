const { getDb, json, emailKey } = require("./utils/firebase");

// Admin action: permanently remove an account and everything tied to it
// (attendance, notifications, message thread, emailIndex entry, and any
// orders they placed) — for wiping out test accounts, unlike member-revoke
// which only turns off membershipActive and leaves the account intact.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { memberId } = JSON.parse(event.body || "{}");
    if (!memberId) return json(400, { error: "memberId is required." });

    const db = getDb();
    const memberSnap = await db.ref(`members/${memberId}`).get();
    const member = memberSnap.val();
    if (!member) return json(404, { error: "Member not found." });

    if ((member.role || "member") === "admin") {
      const allSnap = await db.ref("members").orderByChild("role").equalTo("admin").get();
      const adminCount = allSnap.exists() ? Object.keys(allSnap.val()).length : 0;
      if (adminCount <= 1) {
        return json(400, { error: "Can't delete the only remaining admin account." });
      }
    }

    const ordersSnap = await db.ref("orders").orderByChild("memberId").equalTo(memberId).get();

    const updates = {
      [`members/${memberId}`]: null,
      [`attendance/${memberId}`]: null,
      [`notifications/${memberId}`]: null,
      [`messages/${memberId}`]: null,
      [`emailIndex/${emailKey(member.email)}`]: null,
    };
    if (ordersSnap.exists()) {
      Object.keys(ordersSnap.val()).forEach((orderId) => { updates[`orders/${orderId}`] = null; });
    }

    await db.ref().update(updates);

    return json(200, { ok: true });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
