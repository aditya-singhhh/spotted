import Link from 'next/link';

const groups = [
  { title: 'Explore', links: [['Browse rentals', '/discover'], ['Bengaluru area guides', '/areas'], ['Become a scout', '/scout'], ['Your profile', '/scout/dashboard']] },
  { title: 'Company', links: [['How it works', '/#how-it-works'], ['Trust & safety', '/trust-and-safety'], ['Contact', '/contact']] },
  { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms'], ['Report a listing', '/trust-and-safety']] }
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-line bg-paper">
      <div className="max-w-5xl mx-auto px-5 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-display text-xl font-bold tracking-tight">spotted.</Link>
          <p className="text-sm text-slate mt-3 max-w-xs">Real homes spotted on real streets by your neighbours — verified, fresh, and broker-free.</p>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <p className="section-label mb-3">{g.title}</p>
            <ul className="space-y-2">
              {g.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-sm text-slate hover:text-ink transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="max-w-5xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate">
          <p>© {new Date().getFullYear()} spotted. All rights reserved.</p>
          <p>Made for renters, by the neighbourhood.</p>
        </div>
      </div>
    </footer>
  );
}
