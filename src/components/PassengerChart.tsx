import { useId, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './PassengerChart.css'
import { parsePassengerCount } from '../utils/passengerCount'

type PassengerChartProps = {
  items: Record<string, unknown>[]
}

const series = [
  { key: 't1egsum1', label: 'T1 입국', terminal: 't1', color: '#7c5cdb' },
  { key: 't1dgsum1', label: 'T1 출국', terminal: 't1', color: '#c395f3' },
  { key: 't2egsum1', label: 'T2 입국', terminal: 't2', color: '#168b87' },
  { key: 't2dgsum2', label: 'T2 출국', terminal: 't2', color: '#71c8b4' },
] as const

type SeriesKey = (typeof series)[number]['key']
type Terminal = 'all' | 't1' | 't2'
type ChartRow = Record<SeriesKey, number | null> & {
  date: string
  time: string
  label: string
}

const numberFormat = new Intl.NumberFormat('ko-KR')
const naturalOrder = new Intl.Collator('ko-KR', { numeric: true })

function readLabel(value: unknown, fallback: string): string {
  return (typeof value === 'string' || typeof value === 'number') && String(value).trim()
    ? String(value).trim()
    : fallback
}

function formatDate(date: string): string {
  return date.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3')
}

function isSummaryRow(item: Record<string, unknown>): boolean {
  return [item.adate, item.atime].some((value) =>
    typeof value === 'string' && /^(합계|총계|total|sum)$/i.test(value.trim()),
  )
}

function formatCount(count: number | null): string {
  return count === null ? '정보 없음' : `${numberFormat.format(count)}명`
}

function PassengerChart({ items }: PassengerChartProps) {
  const headingId = useId()
  const noteId = useId()
  const [terminal, setTerminal] = useState<Terminal>('all')
  const { rows, summaryCount } = useMemo(() => {
    const timeRows = items.filter((item) => !isSummaryRow(item))
    const dates = new Set(timeRows.map((item) => readLabel(item.adate, '일자 미제공')))
    const mapped: ChartRow[] = timeRows.map((item) => {
      const date = readLabel(item.adate, '일자 미제공')
      const time = readLabel(item.atime, '시간 미제공')
      return {
        date,
        time,
        label: dates.size > 1 ? `${formatDate(date)} ${time}` : time,
        t1egsum1: parsePassengerCount(item.t1egsum1),
        t1dgsum1: parsePassengerCount(item.t1dgsum1),
        t2egsum1: parsePassengerCount(item.t2egsum1),
        t2dgsum2: parsePassengerCount(item.t2dgsum2),
      }
    })
    mapped.sort((a, b) => naturalOrder.compare(a.date, b.date) || naturalOrder.compare(a.time, b.time))
    return { rows: mapped, summaryCount: items.length - timeRows.length }
  }, [items])

  const visibleSeries = series.filter((field) => terminal === 'all' || field.terminal === terminal)
  const hasChartValues = rows.some((row) => visibleSeries.some((field) => row[field.key] !== null))
  const hasMissingValues = rows.some((row) => visibleSeries.some((field) => row[field.key] === null))
  const dates = [...new Set(rows.map((row) => formatDate(row.date)))]
  const minimumChartWidth = Math.max(360, rows.length * (terminal === 'all' ? 62 : 46) + 90)

  return (
    <section className="passenger-chart" aria-labelledby={headingId} aria-describedby={noteId}>
      <div className="passenger-chart-header">
        <div>
          <span className="passenger-chart-eyebrow">PASSENGER FORECAST</span>
          <h2 id={headingId}>시간대별 예상 승객</h2>
          <p className="passenger-chart-subtitle">
            {dates.length > 0 ? dates.join(' · ') : '조회된 일자 없음'}
            {rows.length > 0 && ` · ${rows.length}개 시간대`}
          </p>
        </div>
        <div className="passenger-chart-filters" role="group" aria-label="차트에 표시할 터미널">
          {([
            ['all', '전체'],
            ['t1', '터미널 1'],
            ['t2', '터미널 2'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={terminal === value}
              onClick={() => setTerminal(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="passenger-chart-totals">
          {visibleSeries.map((field) => {
            const counts = rows.map((row) => row[field.key]).filter((count) => count !== null)
            const total = counts.length ? counts.reduce((sum, count) => sum + count, 0) : null
            return (
              <div className="passenger-chart-total" key={field.key}>
                <span className="passenger-chart-series-label">
                  <span className="passenger-chart-dot" style={{ backgroundColor: field.color }} aria-hidden="true" />
                  {field.label}
                </span>
                <strong>{formatCount(total)}</strong>
                <span className="passenger-chart-total-caption">
                  {counts.length === rows.length ? '조회 시간대 합계' : `정보가 있는 ${counts.length}개 시간대 합계`}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {hasChartValues ? (
        <>
          <div className="passenger-chart-meta">
            <span>예상 승객 수 (명)</span>
            <span>시간대별 입국·출국 비교</span>
          </div>
          <div className="passenger-chart-scroll" tabIndex={0} aria-label="승객 차트, 좌우로 스크롤 가능">
            <div className="passenger-chart-canvas" style={{ minWidth: minimumChartWidth }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={rows} accessibilityLayer margin={{ top: 18, right: 24, bottom: 12, left: 4 }} barGap={3}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={{ fill: 'var(--text)', fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    height={dates.length > 1 ? 112 : 72}
                    tickMargin={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={66}
                    tick={{ fill: 'var(--text)', fontSize: 12 }}
                    tickFormatter={(value: number) => numberFormat.format(value)}
                  />
                  <Tooltip
                    filterNull={false}
                    cursor={{ fill: 'var(--accent-bg)' }}
                    content={({ active, payload }) => {
                      const row = payload?.[0]?.payload as ChartRow | undefined
                      if (!active || !row) return null
                      return (
                        <div className="passenger-chart-tooltip">
                          <p>{formatDate(row.date)}</p>
                          <strong>{row.time}</strong>
                          <dl>
                            {visibleSeries.map((field) => (
                              <div key={field.key}>
                                <dt>
                                  <span className="passenger-chart-dot" style={{ backgroundColor: field.color }} aria-hidden="true" />
                                  {field.label}
                                </dt>
                                <dd>{formatCount(row[field.key])}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )
                    }}
                  />
                  {visibleSeries.map((field) => (
                    <Bar
                      key={field.key}
                      dataKey={field.key}
                      name={field.label}
                      fill={field.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ul className="passenger-chart-legend" aria-label="차트 범례">
            {visibleSeries.map((field) => (
              <li key={field.key}>
                <span className="passenger-chart-dot" style={{ backgroundColor: field.color }} aria-hidden="true" />
                {field.label}
              </li>
            ))}
          </ul>
          <p className="passenger-chart-scroll-hint">차트가 화면보다 넓으면 좌우로 스크롤하세요. 막대를 선택하면 상세 인원을 확인할 수 있습니다.</p>
        </>
      ) : (
        <p className="passenger-chart-empty" role="status">
          {rows.length ? '선택한 터미널에 표시할 승객 수 정보가 없습니다.' : '차트에 표시할 시간대별 데이터가 없습니다.'}
        </p>
      )}

      <div className="passenger-chart-notes" id={noteId}>
        <p>항공편 기준 예상 승객 수이며, 실제 대기시간이나 혼잡 등급을 의미하지 않습니다.</p>
        {hasMissingValues && <p>정보가 없는 항목은 막대를 표시하지 않습니다. 합계에는 확인된 값만 포함됩니다.</p>}
        {summaryCount > 0 && <p>중복 집계를 피하기 위해 API의 합계 행 {summaryCount}개는 차트와 시간대 합계에서 제외했습니다.</p>}
      </div>

    </section>
  )
}

export default PassengerChart
