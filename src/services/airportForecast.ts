import type { DepartureDateTime, PassengerItem } from '../types/airport.ts'
import { getForecastDates } from '../utils/departureTime.ts'
import { splitPassengerItems } from '../utils/passengerSummary.ts'

type AirportApiConfig = {
  baseUrl?: string
  apiKey?: string
}

export class ForecastRequestError extends Error {}

function isRecord(value: unknown): value is PassengerItem {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseAirportForecast(data: unknown): PassengerItem[] {
  let items: unknown = data
  if (isRecord(data)) {
    const envelope = isRecord(data.response) ? data.response : data
    const header = isRecord(envelope.header) ? envelope.header : null
    const resultCode = header?.resultCode
    if (resultCode != null && !['0', '00', '0000', '200'].includes(String(resultCode))) {
      throw new ForecastRequestError('API가 오류를 반환했습니다. 인증키, 활용신청 및 요청 파라미터를 확인하세요.')
    }
    if (!isRecord(envelope.body)) throw new Error('Unexpected response')
    items = envelope.body.items
    if (isRecord(items) && 'item' in items) items = items.item
  }
  if (items == null || items === '') return []
  const list = Array.isArray(items) ? items : [items]
  if (!list.every(isRecord)) throw new Error('Unexpected items')
  return splitPassengerItems(list).timeItems
}

export async function getAirportForecast(
  departure: DepartureDateTime,
  config: AirportApiConfig,
  signal?: AbortSignal,
): Promise<PassengerItem[]> {
  try {
    const dates = getForecastDates()
    if (departure.date !== dates.today && departure.date !== dates.tomorrow) {
      throw new ForecastRequestError('현재 조회 방식에서는 오늘과 내일의 예상 혼잡도만 조회할 수 있습니다.')
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(departure.time)) {
      throw new ForecastRequestError('출발 시간을 입력해 주세요.')
    }
    const { baseUrl, apiKey } = config
    if (!baseUrl || !apiKey) {
      throw new ForecastRequestError('API 설정이 없습니다. .env 설정 후 개발 서버를 재시작하세요.')
    }
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/getPassgrAnncmt`)
    // Decode first so URLSearchParams encodes the supplied key exactly once.
    url.searchParams.set('serviceKey', decodeURIComponent(apiKey))
    url.searchParams.set('selectdate', departure.date === dates.today ? '0' : '1')
    url.searchParams.set('type', 'json')
    url.searchParams.set('numOfRows', '100')
    url.searchParams.set('pageNo', '1')

    const timeoutSignal = AbortSignal.timeout(15000)
    const response = await fetch(url, {
      method: 'GET',
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    })
    if (!response.ok) {
      throw new ForecastRequestError(`조회에 실패했습니다. (HTTP ${response.status})`)
    }
    return parseAirportForecast(await response.json())
  } catch (error) {
    if (error instanceof ForecastRequestError) throw error
    // Fetch errors may contain URLs with the API key. Only expose a safe message.
    throw new ForecastRequestError('데이터를 불러오지 못했습니다. API 주소, 네트워크, CORS 및 응답 형식을 확인하세요.')
  }
}
