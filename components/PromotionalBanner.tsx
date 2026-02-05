import React, { useRef, useEffect } from "react"
import { View, Text, StyleSheet, Pressable, Image, Animated, Linking, Platform } from "react-native"
import { MetaPixelEvent } from "../lib/MetaPixelEvent"

const APP_DOWNLOAD_URL = "https://apps.apple.com/app/id6756338644"

export default function PromotionalBanner() {
  const isWeb = Platform.OS === "web"
  const shineAnim = useRef(new Animated.Value(-1)).current
  
  useEffect(() => {
    const shineAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: !isWeb, // Disable native driver on web
        }),
        Animated.timing(shineAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: !isWeb, // Disable native driver on web
        }),
      ])
    )
    shineAnimation.start()
    return () => shineAnimation.stop()
  }, [shineAnim, isWeb])

  const handleDownload = () => {
    // Fire Meta Pixel event
    void MetaPixelEvent.track("ClickButtonContinueReading")
    if (isWeb) {
      Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})
    }
  }

  return (
    <View style={styles.promotionalBanner}>
      <View style={styles.bannerLeft}>
        <Image source={require("../assets/icon.png")} style={styles.bannerIcon} />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>NextPage</Text>
          <Text style={styles.bannerSubtitle}>Download the book for free</Text>
        </View>
      </View>
      <Pressable 
        style={styles.bannerDownloadButton}
        onPress={handleDownload}
      >
        <Animated.View
          style={[
            styles.shineOverlay,
            {
              transform: [
                {
                  translateX: shineAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-200, 200],
                  }),
                },
              ],
            },
          ]}
        />
        <Text style={styles.bannerDownloadButtonText}>Download</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  promotionalBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffc566",
    paddingHorizontal: 16,
    paddingVertical: 4.5,
    gap: 6,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  bannerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  bannerTextContainer: {
    flexDirection: "column",
    gap: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  bannerSubtitle: {
    fontSize: 10,
    color: "#000",
  },
  bannerDownloadButton: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  shineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 50,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ skewX: "-20deg" }],
  },
  bannerDownloadButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    zIndex: 1,
  },
})
