import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserFromRequest } from '@/lib/apiAuth';

const FOLDER = 'spotted-evidence';
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,heic,heif,mp4,webm,mov';

// POST /api/media/sign — issues a short-lived signature for a signed Cloudinary
// upload, but only to a signed-in user. This gates uploads (unsigned presets let
// anyone with the cloud name spam the account) and pins folder + allowed formats.
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Signed uploads are not configured.' }, { status: 501 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = { allowed_formats: ALLOWED_FORMATS, folder: FOLDER, timestamp };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');

  return NextResponse.json({ cloudName, apiKey, timestamp, folder: FOLDER, allowedFormats: ALLOWED_FORMATS, signature });
}
