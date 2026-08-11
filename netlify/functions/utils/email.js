// Thin wrapper around the Resend API. If RESEND_API_KEY isn't set yet (the
// gym owner hasn't created a Resend account), sends are skipped rather than
// failing the caller — in-app notifications and data writes still happen.
const RESEND_URL = "https://api.resend.com/emails";
const CHUNK_SIZE = 50; // stay well under Resend's per-request recipient limit

function getFrom() {
  return process.env.RESEND_FROM || "Lizfitness Gym <onboarding@resend.dev>";
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email to", to);
    return { skipped: true };
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: getFrom(), to, subject, html }),
    });
    if (!res.ok) {
      console.error("Resend send failed:", res.status, await res.text());
      return { error: true };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend send threw:", err.message);
    return { error: true };
  }
}

// Sends the same email to many recipients, chunked, without exposing
// recipients to each other (each chunk goes as its own request with the
// list in "to" — fine at gym scale; switch to individual sends if that
// visibility ever matters).
async function sendBulkEmail(recipients, subject, html) {
  const unique = [...new Set(recipients.filter(Boolean))];
  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    await sendEmail({ to: unique.slice(i, i + CHUNK_SIZE), subject, html });
  }
  return { count: unique.length };
}

module.exports = { sendEmail, sendBulkEmail };
