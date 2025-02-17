import { useTheme } from 'next-themes'

export function useChartTheme() {
  const { theme } = useTheme()
  
  return {
    colors: {
      primary: theme === 'dark' ? '#60a5fa' : '#3b82f6',
      text: theme === 'dark' ? '#fff' : '#000',
      background: theme === 'dark' ? '#1f2937' : '#fff',
    },
    grid: {
      stroke: theme === 'dark' ? '#374151' : '#e5e7eb',
    },
  }
}