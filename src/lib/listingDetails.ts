// Canonical option lists + parser for the rich listing detail fields
// (NoBroker-style). All optional and PII-free, so they live on the PUBLIC doc.

export const PROPERTY_TYPES = ['Apartment', 'Independent house', 'Villa', 'Studio', 'PG'] as const;
export const FACINGS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] as const;
export const AGE_BANDS = ['New', '< 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'] as const;
export const WATER_SUPPLY = ['Corporation', 'Borewell', 'Both'] as const;
export const AMENITIES = ['Lift', 'Power backup', '24×7 water', 'Car parking', 'Bike parking', 'Security', 'CCTV', 'Gym', 'Swimming pool', 'Park', 'Gas pipeline', 'Wi-Fi'] as const;

export type ListingDetails = {
  propertyType?: string; areaSqft?: number; floor?: number; totalFloors?: number;
  facing?: string; ageBand?: string; availableFrom?: string; bathrooms?: number;
  balconies?: number; maintenance?: number; waterSupply?: string;
};

const inList = (v: unknown, list: readonly string[]) => (typeof v === 'string' && list.includes(v) ? v : undefined);
const num = (v: unknown, min: number, max: number) => { if (v === '' || v == null) return undefined; const x = Number(v); return Number.isFinite(x) && x >= min && x <= max ? x : undefined; };

// Validates + strips the optional details object + amenities from a raw body.
export function parseDetails(body: any): { details: ListingDetails; amenities: string[] } {
  const raw = body?.details ?? {};
  const d: ListingDetails = {
    propertyType: inList(raw.propertyType, PROPERTY_TYPES),
    areaSqft: num(raw.areaSqft, 50, 100000),
    floor: num(raw.floor, 0, 200),
    totalFloors: num(raw.totalFloors, 0, 200),
    facing: inList(raw.facing, FACINGS),
    ageBand: inList(raw.ageBand, AGE_BANDS),
    availableFrom: typeof raw.availableFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.availableFrom) ? raw.availableFrom : undefined,
    bathrooms: num(raw.bathrooms, 0, 20),
    balconies: num(raw.balconies, 0, 20),
    maintenance: num(raw.maintenance, 0, 1_000_000),
    waterSupply: inList(raw.waterSupply, WATER_SUPPLY)
  };
  const details = Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined)) as ListingDetails;
  const amenities = Array.isArray(body?.amenities) ? body.amenities.filter((a: unknown) => (AMENITIES as readonly string[]).includes(a as string)).slice(0, 20) : [];
  return { details, amenities };
}

// Rows for the listing spec table, in display order. Only present values render.
export function detailRows(d: ListingDetails | undefined): [string, string][] {
  if (!d) return [];
  const rows: [string, string][] = [];
  if (d.propertyType) rows.push(['Property type', d.propertyType]);
  if (d.areaSqft) rows.push(['Built-up area', `${d.areaSqft.toLocaleString('en-IN')} sq.ft`]);
  if (d.floor != null) rows.push(['Floor', d.totalFloors != null ? `${d.floor} of ${d.totalFloors}` : `${d.floor}`]);
  if (d.facing) rows.push(['Facing', d.facing]);
  if (d.bathrooms != null) rows.push(['Bathrooms', String(d.bathrooms)]);
  if (d.balconies != null) rows.push(['Balconies', String(d.balconies)]);
  if (d.ageBand) rows.push(['Age of property', d.ageBand]);
  if (d.availableFrom) rows.push(['Available from', new Date(d.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })]);
  if (d.maintenance != null) rows.push(['Maintenance', d.maintenance ? `₹${d.maintenance.toLocaleString('en-IN')}/mo` : 'None']);
  if (d.waterSupply) rows.push(['Water supply', d.waterSupply]);
  return rows;
}
