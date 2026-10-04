export type PassengerItem = Record<string, unknown>

export type DepartureDateTime = {
  date: string
  time: string
}

export type ForecastState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; items: PassengerItem[]; departure: DepartureDateTime }
