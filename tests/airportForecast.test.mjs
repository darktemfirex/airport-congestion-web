import test from 'node:test'
import assert from 'node:assert/strict'
import { ForecastRequestError, getAirportForecast, parseAirportForecast } from '../src/services/airportForecast.ts'
import { getForecastDates } from '../src/utils/departureTime.ts'

const config = { baseUrl: 'https://airport.example.test/passgrAnncmt/', apiKey: 'test%2Fkey%3D' }
const departure = () => ({ date: getForecastDates().today, time: '07:30' })
const hourRow = { adate: '20261004', atime: '07_08', t1egsum1: '100' }
const envelope = (items) => ({ response: { header: { resultCode: '00' }, body: { items } } })

test('parses list and singleton response formats while excluding TOTAL', () => {
  const rows = [hourRow, { adate: '20261004', atime: 'TOTAL' }]
  assert.deepEqual(parseAirportForecast(rows), [hourRow])
  assert.deepEqual(parseAirportForecast(envelope({ item: rows })), [hourRow])
  assert.deepEqual(parseAirportForecast(envelope({ item: hourRow })), [hourRow])
  assert.deepEqual(parseAirportForecast({ body: { items: hourRow } }), [hourRow])
  for (const items of [null, '', [], { item: [] }]) {
    assert.deepEqual(parseAirportForecast(envelope(items)), [])
  }
})

test('rejects API errors and malformed successful responses', () => {
  assert.throws(() => parseAirportForecast({ response: { header: { resultCode: '99' } } }), ForecastRequestError)
  for (const data of [{}, { body: {} , header: { resultCode: '00' }, response: {} }, envelope('invalid'), [null]]) {
    assert.throws(() => parseAirportForecast(data))
  }
})

test('requests the whole day with a once-encoded key and caller cancellation', async (t) => {
  let requestedUrl
  let requestedSignal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requestedUrl = new URL(url)
    requestedSignal = options.signal
    return new Response(JSON.stringify(envelope({ item: [hourRow] })))
  })
  const controller = new AbortController()
  assert.deepEqual(await getAirportForecast(departure(), config, controller.signal), [hourRow])
  assert.equal(requestedUrl.pathname, '/passgrAnncmt/getPassgrAnncmt')
  assert.equal(requestedUrl.searchParams.get('serviceKey'), 'test/key=')
  assert.equal(requestedUrl.searchParams.get('selectdate'), '0')
  assert.equal(requestedUrl.searchParams.get('numOfRows'), '100')
  assert.equal(requestedUrl.searchParams.get('pageNo'), '1')
  assert.equal(requestedUrl.searchParams.get('type'), 'json')
  assert.equal(requestedSignal.aborted, false)
  controller.abort()
  assert.equal(requestedSignal.aborted, true)
})

test('maps tomorrow to selectdate 1', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url.searchParams.get('selectdate'), '1')
    return new Response(JSON.stringify(envelope([])))
  })
  await getAirportForecast({ date: getForecastDates().tomorrow, time: '23:59' }, config)
})

test('validates date, time, and configuration before making a network request', async (t) => {
  const mockedFetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request') })
  await assert.rejects(getAirportForecast({ date: '2000-01-01', time: '07:30' }, config), /오늘과 내일/)
  await assert.rejects(getAirportForecast({ ...departure(), time: '24:00' }, config), /출발 시간/)
  await assert.rejects(getAirportForecast(departure(), {}), /API 설정/)
  assert.equal(mockedFetch.mock.callCount(), 0)
})

test('preserves HTTP and API errors without exposing raw response messages', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }))
  await assert.rejects(getAirportForecast(departure(), config), /HTTP 503/)
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    response: { header: { resultCode: '99', resultMsg: 'private server details' } },
  })))
  await assert.rejects(getAirportForecast(departure(), config), (error) =>
    error instanceof ForecastRequestError && !error.message.includes('private server details'),
  )
})

test('sanitizes fetch failures and malformed JSON responses', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('https://example.test?serviceKey=private-key') })
  await assert.rejects(getAirportForecast(departure(), config), (error) =>
    error instanceof ForecastRequestError && !error.message.includes('private-key'),
  )
  t.mock.method(globalThis, 'fetch', async () => new Response('invalid JSON'))
  await assert.rejects(getAirportForecast(departure(), config), /데이터를 불러오지 못했습니다/)
})
