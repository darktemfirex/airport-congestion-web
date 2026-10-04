import test from 'node:test'
import assert from 'node:assert/strict'
import { splitPassengerItems } from '../src/utils/passengerSummary.ts'

test('separates TOTAL variants from hourly rows without changing their counts', () => {
  const hour = { adate: '20261004', atime: '07_08', t1dgsum1: '100' }
  const summaries = ['TOTAL', ' total ', 'TOTAL (전체)', 'TOTAL_SUM', 'Grand Total', '합계', '총계', 'ＴＯＴＡＬ']
    .map((atime) => ({ adate: '20261004', atime, t1dgsum1: '10000' }))
  const result = splitPassengerItems([hour, ...summaries])
  assert.deepEqual(result.timeItems, [hour])
  assert.deepEqual(result.summaryItems, summaries)
})

test('supports summary labels in the date field and summary-only data', () => {
  const total = { adate: 'TOTAL', atime: '', t1dgsum1: null }
  assert.deepEqual(splitPassengerItems([total]), { timeItems: [], summaryItems: [total] })
  assert.deepEqual(splitPassengerItems([]), { timeItems: [], summaryItems: [] })
})
