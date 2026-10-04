import type { PassengerItem } from '../types/airport.ts'

export function isPassengerSummary(item: PassengerItem): boolean {
  return [item.adate, item.atime].some((value) => {
    if (typeof value !== 'string') return false
    const label = value.normalize('NFKC').trim()
    return /^(?:total|grand[\s_-]*total|sum|합계|총계|전체)(?:$|[\s_:\-（(])/i.test(label)
  })
}

export function splitPassengerItems(items: PassengerItem[]) {
  return {
    timeItems: items.filter((item) => !isPassengerSummary(item)),
    summaryItems: items.filter(isPassengerSummary),
  }
}
