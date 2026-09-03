'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/discover', label: 'Explore', icon: '⌕' },
  { href: '/scout', label: 'Scout', icon: '＋' },
  { href: '/scout/dashboard', label: 'Profile', icon: '◉' }
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-50 bg-ink border-t-2 border-ink flex justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-3px_0_rgba(20,23,26,.12)]">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-w-[64px] min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold px-3 py-1 rounded-xl ${
              active ? 'text-yellow' : 'text-paper/70 hover:text-paper'
            }`}
          >
            <span aria-hidden="true" className="text-base leading-none">{t.icon}</span><span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
