# spotted. — full-stack MVP (Next.js + Firebase + Cloudinary)

Real backend for the crowdsourced rental discovery app: Firestore database,
Firebase Auth (real phone-number SMS OTP, no third-party SMS provider
needed), Cloudinary for scout photo uploads, geolocation, and a mock
payment/unlock flow — **entirely on free tiers, no credit card required
anywhere.**

> **Why Cloudinary instead of Firebase Storage?** As of February 2026,
> Firebase Storage requires the paid Blaze plan even for free-tier usage
> (Google now requires a linked billing account to provision a bucket at
> all). Cloudinary's free tier (25 credits/month — plenty for an MVP) has
> no such requirement, so this project uses it for photos and keeps
> Firestore + Auth on Firebase's free Spark plan. If you'd rather keep
> everything inside Firebase, upgrading to Blaze is still effectively
> $0 at MVP scale — see the note at the bottom of this file.

## What's real here

- **Database**: Firestore (`firestore.rules`) — collections matching the
  brief: `users`, `scouts`, `properties`, `rentalOpportunities` (+ a
  `private` subcollection for owner phone/exact address), `evidence`,
  `verifications`, `unlockTransactions`, `scoutRewards`, `reports`
- **Auth**: Firebase Phone Auth — real SMS one-time codes, built in, no
  Twilio/MessageBird account needed
- **Photo uploads**: Cloudinary, via an unsigned upload preset — the
  browser uploads directly, no server round-trip, no card required
- **Geolocation**: real `navigator.geolocation` + free reverse-geocoding
  (OpenStreetMap Nominatim, no API key) — used for "near me" search sorting
  and for scouts to drop a pin when submitting a board
- **API routes**: `/api/listings`, `/api/listings/:id`, `/api/scout/submit`,
  `/api/scout/stats`, `/api/unlock`, `/api/admin/listings`, `/api/admin/verify`
- **Security**: the browser can only read documents allowed by
  `firestore.rules` — verified/community listings' *public* fields only.
  Owner phone and exact address live in a `private` subcollection that the
  rules never expose to any client. All writes happen through server-side
  API routes using the Firebase Admin SDK, which bypasses rules entirely.
- **Payments**: mocked (marks the transaction `success` immediately). One
  clearly-marked block in `src/app/api/unlock/route.ts` is where you'd
  plug in Razorpay/Stripe.

---

## 1. Create your Firebase project (100% free Spark plan)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   → **Add project**.
2. **Build → Authentication → Get started → Sign-in method** → enable
   **Phone**.
