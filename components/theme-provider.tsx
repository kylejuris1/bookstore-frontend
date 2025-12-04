// React Native doesn't need next-themes - theme handling is done via React Native's Appearance API
import * as React from 'react'
import { type ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // In React Native, theme is typically handled via Appearance API or a custom context
  // This is a placeholder - implement theme logic as needed
  return <>{children}</>
}
