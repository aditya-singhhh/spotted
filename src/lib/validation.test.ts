import test from 'node:test';
import assert from 'node:assert/strict';
import { asString, asFiniteNumber, inRange, isLatLng, stringArray } from './validation.ts';

test('asString trims, caps length, rejects non-strings', () => {
  assert.equal(asString('  hi  '), 'hi');
  assert.equal(asString(''), null);
  assert.equal(asString(5 as unknown), null);
  assert.equal(asString('abcdef', 3), 'abc');
});

test('asFiniteNumber treats null/empty as null (not 0)', () => {
  assert.equal(asFiniteNumber('3.5'), 3.5);
  assert.equal(asFiniteNumber('nope'), null);
  assert.equal(asFiniteNumber(null), null);
  assert.equal(asFiniteNumber(''), null);
  assert.equal(asFiniteNumber(0), 0);
});

test('inRange guards nulls and bounds', () => {
  assert.equal(inRange(5, 1, 10), true);
  assert.equal(inRange(0, 1, 10), false);
  assert.equal(inRange(null, 1, 10), false);
});

test('isLatLng validates coordinate ranges', () => {
  assert.equal(isLatLng(12.9, 77.6), true);
  assert.equal(isLatLng(200, 77), false);
  assert.equal(isLatLng('a', 'b'), false);
});

test('stringArray filters non-strings and caps item count', () => {
  assert.deepEqual(stringArray(['a', '', 5, 'b']), ['a', 'b']);
  assert.equal(stringArray('x' as unknown).length, 0);
  assert.equal(stringArray(Array(50).fill('u')).length, 12);
});
