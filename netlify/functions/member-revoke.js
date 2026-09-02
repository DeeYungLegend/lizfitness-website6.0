const { getDb, json } = require("./utils/firebase");

// Admin action: manually end a member's active status (e.g. they never paid
// by the due date, or a refund happened). Distinct from role — this only
// affects membershipActive, not whether the account is a member/admin.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { memberId } = JSON.parse(event.body || "{}");
    if (!memberId) return json(400, { error: "memberId is required." });

    const db = getDb();
    const memberSnap = await db.ref(`members/${memberId}`).get();
    const member = memberSnap.val();
    if (!member) return json(404, { error: "Member not found." });

    await db.ref(`members/${memberId}`).update({ membershipActive: false });

    await db.ref(`notifications/${memberId}`).push({
      title: "Membership ended",
      body: "Your membership is no longer active. Renew any time from the Membership page.",
      type: "membership",
      read: false,
      createdAt: new Date().toISOString(),
    });

    return json(200, { ok: true });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
