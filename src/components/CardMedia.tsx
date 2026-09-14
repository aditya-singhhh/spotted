'use client';

import { useState } from 'react';
import Media from './Media';

// A mini photo carousel for listing cards. Shows arrows + dots only when there
// is more than one image. Nav buttons stop propagation so they work inside a
// card <Link>.
export default function CardMedia({ urls, cover, alt = '', className = '', emojiClassName = '' }: { urls?: string[]; cover?: string | null; alt?: string; className?: string; emojiClassName?: string }) {
  const list = (urls && urls.length ? urls : cover ? [cover] : []).filter(Boolean) as string[];
  const [i, setI] = useState(0);
  const idx = Math.min(i, Math.max(0, list.length - 1));
  const step = (d: number) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setI((prev) => (prev + d + list.length) % list.length); };

  return (
    <>
      <Media url={list[idx] ?? null} alt={alt} className={className} emojiClassName={emojiClassName} />
      {list.length > 1 && (
        <>
          <button type="button" aria-label="Previous photo" onClick={step(-1)} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-paper/85 backdrop-blur border border-line flex items-center justify-center text-sm shadow-offsetSm opacity-0 group-hover:opacity-100 transition-opacity">‹</button>
          <button type="button" aria-label="Next photo" onClick={step(1)} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-paper/85 backdrop-blur border border-line flex items-center justify-center text-sm shadow-offsetSm opacity-0 group-hover:opacity-100 transition-opacity">›</button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {list.map((_, d) => <span key={d} className={`h-1.5 rounded-full transition-all ${d === idx ? 'w-4 bg-paper' : 'w-1.5 bg-paper/60'}`} />)}
          </div>
        </>
      )}
    </>
  );
}
