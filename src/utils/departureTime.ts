import type { DepartureDateTime, PassengerItem } from '../types/airport.ts'

export function getKoreaDateTime(now = new Date()): DepartureDateTime {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: string) => parts.find((value) => value.type === type)!.value
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` }
}

export function getForecastDates(now = new Date()) {
  return {
    today: getKoreaDateTime(now).date,
    tomorrow: getKoreaDateTime(new Date(now.getTime() + 86400000)).date,
  }
}

export function matchesDepartureTime(item: PassengerItem, date: string, time: string) {
  if (String(item.adate).replace(/[-./]/g, '') !== date.replaceAll('-', '')) return false
  const match = String(item.atime).trim().match(/^(\d{1,2})(?::?(\d{2}))?\s*[~～\-_–]\s*(\d{1,2})(?::?(\d{2}))?$/)
  if (!match) return false
  const start = Number(match[1]) * 60 + Number(match[2] ?? 0)
  let end = Number(match[3]) * 60 + Number(match[4] ?? 0)
  if (start >= 1440 || end > 1440 || Number(match[2] ?? 0) > 59 || Number(match[4] ?? 0) > 59) return false
  if (end <= start) end += 1440
  const [hour, minute] = time.split(':').map(Number)
  const selected = hour * 60 + minute
  return selected >= start && selected < end
}
