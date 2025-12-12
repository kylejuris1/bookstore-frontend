import { createContext, useState, useContext, useEffect, type ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { createGuestUser } from '../lib/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  guestId: string | null;
  loading: boolean;
  isGuest: boolean;
  ensureGuest: () => Promise<string>;
  sendOTP: (email: string) => Promise<{ error?: string }>;
  verifyOTP: (email: string, token: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const ensureGuestId = async () => {
      if (user) {
        setGuestId(null);
        return;
      }
      try {
        const existing = await AsyncStorage.getItem('guest_id');
        const id = await createGuestUser(existing || undefined);
        setGuestId(id);
        await AsyncStorage.setItem('guest_id', id);
      } catch (err) {
        console.error('Failed to ensure guest user:', err);
      }
    };
    ensureGuestId();
  }, [user]);

  const ensureGuest = useCallback(async () => {
    if (user?.id) {
      return user.id;
    }
    if (guestId) return guestId;
    const id = await createGuestUser();
    setGuestId(id);
    await AsyncStorage.setItem('guest_id', id);
    return id;
  }, [guestId, user]);

  const sendOTP = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to send OTP' };
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        return { error: error.message };
      }

      // Create user profile in Supabase only if it doesn't exist
      if (data.user) {
        // First check if user already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        // Only create if user doesn't exist
        if (checkError && checkError.code === 'PGRST116') {
          // User doesn't exist, create with defaults
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              authid: data.user.id,
              email: data.user.email || email,
              number_of_credits: 0,
              bookmarks: [],
              settings: {},
              paid_chapters: [],
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't fail the auth if profile creation fails
          }
        } else if (checkError) {
          console.error('Error checking user profile:', checkError);
        }
        // If user exists, do nothing - don't overwrite their data
      }

      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to verify OTP' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setGuestId(null);
    await AsyncStorage.removeItem('guest_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        guestId,
        loading,
        isGuest: !!(!user && guestId),
        ensureGuest,
        sendOTP,
        verifyOTP,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

