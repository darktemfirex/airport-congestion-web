import { useId, useMemo, useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import './PassengerChart.css'
import { buildTerminalForecast } from '../utils/terminalForecast'
import type { TerminalForecastRow } from '../utils/terminalForecast'
import type { PassengerItem } from '../types/airport'
import { useMediaQuery } from '../hooks/useMediaQuery'
import HourAxisTick from './HourAxisTick'

type PassengerChartProps = {
  items: PassengerItem[]
  date: string
  selectedTime: string
}

const series = [
  { key: 't1', label: '터미널 1', color: 'var(--series-1)', dash: undefined },
  { key: 't2', label: '터미널 2', color: 'var(--series-2)', dash: '6 4' },
] as const
type Terminal = 'all' | 't1' | 't2'
const numberFormat = new Intl.NumberFormat('ko-KR')
const compactNumberFormat = new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 })
const formatCount = (count: number | null) => count === null ? '정보 없음' : `${numberFormat.format(count)}명`

function PassengerChart({ items, date, selectedTime }: PassengerChartProps) {
  const headingId = useId()
  const noteId = useId()
  const [terminal, setTerminal] = useState<Terminal>('all')
  const isMobile = useMediaQuery('(max-width: 700px)')
  const rows = useMemo(() => buildTerminalForecast(items, date), [items, date])
  const visibleSeries = series.filter((field) => terminal === 'all' || field.key === terminal)
  const hasValues = rows.some((row) => visibleSeries.some((field) => row[field.key] !== null))
  const hasMissing = rows.some((row) => visibleSeries.some((field) => row[field.key] === null))
  const selectedHour = `${selectedTime.slice(0, 2)}:00`

  return (
    <section className="passenger-chart" aria-labelledby={headingId} aria-describedby={noteId}>
      <div className="passenger-chart-header">
        <div>
          <span className="passenger-chart-eyebrow">PASSENGER FORECAST</span>
          <h2 id={headingId}>터미널별 24시간 예상 승객 추이</h2>
          <p className="passenger-chart-subtitle">{date} · 00:00~24:00 · 선택 시간 {selectedTime}</p>
        </div>
        <div className="passenger-chart-filters" role="group" aria-label="차트에 표시할 터미널">
          {([['all', '전체'], ['t1', '터미널 1'], ['t2', '터미널 2']] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={terminal === value} onClick={() => setTerminal(value)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="passenger-chart-meta">
        <span>예상 승객 수 (명)</span>
        <span>터미널별 시간대 합계</span>
      </div>
      <div className="passenger-chart-viewport" role="region" aria-label="24시간이 가로로 배치된 터미널별 추이 차트">
        <div className="passenger-chart-canvas">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={rows} layout="horizontal" accessibilityLayer
              margin={{ top: 24, right: isMobile ? 8 : 16, bottom: 8, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
              <XAxis type="category" dataKey="hour" axisLine={false} tickLine={false}
                interval={0} ticks={rows.map((row) => row.hour)}
                tick={<HourAxisTick compact={isMobile} />}
                padding={{ left: 6, right: 10 }} height={isMobile ? 46 : 36} tickMargin={10} />
              <YAxis type="number" interval="preserveStartEnd" axisLine={false} tickLine={false}
                allowDecimals={false} width={isMobile ? 42 : 66} tickCount={5}
                tick={{ fill: 'var(--text)', fontSize: isMobile ? '0.6875rem' : '0.75rem' }}
                tickFormatter={(value: number) => isMobile ? compactNumberFormat.format(value) : numberFormat.format(value)} />
              <ReferenceLine x={selectedHour}
                stroke="var(--accent)" strokeDasharray="3 3" />
              <Tooltip filterNull={false} cursor={{ stroke: 'var(--accent-border)' }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as TerminalForecastRow | undefined
                  if (!active || !row) return null
                  return (
                    <div className="passenger-chart-tooltip">
                      <p>{date}</p><strong>{row.time}</strong>
                      <dl>{visibleSeries.map((field) => (
                        <div key={field.key}>
                          <dt><span className="passenger-chart-dot" style={{ backgroundColor: field.color }} aria-hidden="true" />{field.label}</dt>
                          <dd>{formatCount(row[field.key])}</dd>
                        </div>
                      ))}</dl>
                    </div>
                  )
                }} />
              {visibleSeries.map((field) => (
                <Line key={field.key} dataKey={field.key} name={field.label} type="linear"
                  stroke={field.color} strokeWidth={2.5} strokeDasharray={field.dash}
                  dot={{ r: isMobile ? 2 : 3, fill: field.color }} activeDot={{ r: 6 }}
                  connectNulls={false} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ul className="passenger-chart-legend" aria-label="차트 범례">
        {visibleSeries.map((field) => (
          <li key={field.key}><span className="passenger-chart-line-key" style={{ borderColor: field.color, borderTopStyle: field.dash ? 'dashed' : 'solid' }} aria-hidden="true" />{field.label}</li>
        ))}
      </ul>
      <p className="passenger-chart-hint">점을 선택하면 시간대별 예상 승객 수를 확인할 수 있습니다.</p>
      <div className="passenger-chart-notes" id={noteId}>
        <p>각 시간대의 터미널별 예상 승객 수입니다. 실제 대기시간이나 혼잡 등급을 의미하지 않습니다.</p>
        {!hasValues && <p role="status">선택한 터미널의 예상 승객 데이터가 없습니다.</p>}
        {hasMissing && <p>정보가 없는 시간대는 빈 구간으로 표시합니다.</p>}
      </div>
    </section>
  )
}

export default PassengerChart
