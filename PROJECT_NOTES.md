# spotted. — project notes / handoff

Community rental-discovery marketplace for Bengaluru. Scouts photograph TO-LET boards → team verifies → renters pay a small fee to unlock the owner's contact. Scouts earn a share.

## Stack
- Next.js 14 (app router) + TypeScript + Tailwind
- Firebase Auth (email + phone OTP) & Firestore (Admin SDK in API routes; client SDK for auth)
- Cloudinary for media (images + short video)
- Hosting target: **Vercel** (repo: github.com/aditya-singhhh/spotted, branch `main`). Firebase App Hosting also possible but needs Blaze.

## Run / build / test
- `npm run dev` (Next dev). NOTE: dev `.next` cache gets HMR-corrupted after many edits → spurious runtime errors. When that happens: stop dev servers, `rm -rf .next`, `npm run dev`. Verify real breakage with a prod build, not dev.
- `npm run build` (prod build; last verified green — all 27 routes compile).
- `npm test` → Node built-in test runner over `src/lib/**/*.test.ts` (20 tests: reward/quality, validation, submitLogic).
- tsc check: `npx tsc --noEmit`.

## Env (.env.local; on Vercel set these in dashboard)
- `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId=spotted-b0cb1, messagingSenderId, appId)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=kzpkqlhe`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=spotted_app` (verified working preset)
- `FIREBASE_SERVICE_ACCOUNT_KEY` = full service-account JSON (one value). Local dev falls back to `scripts/serviceAccountKey.json`. **Rotate the key before launch — it was exposed during development.**
- Optional: `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (enables signed uploads + orphan cleanup), `ERROR_WEBHOOK_URL`, `ADMIN_BOOTSTRAP_EMAIL` (first admin, self-disabling once an admin exists).

## Structure (src/)
- `app/page.tsx` — landing: hero + search bar (routes to /discover?query&bhk&budget), featured grid, how-it-works (#how-it-works), dark CTA.
- `app/discover/page.tsx` — marketplace: sticky filters, sort, result count, active-filter chips, cards, reads URL params, localStorage cache.
- `app/listing/[id]/page.tsx` (server, ISR revalidate=60, generateMetadata/OG) + `ListingDetail.tsx` (client: gallery, fact grid, sticky unlock sidebar with transparent pricing, persistent unlock restore, Maps deep-link).
- `app/scout/page.tsx` — contributor landing (workflow/payout/example earnings) + `ScoutForm` (media upload w/ client compression, mandatory "spoken to owner?" radio + availability).
- `app/scout/dashboard/page.tsx` — Profile with **Scout ⇄ Tenant** toggle (top-right). Scout: wallet hero + KPI tiles + trust meter + submissions. Tenant: unlocked contacts + shortlist.
- `app/admin/page.tsx` — ops: metrics, pricing, reward approvals, listings table with Approve/Reject/Edit/Delete (optimistic).
- `app/{privacy,terms,trust-and-safety,contact}/page.tsx` — real policy pages (footer links resolve here).
- `components/` — AppNav (responsive: desktop top bar + mobile bottom tabs), Footer, AuthGate, Media (SVG placeholder, next/image + cloudinary loader), Carousel, ShortlistButton, Reveal, icons.tsx (inline SVGs), LegalPage, TopBar, AccountButton, AdminLink.
- `lib/` — firebaseAdmin (gRPC transport — NOT preferRest, that broke), firebaseClient, apiAuth, reward.ts (submissionQuality/scoutReward/mediaKind), submitLogic.ts (parseSubmission, unit-tested), listings.ts (getPublicListing/getPublicFeed w/ index-free fallback), validation, rateLimit, observability, clientCache, compressImage, cloudinaryLoader.
- API routes under `app/api/`: listings, listings/[id], scout/submit, scout/stats, unlock (POST idempotent txn + GET status), profile, settings, shortlist, tenant/unlocks, media/sign, media (DELETE), admin/{listings,listings/[id],verify,wallet,seed}.

## Firestore collections
users, scouts, rentalOpportunities (public: approxLat/Lng, media, mediaUrls, trustScore, status, contactedOwner, availabilityConfirmed; `private/contact` subdoc = owner name/phone/exact coords — server-only), properties, evidence, unlockTransactions (deterministic id `${uid}_${listingId}`), scoutRewards, shortlists (`${uid}_${listingId}`), verifications, reports, platformSettings/marketplace, rateLimits.
- Rules: browser read-only for verified/community listings + own docs; **role is server-only** (firestore.rules blocks client role writes). Deploy: `firebase deploy --only firestore:rules,firestore:indexes`.
- Index needed: rentalOpportunities (status ASC, spottedAt DESC) — feed falls back to in-memory sort if absent.

## Design system (minimal-premium — see memory spotted-design-system)
White surfaces, near-black `ink` text/primary, indigo `accent` #4F46E5, hairline `line` borders, Inter font, soft shadows. `.sticker`/`.panel` clean cards, `.btn-primary` black. No dotted bg, no thick borders, no offset drop-shadows. Tokens in tailwind.config.ts, components in globals.css.

## Reward/trust
`submissionQuality` → 0–100 trustScore: base 20 + video 45 / photo 25 / extra media (+4 ea, cap 12) + spoke-to-owner 10 + availability 6 + filled fields. `scoutReward` = unlockPrice × 50% × (0.6–1.0 by quality). Explained on /trust-and-safety.

## Done recently
Firestore-gRPC fix; full minimal-premium redesign; responsive nav; carousel/media/animations; shortlist; tenant/scout profile; persistent unlocks + Maps link; client image compression; optimistic admin + caching; ISR; **QA security fixes** (role-escalation, media IDOR, idempotent unlock/reward txns); policy pages; transparent unlock pricing; contributor page.

## Pending / roadmap (ranked)
1. **Map view on Discover** (Leaflet/OSM, no key) — biggest gap per product review.
2. Real payment (Razorpay, INR) — unlock is currently MOCKED (`app/api/unlock/route.ts` always success).
3. Enable Phone OTP in Firebase console + authorized domains (add vercel domain) before launch.
4. Proof/stats band (real counts), testimonials.
5. Wire "report listing" to `reports` collection + admin surfacing (currently mailto).
6. Deploy firestore indexes; rotate service-account key.
7. Content/SEO/localized pages (post-traction).

## Cleanup
Stray gitignored files on disk: `_fstest.js`, `_shots.mjs`, `_shot2.mjs`, `_shot3.mjs`, `.next-verify/`, unused `src/components/BottomNav.tsx` (replaced by AppNav). Playwright is a devDependency (used for screenshot QA via installed Chrome, `channel:'chrome'`).
