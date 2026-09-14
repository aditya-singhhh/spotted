import type { SVGProps } from 'react';

// Lightweight inline SVG icons (Lucide-style), sized via className, coloured by
// currentColor. Replaces emoji-as-icons for crisp, accessible UI glyphs.
function Icon({ className = 'w-5 h-5', children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></Icon>
);
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>
);
export const FilterIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></Icon>
);
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>
);
export const MapPinIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon>
);
export const XIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>
);
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>
);
export const UnlockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></Icon>
);
export const LockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>
);
export const ArrowRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>
);
export const CameraIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3" /></Icon>
);
export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon fill="currentColor" stroke="none" {...p}><path d="M6 3.5v17a1 1 0 0 0 1.5.87l14-8.5a1 1 0 0 0 0-1.74l-14-8.5A1 1 0 0 0 6 3.5Z" /></Icon>
);
export const HeartIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" /></Icon>
);
export const HeartFilledIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon fill="currentColor" stroke="none" {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" /></Icon>
);
export const WalletIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" /><path d="M3 7v12a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /><path d="M22 10v4h-4a2 2 0 0 1 0-4Z" /></Icon>
);
export const TrendingUpIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></Icon>
);
export const ShieldCheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></Icon>
);
export const SparkleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></Icon>
);
