// Lightweight, on-brand SVG illustrations (no raster assets, theme-friendly).
// Colours use the brand palette: ink, paper/white, indigo accent (#4F46E5).

// A delivery-style rider spotting a TO-LET board with a location pin — used on
// the "Become a scout" CTA. Designed to sit on a dark (ink) background.
export function RiderScoutArt({ className = 'w-64' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" fill="none" className={className} role="img" aria-label="A rider spotting a TO-LET board">
      {/* soft glow */}
      <circle cx="170" cy="60" r="46" fill="#4F46E5" opacity="0.18" />

      {/* TO-LET board on a pole */}
      <rect x="150" y="26" width="70" height="48" rx="6" fill="#FFFFFF" />
      <rect x="150" y="26" width="70" height="48" rx="6" stroke="#4F46E5" strokeWidth="2.5" />
      <rect x="158" y="36" width="42" height="6" rx="3" fill="#111827" />
      <rect x="158" y="48" width="54" height="4" rx="2" fill="#9CA3AF" />
      <rect x="158" y="57" width="34" height="4" rx="2" fill="#9CA3AF" />
      <rect x="182" y="74" width="4" height="40" fill="#6B7280" />

      {/* location pin popping off the board */}
      <g transform="translate(205,20)">
        <path d="M8 0C3.6 0 0 3.6 0 8c0 6 8 13 8 13s8-7 8-13c0-4.4-3.6-8-8-8Z" fill="#4F46E5" />
        <circle cx="8" cy="8" r="3" fill="#FFFFFF" />
      </g>

      {/* ground line */}
      <line x1="10" y1="160" x2="230" y2="160" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />

      {/* scooter */}
      <circle cx="70" cy="158" r="16" stroke="#FFFFFF" strokeWidth="4" />
      <circle cx="70" cy="158" r="3" fill="#FFFFFF" />
      <circle cx="120" cy="158" r="16" stroke="#FFFFFF" strokeWidth="4" />
      <circle cx="120" cy="158" r="3" fill="#FFFFFF" />
      <path d="M70 158 L92 130 H118 l6 28" stroke="#4F46E5" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M92 130 q -4 -14 -14 -16" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <rect x="60" y="112" width="18" height="14" rx="3" fill="#4F46E5" />

      {/* rider */}
      <circle cx="108" cy="104" r="9" fill="#FFFFFF" />
      <path d="M108 113 l-6 20 h14 l4 -18" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M110 120 q 12 -2 14 8" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      <path d="M100 100 a9 9 0 0 1 16 0" fill="#111827" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  );
}

// A stylised neighbourhood map with price pins — a premium, abstract brand motif.
export function NeighbourhoodMapArt({ className = 'w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className={className} role="img" aria-label="Map of spotted rentals">
      <rect x="0" y="0" width="320" height="200" rx="16" fill="#FAFAFA" />
      {/* roads */}
      <path d="M0 70 H320 M0 140 H320 M90 0 V200 M210 0 V200" stroke="#E5E7EB" strokeWidth="6" />
      {/* blocks */}
      <rect x="18" y="18" width="54" height="34" rx="4" fill="#EEF2FF" />
      <rect x="228" y="88" width="70" height="34" rx="4" fill="#ECFDF5" />
      <rect x="108" y="156" width="80" height="28" rx="4" fill="#EEF2FF" />
      {/* price pins */}
      {[[60, 60, '₹18k'], [180, 120, '₹29k'], [250, 55, '₹22k']].map(([x, y, label], i) => (
        <g key={i} transform={`translate(${Number(x) - 26},${Number(y) - 30})`}>
          <rect x="0" y="0" width="52" height="24" rx="12" fill="#111827" />
          <text x="26" y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FFFFFF" fontFamily="monospace">{label}</text>
          <path d="M26 24 l-5 8 h10 Z" fill="#111827" />
        </g>
      ))}
    </svg>
  );
}
