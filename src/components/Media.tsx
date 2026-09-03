'use client';

import Image from 'next/image';
import { mediaKind } from '@/lib/reward';
import cloudinaryLoader, { optimizeCloudinaryVideo } from '@/lib/cloudinaryLoader';

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
  return <span className={emojiClassName}>{emoji}</span>;
}
