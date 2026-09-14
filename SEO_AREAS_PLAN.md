# spotted — Area Guides & Reviews (SEO) plan

## Why
Long-tail local search ("2 BHK rent in HSR Layout", "is Koramangala good to rent in", "Whitefield area review") is the **single biggest free acquisition channel** for rental marketplaces (NoBroker/Housing/MagicBricks lean on it hard). We have none today. Area pages also give us unique, freshening content (reviews + live rent stats) that ranks — and NoBroker's weak spot is exactly *area reviews*, so it's a differentiator, not just parity.

## Shape
Server-rendered (ISR) locality pages with rich metadata, unique content, and heavy internal linking into Discover/listings.

- **Routes**
  - `/areas` — index of all localities (cards, search).
  - `/areas/[slug]` — one locality, e.g. `/areas/hsr-layout`.
- **Each area page contains**
  1. **Editorial intro** (curated): what the area is like, connectivity (metro/roads/IT parks), who it suits, pros/cons. Starts as static content we author.
  2. **Live rent stats** computed from our own listings in that area (avg/median rent by BHK, # available, freshness) — dynamic + unique + genuinely useful. Reuses `getPublicFeed` + landmark matching.
  3. **Tenant area reviews** (UGC): star rating + text, moderated. Keeps pages fresh and unique → the ranking engine + the differentiator.
  4. **Live listings in the area** (pull current + link each) + a big "Browse N homes in <area>" CTA → `/discover?query=<area>`. Strong internal links.
- **Voice/design**: same minimal-premium system; each page reads like a real neighbourhood guide, not a doorway page.

## SEO essentials (must-haves)
- **SSG/ISR** per page (`export const revalidate`), unique `generateMetadata` (title, description, canonical, OpenGraph/Twitter).
- **Structured data (JSON-LD)**: `Place` + `AggregateRating` (from reviews) + `ItemList`/`FAQPage` where apt.
- **`app/sitemap.ts`** listing home, /discover, all `/areas/*`, and all public `/listing/*`; **`app/robots.ts`**.
- **Breadcrumbs** (Home › Areas › HSR Layout) with BreadcrumbList JSON-LD.
- Internal linking: Home → Areas index → area → listings, and listings → their area page. Popular-locality chips on Home/Discover.
- Fast load (already: next/font, ISR, image optimisation).

## Data model
- **MVP: static area content** in `src/lib/areas.ts` — `{ slug, name, blurb, connectivity, forWhom, lat, lng }` for the top ~10 Bengaluru localities (HSR, Koramangala, Indiranagar, Whitefield, BTM, JP Nagar, Marathahalli, Electronic City, Bellandur, Sarjapur Road). No DB needed for v1.
- **Rent stats**: computed at build/ISR from `rentalOpportunities` (match `landmark`/area).
- **Reviews (phase 2)**: `areaReviews/{id}` `{ areaSlug, uid, rating 1-5, text, status: 'pending'|'approved', createdAt }`; `/api/area-reviews` GET(approved)/POST(auth, pending) + admin moderation (reuse the admin verify pattern); `firestore.rules` allow read approved. AggregateRating JSON-LD from approved reviews.

## Phases
1. **Foundation (ships real SEO surface):** `/areas` + `/areas/[slug]` (ISR) with static content + computed rent stats + live listings + internal links + metadata + JSON-LD (Place, Breadcrumb) + `sitemap.ts` + `robots.ts`. Popular-locality chips on Home/Discover.
2. **Reviews (UGC):** submission form (auth, moderated) + display + AggregateRating JSON-LD; admin moderation queue.
3. **Scale content:** more localities, comparison/listicle guides ("best areas for bachelors", "under ₹20k areas"), FAQ blocks; wire the footer's "How it works"/guides.

## Notes / caveats
- Reviews are UGC → **moderate** (spam/defamation) exactly like listings; show a policy link (reuse `/trust-and-safety`).
- Avoid thin/duplicate pages: only publish an area page when it has real content + some listings; otherwise it hurts SEO.
- Set `NEXT_PUBLIC_SITE_URL` for absolute canonical/OG/sitemap URLs on Vercel.

## Verification
tsc + build; check `/areas/hsr-layout` renders with metadata + JSON-LD (view-source), `/sitemap.xml` and `/robots.txt` resolve, Lighthouse SEO ~100, internal links click through to Discover/listings.
