// Authored, human area guides for major Bengaluru localities. Editorial content
// + a "Spotted rating". Keep it real and specific — these pages are for SEO and
// for genuinely helping renters decide. Add real photos later (Cloudinary).

export type AreaRating = { overall: number; connectivity: number; value: number; safety: number; amenities: number; green: number };
export type AreaSection = { heading: string; body: string };
export type Area = {
  slug: string;
  name: string;
  tagline: string;
  tint: string; // hero gradient accent
  lat: number;
  lng: number;
  rating: AreaRating;
  bestFor: string[];
  nearby: string[];
  intro: string;
  sections: AreaSection[];
  pros: string[];
  cons: string[];
  matchTerms: string[]; // substrings to match a listing's landmark to this area
};

export const AREAS: Area[] = [
  {
    slug: 'hsr-layout',
    name: 'HSR Layout',
    tagline: 'Startup-belt favourite — cafés, wide roads, and easy tech commutes.',
    tint: '#4F46E5',
    lat: 12.9116, lng: 77.6387,
    rating: { overall: 4.4, connectivity: 4.3, value: 3.8, safety: 4.5, amenities: 4.6, green: 4.2 },
    bestFor: ['Young professionals', 'Startup crowd', 'Bachelors', 'Couples'],
    nearby: ['Sarjapur Road IT corridor', 'Bellandur / Ecospace', 'Silk Board', 'Agara Lake'],
    intro:
      "If you work anywhere along the Sarjapur–Outer Ring Road tech belt, HSR Layout is the default answer — and for good reason. It's leafy, gridded into easy-to-navigate sectors, and packed with the kind of third-wave cafés, gyms and cloud kitchens that a 25–35 crowd actually uses.",
    sections: [
      { heading: 'The vibe', body: "HSR feels newer and more planned than most of Bengaluru. Wide sector roads, tree cover, and a dense cluster of cafés, co-working spaces and boutique gyms around 27th Main and the BDA complex. It skews young, professional and startup-y — you're never far from a filter-coffee stand or a specialty espresso bar." },
      { heading: 'Getting around', body: "The big win is proximity to the Sarjapur Road and ORR employers (Bellandur, Ecospace, Embassy TechVillage) — usually a 15–30 min drive. The catch is Silk Board, one of the city's most notorious junctions; the upcoming metro line along ORR will help, but for now, factor traffic into any west-bound commute." },
      { heading: 'What you pay', body: "HSR is not cheap — you're paying for convenience and lifestyle. Expect a premium over neighbouring BTM or Bommanahalli. 1 and 2 BHKs dominate the rental market, with a healthy supply of semi- and fully-furnished units aimed at working professionals." }
    ],
    pros: ['Café + gym density', 'Close to Sarjapur/ORR tech parks', 'Planned, walkable sectors', 'Feels safe, active late'],
    cons: ['Silk Board traffic', 'Rents above city average', 'Limited metro (for now)'],
    matchTerms: ['hsr']
  },
  {
    slug: 'koramangala',
    name: 'Koramangala',
    tagline: "Bengaluru's original startup hub — buzzing, central, never boring.",
    tint: '#DB2777',
    lat: 12.9352, lng: 77.6245,
    rating: { overall: 4.5, connectivity: 4.4, value: 3.5, safety: 4.4, amenities: 4.8, green: 3.9 },
    bestFor: ['Founders & startup teams', 'Foodies', 'Nightlife lovers', 'Young professionals'],
    nearby: ['Sony World Junction', 'Forum Mall', 'Ejipura', 'St. Johns'],
    intro:
      "Koramangala is where Bengaluru's startup story was written, and it still has the highest density of founders, cafés and restaurants per square kilometre in the city. It's central, energetic and expensive — the trade-off for being in the middle of everything.",
    sections: [
      { heading: 'The vibe', body: "Divided into numbered blocks, Koramangala runs from quiet residential lanes to the buzz around Forum Mall and the 5th/6th block restaurant strips. Expect the best (and priciest) eating-out scene in the city, endless cafés, and a genuinely walkable core." },
      { heading: 'Getting around', body: "Central location means most of the city is reachable, and it's close to the Sony World and Ejipura arteries. Traffic on the arterial roads is heavy at peak hours, but you'll rarely need to travel far for daily needs — most things are within Koramangala itself." },
      { heading: 'What you pay', body: "Among the priciest rental markets in Bengaluru. You pay for centrality and lifestyle. Older independent-house floors offer relative value; newer apartments command a strong premium. Bachelor-friendly stock exists but goes fast." }
    ],
    pros: ['Unbeatable food + nightlife', 'Central to the whole city', 'Startup ecosystem on your doorstep', 'Very walkable core'],
    cons: ['Among the highest rents', 'Peak-hour traffic', 'Parking can be tight'],
    matchTerms: ['koramangala']
  },
  {
    slug: 'indiranagar',
    name: 'Indiranagar',
    tagline: 'Leafy old-Bengaluru charm meets 100 Ft Road nightlife — and a metro line.',
    tint: '#059669',
    lat: 12.9784, lng: 77.6408,
    rating: { overall: 4.4, connectivity: 4.7, value: 3.4, safety: 4.5, amenities: 4.7, green: 4.4 },
    bestFor: ['Professionals', 'Couples', 'Nightlife + brunch crowd', 'Metro commuters'],
    nearby: ['100 Ft Road', 'CMH Road', 'Indiranagar Metro (Purple Line)', 'Old Airport Road'],
    intro:
      "Indiranagar blends tree-lined old-Bengaluru residential charm with one of the city's best restaurant-and-bar strips on 100 Ft Road — and, crucially, sits on the Purple Line metro, making it one of the better-connected premium neighbourhoods.",
    sections: [
      { heading: 'The vibe', body: "Quiet, canopied inner lanes give way to the lively 100 Ft Road and CMH Road, thick with restaurants, pubs, boutiques and cafés. It's a grown-up, well-established neighbourhood that still has a strong going-out scene." },
      { heading: 'Getting around', body: "The Indiranagar metro station (Purple Line) is the headline — direct access to Whitefield and the city centre without touching traffic. Old Airport Road and the ORR are close for tech commutes. This is one of the few premium areas where you can genuinely go car-lite." },
      { heading: 'What you pay', body: "Premium, on par with Koramangala. Independent-house floors and older apartments are common; expect to pay for the location and the metro access. Great if your budget stretches and you value connectivity + lifestyle." }
    ],
    pros: ['On the Purple Line metro', '100 Ft Road dining + nightlife', 'Leafy, established, safe', 'Central-east location'],
    cons: ['Premium rents', 'Busy main roads', 'Older buildings common'],
    matchTerms: ['indiranagar', 'indira nagar']
  },
  {
    slug: 'whitefield',
    name: 'Whitefield',
    tagline: 'The east-side tech township — big apartments, malls, and now a metro.',
    tint: '#0EA5E9',
    lat: 12.9698, lng: 77.7499,
    rating: { overall: 4.2, connectivity: 4.0, value: 4.3, safety: 4.4, amenities: 4.5, green: 4.0 },
    bestFor: ['IT professionals', 'Families', 'Gated-community seekers', 'Value hunters'],
    nearby: ['ITPL / EPIP Zone', 'Phoenix Marketcity', 'Whitefield Metro (Purple Line)', 'Varthur'],
    intro:
      "If you work in the ITPL/EPIP tech parks, Whitefield lets you live minutes from the office in large, amenity-rich gated communities — and with the Purple Line now extended here, the old 'too far' complaint has finally eased.",
    sections: [
      { heading: 'The vibe', body: "Whitefield is a self-contained township: sprawling gated apartment complexes, international schools, big-box malls (Phoenix Marketcity, VR Bengaluru) and a large expat + IT-family population. It trades old-city character for space, amenities and convenience." },
      { heading: 'Getting around', body: "Walk-to-work is realistic for ITPL/EPIP employees. The Purple Line extension to Whitefield is the game-changer for reaching central Bengaluru. The flip side: getting to the south/west (Koramangala, airport) is a long haul, and inner-Whitefield roads can clog." },
      { heading: 'What you pay', body: "Better value per square foot than the central neighbourhoods — you get larger 2–3 BHKs and full amenities (pool, gym, security) for what a smaller central flat costs. The best-value pick if you work in the east and want space." }
    ],
    pros: ['Walk to ITPL/EPIP', 'Big flats + full amenities', 'Metro now connected', 'Good value for space'],
    cons: ['Far from south/west Bengaluru', 'Inner-road congestion', 'Car often needed'],
    matchTerms: ['whitefield']
  },
  {
    slug: 'btm-layout',
    name: 'BTM Layout',
    tagline: 'Central, affordable and bachelor-friendly — the practical all-rounder.',
    tint: '#D97706',
    lat: 12.9166, lng: 77.6101,
    rating: { overall: 4.0, connectivity: 4.2, value: 4.5, safety: 3.9, amenities: 4.1, green: 3.5 },
    bestFor: ['Bachelors', 'Students', 'First jobbers', 'Budget-conscious renters'],
    nearby: ['Silk Board', 'Outer Ring Road', 'Jayadeva Metro (upcoming interchange)', 'Madiwala'],
    intro:
      "BTM Layout is the practical, wallet-friendly middle of Bengaluru — central enough to reach most tech corridors, dense with budget eateries and PGs, and one of the most bachelor-friendly rental markets in the city.",
    sections: [
      { heading: 'The vibe', body: "Busy, dense and unpretentious. BTM is full of PGs, affordable restaurants and everyday shops, with a large population of students and early-career professionals. It's not leafy or planned like HSR, but it's convenient and lively." },
      { heading: 'Getting around', body: "Sits near Silk Board and the ORR, so Sarjapur/ORR tech parks are reachable — traffic permitting. The Jayadeva metro interchange nearby is set to improve connectivity notably. Central position means shorter trips to Koramangala, Jayanagar and the south." },
      { heading: 'What you pay', body: "One of the best-value central areas. Plenty of affordable 1 BHKs and shared/bachelor options. Great for a first Bengaluru address or when you want central access without central prices." }
    ],
    pros: ['Affordable + central', 'Very bachelor-friendly', 'Tons of budget food', 'Near ORR tech belt'],
    cons: ['Silk Board traffic', 'Dense, less green', 'Fewer premium builds'],
    matchTerms: ['btm']
  }
];

export function getArea(slug: string): Area | undefined {
  return AREAS.find((a) => a.slug === slug);
}
