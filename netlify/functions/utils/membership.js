const { sendEmail } = require("./email");

// Categories that represent paid membership (as opposed to one-off shop
// products like the supplement drinks). Must match the category names used
// in assets/js/app.js's MEMBERSHIP_PLANS exactly.
const MEMBERSHIP_CATEGORIES = ["Gym Session Fee", "Fitness Subscription", "Private Session (Home Monthly)"];

// How many days each plan covers, keyed by plan name. Used to compute
// membershipExpiresAt when an order is confirmed.
const PLAN_DURATION_DAYS = {
  "Daily": 1,
  "Weekly": 7,
  "Weekend": 2,
  "Monthly": 30,
  "Quarterly": 90,
  "Annually": 365,
  "Online Training Monthly": 30,
  "Personal Session Monthly": 30,
  "Mainland": 30,
  "Island": 30,
};

// Single source of truth for "is this member currently a paying member".
// A member with no membershipActive field at all predates this feature and
// is grandfathered in as active; everyone signing up from now on starts
// false and has to actually pay and get confirmed.
function isMemberActive(m) {
  if (typeof m.membershipActive !== "boolean") return true;
  if (!m.membershipActive) return false;
  if (m.membershipExpiresAt && new Date(m.membershipExpiresAt).getTime() < Date.now()) return false;
  return true;
}

function isMembershipOrder(order) {
  return (order.items || []).some((it) => MEMBERSHIP_CATEGORIES.includes(it.category));
}

function longestPlanDays(order) {
  const days = (order.items || [])
    .filter((it) => MEMBERSHIP_CATEGORIES.includes(it.category))
    .map((it) => PLAN_DURATION_DAYS[it.plan] || 30);
  return days.length ? Math.max(...days) : 30;
}

// Activates (or renews) a member's paid membership after an order is
// confirmed, and emails the customer to let them know. Shared by the admin
// dashboard's "Mark Confirmed" button and the one-click email confirm link,
// so both paths behave identically.
async function confirmMembershipOrder(db, orderId, order) {
  const memberSnap = await db.ref(`members/${order.memberId}`).get();
  const member = memberSnap.val();
  if (!member) return { ok: false, error: "Member not found." };

  const days = longestPlanDays(order);
  const now = Date.now();
  const currentExpiry = member.membershipExpiresAt ? new Date(member.membershipExpiresAt).getTime() : 0;
  const base = currentExpiry > now ? currentExpiry : now; // extend if still active, else start fresh
  const expiresAt = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
  const planLabel = order.items.map((it) => it.plan).join(", ");

  await db.ref(`members/${order.memberId}`).update({
    membershipActive: true,
    membershipPlan: planLabel,
    membershipExpiresAt: expiresAt,
  });

  await db.ref(`notifications/${order.memberId}`).push({
    title: "You're a full member!",
    body: `Your membership (${planLabel}) is active until ${expiresAt.slice(0, 10)}.`,
    type: "membership",
    read: false,
    createdAt: new Date().toISOString(),
  });

  await sendEmail({
    to: member.email,
    subject: "Welcome to Lizfitness Gym — you're a full member!",
    html: `
      <h2>You're in, ${member.name.split(" ")[0]}!</h2>
      <p>Your payment has been confirmed and your membership is now <b>active</b>.</p>
      <p><b>Plan:</b> ${planLabel}<br><b>Active until:</b> ${expiresAt.slice(0, 10)}</p>
      <p>Log back in any time to check in, message us, and shop the full catalog.</p>
      <p style="color:#888;font-size:12px;">Lizfitness Gym — Ogba, Lagos</p>
    `,
  }).catch(() => {});

  return { ok: true, expiresAt };
}

module.exports = { MEMBERSHIP_CATEGORIES, PLAN_DURATION_DAYS, isMemberActive, isMembershipOrder, longestPlanDays, confirmMembershipOrder };
