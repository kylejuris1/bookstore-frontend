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

// Fire-and-forget view logger
export async function logBookView(bookId: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/books/${encodeURIComponent(bookId)}/view`, {
      method: 'POST',
    });
  } catch (error) {
    console.warn('Failed to log book view', error);
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

