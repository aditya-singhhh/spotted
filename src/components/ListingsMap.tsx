'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export type MapItem = { id: string; approxLat?: number; approxLng?: number; rent: number; bhk: number; landmark: string; status: string };

const BENGALURU: [number, number] = [12.9716, 77.5946];

// Leaflet is imported dynamically inside the effect so it never runs during SSR
// (it touches `window`). Markers are price-label divIcons.
export default function ListingsMap({ items }: { items: MapItem[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current) return;

      if (!map.current) {
        map.current = L.map(el.current, { scrollWheelZoom: false, attributionControl: true }).setView(BENGALURU, 12);
        const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
        if (key) {
          L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
            attribution: '© MapTiler © OpenStreetMap contributors', maxZoom: 20, tileSize: 512, zoomOffset: -1
          }).addTo(map.current);
        } else {
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19
          }).addTo(map.current);
        }
      }

      if (layer.current) { layer.current.remove(); layer.current = null; }
      const group = L.layerGroup().addTo(map.current);
      layer.current = group;

      const pts = items.filter((i) => typeof i.approxLat === 'number' && typeof i.approxLng === 'number') as Required<MapItem>[];
      pts.forEach((i) => {
        const label = i.rent >= 1000 ? `₹${Math.round(i.rent / 1000)}k` : `₹${i.rent}`;
        const icon = L.divIcon({ className: '', html: `<span class="map-price ${i.status === 'verified' ? 'is-verified' : ''}">${label}</span>`, iconSize: [46, 26], iconAnchor: [23, 26] });
        L.marker([i.approxLat, i.approxLng], { icon })
          .addTo(group)
          .bindPopup(`<a href="/listing/${i.id}" class="map-pop">${i.bhk} BHK · ${i.landmark}</a><div class="map-pop-rent">₹${i.rent.toLocaleString('en-IN')}/mo</div>`);
      });

      if (pts.length) {
        map.current.fitBounds(L.latLngBounds(pts.map((p) => [p.approxLat, p.approxLng] as [number, number])).pad(0.25), { maxZoom: 15 });
      }
    })();
    return () => { cancelled = true; };
  }, [items]);

  useEffect(() => () => { if (map.current) { map.current.remove(); map.current = null; } }, []);

  return <div ref={el} className="w-full h-[68vh] min-h-[420px] rounded-2xl overflow-hidden border border-line relative z-0" />;
}
