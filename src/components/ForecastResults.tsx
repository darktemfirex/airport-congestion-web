import { lazy, Suspense } from 'react'
import type { ForecastState } from '../types/airport'
import './ForecastResults.css'

const PassengerChart = lazy(() => import('./PassengerChart'))

type ForecastResultsProps = { state: ForecastState }

function statusMessage(state: ForecastState) {
  switch (state.status) {
    case 'loading': return '승객 예측 데이터를 불러오는 중입니다.'
    case 'success': return `${state.departure.date} · 24시간 터미널별 예상 승객 추이 · 선택 시간 ${state.departure.time}`
    case 'error': return '입력값과 설정을 확인한 뒤 다시 조회해 주세요.'
    case 'idle': return '출발 날짜와 시간을 선택하고 24시간 혼잡도 보기를 눌러 주세요.'
  }
}

export default function ForecastResults({ state }: ForecastResultsProps) {
  return (
    <>
      {state.status === 'error' && <p className="notice error" role="alert">{state.message}</p>}
      <p className="notice" role="status">{statusMessage(state)}</p>
      {state.status === 'success' && (
        <Suspense fallback={<p className="notice" role="status">차트를 불러오는 중입니다.</p>}>
          <PassengerChart items={state.items} date={state.departure.date} selectedTime={state.departure.time} />
        </Suspense>
      )}
    </>
  )
}
