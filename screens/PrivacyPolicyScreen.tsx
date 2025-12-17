import { useMemo } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, useWindowDimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useTheme } from "../context/ThemeContext"
import NavigationHeader from "../components/NavigationHeader"

export default function PrivacyPolicyScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const windowDimensions = useWindowDimensions()

  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 16 // Mobile
    if (width < 1024) return width * 0.15 // Tablet
    return width * 0.31 // Desktop - 31% spacing
  }, [windowDimensions.width])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader />
      
      <ScrollView 
        style={[styles.content, { paddingHorizontal: horizontalPadding }]} 
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[styles.intro, { color: theme.text }]}>
          NextPage respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use the NextPage mobile application.
        </Text>

        {/* Section 1 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>1. Information We Collect</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We may collect the following types of information:
        </Text>

        <Text style={[styles.subheading, { color: theme.text }]}>a. Personal Information</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          When you create an account or use certain features, we may collect:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Email address</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Username or display name</Text>
        </View>

        <Text style={[styles.subheading, { color: theme.text }]}>b. Usage Information</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          We may collect non-personal information about how you use the app, such as:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Books viewed or accessed</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Reading activity and in-app interactions</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• App performance and crash data</Text>
        </View>

        <Text style={[styles.subheading, { color: theme.text }]}>c. Device Information</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          We may collect limited technical information, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Device type</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Operating system version</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• App version</Text>
        </View>

        {/* Section 2 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>2. How We Use Your Information</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          We use the collected information to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Provide and maintain app functionality</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Improve user experience and app performance</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Track reading activity to support features such as rankings or recommendations</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Communicate important updates or service notices</Text>
        </View>

        {/* Section 3 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>3. Payments</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          NextPage may offer in-app purchases or paid content. All payment transactions are processed securely by third-party payment providers. We do not store or process your payment information directly.
        </Text>

        {/* Section 4 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>4. Data Sharing</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          We do not sell or rent your personal information. We may share information only:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• With service providers that help operate the app (such as analytics or hosting services)</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• When required by law or legal process</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• To protect the rights, safety, or security of users or the app</Text>
        </View>

        {/* Section 5 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>5. Data Security</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          We take reasonable measures to protect your information from unauthorized access, loss, or misuse. However, no system is completely secure, and we cannot guarantee absolute security.
        </Text>

        {/* Section 6 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>6. Children's Privacy</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          NextPage is not intended for children under the age of 13. We do not knowingly collect personal information from children.
        </Text>

        {/* Section 7 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>7. Your Rights</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Depending on your location, you may have the right to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Access your personal data</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Request correction or deletion of your data</Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>• Withdraw consent where applicable</Text>
        </View>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          You may contact us to exercise these rights.
        </Text>

        {/* Section 8 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>8. Changes to This Policy</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          We may update this Privacy Policy from time to time. Any changes will be posted within the app or on our website.
        </Text>

        {/* Section 9 */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>9. Contact Us</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          If you have questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={[styles.contactEmail, { color: theme.primary }]}>
          harba.sedo.1@gmail.com
        </Text>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 8,
  },
  bulletItem: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    height: 40,
  },
})

