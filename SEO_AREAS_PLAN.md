# spotted — Area Guides & Reviews (SEO) plan

## Why
Long-tail local search ("2 BHK rent in HSR Layout", "is Koramangala good to rent in", "Whitefield area review") is the **single biggest free acquisition channel** for rental marketplaces (NoBroker/Housing/MagicBricks lean on it hard). We have none today. Area pages also give us unique, freshening content (reviews + live rent stats) that ranks — and NoBroker's weak spot is exactly *area reviews*, so it's a differentiator, not just parity.

## Shape
Server-rendered (ISR) locality pages with rich metadata, unique content, and heavy internal linking into Discover/listings.

- **Routes**
  - `/areas` — index of all localities (cards, search).
  - `/areas/[slug]` — one locality, e.g. `/areas/hsr-layout`.
- **Scope: MAJOR areas only** — write a genuine, human, editorial **article** per top locality (not thin auto-generated stubs). Quality > quantity; ~10 to start. Thin/empty areas are not published (hurts SEO).
- **Each area page contains**
  1. **Human editorial article** (long-form, in our voice): what living there is actually like — connectivity (metro/roads/IT parks), vibe, who it suits, food/nightlife, commute, pros & cons, tips. Reads like a real neighbourhood guide, first-person and specific, **with photos** (hero + inline images of the area; stored in Cloudinary, delivered via next/image).
  2. **Dual rating — "Spotted rating" + "Community rating"** shown side by side:
     - **Spotted rating** = our editorial score (overall + sub-scores: Connectivity, Value for money, Safety, Amenities, Green/quiet), authored in the area content.
     - **Community rating** = average of tenant reviews (AggregateRating).
     Show both prominently near the top ("Spotted 4.2 · Community 4.0 (86 reviews)").
  3. **Live rent stats** from our own listings in that area (avg/median by BHK, # available, freshness). Reuses `getPublicFeed` + landmark matching.
  4. **Tenant reviews + "Rate this area"** (UGC, moderated): star rating (1–5) + optional sub-ratings + text. The review form is the "option to review area" — open to signed-in users, moderated like listings.
  5. **Live listings in the area** + a big "Browse N homes in <area>" CTA → `/discover?query=<area>`. Strong internal links.
- **Voice/design**: same minimal-premium system; reads like a real, opinionated neighbourhood guide, not a doorway page. Images make it human and shareable.

## SEO essentials (must-haves)
- **SSG/ISR** per page (`export const revalidate`), unique `generateMetadata` (title, description, canonical, OpenGraph/Twitter).
- **Structured data (JSON-LD)**: `Place` + `AggregateRating` (from reviews) + `ItemList`/`FAQPage` where apt.
- **`app/sitemap.ts`** listing home, /discover, all `/areas/*`, and all public `/listing/*`; **`app/robots.ts`**.
- **Breadcrumbs** (Home › Areas › HSR Layout) with BreadcrumbList JSON-LD.
- Internal linking: Home → Areas index → area → listings, and listings → their area page. Popular-locality chips on Home/Discover.
- Fast load (already: next/font, ISR, image optimisation).

## Data model
- **MVP: authored area content** in `src/content/areas/*.ts` (or MDX) — `{ slug, name, hero, images[], article (rich/MDX), spottedRating: { overall, connectivity, value, safety, amenities, green }, connectivity, forWhom, lat, lng }` for the top ~10 Bengaluru localities (HSR, Koramangala, Indiranagar, Whitefield, BTM, JP Nagar, Marathahalli, Electronic City, Bellandur, Sarjapur Road). Human-written; no DB needed for the article + Spotted rating.
- **Rent stats**: computed at ISR time from `rentalOpportunities` (match `landmark`/area).
- **Community reviews**: `areaReviews/{id}` `{ areaSlug, uid, rating 1-5, subRatings?, text, status: 'pending'|'approved', createdAt }`; `/api/area-reviews` GET(approved) / POST(auth → pending) / admin moderation (reuse the listing verify pattern); `firestore.rules` allow read approved. AggregateRating JSON-LD from approved reviews → community rating.
- **Images**: area photos in Cloudinary (folder `area-guides`), rendered with next/image + the existing cloudinary loader.

## Phases
1. **Foundation + articles (ships real SEO surface):** `/areas` + `/areas/[slug]` (ISR) with the **human articles + photos + Spotted rating** + computed rent stats + live listings + internal links + metadata + JSON-LD (Place, Breadcrumb) + `sitemap.ts` + `robots.ts`. Popular-locality chips on Home/Discover. Write ~10 major areas.
2. **Community reviews (UGC) + dual rating:** "Rate this area" form (auth, moderated) + reviews list + AggregateRating JSON-LD; show **Spotted rating + Community rating** together; admin moderation queue.
3. **Scale content:** more localities, comparison/listicle guides ("best areas for bachelors", "under ₹20k areas"), FAQ blocks; wire the footer's "How it works"/guides.

## Notes / caveats
- Reviews are UGC → **moderate** (spam/defamation) exactly like listings; show a policy link (reuse `/trust-and-safety`).
- Avoid thin/duplicate pages: only publish an area page when it has real content + some listings; otherwise it hurts SEO.
- Set `NEXT_PUBLIC_SITE_URL` for absolute canonical/OG/sitemap URLs on Vercel.

## Verification
tsc + build; check `/areas/hsr-layout` renders with metadata + JSON-LD (view-source), `/sitemap.xml` and `/robots.txt` resolve, Lighthouse SEO ~100, internal links click through to Discover/listings.
