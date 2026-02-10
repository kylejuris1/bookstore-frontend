import { supabase } from './supabase';
import Constants from "expo-constants";
const isUuid = (val?: string) =>
  !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)

// Get API URL from environment variable or use the IP address
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL;

export interface Book {
  id: string;
  book_id: string;
  book_name: string;
  author: string;
  date_uploaded: string;
  tags: string[];
  views?: number;
  summary?: string | null;
  cover?: string | null;
  ad_image?: string | null;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  chapter_title: string | null;
  chapter_content: string;
  date_uploaded: string;
}

// Fetch books from Supabase
export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('date_uploaded', { ascending: false });

  if (error) {
    console.error('Error fetching books:', error);
    throw error;
  }

  return data || [];
}

// Fetch books ordered by views (descending) for ranking
export async function fetchBooksByViews(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('views', { ascending: false });

  if (error) {
    console.error('Error fetching books by views:', error);
    throw error;
  }

  return data || [];
}

// Fetch a single book by book_id
export async function fetchBook(bookId: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('book_id', bookId)
    .single();

  if (error) {
    console.error('Error fetching book:', error);
    return null;
  }

  return data;
}

// Fetch all chapters for a book
export async function fetchChapters(bookId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('chapter_number', { ascending: true });

  if (error) {
    console.error('Error fetching chapters:', error);
    throw error;
  }

  return data || [];
}

// Fetch a specific chapter
export async function fetchChapter(bookId: string, chapterNumber: number): Promise<Chapter | null> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', bookId)
    .eq('chapter_number', chapterNumber)
    .single();

  if (error) {
    console.error('Error fetching chapter:', error);
    return null;
  }

  return data;
}

// Fire-and-forget view logger (web only)
export async function logBookView(bookId: string): Promise<void> {
  try {
    // Get API URL - prefer environment variable for web
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || API_BASE_URL;
    
    if (!apiUrl) {
      console.warn('API_BASE_URL not configured, skipping view log');
      return;
    }

    const url = `${apiUrl}/books/${encodeURIComponent(bookId)}/view`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't wait for response - fire and forget
    });

    if (!response.ok) {
      console.warn(`View logging failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Silently fail - view logging shouldn't break the app
    console.warn('Failed to log book view:', error);
  }
}

// Create or reuse a guest user record (no email) via backend only
export async function createGuestUser(existingId?: string): Promise<string> {
  const payload: Record<string, string> = {}
  if (isUuid(existingId)) {
    payload.guestId = existingId!
  }

  const resp = await fetch(`${API_BASE_URL}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Guest creation failed: ${resp.status} ${resp.statusText} ${text}`)
  }

  const json = await resp.json()
  return json.guestId || guestId
}

// Delete account and all user data (requires valid session token). Used after OTP verification.
export async function deleteAccount(accessToken: string): Promise<{ error?: string }> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || API_BASE_URL
    if (!apiUrl) {
      return { error: 'API URL not configured' }
    }
    const resp = await fetch(`${apiUrl}/auth/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return { error: text || `Request failed: ${resp.status}` }
    }
    return {}
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete account' }
  }
}

// Request an OTP for account deletion (email -> OTP)
export async function requestAccountDeletionOtp(email: string): Promise<{ error?: string }> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || API_BASE_URL
    if (!apiUrl) return { error: 'API URL not configured' }

    const resp = await fetch(`${apiUrl}/auth/delete-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return { error: text || `Request failed: ${resp.status}` }
    }

    return {}
  } catch (err: any) {
    return { error: err?.message || 'Failed to request deletion code' }
  }
}

// Confirm OTP and delete account + data
export async function confirmAccountDeletion(email: string, token: string): Promise<{ error?: string }> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || API_BASE_URL
    if (!apiUrl) return { error: 'API URL not configured' }

    const resp = await fetch(`${apiUrl}/auth/delete-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return { error: text || `Request failed: ${resp.status}` }
    }

    return {}
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete account' }
  }
}

