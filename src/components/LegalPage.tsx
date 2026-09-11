import Link from 'next/link';
import type { ReactNode } from 'react';

// Shared shell for static policy / info pages.
export default function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated?: string; children: ReactNode }) {
  return (
    <main className="max-w-3xl mx-auto px-5 pt-10 pb-16">
      <Link href="/" className="text-sm font-semibold text-accent">← Back home</Link>
      <p className="section-label mt-6 mb-2">{eyebrow}</p>
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      {updated && <p className="text-sm text-slate mt-3">Last updated {updated}</p>}
      <div className="prose-spotted mt-8 space-y-5 text-[15px] leading-relaxed text-ink/80">{children}</div>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg text-ink mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
