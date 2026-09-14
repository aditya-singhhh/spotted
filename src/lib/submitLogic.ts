import { submissionQuality, mediaKind, pickPrimaryMedia, type MediaKind } from './reward.ts';
import { asString, asFiniteNumber, isLatLng, stringArray, inRange } from './validation.ts';

export type ParsedSubmission = {
  lat: number; lng: number; bhk: number; rent: number; deposit: number;
  landmark: string | null; ownerName: string | null; ownerPhone: string;
  notes: string | null; furnishing: string; bachelorAllowed: string;
  contactedOwner: 'yes' | 'no'; availabilityConfirmed: boolean;
  mediaUrls: string[]; primaryMedia: string | null; mediaType: MediaKind;
  boardMediaUrls: string[]; boardMediaType: MediaKind;
  quality: number;
};

// Validates + normalises a raw scout-submission body into the exact shape the
// route persists (or an error). Pure, so it is unit-tested without Firebase.
export function parseSubmission(body: any): { error: string } | { value: ParsedSubmission } {
  const lat = asFiniteNumber(body?.lat);
  const lng = asFiniteNumber(body?.lng);
  const bhk = asFiniteNumber(body?.bhk);
  const rent = asFiniteNumber(body?.rent);
  const deposit = asFiniteNumber(body?.deposit) ?? 0;

  if (!isLatLng(lat, lng)) return { error: 'A valid location is required.' };
  if (!inRange(bhk, 1, 20)) return { error: 'BHK must be between 1 and 20.' };
  if (!inRange(rent, 1, 100_000_000)) return { error: 'Enter a valid monthly rent.' };
  if (!inRange(deposit, 0, 1_000_000_000)) return { error: 'Enter a valid deposit.' };

  const ownerPhone = asString(body?.ownerPhone, 32);
  if (!ownerPhone) return { error: 'Owner or contact number is required.' };

  if (body?.contactedOwner !== 'yes' && body?.contactedOwner !== 'no') {
    return { error: 'Please tell us whether you have spoken to the owner.' };
  }
  const contactedOwner: 'yes' | 'no' = body.contactedOwner;
  // Availability can only be confirmed if the scout actually contacted the owner.
  const availabilityConfirmed = contactedOwner === 'yes' && body?.availabilityConfirmed === true;

  const landmark = asString(body?.landmark, 120);
  const ownerName = asString(body?.ownerName, 120);
  const notes = asString(body?.notes, 1000);
  const furnishing = asString(body?.furnishing, 40) ?? 'unfurnished';
  const bachelorAllowed = ['yes', 'no', 'unknown'].includes(body?.bachelorAllowed) ? body.bachelorAllowed : 'unknown';

  // Home/property media is PUBLIC (drives browsing). Board/proof media is GATED
  // (it usually shows the owner's number) — stored privately, revealed on unlock.
  const mediaUrls = stringArray(body?.mediaUrls).filter((u) => mediaKind(u) !== 'none');
  const boardMediaUrls = stringArray(body?.boardMediaUrls).filter((u) => mediaKind(u) !== 'none');
  const primaryMedia = pickPrimaryMedia(mediaUrls);

  // Quality scores on all evidence (home + board proof).
  const allMedia = [...mediaUrls, ...boardMediaUrls];
  const { score } = submissionQuality({
    media: pickPrimaryMedia(allMedia), extraMedia: Math.max(0, allMedia.length - 1),
    ownerName, ownerPhone, deposit, notes, furnishing, bachelorAllowed, landmark,
    contactedOwner, availabilityConfirmed
  });

  return {
    value: {
      lat: lat!, lng: lng!, bhk: bhk!, rent: rent!, deposit,
      landmark, ownerName, ownerPhone, notes, furnishing, bachelorAllowed,
      contactedOwner, availabilityConfirmed,
      mediaUrls, primaryMedia, mediaType: mediaKind(primaryMedia),
      boardMediaUrls, boardMediaType: mediaKind(pickPrimaryMedia(boardMediaUrls)),
      quality: score
    }
  };
}
