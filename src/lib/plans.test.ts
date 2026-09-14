import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEntitlement, hasActivePass, resolveUnlockMethod, applyPlan, validatePlans, EMPTY_ENTITLEMENT, type Plan
} from './plans.ts';

const NOW = Date.parse('2026-01-01T00:00:00Z');
const day = 86400000;

test('normalizeEntitlement guards junk', () => {
  assert.deepEqual(normalizeEntitlement(null), { credits: 0, passExpiresAt: null });
  assert.deepEqual(normalizeEntitlement({ credits: '5' }), { credits: 5, passExpiresAt: null });
  assert.deepEqual(normalizeEntitlement({ credits: -3 }), { credits: 0, passExpiresAt: null });
  assert.equal(normalizeEntitlement({ credits: 2.9 }).credits, 2);
});

test('hasActivePass respects expiry', () => {
  assert.equal(hasActivePass({ credits: 0, passExpiresAt: new Date(NOW + day).toISOString() }, NOW), true);
  assert.equal(hasActivePass({ credits: 0, passExpiresAt: new Date(NOW - day).toISOString() }, NOW), false);
  assert.equal(hasActivePass(EMPTY_ENTITLEMENT, NOW), false);
});

test('resolveUnlockMethod prefers pass, then credit, then single', () => {
  assert.equal(resolveUnlockMethod({ credits: 5, passExpiresAt: new Date(NOW + day).toISOString() }, NOW), 'pass');
  assert.equal(resolveUnlockMethod({ credits: 5, passExpiresAt: null }, NOW), 'credit');
  assert.equal(resolveUnlockMethod({ credits: 0, passExpiresAt: null }, NOW), 'single');
});

test('applyPlan stacks credits', () => {
  const plan: Plan = { id: 'p', label: 'x', price: 49, type: 'credits', credits: 3, active: true };
  assert.equal(applyPlan({ credits: 2, passExpiresAt: null }, plan, NOW).credits, 5);
});

test('applyPlan extends pass from later of now/current expiry', () => {
  const pass: Plan = { id: 'm', label: 'x', price: 199, type: 'pass', days: 30, active: true };
  const fresh = applyPlan(EMPTY_ENTITLEMENT, pass, NOW);
  assert.equal(fresh.passExpiresAt, new Date(NOW + 30 * day).toISOString());
  // Buying again while active extends from current expiry, not now.
  const extended = applyPlan(fresh, pass, NOW + day);
  assert.equal(extended.passExpiresAt, new Date(NOW + 60 * day).toISOString());
});

test('validatePlans accepts good input and rejects bad', () => {
  const ok = validatePlans([
    { id: 'Pack-3', label: '3 pack', price: 49, type: 'credits', credits: 3 },
    { id: 'month', label: 'Unlimited', price: 199, type: 'pass', days: 30, active: false }
  ]);
  assert.ok('plans' in ok);
  if ('plans' in ok) {
    assert.equal(ok.plans[0].id, 'pack-3');
    assert.equal(ok.plans[1].active, false);
  }
  assert.ok('error' in validatePlans([{ id: 'a', label: 'x', price: 0, type: 'credits', credits: 1 }]));
  assert.ok('error' in validatePlans([{ id: 'a', label: 'x', price: 49, type: 'credits' }])); // missing credits
  assert.ok('error' in validatePlans([{ id: 'a', label: 'x', price: 49, type: 'pass' }])); // missing days
  assert.ok('error' in validatePlans([{ id: 'a', label: 'x', price: 49, type: 'credits', credits: 1 }, { id: 'a', label: 'y', price: 9, type: 'credits', credits: 1 }])); // dup id
});
