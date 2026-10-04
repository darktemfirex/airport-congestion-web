import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTerminalForecast } from '../src/utils/terminalForecast.ts'

const passenger = (atime, values = {}) => ({
  adate: '20261004', atime, t1egsum1: '428.0', t1dgsum1: '590.0', t2egsum1: '0.0', t2dgsum2: '1.0', ...values,
})

test('shows all 24 hours in order and adds arrivals and departures for each terminal', () => {
  const items = Array.from({ length: 24 }, (_, hour) => passenger(`${String(hour).padStart(2, '0')}_${String(hour + 1).padStart(2, '0')}`))
  const rows = buildTerminalForecast(items.reverse(), '2026-10-04')
  assert.equal(rows.length, 24)
  assert.equal(rows[0].time, '00:00~01:00')
  assert.equal(rows[23].time, '23:00~24:00')
  rows.forEach((row, hour) => {
    assert.equal(row.hour, `${String(hour).padStart(2, '0')}:00`)
    assert.equal(row.t1, 1018)
    assert.equal(row.t2, 1)
  })
})

test('excludes TOTAL and other dates, and retains missing hours as unknown', () => {
  const rows = buildTerminalForecast([
    passenger('TOTAL', { t1egsum1: '100000' }),
    passenger('07_08'),
    passenger('08_09', { adate: '20261005' }),
  ], '2026-10-04')
  assert.equal(rows[7].t1, 1018)
  assert.equal(rows[0].t1, null)
  assert.equal(rows[8].t1, null)
  assert.equal(rows.length, 24)
})

test('preserves real zero totals without fabricating partial totals for missing counts', () => {
  const rows = buildTerminalForecast([
    passenger('00_01', { t1egsum1: '', t2egsum1: '0', t2dgsum2: '0' }),
    passenger('01_02', { t1dgsum1: null }),
  ], '2026-10-04')
  assert.equal(rows[0].t1, null)
  assert.equal(rows[0].t2, 0)
  assert.equal(rows[1].t1, null)
})
