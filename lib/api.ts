import { supabase } from './supabase';
import Constants from "expo-constants";

// Get API URL from environment variable or use the IP address
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'https://bookstore-backend-n40b.onrender.com/api';

export interface Book {
  id: string;
  book_id: string;
  book_name: string;
  author: string;
  date_uploaded: string;
  tags: string[];
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

