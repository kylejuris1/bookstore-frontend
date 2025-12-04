import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration - these should match your backend .env
const SUPABASE_URL = 'https://jgfuoqnieigwodtdfmfw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZnVvcW5pZWlnd29kdGRmbWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjg0OTYsImV4cCI6MjA3OTkwNDQ5Nn0.Dqqe3d6tUprNH4lGzscJjNedFMf0oYQhwkpsYWUzHmI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