3. **Build → Firestore Database → Create database** → start in
   **production mode** (we'll paste real rules next) → pick a region.
   *(Skip Storage entirely — we're not using it.)*
4. Go to **Project settings (gear icon) → General → Your apps → Add app →
   Web (`</>`)**. Copy the config values into `.env.local` as the
   `NEXT_PUBLIC_FIREBASE_*` variables.
5. Go to **Project settings → Service accounts → Generate new private
   key**. This downloads a JSON file — you'll use it two ways:
   - Save a copy as `scripts/serviceAccountKey.json` (for the local seed
     script — this file is gitignored, never commit it)
   - Turn it into one line and set it as `FIREBASE_SERVICE_ACCOUNT_KEY` in
     `.env.local` (see the comment in `.env.example` for the one-liner
     command)

## 2. Create your Cloudinary account (free, no card)

1. Go to [cloudinary.com](https://cloudinary.com) → sign up free.
2. On the Dashboard, copy your **Cloud name** →
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in `.env.local`.
3. **Settings (gear icon) → Upload → Upload presets → Add upload preset**.
   Set **Signing Mode** to **Unsigned** → give it a name (e.g.
   `spotted-scout-photos`) → Save.
4. Put that preset name in `.env.local` as
   `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

That's it — no billing page, no card, nothing else to configure.

## 3. Deploy the Firestore security rules

Install the Firebase CLI once, then push the rules in this repo:

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # pick your project
firebase deploy --only firestore:rules
```

(Or just paste the contents of `firestore.rules` into the Console's Rules
tab manually — same effect.)

## 4. Configure environment variables

```bash
cp .env.example .env.local
# fill in the 5 NEXT_PUBLIC_FIREBASE_* values + FIREBASE_SERVICE_ACCOUNT_KEY
# + the 2 Cloudinary values
```

### Fast local demo: email/password + admin seed button

1. Firebase Console → **Authentication** → **Sign-in method** → enable
   **Email/Password**.
2. In `.env.local`, add your own email (not a password):

   ```env
   ADMIN_BOOTSTRAP_EMAIL=you@example.com
   ```

3. Restart `npm run dev`, visit `/login`, and create an account with that
   email and any password of at least six characters. The app securely makes
   that profile an admin on first sign-in.
4. Visit `/admin` and choose **Add starter rentals**. This writes the three
   example Bengaluru rentals to Firestore. It runs only when the database is
   empty, so it cannot duplicate data.

This is real Firebase authentication—not a frontend-only dummy login. Remove
`ADMIN_BOOTSTRAP_EMAIL` after the first admin profile is created and manage
roles from the Firestore `users` collection going forward.

## 5. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Seed some listings** so Discover isn't empty:
  ```bash
  node scripts/seed.js
  ```
- **Sign in**: any unlock/submit action shows a phone-OTP form — enter a
  real phone number, you'll get an actual SMS code. (Firebase's test-phone
  numbers feature is also handy for development — Console → Authentication
  → Sign-in method → Phone → Phone numbers for testing.)
- **Try the loop**: Discover tab → tap a listing → "Unlock Owner Contact"
  (mock payment succeeds instantly) → owner phone + address reveal.
- **Try scouting**: Scout tab → allow location access → fill the form →
  submit. It lands in Firestore with `status: 'pending'`.
- **Verify it**: to see it live on Discover, you need an admin account —
  see below.

### Make yourself an admin

After signing in once (so your `users/{uid}` doc exists), open
**Firestore Database** in the Console, find your doc under `users`, and
change its `role` field from `seeker` to `admin`. Now `/admin` will load
for you, and verifying a pending submission there makes it immediately
appear on `/discover`.

---

## 6. Host it for real (free)

**Frontend + API routes → Vercel.** **Database/Auth → Firebase. Photos →
Cloudinary.** (Firebase and Cloudinary are already hosted from steps 1–2.)

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "spotted MVP (Firebase + Cloudinary)"
   git remote add origin https://github.com/YOUR-USERNAME/spotted-app.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import
   that repo.
3. In the import screen, expand **Environment Variables** and add all 7
   values from your `.env.local` (5 `NEXT_PUBLIC_FIREBASE_*`,
   `FIREBASE_SERVICE_ACCOUNT_KEY`, and the 2 Cloudinary values).
4. Click **Deploy**. Vercel builds and gives you a live URL like
   `spotted-app.vercel.app` in about a minute.
5. Back in the Firebase Console → **Authentication → Settings →
   Authorized domains** → add your Vercel domain (phone auth won't work
   from an unrecognized domain otherwise).
6. **Custom domain** (optional): Vercel dashboard → your project →
   **Settings → Domains** → add your domain and follow the DNS
   instructions.
7. Every future `git push` to `main` auto-redeploys.

**Alternative**: Firebase now also hosts Next.js apps directly via
**Firebase App Hosting** (Console → Build → App Hosting), which keeps
everything inside one Firebase project instead of splitting across Vercel
+ Firebase. Note that App Hosting itself requires the Blaze plan (it's a
compute product, not Storage), so if you want to stay 100% card-free,
Vercel is the way to go.

That's it — no servers to manage, and no billing setup anywhere in this
stack.

### If you'd rather just use Firebase Storage after all

It's still a fine choice — you just need to add a card to your Firebase
project once (Console → bottom-left "Spark plan" badge → Upgrade to
Blaze). At MVP scale (a few hundred photos) you'll stay inside Google
Cloud Storage's Always Free tier (5GB-months stored, 100GB/month
transfer) and pay $0. If you'd like, ask and this project can be switched
back to Firebase Storage instead of Cloudinary.

---

## Project structure

```
src/
  app/
    page.tsx                     landing
    discover/page.tsx            live search + near-me geolocation
    listing/[id]/page.tsx        detail + unlock flow
    scout/page.tsx               submission form (geolocation + photo upload)
    scout/dashboard/page.tsx     scout earnings/stats
    admin/page.tsx                verification queue
    api/
      listings/route.ts          GET public safe feed
      listings/[id]/route.ts     GET one listing (safe)
      scout/submit/route.ts      POST new discovery
      scout/stats/route.ts       GET scout's own stats
      unlock/route.ts            POST mock-pay + reveal owner details
      admin/listings/route.ts    GET full queue (admin only)
      admin/verify/route.ts      POST verify/reject/etc (admin only)
  components/
    AuthGate.tsx                 phone-OTP sign-in wrapper (real SMS)
    BottomNav.tsx
  lib/
    firebaseClient.ts            browser SDK init (auth, firestore)
    firebaseAdmin.ts             server-only Admin SDK init
    apiAuth.ts                   verifies ID tokens in API routes
    cloudinary.ts                 unsigned client-side photo upload helper
    geo.ts                       geolocation + haversine distance helpers
firestore.rules                  deploy with the Firebase CLI
scripts/seed.js                  adds 2 sample listings for testing
```

## Extending this MVP

- **Trust score automation**: currently manual/seeded — wire it to a
  Cloud Function that weighs freshness, evidence count, and report count,
  triggered on a `verifications` doc write.
- **Duplicate detection**: before insert, query `rentalOpportunities` for
  existing docs with `approxLat`/`approxLng` within ~1 grid cell and rent
  within ~5%.
- **Listing expiry**: a scheduled Cloud Function (Firebase Scheduled
  Functions) that marks opportunities `rejected` if `lastVerifiedAt` is
  older than N days.
- **Real payments**: replace the mock block in `api/unlock/route.ts` with
  a Razorpay order + webhook (Razorpay is the natural choice for ₹29
  India-first payments).
