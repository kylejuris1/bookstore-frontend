import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { LibraryProvider } from "../context/LibraryContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  useEffect(() => {
    // Hide navigation bar on Android and enable immersive mode
    if (Platform.OS === "android") {
      const configureNavigationBar = async () => {
        try {
          // Hide the navigation bar
          await NavigationBar.setVisibilityAsync("hidden");
          // Enable immersive mode - bar stays hidden until user swipes from edge
          await NavigationBar.setBehaviorAsync("inset-swipe");
        } catch (error) {
          console.error("Error configuring navigation bar:", error);
        }
      };

      configureNavigationBar();
    }
  }, []);

  return (
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
  );
}

