import test from 'node:test'
import assert from 'node:assert/strict'
import { getKoreaDateTime, getForecastDates, matchesDepartureTime } from '../src/utils/departureTime.ts'

test('Korean date and forecast dates cross month and year boundaries', () => {
  const now = new Date('2026-12-31T15:05:00Z')
  assert.deepEqual(getKoreaDateTime(now), { date: '2027-01-01', time: '00:05' })
  assert.deepEqual(getForecastDates(now), { today: '2027-01-01', tomorrow: '2027-01-02' })
})

test('matches supported API time ranges with exclusive end boundaries', () => {
  for (const atime of ['0700_0800', '07:00~08:00', '07~08', '07:00 - 08:00']) {
    const item = { adate: '20261004', atime }
    assert.equal(matchesDepartureTime(item, '2026-10-04', '07:00'), true)
    assert.equal(matchesDepartureTime(item, '2026-10-04', '07:59'), true)
    assert.equal(matchesDepartureTime(item, '2026-10-04', '08:00'), false)
    assert.equal(matchesDepartureTime(item, '2026-10-05', '07:30'), false)
  }
})

test('handles the last hour without including daily summary or malformed rows', () => {
  for (const atime of ['2300_2400', '23:00~00:00']) {
    assert.equal(matchesDepartureTime({ adate: '20261004', atime }, '2026-10-04', '23:59'), true)
    assert.equal(matchesDepartureTime({ adate: '20261004', atime }, '2026-10-04', '00:00'), false)
  }
  for (const atime of ['합계', '', '25:00~26:00', '07:99~08:00']) {
    assert.equal(matchesDepartureTime({ adate: '20261004', atime }, '2026-10-04', '07:30'), false)
  }
})
