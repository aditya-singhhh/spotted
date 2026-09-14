import type { Area } from '@/content/areas';

// A deterministic, per-area abstract "map" graphic. Seeded from the slug so each
// area gets a distinct street/block layout (never repetitive), tinted with the
// area's own colour. Pure + SSR-safe. Falls back target when no real photo exists.

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function AreaGraphic({ area, className = 'absolute inset-0 w-full h-full' }: { area: Area; className?: string }) {
  const rnd = mulberry32(hashSeed(area.slug));
  const W = 200, H = 250;

  // Two roads each way at seeded offsets → a unique grid per area.
  const vx = [40 + rnd() * 40, 120 + rnd() * 40];
  const hy = [60 + rnd() * 40, 150 + rnd() * 50];

  // A handful of blocks in the grid cells, varied opacity.
  const blocks = Array.from({ length: 5 }, () => ({
    x: 15 + rnd() * 150, y: 25 + rnd() * 150,
    w: 26 + rnd() * 34, h: 20 + rnd() * 30,
    o: 0.06 + rnd() * 0.1
  }));

  // One "park" and a couple of accent dots.
  const park = { x: 20 + rnd() * 160, y: 30 + rnd() * 120, r: 22 + rnd() * 16 };
  const pin = { x: 55 + rnd() * 90, y: 45 + rnd() * 70 };
  const dots = Array.from({ length: 2 }, () => ({ x: 30 + rnd() * 140, y: 30 + rnd() * 120 }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g-${area.slug}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={area.tint} />
          <stop offset="100%" stopColor={area.tint} stopOpacity="0.72" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#g-${area.slug})`} />

      {/* park / green patch */}
      <circle cx={park.x} cy={park.y} r={park.r} fill="#ffffff" opacity="0.10" />

      {/* blocks */}
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill="#ffffff" opacity={b.o} />
      ))}

      {/* roads */}
      <g stroke="#ffffff" strokeOpacity="0.22" strokeLinecap="round">
        {vx.map((x, i) => <line key={`v${i}`} x1={x} y1="0" x2={x} y2={H} strokeWidth={i === 0 ? 5 : 3} />)}
        {hy.map((y, i) => <line key={`h${i}`} x1="0" y1={y} x2={W} y2={y} strokeWidth={i === 0 ? 5 : 3} />)}
      </g>

      {/* accent dots */}
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3" fill="#ffffff" opacity="0.5" />)}

      {/* location pin */}
      <g transform={`translate(${pin.x - 9},${pin.y - 18})`}>
        <path d="M9 0C4 0 0 4 0 9c0 6.5 9 15 9 15s9-8.5 9-15c0-5-4-9-9-9Z" fill="#ffffff" />
        <circle cx="9" cy="9" r="3.4" fill={area.tint} />
      </g>
    </svg>
  );
}
