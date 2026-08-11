const { getDb, json } = require("./utils/firebase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { memberId, from, text } = JSON.parse(event.body || "{}");
    if (!memberId || !["admin", "member"].includes(from) || !text || !text.trim()) {
      return json(400, { error: "memberId, from (admin|member), and text are required." });
    }

    const db = getDb();
    const memberSnap = await db.ref(`members/${memberId}`).get();
    const member = memberSnap.val();
    if (!member) return json(400, { error: "Member not found." });

    const createdAt = new Date().toISOString();
    const msgRef = db.ref(`messages/${memberId}`).push();
    await msgRef.set({ from, text: text.trim().slice(0, 2000), read: false, createdAt });

    if (from === "admin") {
      await db.ref(`notifications/${memberId}`).push({
        title: "New message from Lizfitness Gym",
        body: text.trim().slice(0, 140),
        type: "message",
        read: false,
        createdAt,
      });
    } else {
      await db.ref("notifications/admin").push({
        title: `New message from ${member.name}`,
        body: text.trim().slice(0, 140),
        type: "message",
        memberId,
        read: false,
        createdAt,
      });
    }

    return json(200, { id: msgRef.key, from, text: text.trim(), createdAt });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
