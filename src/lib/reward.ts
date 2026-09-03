export type MediaKind = 'video' | 'image' | 'none';

export function mediaKind(url?: string | null): MediaKind {
  if (!url || !/^https?:\/\//i.test(url)) return 'none';
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ? 'video' : 'image';
}

// Cover media for a listing: feature a video when present, else the first image.
export function pickPrimaryMedia(urls: string[]): string | null {
  return urls.find((u) => mediaKind(u) === 'video') ?? urls[0] ?? null;
}

const filled = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

export type SubmissionFields = {
  media?: string | null;
  extraMedia?: number;
  ownerName?: string | null;
  ownerPhone?: string | null;
  deposit?: number | null;
  notes?: string | null;
  furnishing?: string | null;
  bachelorAllowed?: string | null;
  landmark?: string | null;
  contactedOwner?: string | null;
  availabilityConfirmed?: boolean;
};

// Quality 0-100: media weighs most (video > photo), then direct owner contact,
// then each verified field. Extra attached media add a small bonus (up to +12).
export function submissionQuality(input: SubmissionFields): { score: number; media: MediaKind } {
  const media = mediaKind(input.media);
  let score = 20;
  score += media === 'video' ? 45 : media === 'image' ? 25 : 0;
  score += Math.min(12, Math.max(0, input.extraMedia ?? 0) * 4);
  if (input.contactedOwner === 'yes') score += 10;
  if (input.availabilityConfirmed) score += 6;
  if (filled(input.ownerName)) score += 8;
  if (filled(input.ownerPhone)) score += 6;
  if ((input.deposit ?? 0) > 0) score += 6;
  if (filled(input.notes)) score += 6;
  if (filled(input.landmark)) score += 6;
  if (input.bachelorAllowed && input.bachelorAllowed !== 'unknown') score += 6;
  if (filled(input.furnishing)) score += 4;
  return { score: Math.min(100, score), media };
}

// Scout payout for one unlock, scaled 60%-100% of the base share by quality.
export function scoutReward(unlockPrice: number, qualityScore: number, share = 0.5): number {
  const factor = 0.6 + 0.4 * (Math.max(0, Math.min(100, qualityScore)) / 100);
  return Math.round(unlockPrice * share * factor);
}
