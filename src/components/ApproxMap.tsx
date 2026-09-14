'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// A small privacy-preserving map: shows a soft circle around the APPROXIMATE
// location (never the exact pin) so renters get area context before unlocking.
// Create + teardown live in one effect (with a local `map`) so React Strict
// Mode's double-mount can't leave the container half-initialised.
export default function ApproxMap({ lat, lng }: { lat: number; lng: number }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false, zoomControl: false, attributionControl: true, dragging: true }).setView([lat, lng], 14);
      const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
      if (key) {
        L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, { attribution: '© MapTiler © OpenStreetMap', maxZoom: 20, tileSize: 512, zoomOffset: -1 }).addTo(map);
      } else {
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      }
      L.circle([lat, lng], { radius: 600, color: '#4F46E5', weight: 1.5, fillColor: '#4F46E5', fillOpacity: 0.12 }).addTo(map);
      setTimeout(() => { if (!cancelled && map) map.invalidateSize(); }, 60);
    })();
    return () => { cancelled = true; if (map) { map.remove(); map = null; } };
  }, [lat, lng]);

  return <div ref={el} className="w-full h-48 rounded-xl overflow-hidden border border-line relative z-0" />;
}
