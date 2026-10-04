/** API counts can be integers serialized as decimal strings, e.g. "428.0". */
export function parsePassengerCount(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null

  if (typeof value === 'string') {
    const text = value.trim()
    // Validate comma grouping and decimal syntax before converting. Blank or
    // missing values must stay unknown instead of becoming zero.
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(text)) return null
  }

  const count = typeof value === 'string' ? Number(value.trim().replaceAll(',', '')) : value
  return Number.isSafeInteger(count) && count >= 0 ? count : null
}
