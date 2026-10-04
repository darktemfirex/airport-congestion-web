import DashboardHeader from './components/DashboardHeader'
import DepartureForm from './components/DepartureForm'
import ForecastResults from './components/ForecastResults'
import { useAirportForecast } from './hooks/useAirportForecast'
import { useTheme } from './hooks/useTheme'
import './App.css'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { state, search } = useAirportForecast()

  return (
    <main className="dashboard">
      <DashboardHeader theme={theme} onToggleTheme={toggleTheme} />
      <DepartureForm loading={state.status === 'loading'} onSearch={search} />
      <ForecastResults state={state} />
    </main>
  )
}

export default App
