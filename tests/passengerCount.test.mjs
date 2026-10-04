import assert from 'node:assert/strict'
import test from 'node:test'
import { parsePassengerCount } from '../src/utils/passengerCount.ts'

test('accepts the decimal strings returned by the live passenger API', () => {
  // The four totals from the 00_01 row returned on 2026-10-04.
  assert.deepEqual(
    ['428.0', '590.0', '0.0', '1.0'].map(parsePassengerCount),
    [428, 590, 0, 1],
  )
})

test('supports integer numbers, numeric strings, and comma-formatted counts', () => {
  for (const value of [1234, '1234', '1,234', '1,234.00', ' 1234.0 ']) {
    assert.equal(parsePassengerCount(value), 1234)
  }
  for (const value of [0, '0', '0.0', '0.00']) {
    assert.equal(parsePassengerCount(value), 0)
  }
})

test('keeps missing and invalid counts unknown instead of fabricating zero', () => {
  for (const value of [
    null, undefined, '', ' ', '-', '정보 없음', '1,23', '1,', '12명',
    '0x10', '1e3', '1.5', 1.5, -1, '-1.0', true, {}, [], Infinity, NaN,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    assert.equal(parsePassengerCount(value), null, `Unexpected valid count: ${String(value)}`)
  }
})
