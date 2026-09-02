const { getDb, json } = require("./utils/firebase");
const { isMemberActive } = require("./utils/membership");

// Re-fetches a member's current record. Needed because a browser's saved
// session is a snapshot from whenever they logged in — if an admin confirms
// their membership afterward (e.g. via the emailed link, which the member
// never touches), their open tab has no way to know until it checks again.
exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const memberId = event.queryStringParameters && event.queryStringParameters.memberId;
    if (!memberId) return json(400, { error: "memberId query parameter is required." });

    const db = getDb();
    const snap = await db.ref(`members/${memberId}`).get();
    const member = snap.val();
    if (!member) return json(404, { error: "Member not found." });

    return json(200, {
      id: memberId,
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      joined: member.joined,
      role: member.role || "member",
      membershipActive: isMemberActive(member),
      membershipPlan: member.membershipPlan || "",
      membershipExpiresAt: member.membershipExpiresAt || "",
    });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
