'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Media from './Media';
import { CheckIcon } from './icons';

export type Slide = {
  id: string;
  bhk: number;
  rent: number;
  landmark: string;
  status: string;
  trustScore: number;
  media?: string | null;
  photo?: string | null;
};

// Auto-advancing media carousel for the home page.
export default function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex((count + next) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [count]);

  if (!count) return null;
  const s = slides[index];

  return (
    <div className="sticker overflow-hidden relative select-none">
      <div className="relative h-64 sm:h-80 lg:h-[26rem] bg-yellowSoft border-b-2 border-ink flex items-center justify-center overflow-hidden">
        <Media
          key={s.id}
          url={s.media}
          emoji={s.photo || '🏠'}
          alt={`${s.bhk} BHK in ${s.landmark}`}
          className="w-full h-full object-cover animate-fade-in"
          emojiClassName="text-8xl animate-fade-in"
        />

        <span className={`badge absolute top-3 left-3 ${s.status === 'verified' ? 'badge-green' : 'badge-yellow'}`}>
          {s.status === 'verified' ? <><CheckIcon className="w-3 h-3" /> Verified</> : 'Community spotted'}
        </span>

        {count > 1 && (
          <>
            <button type="button" aria-label="Previous" onClick={() => go(index - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 btn w-11 h-11 !p-0 rounded-full text-xl leading-none">‹</button>
            <button type="button" aria-label="Next" onClick={() => go(index + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn w-11 h-11 !p-0 rounded-full text-xl leading-none">›</button>
          </>
        )}
      </div>

      <div className="p-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl">{s.bhk} BHK · {s.landmark}</h3>
          <p className="font-mono font-bold mt-1">₹{s.rent.toLocaleString('en-IN')} <span className="text-xs font-normal">/ month · Trust {s.trustScore}</span></p>
        </div>
        <Link href={`/listing/${s.id}`} className="btn btn-sm btn-primary shrink-0">View →</Link>
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-1 pb-2">
          {slides.map((slide, i) => (
            <button key={slide.id} type="button" aria-label={`Go to slide ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)}
              className="h-8 px-1 flex items-center group">
              <span className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-ink' : 'w-2 bg-ink/30 group-hover:bg-ink/50'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
