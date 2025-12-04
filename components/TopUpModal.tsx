import { useState } from "react"
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert } from "react-native"
import Constants from "expo-constants"
import { useStripe } from "@stripe/stripe-react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useLibrary } from "../context/LibraryContext"
import { useTheme } from "../context/ThemeContext"

// Get API URL from environment variable or use the IP address
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'https://bookstore-backend-n40b.onrender.com/api';

interface CreditPackage {
  id: string;
  baseCredits: number;
  bonusPercent: number;
  totalCredits: number;
  price: number;
}

// Credit packages - defined locally to avoid network issues
const CREDIT_PACKAGES: CreditPackage[] = [
  { id: '500', baseCredits: 500, bonusPercent: 0, totalCredits: 500, price: 4.99 },
  { id: '1000', baseCredits: 1000, bonusPercent: 10, totalCredits: 1100, price: 9.99 },
  { id: '2000', baseCredits: 2000, bonusPercent: 15, totalCredits: 2300, price: 19.99 },
  { id: '3000', baseCredits: 3000, bonusPercent: 20, totalCredits: 3600, price: 29.99 },
  { id: '5000', baseCredits: 5000, bonusPercent: 25, totalCredits: 6250, price: 49.99 },
  { id: '10000', baseCredits: 10000, bonusPercent: 30, totalCredits: 13000, price: 99.99 },
];

