import { useId, useMemo, useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import './PassengerChart.css'
import { buildTerminalForecast } from '../utils/terminalForecast'
import type { TerminalForecastRow } from '../utils/terminalForecast'
import type { PassengerItem } from '../types/airport'
import { useMediaQuery } from '../hooks/useMediaQuery'

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
      <div className="passenger-chart-scroll" tabIndex={0} aria-label={isMobile ? '24시간이 세로로 배치된 터미널별 추이 차트' : '24시간 터미널별 추이 차트, 좌우로 스크롤 가능'}>
        <div className="passenger-chart-canvas" style={{ minWidth: isMobile ? 0 : 1080, height: isMobile ? 1080 : 420 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={rows} layout={isMobile ? 'vertical' : 'horizontal'} accessibilityLayer margin={{ top: 24, right: 16, bottom: 12, left: 4 }}>
              <CartesianGrid vertical={isMobile} horizontal={!isMobile} stroke="var(--border)" strokeDasharray="4 5" />
              <XAxis type={isMobile ? 'number' : 'category'} dataKey={isMobile ? undefined : 'hour'}
                allowDecimals={false} tickFormatter={isMobile ? (value: number) => numberFormat.format(value) : undefined}
                axisLine={false} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0}
                tick={{ fill: 'var(--text)', fontSize: '0.75rem' }}
                angle={isMobile ? 0 : -45} textAnchor={isMobile ? 'middle' : 'end'} height={isMobile ? 44 : 64} tickMargin={12} />
              <YAxis type={isMobile ? 'category' : 'number'} dataKey={isMobile ? 'hour' : undefined}
                interval={isMobile ? 0 : 'preserveStartEnd'} axisLine={false} tickLine={false}
                allowDecimals={false} width={isMobile ? 58 : 66}
                tick={{ fill: 'var(--text)', fontSize: '0.75rem' }}
                tickFormatter={isMobile ? undefined : (value: number) => numberFormat.format(value)} />
              <ReferenceLine x={isMobile ? undefined : selectedHour} y={isMobile ? selectedHour : undefined}
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
                  dot={{ r: 3, fill: field.color }} activeDot={{ r: 6 }}
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
      <p className="passenger-chart-scroll-hint">{isMobile ? '위에서 아래로 시간대별 추이를 비교하세요. 점을 터치하면 인원을 확인할 수 있습니다.' : '좌우로 스크롤해 24시간 전체 추이를 확인하세요. 점을 선택하면 인원을 확인할 수 있습니다.'}</p>
      <div className="passenger-chart-notes" id={noteId}>
        <p>각 시간대의 터미널별 예상 승객 수입니다. 실제 대기시간이나 혼잡 등급을 의미하지 않습니다.</p>
        {!hasValues && <p role="status">선택한 터미널의 예상 승객 데이터가 없습니다.</p>}
        {hasMissing && <p>정보가 없는 시간대는 빈 구간으로 표시합니다.</p>}
      </div>
    </section>
  )
}

export default PassengerChart
