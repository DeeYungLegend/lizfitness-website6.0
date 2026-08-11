const { getDb, json } = require("./utils/firebase");
const { sendBulkEmail } = require("./utils/email");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { title, body } = JSON.parse(event.body || "{}");
    if (!title || !title.trim() || !body || !body.trim()) {
      return json(400, { error: "title and body are required." });
    }

    const db = getDb();
    const createdAt = new Date().toISOString();
    const annRef = db.ref("announcements").push();
    await annRef.set({ title: title.trim(), body: body.trim(), createdAt });

    // Fan out an in-app notification to every member.
    const membersSnap = await db.ref("members").get();
    const membersObj = membersSnap.exists() ? membersSnap.val() : {};
    const memberIds = Object.keys(membersObj);
    await Promise.all(memberIds.map((id) =>
      db.ref(`notifications/${id}`).push({
        title: `New: ${title.trim()}`,
        body: body.trim().slice(0, 140),
        type: "announcement",
        announcementId: annRef.key,
        read: false,
        createdAt,
      })
    ));

    // Email the newsletter list (skipped gracefully if RESEND_API_KEY isn't set yet).
    const subsSnap = await db.ref("newsletter/subscribers").get();
    const subsObj = subsSnap.exists() ? subsSnap.val() : {};
    const memberEmails = Object.values(membersObj).map((m) => m.email);
    const subscriberEmails = Object.values(subsObj).map((s) => s.email);
    const recipients = [...memberEmails, ...subscriberEmails];

    let emailResult = { count: 0 };
    if (recipients.length) {
      emailResult = await sendBulkEmail(
        recipients,
        title.trim(),
        `<h2>${title.trim()}</h2><p>${body.trim().replace(/\n/g, "<br>")}</p><p style="color:#888;font-size:12px;">Lizfitness Gym — Ogba, Lagos</p>`
      );
    }

    return json(200, { id: annRef.key, title, body, createdAt, notified: memberIds.length, emailed: emailResult.count || 0 });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