export default function TopUpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { credits, setCredits } = useLibrary()
  const { theme } = useTheme()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [packages] = useState<CreditPackage[]>(CREDIT_PACKAGES)
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [processing, setProcessing] = useState(false)

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to purchase credits")
      return
    }

    setSelectedPackage(pkg)
    setProcessing(true)

    try {
      // Create payment intent with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      let response
      try {
        response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageId: pkg.id,
            userId: user.id,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        // Handle network errors specifically
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please check your connection and try again.')
        }
        if (fetchError.message?.includes('Network request failed') || fetchError.message?.includes('Failed to fetch')) {
          throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please ensure:\n1. Backend server is running\n2. You're on the same network\n3. Firewall allows connections on port 3001`)
        }
        throw fetchError
      }

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If response isn't JSON, use the status text
          try {
            const text = await response.text()
            if (text) {
              errorMessage = text
            }
          } catch (textError) {
            // If we can't read the text either, use the status
            errorMessage = `Server returned error ${response.status}`
          }
        }
        throw new Error(errorMessage)
      }

      // Parse JSON response
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server. Please try again.')
      }

      const { clientSecret, package: packageData } = data

      if (!clientSecret) {
        throw new Error('Payment intent created but no client secret received')
      }

      // Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Bookstore',
        allowsDelayedPaymentMethods: false,
      })

      if (initError) {
        throw new Error(initError.message || 'Failed to initialize payment sheet')
      }

      // Present the payment sheet
      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        // User cancelled or there was an error
        if (presentError.code !== 'Canceled') {
          throw new Error(presentError.message || 'Payment failed')
        } else {
          // User cancelled - just reset state
          setProcessing(false)
          setSelectedPackage(null)
          return
        }
      }

      // Payment succeeded - verify and add credits
      // Extract payment intent ID from client secret (format: pi_xxx_secret_xxx)
      const paymentIntentId = clientSecret.split('_secret_')[0]
      if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
        throw new Error('Invalid payment intent ID format')
      }
      await verifyPayment(paymentIntentId, user.id)
    } catch (error: any) {
      console.error("Error processing payment:", error)
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
      
      // Provide more specific error messages
      let errorMessage = "Failed to process payment"
      if (error.message) {
        errorMessage = error.message
      } else if (error.name === 'TypeError') {
        if (error.message?.includes('Network request failed')) {
          errorMessage = `Network error: Could not reach server at ${API_BASE_URL}\n\nPlease check:\n• Backend server is running\n• You're on the same WiFi network\n• Firewall allows port 3001`
        } else if (error.message?.includes('Failed to fetch')) {
          errorMessage = `Connection failed: Could not connect to ${API_BASE_URL}\n\nPlease check your network connection.`
        } else {
          errorMessage = `Network error: ${error.message || 'Unknown error'}`
        }
      } else if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please check your connection."
      }
      
      Alert.alert("Payment Error", errorMessage)
      setProcessing(false)
      setSelectedPackage(null)
    }
  }

  const verifyPayment = async (paymentIntentId: string, userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          userId,
        }),
      })

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          const text = await response.text()
          if (text) {
            errorMessage = text
          }
        }
        throw new Error(errorMessage)
      }

      // Parse JSON response
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server. Please try again.')
      }

      if (data.success) {
        // Update credits in context
        setCredits(data.newTotal)
        Alert.alert("Success", `Added ${data.creditsAdded} credits to your account!`)
        onClose()
      } else {
        throw new Error(data.error || "Payment verification failed")
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to verify payment"
      if (error.message) {
        errorMessage = error.message
      } else if (error.name === 'TypeError' && error.message?.includes('Network request failed')) {
        errorMessage = "Network error: Could not reach server. Please check your connection."
      } else if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
        errorMessage = "Connection failed: Could not connect to the server."
      }
      
      Alert.alert("Verification Error", errorMessage)
    } finally {
      setProcessing(false)
      setSelectedPackage(null)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.primary }]}>Top Up Credits</Text>
              <Pressable onPress={onClose} disabled={processing}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

          {!user && (
            <View style={[styles.loginPrompt, { backgroundColor: theme.muted, borderColor: theme.primary }]}>
              <Ionicons name="lock-closed" size={20} color={theme.primary} />
              <Text style={[styles.loginPromptText, { color: theme.primary }]}>Please sign in to purchase credits</Text>
            </View>
          )}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {packages.map((pkg) => (
              <Pressable
                key={pkg.id}
                style={[
                  styles.packageCard,
                  { backgroundColor: theme.background },
                  selectedPackage?.id === pkg.id && { borderColor: theme.primary, backgroundColor: theme.muted },
                  (processing || !user) && styles.packageCardDisabled,
                ]}
                onPress={() => handlePurchase(pkg)}
                disabled={processing || !user}
              >
                <View style={styles.packageHeader}>
                  <Text style={[styles.packageCredits, { color: theme.text }]}>{pkg.totalCredits.toLocaleString()}</Text>
                  <Text style={[styles.packageCreditsLabel, { color: theme.textSecondary }]}>Credits</Text>
                </View>
                {pkg.bonusPercent > 0 && (
                  <View style={[styles.bonusBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.bonusText}>
                      {pkg.bonusPercent}% Bonus
                    </Text>
                  </View>
                )}
                <View style={styles.packageDetails}>
                  <Text style={[styles.packageBaseCredits, { color: theme.textSecondary }]}>
                    {pkg.baseCredits.toLocaleString()} base
                    {pkg.bonusPercent > 0 && ` + ${(pkg.totalCredits - pkg.baseCredits).toLocaleString()} bonus`}
                  </Text>
                  <Text style={[styles.packagePrice, { color: theme.text }]}>${pkg.price.toFixed(2)}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    maxWidth: 500,
    maxHeight: "80%",
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
  packageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  packageCardDisabled: {
    opacity: 0.5,
  },
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a1a1a",
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4876f",
    gap: 8,
  },
  loginPromptText: {
    color: "#d4876f",
    fontSize: 14,
    fontWeight: "600",
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  packageCredits: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginRight: 8,
  },
  packageCreditsLabel: {
    fontSize: 16,
    color: "#9b7b6f",
  },
  bonusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#d4876f",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  bonusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  packageDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  packageBaseCredits: {
    fontSize: 14,
    color: "#9b7b6f",
    flex: 1,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#d4876f",
  },
})

