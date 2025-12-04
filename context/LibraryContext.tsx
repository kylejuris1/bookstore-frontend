import { createContext, useState, useContext, type ReactNode, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "../lib/supabase"
import { useAuth } from "./AuthContext"
import { ThemeProvider } from "./ThemeContext"

export interface Book {
  id: string
  title: string
  author: string
  cover: string
  description: string
  tags: string[]
  credits: number
  views: number
}

interface ReadingProgress {
  bookId: string
  lastChapter: number
  lastReadAt: number // timestamp
}

export interface UserSettings {
  fontSize?: number // 14, 16, 18, 20, 22
  notifications?: boolean
  darkMode?: boolean
}

interface LibraryContextType {
  library: Book[]
  addToLibrary: (book: Book) => Promise<void>
  removeFromLibrary: (bookId: string) => Promise<void>
  isInLibrary: (bookId: string) => boolean
  credits: number
  setCredits: (credits: number) => void
  isLoading: boolean
  unlockedChapters: Record<string, Set<number>>
  unlockChapter: (bookId: string, chapterNum: number) => Promise<boolean>
  isChapterUnlocked: (bookId: string, chapterNum: number) => boolean
  bookmarkedBooks: string[]
  toggleBookmark: (bookId: string) => Promise<void>
  isBookmarked: (bookId: string) => boolean
  readingProgress: Record<string, ReadingProgress>
  updateReadingProgress: (bookId: string, chapterNum: number) => Promise<void>
  getLastReadChapter: (bookId: string) => number
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>
  paidChapters: Array<{ bookId: string; chapterNum: number }>
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [library, setLibrary] = useState<Book[]>([])
  const [credits, setCredits] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [unlockedChapters, setUnlockedChapters] = useState<Record<string, Set<number>>>({})
  const [bookmarkedBooks, setBookmarkedBooks] = useState<string[]>([])
  const [readingProgress, setReadingProgress] = useState<Record<string, ReadingProgress>>({})
  const [settings, setSettings] = useState<UserSettings>({ fontSize: 16, notifications: true, darkMode: true })
  const [paidChapters, setPaidChapters] = useState<Array<{ bookId: string; chapterNum: number }>>([])

  // Load user data from Supabase when user is logged in
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        // If no user, reset to defaults and load reading progress from local storage only
        setCredits(0)
        setBookmarkedBooks([])
        setUnlockedChapters({})
        try {
          const savedProgress = await AsyncStorage.getItem("readingProgress")
          if (savedProgress) {
            setReadingProgress(JSON.parse(savedProgress))
          }
        } catch (error) {
          console.error("Error loading reading progress:", error)
        } finally {
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        
        // Load reading progress from local storage (always local)
        const savedProgress = await AsyncStorage.getItem("readingProgress")
        if (savedProgress) {
          setReadingProgress(JSON.parse(savedProgress))
        }

        // Load user data from Supabase
        console.log("Loading user data for user ID:", user.id)
        const { data: userData, error } = await supabase
          .from('users')
          .select('number_of_credits, bookmarks, paid_chapters, settings')
          .eq('id', user.id)
          .single()

        console.log("User data query result:", { userData, error })

        if (error) {
          console.error("Error loading user data:", error)
          // If user doesn't exist in users table (PGRST116 = no rows returned), create them
          if (error.code === 'PGRST116') {
            console.log("User not found in database, creating new user profile")
            const { error: createError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                authid: user.id,
                email: user.email || '',
                number_of_credits: 0,
                bookmarks: [],
                settings: {},
                paid_chapters: [],
              })
            
            if (createError) {
              console.error("Error creating user profile:", createError)
            } else {
              console.log("New user profile created with defaults")
              // Set defaults
              setCredits(0)
              setBookmarkedBooks([])
              setUnlockedChapters({})
            }
          }
        } else if (userData) {
          console.log("User data loaded successfully:", {
            credits: userData.number_of_credits,
            bookmarksCount: userData.bookmarks?.length || 0,
            paidChaptersCount: userData.paid_chapters?.length || 0,
            hasSettings: !!userData.settings
          })
          // Set data from Supabase
          setCredits(userData.number_of_credits || 0)
          
          // Load settings
          if (userData.settings) {
            const userSettings = typeof userData.settings === 'string' 
              ? JSON.parse(userData.settings) 
              : userData.settings
            setSettings({
              fontSize: userSettings.fontSize || 16,
              notifications: userSettings.notifications !== false,
              darkMode: userSettings.darkMode !== false,
            })
          }
          
          // Load paid chapters - parse from string format "bookId:chapterNum"
          if (userData.paid_chapters && Array.isArray(userData.paid_chapters)) {
            const parsed = userData.paid_chapters
              .filter((item): item is string => typeof item === 'string')
              .map((item) => {
                const [bookId, chapterNum] = item.split(':')
                return { bookId, chapterNum: parseInt(chapterNum, 10) }
              })
              .filter((item) => !isNaN(item.chapterNum))
            setPaidChapters(parsed)
          }
          setBookmarkedBooks(userData.bookmarks || [])
          
          // Convert paid_chapters array to unlockedChapters format
          // paid_chapters format: ["bookId:chapterNum", "bookId:chapterNum", ...]
          const unlocked: Record<string, Set<number>> = {}
          if (userData.paid_chapters && Array.isArray(userData.paid_chapters)) {
            userData.paid_chapters.forEach((item: string) => {
              const [bookId, chapterNum] = item.split(':')
              if (bookId && chapterNum) {
                if (!unlocked[bookId]) {
                  unlocked[bookId] = new Set()
                }
                unlocked[bookId].add(parseInt(chapterNum))
              }
            })
          }
          setUnlockedChapters(unlocked)
        }

        // Load library from local storage (if needed)
        const savedLibrary = await AsyncStorage.getItem("library")
        if (savedLibrary) {
          setLibrary(JSON.parse(savedLibrary))
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user])

  const addToLibrary = async (book: Book) => {
    try {
      const updated = [...library, book]
      setLibrary(updated)
      await AsyncStorage.setItem("library", JSON.stringify(updated))
    } catch (error) {
      console.error("Error adding to library:", error)
    }
  }

  const removeFromLibrary = async (bookId: string) => {
    try {
      const updated = library.filter((b) => b.id !== bookId)
      setLibrary(updated)
      await AsyncStorage.setItem("library", JSON.stringify(updated))
    } catch (error) {
      console.error("Error removing from library:", error)
    }
  }

  const isInLibrary = (bookId: string) => {
    return library.some((b) => b.id === bookId)
  }

  const updateCredits = async (newCredits: number) => {
    try {
      setCredits(newCredits)
      
      // Update in Supabase if user is logged in
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ number_of_credits: newCredits })
          .eq('id', user.id)
        
        if (error) {
          console.error("Error updating credits in Supabase:", error)
        }
      }
    } catch (error) {
      console.error("Error updating credits:", error)
    }
  }

  const unlockChapter = async (bookId: string, chapterNum: number): Promise<boolean> => {
    // Chapters 1-19 are free, only 20+ require credits
    if (chapterNum < 20) {
      return true
    }

    // Check if already unlocked
    if (isChapterUnlocked(bookId, chapterNum)) {
      return true
    }

    // Check if user has enough credits (50 credits per chapter)
    const chapterCost = 50
    if (credits < chapterCost) {
      return false
    }

    if (!user) {
      return false // User must be logged in to unlock chapters
    }

    try {
      // Deduct credits
      const newCredits = credits - chapterCost
      await updateCredits(newCredits)

      // Unlock chapter
      const updated = { ...unlockedChapters }
      if (!updated[bookId]) {
        updated[bookId] = new Set()
      }
      updated[bookId].add(chapterNum)

      setUnlockedChapters(updated)

      // Convert to paid_chapters format for Supabase: ["bookId:chapterNum", ...]
      const paidChapters: string[] = []
      for (const [id, chapters] of Object.entries(updated)) {
        chapters.forEach((chNum) => {
          paidChapters.push(`${id}:${chNum}`)
        })
      }

      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({ paid_chapters: paidChapters })
        .eq('id', user.id)

      if (error) {
        console.error("Error updating paid chapters in Supabase:", error)
        // Revert the local state if Supabase update fails
        return false
      }

      return true
    } catch (error) {
      console.error("Error unlocking chapter:", error)
      return false
    }
  }

  const isChapterUnlocked = (bookId: string, chapterNum: number): boolean => {
    // Chapters 1-19 are always unlocked
    if (chapterNum < 20) {
      return true
    }

    // Check if chapter is in unlocked set
    return unlockedChapters[bookId]?.has(chapterNum) || false
  }

  const toggleBookmark = async (bookId: string) => {
    if (!user) {
      return // User must be logged in to bookmark
    }

    try {
      const updated = bookmarkedBooks.includes(bookId)
        ? bookmarkedBooks.filter((id) => id !== bookId)
        : [...bookmarkedBooks, bookId]

      setBookmarkedBooks(updated)

      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({ bookmarks: updated })
        .eq('id', user.id)

      if (error) {
        console.error("Error updating bookmarks in Supabase:", error)
        // Revert local state if Supabase update fails
        setBookmarkedBooks(bookmarkedBooks)
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
    }
  }

  const isBookmarked = (bookId: string) => {
    return bookmarkedBooks.includes(bookId)
  }

  const updateReadingProgress = useCallback(async (bookId: string, chapterNum: number) => {
    try {
      setReadingProgress((prev) => {
        const updated = {
          ...prev,
          [bookId]: {
            bookId,
            lastChapter: chapterNum,
            lastReadAt: Date.now(),
          },
        }
        AsyncStorage.setItem("readingProgress", JSON.stringify(updated)).catch(console.error)
        return updated
      })
    } catch (error) {
      console.error("Error updating reading progress:", error)
    }
  }, [])

  const getLastReadChapter = (bookId: string): number => {
    return readingProgress[bookId]?.lastChapter || 1
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return

    try {
      const updatedSettings = { ...settings, ...newSettings }
      // Update local state immediately for responsive UI
      setSettings(updatedSettings)

      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({ settings: updatedSettings })
        .eq('id', user.id)

      if (error) {
        console.error("Error updating settings in Supabase:", error)
        // Revert local state if Supabase update fails
        setSettings(settings)
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      // Revert on error
      setSettings(settings)
    }
  }

  return (
    <LibraryContext.Provider
      value={{
        library,
        addToLibrary,
        removeFromLibrary,
        isInLibrary,
        credits,
        setCredits: updateCredits,
        isLoading,
        unlockedChapters,
        unlockChapter,
        isChapterUnlocked,
        bookmarkedBooks,
        toggleBookmark,
        isBookmarked,
        readingProgress,
        updateReadingProgress,
        getLastReadChapter,
        settings,
        updateSettings,
        paidChapters,
      }}
    >
      <ThemeProvider settings={settings} updateSettings={updateSettings}>
        {children}
      </ThemeProvider>
    </LibraryContext.Provider>
  )
}

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (!context) {
    throw new Error("useLibrary must be used within LibraryProvider")
  }
  return context
}
