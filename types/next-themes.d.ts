declare module 'next-themes' {
  export interface ThemeProviderProps {
    attribute?: string
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
    forcedTheme?: string
    storageKey?: string
    themes?: string[]
    value?: { [key: string]: string }
    children?: React.ReactNode
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element

  export function useTheme(): {
    theme: string | undefined
    setTheme: (theme: string) => void
    resolvedTheme: string | undefined
    themes: string[]
    systemTheme: string | undefined
  }
}