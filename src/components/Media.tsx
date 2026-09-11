'use client';

import Image from 'next/image';
import { mediaKind } from '@/lib/reward';
import cloudinaryLoader, { optimizeCloudinaryVideo } from '@/lib/cloudinaryLoader';
import { HomeIcon } from './icons';

// Renders a listing's media: <video> for clips, an optimized next/image for
// photos (responsive Cloudinary sizes + lazy loading), or an emoji placeholder.
// Image/video callers must give the parent `position: relative` and a size.
export default function Media({
  url,
  emoji = '🏠',
  alt = '',
  className = '',
  emojiClassName = '',
  sizes = '(max-width: 768px) 100vw, 50vw'
}: {
  url?: string | null;
  emoji?: string;
  alt?: string;
  className?: string;
  emojiClassName?: string;
  sizes?: string;
}) {
  const kind = mediaKind(url);
  if (kind === 'video') {
    return <video src={optimizeCloudinaryVideo(url!)} className={className} autoPlay muted loop playsInline preload="none" />;
  }
  if (kind === 'image') {
    return <Image src={url!} alt={alt} fill sizes={sizes} loader={cloudinaryLoader} className={className} />;
  }
  // Branded neutral placeholder (no photo yet) — cleaner than an emoji.
  void emoji; void emojiClassName;
  return (
    <div className="absolute inset-0 flex items-center justify-center text-slate/30">
      <HomeIcon className="w-1/4 h-1/4 max-w-[56px] max-h-[56px] min-w-[22px] min-h-[22px]" />
    </div>
  );
}
