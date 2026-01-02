import React from "react"
import { Stack } from "expo-router"
import { Head } from "expo-router/head"
import { AuthProvider } from "../context/AuthContext"
import { LibraryProvider } from "../context/LibraryContext"
import { ThemeProvider } from "../context/ThemeContext"

export default function RootLayout() {
  return (
    <>
      <Head>
        <meta name="google-site-verification" content="f4hE6CjKLJ6awC43ORfLGx9m34-MYJy13FZ3qqSpNw8" />
      </Head>
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
    </>
  )
}

