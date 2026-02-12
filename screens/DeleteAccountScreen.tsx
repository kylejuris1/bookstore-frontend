import { useMemo, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput, Alert, useWindowDimensions, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useTheme } from "../context/ThemeContext"
import NavigationHeader from "../components/NavigationHeader"
import PromotionalBanner from "../components/PromotionalBanner"
import { requestAccountDeletionOtp, confirmAccountDeletion } from "../lib/api"

export default function DeleteAccountScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const windowDimensions = useWindowDimensions()

  const [email, setEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 16
    if (width < 1024) return 24
    return Math.min(width * 0.2, 384)
  }, [windowDimensions.width])

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email.")
      return
    }
    setIsLoading(true)
    const { error } = await requestAccountDeletionOtp(email)
    setIsLoading(false)
    if (error) {
      Alert.alert("Error", error)
      return
    }
    setOtpSent(true)
    Alert.alert("Code sent", "Check your email for the 6-digit code.")
  }

  const handleConfirmDelete = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email.")
      return
    }
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code from your email.")
      return
    }
    setIsLoading(true)
    const { error } = await confirmAccountDeletion(email, otp)
    setIsLoading(false)
    if (error) {
      Alert.alert("Error", error)
      return
    }
    Alert.alert("Account deleted", "Your account and all associated data have been permanently deleted.")
    setEmail("")
    setOtp("")
    setOtpSent(false)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <PromotionalBanner />
      <NavigationHeader />

      <ScrollView style={[styles.content, { paddingHorizontal: horizontalPadding }]} showsVerticalScrollIndicator={true}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Account deletion</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          NextPage by <Text style={[styles.inlineEmphasis, { color: theme.text }]}>Harba Media</Text>
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>How to delete your account</Text>
          <View style={styles.steps}>
            <Text style={[styles.step, { color: theme.textSecondary }]}>1. Enter your email address.</Text>
            <Text style={[styles.step, { color: theme.textSecondary }]}>2. Tap “Send code” to receive a one-time code (OTP) by email.</Text>
            <Text style={[styles.step, { color: theme.textSecondary }]}>3. Enter the 6-digit code.</Text>
            <Text style={[styles.step, { color: theme.textSecondary }]}>4. Tap “Delete account” to permanently delete your account.</Text>
          </View>

          <View style={[styles.warningBox, { borderColor: theme.destructive || "#dc2626" }]}>
            <Ionicons name="warning-outline" size={18} color={theme.destructive || "#dc2626"} />
            <Text style={[styles.warningText, { color: theme.destructive || "#dc2626" }]}>
              Account deletion is permanent and cannot be undone.
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>What data is deleted</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            When you complete the steps below, we permanently delete all user data associated with your account from our database,
            including (but not limited to) your profile, credits, bookmarks, settings, and unlocked content.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Delete your account</Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Email address"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          {otpSent && (
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="6-digit code"
              placeholderTextColor={theme.textSecondary}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, "").slice(0, 6))}
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              maxLength={6}
              editable={!isLoading}
            />
          )}

          {!otpSent ? (
            <Pressable
              style={[styles.primaryButton, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              <Text style={[styles.primaryButtonText, { color: theme.primaryForeground || "#fff" }]}>
                {isLoading ? "Sending..." : "Send code"}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={[styles.dangerButton, { backgroundColor: theme.destructive || "#dc2626" }, (isLoading || otp.length !== 6) && styles.buttonDisabled]}
                onPress={handleConfirmDelete}
                disabled={isLoading || otp.length !== 6}
              >
                <Text style={styles.dangerButtonText}>{isLoading ? "Deleting..." : "Delete account"}</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryLink}
                onPress={() => {
                  setOtpSent(false)
                  setOtp("")
                }}
                disabled={isLoading}
              >
                <Text style={[styles.secondaryLinkText, { color: theme.primary }]}>Use a different email</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  backButton: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { marginBottom: 12, fontSize: 14 },
  inlineEmphasis: { fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  steps: { gap: 6, marginBottom: 12 },
  step: { fontSize: 14, lineHeight: 20 },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  warningText: { fontSize: 13, fontWeight: "700", flex: 1 },
  paragraph: { fontSize: 14, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 8,
  },
  primaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { fontSize: 16, fontWeight: "700" },
  dangerButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  buttonDisabled: { opacity: 0.6 },
  secondaryLink: { marginTop: 10, alignItems: "center" },
  secondaryLinkText: { fontSize: 14, fontWeight: "700" },
})

