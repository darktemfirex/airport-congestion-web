type HourAxisTickProps = {
  x?: number
  y?: number
  index?: number
  payload?: { value: string }
  compact: boolean
}

export default function HourAxisTick({ x = 0, y = 0, index = 0, payload, compact }: HourAxisTickProps) {
  if (!payload) return null
  const hour = Number(payload.value.split(':')[0])
  // Stagger neighboring labels on small screens so all 24 stay readable.
  const offset = compact && index % 2 === 1 ? 18 : 4

  return (
    <text x={x} y={y + offset} textAnchor="middle" fill="var(--text)"
      className={compact ? 'hour-axis-tick hour-axis-tick-compact' : 'hour-axis-tick'}>
      {hour}
    </text>
  )
}
