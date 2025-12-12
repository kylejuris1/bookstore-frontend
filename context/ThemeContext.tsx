import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  border: string
  primary: string
  primaryForeground: string
  muted: string
  mutedForeground: string
  text: string
  textSecondary: string
}

const darkTheme: ThemeColors = {
  background: "#0f0f0f",
  foreground: "#fff",
  card: "#1a1a1a",
  cardForeground: "#fff",
  border: "#2a2a2a",
  primary: "#d4876f",
  primaryForeground: "#fff",
  muted: "#2a2a2a",
  mutedForeground: "#9b7b6f",
  text: "#fff",
  textSecondary: "#9b7b6f",
}

const lightTheme: ThemeColors = {
  background: "#ffffff",
  foreground: "#0f0f0f",
  card: "#f5f5f5",
  cardForeground: "#0f0f0f",
  border: "#e0e0e0",
  primary: "#d4876f",
  primaryForeground: "#fff",
  muted: "#e0e0e0",
  mutedForeground: "#666666",
  text: "#0f0f0f",
  textSecondary: "#666666",
}

interface ThemeContextType {
  theme: ThemeColors
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  settings?: { darkMode?: boolean }
  updateSettings?: (settings: { darkMode: boolean }) => Promise<void>
}

export function ThemeProvider({ children, settings, updateSettings }: ThemeProviderProps) {
  // Default to light mode if settings not provided
  const isDarkMode = settings?.darkMode === true
  const [theme, setTheme] = useState<ThemeColors>(isDarkMode ? darkTheme : lightTheme)
  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode)

  useEffect(() => {
    const newIsDarkMode = settings?.darkMode === true
    setLocalDarkMode(newIsDarkMode)
    setTheme(newIsDarkMode ? darkTheme : lightTheme)
  }, [settings?.darkMode])

  const toggleTheme = async () => {
    if (updateSettings) {
      const newDarkMode = !localDarkMode
      // Optimistically update local state for immediate UI response
      setLocalDarkMode(newDarkMode)
      setTheme(newDarkMode ? darkTheme : lightTheme)
      
      try {
        await updateSettings({ darkMode: newDarkMode })
      } catch (error) {
        console.error("Error toggling theme:", error)
        // Revert on error
        setLocalDarkMode(!newDarkMode)
        setTheme(!newDarkMode ? darkTheme : lightTheme)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode: localDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    // Return default light theme if context is not available (fallback)
    return { theme: lightTheme, isDarkMode: false, toggleTheme: async () => {} }
  }
  return context
}

