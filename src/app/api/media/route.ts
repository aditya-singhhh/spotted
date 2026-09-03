import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserFromRequest } from '@/lib/apiAuth';
import { captureError } from '@/lib/observability';

type CleanupItem = { publicId: string; resourceType?: 'image' | 'video' };

// DELETE /api/media  body: { items: [{ publicId, resourceType }] }
// Cleans up media that was uploaded but whose listing submission then failed,
// so abandoned/failed uploads don't linger as orphans in Cloudinary.
export async function DELETE(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Media cleanup is not configured.' }, { status: 501 });
  }

  const body = await req.json().catch(() => ({}));
  const items: CleanupItem[] = Array.isArray(body.items)
    ? body.items.filter((i: any) => i && typeof i.publicId === 'string').slice(0, 12)
    : [];
  if (!items.length) return NextResponse.json({ deleted: 0 });

  let deleted = 0;
  await Promise.all(
    items.map(async (item) => {
      const timestamp = Math.round(Date.now() / 1000);
      const toSign = `public_id=${item.publicId}&timestamp=${timestamp}`;
      const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
      const resourceType = item.resourceType === 'video' ? 'video' : 'image';
      const form = new URLSearchParams({ public_id: item.publicId, timestamp: String(timestamp), api_key: apiKey, signature });
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (data?.result === 'ok') deleted += 1;
      } catch (error) {
        captureError('media.cleanup', error, { publicId: item.publicId, uid: decoded.uid });
      }
    })
  );

  return NextResponse.json({ deleted });
}
