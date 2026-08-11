# Lizfitness Gym — Website + Backend (Firebase Realtime Database)

## What's in this folder
- `index.html` — the site shell (sections + modals); styles and scripts now live in `assets/`
- `assets/css/style.css` — all styling
- `assets/js/app.js` — all front-end logic: nav, mobile menu, plans/cart, auth, member dashboard, admin dashboard, newsletter
- `assets/img/`, `assets/video/` — favicon, gallery photos, gym tour video, testimonial photos
- `netlify/functions/` — the backend, talking to Firebase Realtime Database:
  - `signup.js` / `login.js` — member accounts (bcrypt-hashed passwords)
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

### Optional: real email sending (newsletter + announcements)
Announcements and the newsletter signup work today — they just store data and skip the email step until you add:
- `RESEND_API_KEY` — create a free account at [resend.com](https://resend.com), verify a sending domain (or use their test sender to start), and generate an API key
- `RESEND_FROM` — e.g. `Lizfitness Gym <hello@yourdomain.com>` (optional — defaults to Resend's test sender if unset)

Without these, member/owner notifications still work in-app; only the actual email delivery is skipped (logged as a warning in the function logs).

## How to deploy
1. Push everything in this folder to your GitHub repo (already connected — this repo).
2. Confirm the environment variables above are set in Netlify.
3. Wait for the deploy to finish, then test: sign up a member, check in, add a plan to your cart and check out, and confirm it shows up under the admin Orders tab.
4. To confirm it's really working, check Firebase Console → Realtime Database — you should see `members`, `attendance`, `orders`, `notifications`, `messages`, `announcements`, and `newsletter` trees appear as you use the site.

## To make someone an admin
1. Firebase Console → Realtime Database → find `members` → your member's entry.
2. Edit the `role` field from `"member"` to `"admin"`.
3. They'll see the admin icon in their dashboard next time they log in, opening a tabbed panel: Members, Orders, Messages, Notifications, Announce.

## Payment is a placeholder
The Plans section (pricing pulled from the gym's rate card) and cart are fully wired up, but checkout only **records** the order as `"pending"` — no card details are collected and no money moves. A team member is expected to follow up on WhatsApp to confirm and collect payment. To go live with real online payment, integrate a gateway such as Paystack or Flutterwave inside `order-create.js` / the checkout flow in `assets/js/app.js` (`handleCheckout`), using your own API keys as Netlify environment variables the same way Firebase and Resend are configured above.

## Known limitations
- No login session/token — the browser remembers who's logged in via `localStorage`, not a signed session.
- The `members`, `orders-list`, and admin-facing endpoints have no server-side access check yet — fine for a small private deployment, worth locking down (e.g. verifying the caller is actually an admin) before wide public launch.
- Your Realtime Database is likely still in "test mode," meaning anyone with your database URL could read/write it directly (not through the site, but directly via Firebase's API). Tighten the rules in Firebase Console → Realtime Database → Rules before going fully live.
- Two source photos (`IMG_4020.DNG`, `IMG_4060.DNG`) were RAW camera files and couldn't be converted for the web in this pass — export them as JPG/PNG yourself if you'd like them added to the gallery.
