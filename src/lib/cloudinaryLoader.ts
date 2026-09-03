// next/image loader that asks Cloudinary for a right-sized, auto-format image.
// Non-Cloudinary URLs pass through untouched.
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!/res\.cloudinary\.com\/.+\/upload\//.test(src)) return src;
  const transform = `c_limit,w_${width},q_${quality ?? 'auto'},f_auto`;
  return src.replace('/upload/', `/upload/${transform}/`);
}

// Perceptual quality auto for video delivery — smaller stream, no visible loss.
export function optimizeCloudinaryVideo(src: string): string {
  if (!/res\.cloudinary\.com\/.+\/upload\//.test(src)) return src;
  return src.replace('/upload/', '/upload/q_auto/');
}
