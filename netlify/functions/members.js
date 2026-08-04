const { getDb, json } = require("./utils/firebase");

// NOTE: same caveat as before — no access control on this endpoint yet.
// Fine for a small private deployment, worth locking down before wide launch.
exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const db = getDb();
    const membersSnap = await db.ref("members").get();
    const attendanceSnap = await db.ref("attendance").get();

    const membersObj = membersSnap.exists() ? membersSnap.val() : {};
    const attendanceObj = attendanceSnap.exists() ? attendanceSnap.val() : {};

    const result = Object.entries(membersObj).map(([id, m]) => {
      const dates = attendanceObj[id] ? Object.keys(attendanceObj[id]).sort() : [];
      return {
        id,
        name: m.name,
        email: m.email,
        joined: m.joined,
        visits: dates.length,
        dates,
      };
    });

    result.sort((a, b) => (a.joined > b.joined ? 1 : -1));

    return json(200, { members: result });
  } catch (err) {
    return json(500, { error: "Server error: " + err.message });
  }
};
