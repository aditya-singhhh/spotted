'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// A small privacy-preserving map: shows a soft circle around the APPROXIMATE
// location (never the exact pin) so renters get area context before unlocking.
//
// The map lives inside a `.animate-fade-up` block (a CSS transform), so Leaflet
// can measure the container mid-animation and render grey/partial tiles. We fix
// that by calling invalidateSize after layout settles and whenever the box
// resizes. Create + teardown share one effect so React Strict Mode's
// double-mount can't leave the container half-initialised.
export default function ApproxMap({ lat, lng }: { lat: number; lng: number }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

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

      // Re-measure once the fade-up animation has settled (several passes covers
      // slow layout) and on every subsequent container resize.
      const refresh = () => { if (!cancelled && map) { map.invalidateSize(); map.setView([lat, lng], 14); } };
      [80, 300, 600, 1000].forEach((ms) => timers.push(setTimeout(refresh, ms)));
      if (typeof ResizeObserver !== 'undefined' && el.current) {
        ro = new ResizeObserver(() => { if (!cancelled && map) map.invalidateSize(); });
        ro.observe(el.current);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (ro) ro.disconnect();
      if (map) { map.remove(); map = null; }
    };
  }, [lat, lng]);

  return <div ref={el} className="w-full h-48 rounded-xl overflow-hidden border border-line relative z-0 bg-canvas" />;
}
