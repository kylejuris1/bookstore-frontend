import React from "react"
import { Stack } from "expo-router"
import { AuthProvider } from "../context/AuthContext"
import { LibraryProvider } from "../context/LibraryContext"
import { ThemeProvider } from "../context/ThemeContext"

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="reader" />
          </Stack>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

