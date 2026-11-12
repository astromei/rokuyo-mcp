import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRokuyo, getRokuyoMonth, findRokuyoDates } from '../dist/index.js';

test('Japan midnight new-moon boundary: 2026-10-10 and 2026-10-11', () => {
  const before = getRokuyo('2026-10-10');
  const after = getRokuyo('2026-10-11');
  assert.deepEqual(before.lunarDate, { year: 2026, month: 8, day: 30, leap: false });
  assert.equal(before.rokuyo, '先勝');
  assert.deepEqual(after.lunarDate, { year: 2026, month: 9, day: 1, leap: false });
  assert.equal(after.rokuyo, '先負');
  assert.equal(getRokuyo('2026-10-23').rokuyo, '先負');
});
test('known 大安 date from production calendar and month boundaries', () => {
  assert.equal(getRokuyo('2026-10-31').rokuyo, '大安');
  assert.equal(getRokuyoMonth(2026, 2).length, 28);
  const october = getRokuyoMonth(2026, 10);
  assert.equal(october.length, 31);
  assert.equal(october.at(-1).date, '2026-10-31');
  assert.deepEqual(findRokuyoDates('2026-10-31', '2026-10-31'), [october.at(-1)]);
});
test('reject malformed dates, impossible dates, unsupported years and unbounded searches', () => {
  for (const date of ['2026-02-29', '2026-04-31', '2026-1-01', '2026-10-11T00:00:00Z', '2024-12-31', '2028-01-01']) {
    assert.throws(() => getRokuyo(date), RangeError);
  }
  assert.throws(() => getRokuyoMonth(2026, 13), RangeError);
  assert.throws(() => findRokuyoDates('2026-01-02', '2026-01-01'), RangeError);
  assert.throws(() => findRokuyoDates('2025-01-01', '2027-01-01'), RangeError);
  assert.throws(() => findRokuyoDates('2026-01-01', '2026-01-02', 'invented'), RangeError);
});
test('returned objects cannot change later lookups', () => {
  const result = getRokuyo('2026-10-31');
  result.timeSlots.morning = '凶';
  result.lunarDate.day = 99;
  assert.equal(getRokuyo('2026-10-31').timeSlots.morning, '吉');
  assert.equal(getRokuyo('2026-10-31').lunarDate.day, 21);
});
