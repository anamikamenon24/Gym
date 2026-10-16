import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const readStored = () => {
  try {
    return localStorage.getItem('pulsefit-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStored)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#07090C' : '#F4F6F0')
    try {
      localStorage.setItem('pulsefit-theme', theme)
    } catch {
      /* storage unavailable — theme still works for this session */
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

// Chart colours need real values (SVG attributes), so derive them from the theme.
export const useChartColors = () => {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return {
    lime: dark ? '#C6FF3D' : '#5B9E0B',
    cyan: dark ? '#22E5FF' : '#0891B2',
    // Multi-series palette, validated for CVD separation + lightness band per mode.
    series: dark ? ['#6FA312', '#1593B5', '#9B72F2'] : ['#5B9E0B', '#0891B2', '#7C3AED'],
    grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(12,16,22,0.07)',
    axis: dark ? '#7D889A' : '#6B7280',
    tooltipBg: dark ? 'rgba(18,22,30,0.92)' : 'rgba(255,255,255,0.96)',
    tooltipBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(12,16,22,0.1)',
    text: dark ? '#F0F4F8' : '#0C1016',
    surface: dark ? '#12161E' : '#FFFFFF',
  }
}
