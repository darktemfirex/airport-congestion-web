import { lazy, Suspense, useState } from 'react'
import './App.css'
import { parsePassengerCount } from './utils/passengerCount'

const PassengerChart = lazy(() => import('./components/PassengerChart'))

// VITE_ variables are public in the browser bundle.
const baseUrl = import.meta.env.VITE_BASE_URL
const apiKey = import.meta.env.VITE_API_KEY

type PassengerItem = Record<string, unknown>

const fieldLabels: Record<string, string> = {
  adate: '예고 일자', atime: '시간대',
  t1eg1: 'T1 입국장 동편 (A·B)', t1eg2: 'T1 입국장 서편 (E·F)',
  t1eg3: 'T1 입국심사 C', t1eg4: 'T1 입국심사 D', t1egsum1: 'T1 입국 합계',
  t1dg1: 'T1 출국장 1', t1dg2: 'T1 출국장 2', t1dg3: 'T1 출국장 3',
  t1dg4: 'T1 출국장 4', t1dg5: 'T1 출국장 5', t1dg6: 'T1 출국장 6',
  t1dgsum1: 'T1 출국 합계', t2eg1: 'T2 입국장 1', t2eg2: 'T2 입국장 2',
  t2egsum1: 'T2 입국 합계', t2dg1: 'T2 출국장 1', t2dg2: 'T2 출국장 2',
  t2dgsum2: 'T2 출국 합계', tmp1: '추가 정보 1', tmp2: '추가 정보 2',
}
const totalFields = ['t1egsum1', 't1dgsum1', 't2egsum1', 't2dgsum2']

function isRecord(value: unknown): value is PassengerItem {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getItems(data: unknown): PassengerItem[] {
  let items: unknown = data
  if (isRecord(data)) {
    const envelope = isRecord(data.response) ? data.response : data
    if (!isRecord(envelope.body)) throw new Error('Unexpected response')
    items = envelope.body.items
    if (isRecord(items) && 'item' in items) items = items.item
  }
  if (items == null || items === '') return []
  const list = Array.isArray(items) ? items : [items]
  if (!list.every(isRecord)) throw new Error('Unexpected items')
  return list
}

function displayValue(key: string, value: unknown): string {
  if (value == null || value === '') return '정보 없음'
  if (/^t[12][ed]g/.test(key)) {
    const count = parsePassengerCount(value)
    return count === null ? '정보 없음' : `${count.toLocaleString('ko-KR')}명`
  }
  if (key === 'adate' && /^\d{8}$/.test(String(value))) {
    return String(value).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3')
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

function App() {
  const [items, setItems] = useState<PassengerItem[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [selectedDate, setSelectedDate] = useState<'0' | '1'>('0')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function fetchAirportCongestion(selectdate: '0' | '1' = '0') {
    setLoading(true)
    setError('')
    setItems([])
    setHasLoaded(false)

    try {
      if (!baseUrl || !apiKey) {
        setError('API 설정이 없습니다. .env 설정 후 개발 서버를 재시작하세요.')
        return
      }

      const url = new URL(`${baseUrl.replace(/\/$/, '')}/getPassgrAnncmt`)
      // Decode the supplied encoded key before URLSearchParams encodes it once.
      url.searchParams.set('serviceKey', decodeURIComponent(apiKey))
      url.searchParams.set('selectdate', selectdate)
      url.searchParams.set('type', 'json')
      url.searchParams.set('numOfRows', '100')
      url.searchParams.set('pageNo', '1')

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        setError(`조회에 실패했습니다. (HTTP ${response.status})`)
        return
      }

      const data = await response.json()
      // The API can return an error header even when HTTP status is 200.
      const resultCode = (data?.response ?? data)?.header?.resultCode
      if (
        resultCode != null &&
        !['0', '00', '0000', '200'].includes(String(resultCode))
      ) {
        setError('API가 오류를 반환했습니다. 인증키, 활용신청 및 요청 파라미터를 확인하세요.')
        return
      }

      console.log('인천공항 승객 예고 데이터:', data)
      setItems(getItems(data))
      setHasLoaded(true)
      return data
    } catch {
      // Do not display exception URLs that may contain the key.
      setError('데이터를 불러오지 못했습니다. API 주소, 네트워크, CORS 및 응답 형식을 확인하세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <span className="eyebrow">INCHEON AIRPORT</span>
        <h1>인천공항 승객 예고</h1>
        <p>시간대별 예상 승객 수를 터미널과 출입국장별로 확인하세요.</p>
      </header>
      <div className="toolbar">
        <label htmlFor="select-date">조회 일자</label>
        <select id="select-date" value={selectedDate} disabled={loading} onChange={(event) => {
          setSelectedDate(event.target.value as '0' | '1')
          setItems([])
          setHasLoaded(false)
          setError('')
        }}>
          <option value="0">오늘</option>
          <option value="1">내일</option>
        </select>
        <button type="button" onClick={() => fetchAirportCongestion(selectedDate)} disabled={loading}>
          {loading ? '조회 중...' : '데이터 조회'}
        </button>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <p className="notice" role="status">
        {loading ? '승객 예고 데이터를 불러오는 중입니다.' : hasLoaded
          ? items.length ? `조회된 데이터 ${items.length}건 · 예상 승객 수 단위: 명` : '조회된 데이터가 없습니다.'
          : error ? '설정을 확인한 뒤 다시 조회해 주세요.' : '조회 일자를 선택하고 데이터 조회를 눌러 주세요.'}
      </p>
      {items.length > 0 && (
        <Suspense fallback={<p className="notice" role="status">차트를 불러오는 중입니다.</p>}>
          <PassengerChart items={items} />
        </Suspense>
      )}
      {items.length > 0 && <details className="source-details">
      <summary>출입국장별 상세 데이터 보기</summary>
      <section className="passenger-grid" aria-label="시간대별 예상 승객 상세 정보">
        {items.map((item, index) => (
          <article className="passenger-card" key={`${item.adate}-${item.atime}-${index}`}>
            <header className="card-header">
              <span>{displayValue('adate', item.adate)}</span>
              <h2>{displayValue('atime', item.atime)}</h2>
            </header>
            <dl className="totals">
              {totalFields.map((key) => (
                <div className="total" key={key}>
                  <dt>{fieldLabels[key]}</dt>
                  <dd>{displayValue(key, item[key])}</dd>
                </div>
              ))}
            </dl>
            <details>
              <summary>출입국장별 상세 정보</summary>
              <dl className="field-list">
                {Object.entries(item)
                  .filter(([key]) => !['adate', 'atime', ...totalFields].includes(key))
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt>{fieldLabels[key] ?? key}</dt>
                      <dd>{displayValue(key, value)}</dd>
                    </div>
                  ))}
              </dl>
            </details>
          </article>
        ))}
      </section>
      </details>}
    </main>
  )
}

export default App
