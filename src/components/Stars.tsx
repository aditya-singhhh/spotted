import { StarIcon } from './icons';

// Read-only star rating (supports halves via a clipped overlay).
export default function Stars({ value, className = 'w-4 h-4' }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="relative inline-flex align-middle" aria-label={`${value.toFixed(1)} out of 5`}>
      <span className="flex text-line">
        {[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} className={className} />)}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-yellow" style={{ width: `${pct}%` }}>
        {[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} className={`${className} shrink-0`} />)}
      </span>
    </span>
  );
}
