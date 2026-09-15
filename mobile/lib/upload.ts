import { auth } from './firebase';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export type Uploaded = { url: string; publicId: string; resourceType: 'image' | 'video' };

// Uploads a local file (from expo-image-picker) to Cloudinary via a signed,
// auth-gated request — the backend's /api/media/sign returns everything needed
// (including the cloud name), so no Cloudinary secrets live in the app.
export async function uploadToCloudinary(uri: string, mimeType?: string): Promise<Uploaded> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in required to upload.');

  const sigRes = await fetch(`${BASE}/api/media/sign`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  if (!sigRes.ok) throw new Error('Could not authorise the upload.');
  const s = await sigRes.json();

  const name = uri.split('/').pop() || 'upload';
  const type = mimeType || (/(mp4|mov|webm)$/i.test(name) ? 'video/mp4' : 'image/jpeg');

  const form = new FormData();
  form.append('file', { uri, name, type } as any);
  form.append('api_key', s.apiKey);
  form.append('timestamp', String(s.timestamp));
  form.append('signature', s.signature);
  form.append('folder', s.folder);
  form.append('allowed_formats', s.allowedFormats);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/auto/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Upload failed.');
  return { url: data.secure_url, publicId: data.public_id, resourceType: data.resource_type === 'video' ? 'video' : 'image' };
}
