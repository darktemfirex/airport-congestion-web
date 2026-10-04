import { useEffect, useState } from 'react'
import type { Theme } from '../types/theme'

export function useTheme() {
  // index.html restores the theme before the first paint.
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('airport-theme', theme)
    } catch {
      // The control remains usable when browser storage is unavailable.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggleTheme }
}
