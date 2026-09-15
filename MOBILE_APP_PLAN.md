# spotted — native mobile app plan (React Native / Expo)

## Decision
Build a **proper native app** with **React Native (Expo + expo-router)** — not a Capacitor
webview and not a PWA. The app is a **client of the existing Next.js backend**: it calls the
same hosted API routes and reuses the pure TypeScript logic. The backend does not change.

## Why this architecture
- **Backend stays put.** Every screen talks to your Vercel-hosted `/api/*` routes with a
  Firebase ID token (exactly like the web client does today). No duplicate server code.
- **Shared logic, not shared UI.** The framework-free libs (`plans`, `reward`,
  `scoutRequests`, `listingDetails`) are copied into `mobile/lib/shared` and used as-is.
  UI is rebuilt natively (that's the point — a real app, not a wrapped site).
- **One brand, two front-ends.** A native theme mirrors the minimal-premium tokens
  (ink #111827, accent #4F46E5, canvas #FAFAFA, line #E5E7EB, Space-Mono for numbers).

## Stack
- **Expo (managed workflow)** + **expo-router** (file-based routing, feels like Next).
- **Firebase JS SDK** auth with AsyncStorage persistence. Email/password first; **phone OTP**
  needs `expo-firebase-recaptcha` or a native build — Phase 4.
- **react-native-maps** for the map view (native Google/Apple maps).
- **expo-image-picker / expo-camera** for scout capture (native camera).
- **expo-notifications + FCM** for push (assignment/fulfilment notifications).
- **@react-native-async-storage/async-storage** for local cache (recently viewed, feed cache).

## Folder layout (`mobile/`)
```
mobile/
  app/                      # expo-router
    _layout.tsx             # root stack + auth provider + theme
    (tabs)/
      _layout.tsx           # bottom tab bar (Home, Discover, Scout, Profile)
      index.tsx             # Home
      discover.tsx          # feed + filters
      scout.tsx             # submit a discovery (native camera)
      profile.tsx           # tenant/scout profile, wallet, requests
    listing/[id].tsx        # listing detail + unlock
    login.tsx               # auth
  lib/
    api.ts                  # fetch client → EXPO_PUBLIC_API_URL, attaches ID token
    firebase.ts             # Firebase app + auth (RN persistence)
    theme.ts                # design tokens + shared styles
    auth.tsx                # AuthProvider/useAuth hook
    shared/                 # copied pure libs (plans, reward, scoutRequests, listingDetails)
  app.json, package.json, tsconfig.json, babel.config.js, README.md
```

## API endpoints the app consumes (already built)
- `GET /api/listings` — public feed · `GET /api/listings/[id]` — one listing
- `GET/POST /api/unlock` · `GET/POST /api/purchase` · `GET /api/plans`
- `GET/POST /api/scout-requests` · `GET/POST /api/notifications`
- `POST /api/scout/submit` · `GET /api/scout/stats` · `POST /api/scout/withdraw`
- `POST /api/listing-report` · `GET/POST/DELETE /api/shortlist` · `/api/saved-searches`
- `POST /api/profile` (ensure profile) · `GET /api/settings`

## Phases
1. **Foundation + browse (this slice):** Expo project, theme, API client, Firebase auth,
   tab navigation, **Discover feed**, **Listing detail**, **Login**. Runnable via Expo Go.
2. **Unlock + wallet:** unlock flow (+ entitlements/packages), unlocked contact + maps,
   tenant profile (recently viewed, shortlist, unlocked), report-a-listing.
3. **Scout:** native camera capture (home + board media), submit form, scout dashboard
   (wallet, withdraw, assigned requests + fulfil).
4. **Native polish:** push notifications (FCM), phone OTP, react-native-maps map view,
   deep links, splash/icon, offline cache, haptics, share.
5. **Ship:** EAS Build → Play Store (internal testing track first).

## Running it (dev)
```
cd mobile
npm install
# set env in mobile/.env: EXPO_PUBLIC_API_URL=https://<your-vercel-url>
#   + EXPO_PUBLIC_FIREBASE_* (same values as the web .env, NEXT_PUBLIC_* → EXPO_PUBLIC_*)
npx expo start          # scan the QR with Expo Go on your Android phone
```
> Use `npx expo install <pkg>` (not plain npm) for Expo-managed native deps so versions
> match the SDK. `EXPO_PUBLIC_` is the Expo equivalent of Next's `NEXT_PUBLIC_`.

## Notes / caveats
- Point `EXPO_PUBLIC_API_URL` at the **deployed** backend (localhost won't reach a phone).
- Firebase **authorized domains** don't apply to native, but the API still verifies the ID
  token server-side — unchanged.
- Shared libs are **copied** into `mobile/lib/shared` (Metro doesn't reach into the web
  app's node_modules cleanly). Keep them in sync when the web versions change, or move to an
  npm-workspaces monorepo later.
- Phone OTP + push need a **dev/EAS build** (not just Expo Go) once wired.
