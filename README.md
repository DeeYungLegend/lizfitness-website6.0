# Lizfitness Gym — Website + Backend (Firebase Realtime Database)

## Pages
- `index.html` — homepage (About, Services, Gallery, Connect, Results, Visit)
- `shop.html` — Plans, subscriptions, and products, with cart
- `login.html` — full-page log in / sign up (member or admin)
- `dashboard.html` — a logged-in member's own page: Check-In, Plans, My Orders, Notifications, Messages. Requires login; redirects to `index.html` otherwise.
- `admin.html` — the owner's dashboard: Members, Orders, Messages, Notifications, Announce. Requires an admin account; redirects non-admins to `dashboard.html`.

Logging in (or signing up) takes you straight to `dashboard.html` or `admin.html` depending on your role — there's no popup dashboard anymore, just your own page, and you stay on it until you log out.

## What's in this folder
- `assets/css/style.css` — all styling
- `assets/js/app.js` — all front-end logic: nav, mobile menu, plans/cart, auth, member dashboard, admin dashboard, newsletter. Shared across every page above (some pages don't have every element — e.g. `admin.html` has no cart — so most DOM lookups are null-guarded).
- `assets/img/`, `assets/video/` — favicon, gallery photos, gym tour video, testimonial photos
- `netlify/functions/` — the backend, talking to Firebase Realtime Database:
  - `signup.js` / `login.js` — member accounts (bcrypt-hashed passwords)
  - `admin-signup.js` — same as `signup.js`, but creates the account with `role:"admin"` — only if the request includes the correct `adminCode` (see below)
  - `checkin.js` / `attendance.js` — daily check-in tracking
  - `members.js` — all members + visit counts, for the admin Members tab
  - `order-create.js` / `orders-list.js` / `my-orders.js` / `order-update-status.js` — the Plans/cart checkout flow and order history (placeholder payment — no real gateway wired in yet, see below)
  - `notifications-list.js` / `notifications-mark-read.js` — in-app notification feeds (`notifications/admin` for the owner, `notifications/{memberId}` per member)
  - `messages-list.js` / `messages-send.js` / `messages-threads.js` — admin ↔ member chat threads
  - `announcement-create.js` / `announcements-list.js` — owner publishes a special program/product; fans out a notification to every member and emails the newsletter list
  - `newsletter-subscribe.js` — public email signup (footer form), independent of member accounts
  - `utils/firebase.js` — Realtime Database connection + shared helpers
  - `utils/email.js` — Resend API wrapper (see below)
- `package.json` — needs `firebase-admin` and `bcryptjs`

## Environment variables required in Netlify
Go to Site configuration → Environment variables and set:
- `FIREBASE_SERVICE_ACCOUNT` — the entire contents of the service account JSON file you downloaded from Firebase (Project settings → Service accounts → Generate new private key)
- `FIREBASE_DB_URL` — your Realtime Database URL, shown at the top of the Realtime Database page, looks like `https://your-project-default-rtdb.region.firebasedatabase.app`
- `ADMIN_SIGNUP_CODE` — a password of your choosing that gates admin account creation (see below). Pick something you wouldn't mind rotating later; it's not tied to any one person's login.

### Optional: real email sending (newsletter, announcements, new-order alerts)
Announcements, the newsletter signup, and new-order alerts all work today — they just store data (and skip the email step) until you add:
- `RESEND_API_KEY` — create a free account at [resend.com](https://resend.com), verify a sending domain (or use their test sender to start), and generate an API key
- `RESEND_FROM` — e.g. `Lizfitness Gym <hello@yourdomain.com>` (optional — defaults to Resend's test sender if unset)
- `ADMIN_NOTIFY_EMAIL` — the owner's personal email address. When set, every new order emails this address immediately with the customer's name, phone, email, what they ordered, and the total — so she finds out without opening the site, and has a phone number to actually call or message them on. This is deliberately email, not WhatsApp: your client didn't want a payment platform, and this isn't one — it's just a notification, sent through infrastructure already in this repo, with no third-party WhatsApp bot risk.

Without these, member/owner notifications still work in-app; only the actual email delivery is skipped (logged as a warning in the function logs).

## How to deploy
1. Push everything in this folder to your GitHub repo (already connected — this repo).
2. Confirm the environment variables above are set in Netlify.
3. Wait for the deploy to finish, then test: sign up a member, check in, add a plan to your cart and check out, and confirm it shows up under the admin Orders tab.
4. To confirm it's really working, check Firebase Console → Realtime Database — you should see `members`, `attendance`, `orders`, `notifications`, `messages`, `announcements`, and `newsletter` trees appear as you use the site.

## To make someone an admin
No Firebase editing needed — it's a self-service signup, gated by a code:
1. Set `ADMIN_SIGNUP_CODE` in Netlify (see above) and redeploy.
2. Send that code privately to whoever should be staff/admin (WhatsApp, in person — not anywhere public).
3. They go to `login.html` → "Create an account" → click "Staff? Enter your admin invite code" → fill in the form including that code → submit.
4. They're now an admin and land on `admin.html` immediately, and every future login sends them there automatically.

If someone already has a regular member account and you'd rather promote it than have them create a new one, that still works the old way: Firebase Console → Realtime Database → `members` → their entry → change `role` from `"member"` to `"admin"`.

## Payment is a placeholder
The Plans section (pricing pulled from the gym's rate card) and cart are fully wired up, but checkout only **records** the order as `"pending"` — no card details are collected and no money moves. A team member is expected to follow up on WhatsApp to confirm and collect payment. To go live with real online payment, integrate a gateway such as Paystack or Flutterwave inside `order-create.js` / the checkout flow in `assets/js/app.js` (`handleCheckout`), using your own API keys as Netlify environment variables the same way Firebase and Resend are configured above.

## Known limitations
- No login session/token — the browser remembers who's logged in via `localStorage`, not a signed session.
- The `members`, `orders-list`, and admin-facing endpoints have no server-side access check yet — fine for a small private deployment, worth locking down (e.g. verifying the caller is actually an admin) before wide public launch.
- Your Realtime Database is likely still in "test mode," meaning anyone with your database URL could read/write it directly (not through the site, but directly via Firebase's API). Tighten the rules in Firebase Console → Realtime Database → Rules before going fully live.
- Two source photos (`IMG_4020.DNG`, `IMG_4060.DNG`) were RAW camera files and couldn't be converted for the web in this pass — export them as JPG/PNG yourself if you'd like them added to the gallery.
