import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, TextInput, Alert, Modal, Switch, Platform, Linking, useWindowDimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useLibrary } from "../context/LibraryContext"
import { useTheme } from "../context/ThemeContext"
import { useState, useEffect, useMemo, type ComponentProps } from "react"
import { useRouter } from "expo-router"
import { fetchBook } from "../lib/api"
import NavigationHeader from "../components/NavigationHeader"
import PromotionalBanner from "../components/PromotionalBanner"

const APP_DOWNLOAD_URL = "https://apps.apple.com/app/id6756338644"

export default function SettingsScreen() {
  const { user, sendOTP, verifyOTP, signOut, loading } = useAuth()
  const { settings, updateSettings, paidChapters } = useLibrary()
  const { theme, isDarkMode, toggleTheme } = useTheme()
  const router = useRouter()
  const windowDimensions = useWindowDimensions()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPurchasedBooks, setShowPurchasedBooks] = useState(false)
  const [showFontSizeModal, setShowFontSizeModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [bookNames, setBookNames] = useState<Record<string, string>>({})
  const isWeb = Platform.OS === "web"
  
  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    // Smooth interpolation for settings screen
    if (width < 640) {
      return 16
    } else if (width < 1024) {
      const minPadding = 16
      const maxPadding = width * 0.15
      const ratio = (width - 640) / (1024 - 640)
      return minPadding + (maxPadding - minPadding) * ratio
    } else if (width < 1920) {
      const minPadding = width * 0.15
      const maxPadding = Math.min(width * 0.31, 595)
      const ratio = (width - 1024) / (1920 - 1024)
      return minPadding + (maxPadding - minPadding) * ratio
    } else {
      return Math.min(width * 0.31, 595)
    }
  }, [windowDimensions.width])

  const handleSendOTP = async () => {
    if (isWeb) {
      Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})
      return
    }
    if (!email) {
      Alert.alert("Error", "Please enter your email")
      return
    }

    setIsLoading(true)
    const { error } = await sendOTP(email)
    setIsLoading(false)

    if (error) {
      Alert.alert("Error", error)
    } else {
      setOtpSent(true)
      Alert.alert("Success", "Check your email for the OTP code!")
    }
  }

  const handleVerifyOTP = async () => {
    if (isWeb) {
      Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})
      return
    }
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP code")
      return
    }

    setIsLoading(true)
    const { error } = await verifyOTP(email, otp)
    setIsLoading(false)

    if (error) {
      Alert.alert("Error", error)
    } else {
      Alert.alert("Success", "Signed in successfully!")
      setShowLoginModal(false)
      setEmail("")
      setOtp("")
      setOtpSent(false)
    }
  }

  const handleCloseModal = () => {
    setShowLoginModal(false)
    setEmail("")
    setOtp("")
    setOtpSent(false)
  }

  const handleLogout = async () => {
    await signOut()
  }

  const handleFontSizeChange = async (size: number) => {
    await updateSettings({ fontSize: size })
    setShowFontSizeModal(false)
    Alert.alert("Success", `Font size set to ${size}pt`)
  }

  const handleDarkModeToggle = async (value: boolean) => {
    await updateSettings({ darkMode: value })
    // Theme will update automatically via ThemeContext
  }

  const handlePrivacy = () => {
    router.push("/privacy")
  }

  const handleAbout = () => {
    setShowAboutModal(true)
  }

  const handleHelp = () => {
    setShowHelpModal(true)
  }

  // Load book names for purchased chapters
  useEffect(() => {
    const loadBookNames = async () => {
      const names: Record<string, string> = {}
      for (const item of paidChapters) {
        if (!names[item.bookId]) {
          const book = await fetchBook(item.bookId)
          if (book) {
            names[item.bookId] = book.book_name
          } else {
            names[item.bookId] = `Book ${item.bookId}`
          }
        }
      }
      setBookNames(names)
    }
    if (paidChapters.length > 0) {
      loadBookNames()
    }
  }, [paidChapters])

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.text,
    },
  })

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <PromotionalBanner />
      <NavigationHeader />
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
        {!user ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Account</Text>
            <Pressable
              style={[styles.loginButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                if (isWeb) {
                  Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})
                  return
                }
                setShowLoginModal(true)
              }}
            >
              <Text style={[styles.loginButtonText, { color: theme.primaryForeground || "#fff" }]}>Continue on the App</Text>
            </Pressable>
          </View>
        ) : (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Account</Text>
            <View style={[styles.userInfo, { backgroundColor: theme.card }]}>
              <Text style={[styles.userEmail, { color: theme.text }]}>{user.email}</Text>
            </View>
            <SettingItem icon="person-circle" label="Profile" onPress={() => setShowProfileModal(true)} theme={theme} />
            <SettingItem icon="bookmark" label="My Purchased Chapters" onPress={() => setShowPurchasedBooks(true)} theme={theme} />
        </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Preferences</Text>
          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={24} color={theme.primary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>
          <SettingItem icon="text" label="Font Size" onPress={() => setShowFontSizeModal(true)} value={`${settings.fontSize || 16}pt`} theme={theme} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Support</Text>
          <SettingItem icon="help-circle" label="Help & FAQ" onPress={handleHelp} theme={theme} />
          <SettingItem icon="lock-closed" label="Privacy Policy" onPress={handlePrivacy} theme={theme} />
          <SettingItem icon="information-circle" label="About" onPress={handleAbout} theme={theme} />
          <SettingItem icon="trash-outline" label="Delete Account" onPress={() => router.push("/delete-account")} theme={theme} />
        </View>

        {user && (
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
        )}

      </ScrollView>

      {/* Login Modal */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.primary }]}>Sign In</Text>
              <Pressable onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {isWeb ? (
                <View style={styles.webOnlyBlock}>
                  <Ionicons name="phone-portrait-outline" size={48} color={theme.primary} />
                  <Text style={[styles.loginHint, { color: theme.textSecondary, textAlign: "center" }]}>
                    Sign in is available in the mobile app. Continue there to manage your account.
                  </Text>
                  <Pressable
                    style={[styles.sendOTPButton, { backgroundColor: theme.primary }]}
                    onPress={() => Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})}
                  >
                    <Text style={[styles.sendOTPButtonText, { color: theme.primaryForeground || "#fff" }]}>
                      Continue on the App
                    </Text>
                  </Pressable>
                </View>
              ) : !otpSent ? (
                <>
                  <TextInput
                    style={[styles.emailInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                    editable={!isLoading}
                  />
                  <Pressable
                    style={[styles.sendOTPButton, { backgroundColor: theme.primary }, isLoading && styles.sendOTPButtonDisabled]}
                    onPress={handleSendOTP}
                    disabled={isLoading}
                  >
                    <Text style={[styles.sendOTPButtonText, { color: theme.primaryForeground || "#fff" }]}>
                      {isLoading ? "Sending..." : "Send OTP"}
                    </Text>
                  </Pressable>
                  <Text style={[styles.loginHint, { color: theme.textSecondary }]}>
                    We'll send you a 6-digit code to sign in. No password needed!
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.otpSentText, { color: theme.text }]}>
                    Enter the 6-digit code sent to {email}
                  </Text>
                  <TextInput
                    style={[styles.otpInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="000000"
                    placeholderTextColor={theme.textSecondary}
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    editable={!isLoading}
                  />
                  <Pressable
                    style={[styles.verifyOTPButton, { backgroundColor: theme.primary }, (isLoading || otp.length !== 6) && styles.verifyOTPButtonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                  >
                    <Text style={[styles.verifyOTPButtonText, { color: theme.primaryForeground || "#fff" }]}>
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.resendButton}
                    onPress={() => {
                      setOtpSent(false)
                      setOtp("")
                    }}
                    disabled={isLoading}
                  >
                    <Text style={[styles.resendButtonText, { color: theme.primary }]}>Change email</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile</Text>
              <Pressable onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color="#9b7b6f" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.profileInfo}>
                <Ionicons name="person-circle" size={64} color={theme.primary} />
                <Text style={[styles.profileEmail, { color: theme.text }]}>{user?.email}</Text>
                <Text style={[styles.profileLabel, { color: theme.textSecondary }]}>Email Address</Text>
              </View>
              <Text style={[styles.profileNote, { color: theme.textSecondary }]}>Your profile information is managed through your account settings.</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Purchased Books Modal */}
      <Modal visible={showPurchasedBooks} transparent animationType="fade" onRequestClose={() => setShowPurchasedBooks(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Purchased Chapters</Text>
              <Pressable onPress={() => setShowPurchasedBooks(false)}>
                <Ionicons name="close" size={24} color="#9b7b6f" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {paidChapters.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="book-outline" size={48} color="#9b7b6f" />
                  <Text style={styles.emptyStateText}>No purchased chapters yet</Text>
                  <Text style={styles.emptyStateSubtext}>Chapters you unlock will appear here</Text>
                </View>
              ) : (
                <View style={styles.purchasedList}>
                  {paidChapters.map((item, index) => (
                    <View key={index} style={[styles.purchasedItem, { backgroundColor: theme.card }]}>
                      <Ionicons name="bookmark" size={20} color={theme.primary} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.purchasedText, { color: theme.text }]}>
                          {bookNames[item.bookId] || `Book ${item.bookId}`}
                        </Text>
                        <Text style={[styles.purchasedText, { color: theme.textSecondary, fontSize: 12 }]}>Chapter {item.chapterNum}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Font Size Modal */}
      <Modal visible={showFontSizeModal} transparent animationType="fade" onRequestClose={() => setShowFontSizeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Font Size</Text>
              <Pressable onPress={() => setShowFontSizeModal(false)}>
                <Ionicons name="close" size={24} color="#9b7b6f" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.fontSizePreview, { fontSize: settings.fontSize || 16 }]}>
                Sample text at {settings.fontSize || 16}pt
              </Text>
              <View style={styles.fontSizeOptions}>
                {[14, 16, 18, 20, 22].map((size) => (
                  <Pressable
                    key={size}
                    style={[
                      styles.fontSizeOption,
                      (settings.fontSize || 16) === size && styles.fontSizeOptionSelected,
                    ]}
                    onPress={() => handleFontSizeChange(size)}
                  >
                    <Text style={[
                      styles.fontSizeOptionText,
                      (settings.fontSize || 16) === size && styles.fontSizeOptionTextSelected,
                      { fontSize: size }
                    ]}>
                      Aa
                    </Text>
                    <Text style={[
                      styles.fontSizeOptionLabel,
                      (settings.fontSize || 16) === size && styles.fontSizeOptionLabelSelected,
                    ]}>
                      {size}pt
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & FAQ Modal */}
      <Modal visible={showHelpModal} transparent animationType="fade" onRequestClose={() => setShowHelpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & FAQ</Text>
              <Pressable onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color="#9b7b6f" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.faqSection}>
                <Text style={styles.faqQuestion}>How do I purchase credits?</Text>
                <Text style={styles.faqAnswer}>Tap the "TOP UP" button in the top right corner of the Home screen to purchase credit packages.</Text>
              </View>
              <View style={styles.faqSection}>
                <Text style={styles.faqQuestion}>How do I unlock chapters?</Text>
                <Text style={styles.faqAnswer}>When reading a book, locked chapters can be unlocked using credits. Each chapter costs 50 credits.</Text>
              </View>
              <View style={styles.faqSection}>
                <Text style={styles.faqQuestion}>Can I change my font size?</Text>
                <Text style={styles.faqAnswer}>Yes! Go to Settings → Preferences → Font Size to adjust the reading font size.</Text>
              </View>
              <View style={styles.faqSection}>
                <Text style={styles.faqQuestion}>How do I bookmark a book?</Text>
                <Text style={styles.faqAnswer}>Tap the bookmark icon on any book cover to add it to your library.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>


      {/* About Modal */}
      <Modal visible={showAboutModal} transparent animationType="fade" onRequestClose={() => setShowAboutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About</Text>
              <Pressable onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={24} color="#9b7b6f" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutTitle}>Next Page</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              </View>
              <Text style={styles.aboutDescription}>
                Your personal digital library for reading novels and stories. Discover new books, unlock chapters with credits, and enjoy reading anywhere.
              </Text>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutLabel}>© 2024 Next Page App</Text>
                <Text style={styles.aboutLabel}>All rights reserved</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function SettingItem({
  icon,
  label,
  onPress,
  value,
  theme,
}: {
  icon: ComponentProps<typeof Ionicons>["name"]
  label: string
  onPress: () => void
  value?: string
  theme: any
}) {
  return (
    <Pressable style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={theme.primary} />
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
        {value && <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{value}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  header: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d4876f",
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 32,
    marginBottom: 24,
    backgroundColor: "#d4876f",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#d4876f",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#d4876f",
  },
  modalBody: {
    padding: 20,
  },
  emailInput: {
    backgroundColor: "#0f0f0f",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  sendOTPButton: {
    backgroundColor: "#d4876f",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  sendOTPButtonDisabled: {
    opacity: 0.6,
  },
  sendOTPButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  otpSentText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  otpInput: {
    backgroundColor: "#0f0f0f",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: "#fff",
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    fontFamily: "monospace",
  },
  verifyOTPButton: {
    backgroundColor: "#d4876f",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  verifyOTPButtonDisabled: {
    opacity: 0.6,
  },
  verifyOTPButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resendButtonText: {
    color: "#d4876f",
    fontSize: 14,
    fontWeight: "500",
  },
  loginHint: {
    color: "#9b7b6f",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  webOnlyBlock: {
    alignItems: "center",
    gap: 12,
  },
  userInfo: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  userEmail: {
    color: "#fff",
    fontSize: 16,
  },
  settingValue: {
    color: "#9b7b6f",
    fontSize: 14,
    marginLeft: 8,
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileEmail: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  profileLabel: {
    color: "#9b7b6f",
    fontSize: 14,
    marginTop: 4,
  },
  profileNote: {
    color: "#9b7b6f",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: "#9b7b6f",
    fontSize: 14,
    marginTop: 8,
  },
  purchasedList: {
    gap: 12,
  },
  purchasedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  purchasedText: {
    color: "#fff",
    fontSize: 14,
  },
  fontSizePreview: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#0f0f0f",
    borderRadius: 8,
  },
  fontSizeOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  fontSizeOption: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2a2a2a",
    minWidth: 60,
  },
  fontSizeOptionSelected: {
    borderColor: "#d4876f",
    backgroundColor: "#1a0f0f",
  },
  fontSizeOptionText: {
    color: "#9b7b6f",
    fontWeight: "600",
    marginBottom: 4,
  },
  fontSizeOptionTextSelected: {
    color: "#d4876f",
  },
  fontSizeOptionLabel: {
    color: "#9b7b6f",
    fontSize: 12,
  },
  fontSizeOptionLabelSelected: {
    color: "#d4876f",
  },
  faqSection: {
    marginBottom: 24,
  },
  faqQuestion: {
    color: "#d4876f",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  faqAnswer: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  aboutSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  aboutTitle: {
    color: "#d4876f",
    fontSize: 24,
    fontWeight: "700",
  },
  aboutVersion: {
    color: "#9b7b6f",
    fontSize: 14,
    marginTop: 4,
  },
  aboutDescription: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  aboutLabel: {
    color: "#9b7b6f",
    fontSize: 12,
    textAlign: "center",
  },
})
