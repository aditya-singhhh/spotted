# spotted. — UX & feature gap analysis + fix plan

Benchmarked against NoBroker, Housing.com, MagicBricks, Airbnb, Zillow. Note our model is different: community-scouted boards, exact location + owner contact revealed only after a paid unlock. So "hide precise data pre-unlock" is intentional — but everything below still applies to the *browsing, trust, and richness* layers.

## A. Feature gaps (what production rental sites have that we don't)

### Discovery / search
- **Map view** — pins with price labels, list⇄map toggle, "search this area". (We show only approximate area; use approx pins.) — biggest single gap.
- **Faceted filters** — we only have text + size + budget-cap + bachelor. Missing: budget **min–max range**, furnishing, property type, availability date, deposit range, amenities, locality multi-select, **"verified only"** toggle.
- **Saved searches + alerts** — save a filter set, notify on new matches / price drops. Top retention lever, we have none.
- **Locality autocomplete** in search (suggest HSR, Koramangala…) instead of free text.
- **Recently viewed** listings.
- **Mobile filter drawer** with active-filter count (we have inline filters; fine on desktop, cramped on mobile).

### Listing card
- **Multi-image carousel + photo count** on the card (we show one image). Consistent detail placement (we're close).

### Listing detail (PDP) — currently thin
- **Amenities grid** (parking, lift, power backup, water, security, gym…).
- **Full spec table** — area (sqft), floor, facing, property age, availability date, maintenance.
- **Price breakdown** — rent + deposit + maintenance + "₹0 brokerage" (we show rent/deposit only).
- **Image lightbox / gallery** (we have a thumb strip; no fullscreen).
- **Similar / nearby listings** at the bottom.
- **Nearby & commute** — metro, schools, hospitals (approx, pre-unlock).
- **Schedule a visit / request callback** (post-unlock CTA beyond "call").

### Trust & social proof
- **Reviews** — locality + property/owner reviews. NoBroker's #1 known gap → our differentiator.
- **Social proof band** — real counts ("N verified homes"), testimonials.
- Verified-photo / freshness timestamps shown consistently.

### Engagement / retention
- **Compare** listings side by side.
- **Alerts / notifications** (email or in-app) for saved searches.
- **Owner "list your property" path** (supply side beyond scouts).

## B. Layout / design gaps (per surface)
- **Home**: add a social-proof stats band, popular-locality chips (quick links into Discover), and a testimonials/reviews strip. Hero search should have locality autocomplete.
- **Discover**: cramped filters on mobile → drawer; add a list⇄map split; card needs image carousel + more data; result header could add saved-search "🔔 Save this search".
- **Listing**: too sparse — needs amenities, spec table, price breakdown, lightbox, similar listings, nearby. Sticky sidebar is good; add "Schedule visit" post-unlock.
- **Global**: breadcrumbs on inner pages; consistent 8pt spacing rhythm; skeleton parity; better empty states with suggested localities.

## C. Data-model additions required
On `rentalOpportunities` (+ scout form + submit validation): `propertyType`, `areaSqft`, `floor`, `facing`, `availabilityDate`, `maintenance`, `amenities: string[]`, richer `mediaUrls` (already), `furnishing` (have). New collections: `savedSearches`, `reviews` (locality/property), `visitRequests`, `recentlyViewed` (client/localStorage).

## D. Phased fix plan (ranked by impact ÷ effort)

**Phase 1 — Core browsing (highest impact)**
1. Discover **map view** (Leaflet/OpenStreetMap, no key) with approx price pins + list⇄map toggle.
2. **Filter upgrade**: budget min–max, furnishing, property type, "verified only"; mobile filter **drawer** with active count; keep chips + sort.
3. **Card carousel** + photo count + consistent data row.
4. **Saved searches** (save filter set → `savedSearches`; badge in profile) — alerts can be email later.
5. **Recently viewed** (localStorage strip on Discover/Home).

**Phase 2 — Listing depth + trust**
6. PDP: amenities grid, spec table, price breakdown, image **lightbox**, **similar listings**, nearby (approx).
7. **Reviews** (locality + property) — the NoBroker gap; strong differentiator.
8. **Schedule a visit / request callback** post-unlock.
9. Data-model + scout-form fields for the above.

**Phase 3 — Engagement / retention**
10. **Compare** listings. 11. Alerts/notifications (email digest for saved searches). 12. Social-proof stats band + testimonials on home. 13. Locality autocomplete + popular-locality quick links.

**Phase 4 — Monetization / adjacent (post-traction)**
14. Real payment (Razorpay). 15. Owner "list your property" flow. 16. Rent agreement / home-services upsells. 17. Content/SEO locality landing pages.

## Sources
NoBroker/Housing UX reviews (Medium), Blacksmith "UX tips for apartment websites", Ascendix "must-have rental features", DEV.to "5 UX details for property platforms", Luxury Presence "Real estate UI/UX 2026".
