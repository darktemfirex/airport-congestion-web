import { matchesDepartureTime } from './departureTime.ts'
import { parsePassengerCount } from './passengerCount.ts'
import { splitPassengerItems } from './passengerSummary.ts'
import type { PassengerItem } from '../types/airport.ts'

export type TerminalForecastRow = {
  hour: string
  time: string
  t1: number | null
  t2: number | null
}

function terminalTotal(arrivals: unknown, departures: unknown): number | null {
  const arrivalCount = parsePassengerCount(arrivals)
  const departureCount = parsePassengerCount(departures)
  if (arrivalCount === null || departureCount === null) return null
  const total = arrivalCount + departureCount
  return Number.isSafeInteger(total) ? total : null
}

export function buildTerminalForecast(items: PassengerItem[], date: string): TerminalForecastRow[] {
  const { timeItems } = splitPassengerItems(items)
  return Array.from({ length: 24 }, (_, hour) => {
    const start = `${String(hour).padStart(2, '0')}:00`
    const end = `${String(hour + 1).padStart(2, '0')}:00`
    const item = timeItems.find((row) => matchesDepartureTime(row, date, start))
    return {
      hour: start,
      time: `${start}~${end}`,
      t1: item ? terminalTotal(item.t1egsum1, item.t1dgsum1) : null,
      t2: item ? terminalTotal(item.t2egsum1, item.t2dgsum2) : null,
    }
  })
}
