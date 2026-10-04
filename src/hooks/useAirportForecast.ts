import { useEffect, useRef, useState } from 'react'
import { airportApiConfig } from '../config/airportApi'
import { ForecastRequestError, getAirportForecast } from '../services/airportForecast'
import type { DepartureDateTime, ForecastState } from '../types/airport'

export function useAirportForecast() {
  const [state, setState] = useState<ForecastState>({ status: 'idle' })
  const activeRequest = useRef<AbortController | null>(null)

  useEffect(() => () => activeRequest.current?.abort(), [])

  async function search(target: DepartureDateTime) {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const departure = { ...target }
    setState({ status: 'loading' })

    try {
      const items = await getAirportForecast(departure, airportApiConfig, controller.signal)
      if (controller.signal.aborted || activeRequest.current !== controller) return
      setState({ status: 'success', items, departure })
    } catch (error) {
      if (controller.signal.aborted || activeRequest.current !== controller) return
      setState({
        status: 'error',
        message: error instanceof ForecastRequestError ? error.message : '데이터를 불러오지 못했습니다. 다시 조회해 주세요.',
      })
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }

  return { state, search }
}
