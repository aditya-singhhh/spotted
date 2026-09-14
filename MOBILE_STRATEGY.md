# spotted — mobile app strategy (web + app, one brand)

Goal: two variants — the web app and a mobile app — that **share the exact same theme/branding** with minimal duplicate work. Current stack: Next.js 14 (app router) + Tailwind + Firebase + Cloudinary.

## Recommendation (short version)
**Do NOT rewrite in a new technology.** Reuse the Next.js codebase:
1. **Now (days): ship a PWA** — make the existing site installable (manifest + service worker + icons). Zero new stack, 100% theme parity, home-screen icon, offline shell, push where supported (iOS 16.4+ after install).
2. **For the App Store / Play Store: wrap it with Capacitor** — the same Next.js UI runs in a native shell; add native Camera, Geolocation, and Push. ~95–100% code + literally the same CSS/theme. This is the industry-standard "web → native" path for web-first teams in 2026.
3. **Only if** you later want a premium, platform-native feel do you add **React Native (Expo)** as a second UI — and even then keep branding in sync via a shared **design-token package** (+ NativeWind so RN uses the same Tailwind classes). Not needed now.

Rationale: our differentiators are content + trust, not 120fps native animation. Capacitor gives real app-store apps, the native APIs this product actually needs, and one brand/one codebase. A React Native/Flutter rewrite = a second codebase to maintain with no proportional payoff at this stage.

## Why Capacitor fits *this* product
The core loops need native device APIs that Capacitor exposes as plugins:
- **Camera / video** — scouts capturing TO-LET boards (`@capacitor/camera`).
- **Geolocation** — "near me" + submit location (`@capacitor/geolocation`; today we use the browser API, which also works).
- **Push notifications** — re-engagement for **saved-search alerts** and payout/verification updates (`@capacitor/push-notifications` + FCM — we already use Firebase).
- **Share sheet, status-bar, safe-areas** — native polish (`@capacitor/share`, Tailwind `pt-safe`/`pb-safe`).

## Branding = one source of truth (do this first)
Make the theme a single shared layer so web and any native surface can never drift:
- **Design tokens** already live in `tailwind.config.ts` (colors: paper/ink/accent/line…, radii, shadows) + `globals.css`. Extract them to a framework-agnostic `tokens.ts`/JSON that Tailwind consumes (web) and, if RN is ever added, NativeWind/StyleSheet consumes too.
- **Icons** — our `src/components/icons.tsx` are inline SVGs; portable to `react-native-svg` if needed.
- **Wordmark/voice** — "spotted.", minimal-premium, indigo accent. Keep in the tokens doc + `PROJECT_NOTES`.
With Capacitor this parity is automatic (it *is* the web UI); the token extraction matters only if a native rewrite ever happens.

## Architecture with Capacitor (important detail)
Next.js SSR + API routes stay on **Vercel**. Two viable shapes:
- **A. Remote/hosted (simplest):** the Capacitor shell loads the deployed Vercel URL in the native WebView; native plugins (camera/geo/push) bridge in. Fastest to ship; needs connectivity.
- **B. Static shell + API:** `next build` a mostly-client shell shipped in the app bundle that calls the Vercel API routes. More offline-capable; more setup (some app-router SSR features don't statically export).
Start with **A**, move hot paths to **B** if needed. Auth (Firebase), Cloudinary uploads, unlock/wallet APIs all work unchanged over HTTPS.

## Phased plan
1. **PWA** — `manifest.webmanifest` (name, icons, theme_color = ink `#111827`, background = canvas), a service worker (e.g. `next-pwa` or a hand-rolled one) for install + offline shell; add iOS `apple-touch-icon`. Verify "Add to Home Screen".
2. **Token extraction** — pull colors/spacing/radii/shadows into `src/lib/tokens.ts`; point `tailwind.config.ts` at it. (Cheap insurance.)
3. **Capacitor** — `npm i @capacitor/core @capacitor/cli`; `npx cap init`; add iOS/Android; config to load the Vercel URL (shape A). Swap the scout camera input to `@capacitor/camera` and add `@capacitor/push-notifications` (FCM) for saved-search alerts. `safe-area` utilities for notches.
4. **Store prep** — icons/splash, privacy labels (we handle owner PII — reference `/privacy` + `/trust-and-safety`), TestFlight/Play internal testing.
5. **(Optional, later) React Native/Expo** — only for a native-feel rewrite; share the token package + NativeWind; keep Firebase/Cloudinary.

## Cost / effort
- PWA: ~1–2 days. Capacitor store apps: ~1–2 weeks (mostly store setup, icons, push wiring, device testing). RN rewrite: months — deferred.

## Sources
NextNative "Next.js + Capacitor vs Expo"; capgo "Next.js + Capacitor 8"; PkgPulse "React Native vs Expo vs Capacitor 2026"; multiple "PWA vs Native 2026" analyses.
