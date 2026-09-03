'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AccountButton from './AccountButton';
import AdminLink from './AdminLink';
import { HomeIcon, SearchIcon, PlusIcon, UserIcon } from './icons';

const tabs = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/discover', label: 'Explore', Icon: SearchIcon },
  { href: '/scout', label: 'Scout', Icon: PlusIcon },
  { href: '/scout/dashboard', label: 'Profile', Icon: UserIcon }
];

// Responsive primary navigation: a sticky top bar on desktop (brand + links +
// account) and a fixed bottom tab bar on mobile.
export default function AppNav() {
  const pathname = usePathname();
  // Pick the single most specific matching tab so parent/child routes
  // (/scout vs /scout/dashboard) don't both highlight.
  const activeHref = tabs
    .filter((t) => (t.href === '/' ? pathname === '/' : pathname === t.href || pathname.startsWith(t.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const active = (href: string) => href === activeHref;

  return (
    <>
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b-2 border-ink">
        <div className="max-w-6xl mx-auto px-5 md:px-6 h-14 md:h-16 flex items-center gap-4 md:gap-6">
          <Link href="/" className="font-display text-xl md:text-2xl leading-none">spotted.</Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active(t.href) ? 'page' : undefined}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${active(t.href) ? 'bg-ink text-paper' : 'hover:bg-ink/5'}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <AdminLink />
            <AccountButton />
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ink border-t-2 border-ink flex justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-3px_0_rgba(20,23,26,.12)]"
      >
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active(t.href) ? 'page' : undefined}
            className={`flex min-w-[64px] min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold px-3 py-1 rounded-xl ${active(t.href) ? 'text-yellow' : 'text-paper/70 hover:text-paper'}`}
          >
            <t.Icon className="w-5 h-5" />
            <span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
