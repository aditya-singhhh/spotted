# spotted — mobile app (React Native / Expo)

Native app that reuses the web backend (the Next.js `/api/*` routes on Vercel).
See `../MOBILE_APP_PLAN.md` for architecture and phases.

## Run it (dev)
```bash
cd mobile
npm install
cp .env.example .env      # then fill in the values (see below)
npx expo start            # scan the QR code with Expo Go on your Android phone
```

### Environment (`mobile/.env`)
- `EXPO_PUBLIC_API_URL` — your **deployed** backend URL (e.g. `https://spotted.vercel.app`).
  A phone on Expo Go cannot reach `localhost`.
- `EXPO_PUBLIC_FIREBASE_*` — same values as the web app's Firebase config
  (web `NEXT_PUBLIC_FIREBASE_*` → mobile `EXPO_PUBLIC_FIREBASE_*`).
- `EXPO_PUBLIC_MAPTILER_KEY` — optional, for the map view (Phase 4).

> Use `npx expo install <pkg>` (not plain `npm install <pkg>`) when adding native
> Expo packages so versions match the SDK.

## What's built (Phases 1–3)
- Tab navigation (Home · Explore · Scout · Profile), brand theme.
- **Home** — hero + featured listings + scout CTA.
- **Explore** — live feed from `/api/listings` with search + pull-to-refresh.
- **Listing detail** — facts + **unlock flow**, **packages/credits/pass**, **shortlist**,
  **report-a-listing**, recently-viewed tracking.
- **Scout** — **native camera + gallery capture** (home + gated board media),
  location (GPS or area chips), full submit form → Cloudinary (signed) → `/api/scout/submit`.
- **Scout dashboard** — wallet (available/pending/total/withdrawn) + **withdraw**,
  KPIs, **notifications**, **assigned requests + fulfil**, submissions.
- **Login** — email/password (Firebase); phone OTP is Phase 4.
- **Profile** — account, recently viewed, unlocked contacts, shortlist, sign out.

## Next phases
4. Push notifications (FCM), phone OTP, react-native-maps, deep links, offline, share.
5. EAS Build → Play Store internal testing.
