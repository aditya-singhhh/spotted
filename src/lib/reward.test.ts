import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaKind, submissionQuality, scoutReward, pickPrimaryMedia } from './reward.ts';

test('mediaKind classifies urls', () => {
  assert.equal(mediaKind('https://x/a.mp4'), 'video');
  assert.equal(mediaKind('https://x/a.MOV?v=1'), 'video');
  assert.equal(mediaKind('https://x/a.jpg'), 'image');
  assert.equal(mediaKind('🏠'), 'none');
  assert.equal(mediaKind(null), 'none');
});

test('quality weights video > photo > no media', () => {
  const video = submissionQuality({ media: 'https://x/a.mp4' }).score;
  const photo = submissionQuality({ media: 'https://x/a.jpg' }).score;
  const none = submissionQuality({}).score;
  assert.ok(video > photo, 'video beats photo');
  assert.ok(photo > none, 'photo beats none');
});

test('extra media adds a bonus capped at +12', () => {
  const one = submissionQuality({ media: 'https://x/a.jpg', extraMedia: 0 }).score;
  const many = submissionQuality({ media: 'https://x/a.jpg', extraMedia: 10 }).score;
  assert.equal(many - one, 12);
});

test('each verified field raises the score and it caps at 100', () => {
  const base = submissionQuality({ media: 'https://x/a.jpg' }).score;
  const withName = submissionQuality({ media: 'https://x/a.jpg', ownerName: 'Asha' }).score;
  assert.ok(withName > base);
  const maxed = submissionQuality({
    media: 'https://x/a.mp4', extraMedia: 5, ownerName: 'A', ownerPhone: '1',
    deposit: 100, notes: 'n', landmark: 'L', bachelorAllowed: 'yes', furnishing: 'semi'
  }).score;
  assert.ok(maxed <= 100);
});

test('scoutReward scales 60%-100% of base share and rounds', () => {
  assert.equal(scoutReward(100, 0), 30);
  assert.equal(scoutReward(100, 100), 50);
  const mid = scoutReward(100, 50);
  assert.ok(mid > 30 && mid < 50);
  assert.equal(scoutReward(29, 100), 15);
});

test('pickPrimaryMedia features a video, else first, else null', () => {
  assert.equal(pickPrimaryMedia(['https://x/a.jpg', 'https://x/b.mp4']), 'https://x/b.mp4');
  assert.equal(pickPrimaryMedia(['https://x/a.jpg']), 'https://x/a.jpg');
  assert.equal(pickPrimaryMedia([]), null);
});
