import type { Theme } from '../types/theme'
import './DashboardHeader.css'

type DashboardHeaderProps = {
  theme: Theme
  onToggleTheme: () => void
}

export default function DashboardHeader({ theme, onToggleTheme }: DashboardHeaderProps) {
  const actionLabel = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-top">
        <span className="eyebrow">INCHEON AIRPORT</span>
        <button className="theme-toggle" type="button" aria-label="다크 모드"
          aria-pressed={theme === 'dark'} title={actionLabel} onClick={onToggleTheme}>
          {actionLabel}
        </button>
      </div>
      <h1>인천공항 승객 예측</h1>
      <p>하루 24시간의 터미널별 예상 승객 추이를 확인하세요.</p>
    </header>
  )
}
