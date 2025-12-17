import React, { useMemo } from "react"
import { View, Text, StyleSheet, Pressable, Linking, useWindowDimensions, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useTheme } from "../context/ThemeContext"

const FOOTER_BG = "#1a1625"
const FOOTER_ACCENT = "#d4876f"
const FOOTER_TEXT = "#a8a3b3"
const FOOTER_TEXT_LIGHT = "#e8e6ed"

export default function Footer() {
  const router = useRouter()
  const { theme } = useTheme()
  const windowDimensions = useWindowDimensions()
  const isWeb = Platform.OS === "web"
  
  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 24
    if (width < 1024) return width * 0.1
    return width * 0.15
  }, [windowDimensions.width])

  const isDesktop = windowDimensions.width >= 768

  const handlePrivacy = () => {
    router.push("/privacy")
  }

  const handleContact = () => {
    Linking.openURL("mailto:harba.sedo.1@gmail.com")
  }

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      {/* Top Section */}
      <View style={[styles.topSection, isDesktop && styles.topSectionDesktop]}>
        {/* Logo & Social */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="book" size={28} color={FOOTER_ACCENT} />
            <Text style={styles.logoText}>
              <Text style={styles.logoNext}>Next</Text>
              <Text style={styles.logoPage}>Page</Text>
            </Text>
          </View>
          <Text style={styles.tagline}>Your personal digital library for reading novels and stories.</Text>
          <View style={styles.socialRow}>
            <Text style={styles.followText}>Follow Us:</Text>
            <View style={styles.socialIcons}>
              <Pressable style={styles.socialIcon}>
                <Ionicons name="logo-facebook" size={20} color={FOOTER_TEXT} />
              </Pressable>
              <Pressable style={styles.socialIcon}>
                <Ionicons name="logo-instagram" size={20} color={FOOTER_TEXT} />
              </Pressable>
              <Pressable style={styles.socialIcon}>
                <Ionicons name="logo-twitter" size={20} color={FOOTER_TEXT} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Links Sections */}
        {isDesktop && (
          <>
            <View style={styles.linksSection}>
              <Text style={styles.linksSectionTitle}>Hot Genres</Text>
              <Pressable><Text style={styles.linkText}>Romance</Text></Pressable>
              <Pressable><Text style={styles.linkText}>Fantasy</Text></Pressable>
              <Pressable><Text style={styles.linkText}>Urban</Text></Pressable>
              <Pressable><Text style={styles.linkText}>Werewolf</Text></Pressable>
            </View>

            <View style={styles.linksSection}>
              <Text style={styles.linksSectionTitle}>Contact Us</Text>
              <Pressable onPress={handleContact}><Text style={styles.linkText}>Help & Support</Text></Pressable>
              <Pressable><Text style={styles.linkText}>About Us</Text></Pressable>
              <Pressable><Text style={styles.linkText}>Business</Text></Pressable>
            </View>

            <View style={styles.linksSection}>
              <Text style={styles.linksSectionTitle}>Resources</Text>
              <Pressable onPress={handlePrivacy}><Text style={styles.linkText}>Privacy Policy</Text></Pressable>
              <Pressable><Text style={styles.linkText}>Terms of Use</Text></Pressable>
              <Pressable><Text style={styles.linkText}>Content Policy</Text></Pressable>
            </View>
          </>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Section */}
      <View style={[styles.bottomSection, isDesktop && styles.bottomSectionDesktop]}>
        <Text style={styles.copyright}>© 2025 NextPage. All rights reserved.</Text>
        <View style={styles.bottomLinks}>
          <Pressable onPress={handlePrivacy}>
            <Text style={styles.bottomLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.bottomDivider}>|</Text>
          <Pressable onPress={handleContact}>
            <Text style={styles.bottomLink}>Contact Us</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: FOOTER_BG,
    paddingTop: 40,
    paddingBottom: 24,
    marginTop: 48,
  },
  topSection: {
    gap: 32,
  },
  topSectionDesktop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandSection: {
    gap: 12,
    maxWidth: 280,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 24,
  },
  logoNext: {
    fontSize: 24,
    fontWeight: "600",
    color: FOOTER_TEXT_LIGHT,
  },
  logoPage: {
    fontSize: 24,
    fontWeight: "800",
    color: FOOTER_TEXT_LIGHT,
  },
  tagline: {
    fontSize: 14,
    color: FOOTER_TEXT,
    lineHeight: 20,
  },
  followText: {
    fontSize: 14,
    color: FOOTER_TEXT,
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  socialIcons: {
    flexDirection: "row",
    gap: 8,
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  linksSection: {
    gap: 10,
  },
  linksSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: FOOTER_TEXT_LIGHT,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 14,
    color: FOOTER_TEXT,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 24,
  },
  bottomSection: {
    gap: 12,
    alignItems: "center",
  },
  bottomSectionDesktop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copyright: {
    fontSize: 13,
    color: FOOTER_TEXT,
  },
  bottomLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomLink: {
    fontSize: 13,
    color: FOOTER_ACCENT,
  },
  bottomDivider: {
    fontSize: 13,
    color: FOOTER_TEXT,
  },
})

