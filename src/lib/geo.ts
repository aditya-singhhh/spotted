export type LatLng = { lat: number; lng: number };

/** Distance in kilometres between two coordinates (haversine formula). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Wraps the browser Geolocation API in a promise. Client-side only. */
export function getCurrentLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/** Reverse-geocodes lat/lng into a short human-readable place name using
 *  OpenStreetMap's free Nominatim API (no key required). Client-side only. */
export async function reverseGeocode(loc: LatLng): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address ?? {};
    const parts = [a.suburb || a.neighbourhood || a.road, a.city_district || a.city || a.town].filter(
      Boolean
    );
    return parts.length ? parts.join(', ') : data.display_name ?? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  } catch {
    return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  }
}
