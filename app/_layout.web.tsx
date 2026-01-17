import React, { useEffect } from "react"
import { Stack } from "expo-router"
import { AuthProvider } from "../context/AuthContext"
import { LibraryProvider } from "../context/LibraryContext"
import { ThemeProvider } from "../context/ThemeContext"
import { SearchProvider } from "../context/SearchContext"

export default function RootLayout() {
  useEffect(() => {
    // Add Google site verification meta tag to document head
    if (typeof document !== "undefined") {
      // Check if meta tag already exists
      const existingMeta = document.querySelector('meta[name="google-site-verification"]')
      if (!existingMeta) {
        const meta = document.createElement("meta")
        meta.name = "google-site-verification"
        meta.content = "f4hE6CjKLJ6awC43ORfLGx9m34-MYJy13FZ3qqSpNw8"
        document.head.appendChild(meta)
      }
    }
  }, [])

  return (
    <AuthProvider>
      <LibraryProvider>
        <SearchProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="reader" />
          </Stack>
        </SearchProvider>
      </LibraryProvider>
    </AuthProvider>
  )
}

