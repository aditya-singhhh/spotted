import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSubmission } from './submitLogic.ts';

const base = { lat: 12.9, lng: 77.6, bhk: 2, rent: 25000, ownerPhone: '+91 90000 00000', contactedOwner: 'no' };

test('rejects invalid location', () => {
  const r = parseSubmission({ ...base, lat: 200 });
  assert.ok('error' in r);
});

test('rejects missing owner phone', () => {
  const r = parseSubmission({ ...base, ownerPhone: '' });
  assert.ok('error' in r);
});

test('requires the contacted-owner answer', () => {
  const { contactedOwner, ...noContact } = base;
  assert.ok('error' in parseSubmission(noContact));
  assert.ok('error' in parseSubmission({ ...base, contactedOwner: 'maybe' }));
});

test('contacting the owner + confirming availability raises quality', () => {
  const no = parseSubmission({ ...base, contactedOwner: 'no' });
  const yes = parseSubmission({ ...base, contactedOwner: 'yes', availabilityConfirmed: true });
  assert.ok('value' in no && 'value' in yes);
  if ('value' in no && 'value' in yes) {
    assert.ok(yes.value.quality > no.value.quality);
    assert.equal(yes.value.availabilityConfirmed, true);
  }
});

test('availability cannot be confirmed without contacting the owner', () => {
  const r = parseSubmission({ ...base, contactedOwner: 'no', availabilityConfirmed: true });
  assert.ok('value' in r);
  if ('value' in r) assert.equal(r.value.availabilityConfirmed, false);
});

test('rejects out-of-range bhk and rent', () => {
  assert.ok('error' in parseSubmission({ ...base, bhk: 0 }));
  assert.ok('error' in parseSubmission({ ...base, rent: 0 }));
});

test('accepts a valid minimal submission with defaults', () => {
  const r = parseSubmission(base);
  assert.ok('value' in r);
  if ('value' in r) {
    assert.equal(r.value.furnishing, 'unfurnished');
    assert.equal(r.value.bachelorAllowed, 'unknown');
    assert.equal(r.value.deposit, 0);
    assert.equal(r.value.primaryMedia, null);
    assert.equal(r.value.mediaType, 'none');
    assert.ok(r.value.quality > 0);
  }
});

test('features a video as primary and scores higher than photo-only', () => {
  const withVideo = parseSubmission({ ...base, mediaUrls: ['https://x/a.jpg', 'https://x/b.mp4'] });
  const withPhoto = parseSubmission({ ...base, mediaUrls: ['https://x/a.jpg'] });
  assert.ok('value' in withVideo && 'value' in withPhoto);
  if ('value' in withVideo && 'value' in withPhoto) {
    assert.equal(withVideo.value.primaryMedia, 'https://x/b.mp4');
    assert.equal(withVideo.value.mediaType, 'video');
    assert.ok(withVideo.value.quality > withPhoto.value.quality);
  }
});

test('drops non-media urls and caps/trims text fields', () => {
  const r = parseSubmission({ ...base, mediaUrls: ['not-a-url', 'https://x/a.jpg'], landmark: '  HSR  ' });
  assert.ok('value' in r);
  if ('value' in r) {
    assert.deepEqual(r.value.mediaUrls, ['https://x/a.jpg']);
    assert.equal(r.value.landmark, 'HSR');
  }
});
