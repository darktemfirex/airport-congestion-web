import { useId, useState } from 'react'
import { getForecastDates, getKoreaDateTime } from '../utils/departureTime'
import type { DepartureDateTime } from '../types/airport'
import './DepartureForm.css'

type DepartureFormProps = {
  loading: boolean
  onSearch: (departure: DepartureDateTime) => Promise<void>
}

export default function DepartureForm({ loading, onSearch }: DepartureFormProps) {
  const [departure, setDeparture] = useState<DepartureDateTime>(() => getKoreaDateTime())
  const dates = getForecastDates()
  const id = useId()
  const dateId = `${id}-date`
  const timeId = `${id}-time`
  const helpId = `${id}-help`

  return (
    <>
      <form className="toolbar" onSubmit={(event) => {
        event.preventDefault()
        void onSearch(departure)
      }}>
        <div className="departure-field">
          <label htmlFor={dateId}>출발 날짜 (YYYY-MM-DD)</label>
          <input id={dateId} type="date" required min={dates.today} max={dates.tomorrow}
            value={departure.date} disabled={loading} aria-describedby={helpId}
            onChange={(event) => setDeparture({ ...departure, date: event.target.value })} />
        </div>
        <div className="departure-field">
          <label htmlFor={timeId}>출발 시간</label>
          <input id={timeId} type="time" required value={departure.time} disabled={loading}
            onChange={(event) => setDeparture({ ...departure, time: event.target.value })} />
        </div>
        <button type="submit" disabled={loading}>{loading ? '조회 중...' : '24시간 혼잡도 보기'}</button>
      </form>
      <p className="departure-help" id={helpId}>한국 시간(KST) 기준 · 오늘과 내일 조회 가능 · 선택한 날짜의 24시간 추이와 출발 시간 위치를 표시합니다.</p>
    </>
  )
}
