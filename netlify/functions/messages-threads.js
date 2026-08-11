const { getDb, json } = require("./utils/firebase");

// Admin-side inbox summary: one row per member who has at least one
// message, with a preview of the last message and an unread-from-member count.
exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const db = getDb();
    const [membersSnap, messagesSnap] = await Promise.all([
      db.ref("members").get(),
      db.ref("messages").get(),
    ]);
    const membersObj = membersSnap.exists() ? membersSnap.val() : {};
    const messagesObj = messagesSnap.exists() ? messagesSnap.val() : {};

    const threads = Object.entries(messagesObj).map(([memberId, msgs]) => {
      const list = Object.values(msgs).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
      const last = list[list.length - 1];
      const unread = list.filter((m) => m.from === "member" && !m.read).length;
      const member = membersObj[memberId] || {};
      return {
        memberId,
        memberName: member.name || "Unknown member",
        memberEmail: member.email || "",
        lastText: last ? last.text : "",
        lastFrom: last ? last.from : "",
        lastAt: last ? last.createdAt : "",
        unread,
      };
    }).sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));

    return json(200, { threads });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
