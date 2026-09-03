export type UploadedMedia = { url: string; publicId: string; resourceType: 'image' | 'video' };

const MAX_BYTES = 40 * 1024 * 1024;
const ALLOWED = /^(image|video)\//;

// Uploads to Cloudinary and returns url + public_id (for cleanup). Prefers a
// signed, auth-gated upload via /api/media/sign; falls back to the unsigned preset.
export async function uploadToCloudinary(file: File, authToken?: string): Promise<UploadedMedia> {
  if (!ALLOWED.test(file.type)) throw new Error('Only image or video files are allowed.');
  if (file.size > MAX_BYTES) throw new Error('File is too large (max 40 MB).');

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error('Cloudinary is not configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.');

  const form = new FormData();
  form.append('file', file);

  let signed = false;
  if (authToken) {
    try {
      const sigRes = await fetch('/api/media/sign', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } });
      if (sigRes.ok) {
        const s = await sigRes.json();
        form.append('api_key', s.apiKey);
        form.append('timestamp', String(s.timestamp));
        form.append('signature', s.signature);
        form.append('folder', s.folder);
        form.append('allowed_formats', s.allowedFormats);
        signed = true;
      }
    } catch {
      signed = false;
    }
  }

  if (!signed) {
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!uploadPreset) throw new Error('Cloudinary upload preset is not configured.');
    form.append('upload_preset', uploadPreset);
    form.append('folder', 'spotted-evidence');
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? 'Upload failed.');
  }
  const data = await res.json();
  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    resourceType: data.resource_type === 'video' ? 'video' : 'image'
  };
}
