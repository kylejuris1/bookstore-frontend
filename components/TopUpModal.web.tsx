import React from "react"
import { Modal, View, Text, StyleSheet, Pressable, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { useLibrary } from "../context/LibraryContext"

const APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.bookstore.harba.app"

type TopUpModalProps = {
  visible: boolean
  onClose: () => void
}

export default function TopUpModal({ visible, onClose }: TopUpModalProps) {
  const { theme } = useTheme()
  const { credits } = useLibrary()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Continue on the App</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.body}>
            <Ionicons name="phone-portrait-outline" size={48} color={theme.primary} />
            <Text style={[styles.subtitle, { color: theme.text }]}>Top up and unlock in the app</Text>
            <Text style={[styles.helper, { color: theme.textSecondary }]}>
              Credits and purchases are available in the mobile app. You currently have {credits} credits.
            </Text>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: theme.primary }]}
              onPress={() => Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})}
            >
              <Text style={styles.ctaText}>Continue Reading on the App</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  body: {
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  helper: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
})

