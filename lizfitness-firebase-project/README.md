# Lizfitness Gym — Website + Attendance Backend (Firebase Realtime Database)

## What's in this folder
- `index.html` — the full website (same as before — no changes needed here)
- `netlify/functions/` — the backend, now talking to Firebase instead of MongoDB:
  - `signup.js` — creates a member (password stored as a bcrypt hash)
  - `login.js` — verifies email + password
  - `checkin.js` — records today's attendance (safe to click twice, won't duplicate)
  - `attendance.js` — fetches a member's check-in history
  - `members.js` — returns all members + visit counts, for the Admin panel
- `package.json` — needs `firebase-admin` and `bcryptjs`

## Environment variables required in Netlify
Go to Site configuration → Environment variables and set:
- `FIREBASE_SERVICE_ACCOUNT` — the entire contents of the service account JSON file you downloaded from Firebase (Project settings → Service accounts → Generate new private key)
- `FIREBASE_DB_URL` — your Realtime Database URL, shown at the top of the Realtime Database page, looks like `https://your-project-default-rtdb.region.firebasedatabase.app`

Delete any old `MONGODB_URI` variable — it's not used anymore.

## How to deploy
1. Upload everything in this folder to your GitHub repo (the whole thing — `index.html`, `netlify/`, `package.json`, `netlify.toml`).
2. Confirm both environment variables above are set in Netlify.
3. Wait for the deploy to finish, then test: open the live site, click "Member Login," sign up, and check in.
4. To confirm it's really working, check Firebase Console → Realtime Database — you should see a `members` and `attendance` tree appear with your test account in it.

## To make someone an admin
1. Firebase Console → Realtime Database → find `members` → your member's entry.
2. Edit the `role` field from `"member"` to `"admin"`.
3. They'll see the admin icon in their dashboard next time they log in.

## Known limitations
- No login session/token — the browser just remembers who's logged in for that visit.
- The `members` (admin) endpoint has no access check yet — fine for private testing, worth locking down before public launch.
- Your Realtime Database is currently in "test mode," meaning anyone with your database URL could read/write it directly (not through your site, but directly via Firebase's API). Before going fully live, tighten the rules in Firebase Console → Realtime Database → Rules.
