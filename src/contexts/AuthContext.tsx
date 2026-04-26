import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Company } from '../types';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserId = React.useRef<string | null>(null);
  const isFetchingRef = React.useRef<boolean>(false);

  const fetchProfileAndCompany = useCallback(async (userId: string, force = false) => {
    if (!userId) return;
    if (isFetchingRef.current && !force) return;
    if (lastFetchedUserId.current === userId && !force) {
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    lastFetchedUserId.current = userId;
    
    // Only set loading to true if we don't have a profile yet (initial load)
    // or if we are forcing a refresh. This prevents "Authenticating..." flickering
    // during token refreshes or tab switches.
    if (!profile || force) {
      setLoading(true);
    }

    // Initial check for placeholder/missing credentials to prevent hanging on invalid URLs
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.warn('Supabase not configured properly. Skipping profile fetch.');
      setLoading(false);
      isFetchingRef.current = false;
      return;
    }

    try {
      console.log('Starting optimized profile/company fetch for user:', userId);
      
      const { data: profileWithCompany, error: fetchError } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        if (fetchError.code === 'PGRST116') {
          setProfile(null);
          setCompany(null);
          return;
        }
        throw fetchError;
      }

      setProfile(profileWithCompany);
      setCompany(profileWithCompany?.company || null);
    } catch (error: any) {
      console.error('Error fetching profile/company:', error.message || error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      console.log('Profile fetch workflow completed');
    }
  }, [profile]);

  useEffect(() => {
    // Single source of truth for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth event change:', event, currentSession?.user?.id);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfileAndCompany(currentSession.user.id);
      } else {
        lastFetchedUserId.current = null;
        setProfile(null);
        setCompany(null);
        // Only set loading false if no user, otherwise fetchProfileAndCompany will handle it
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndCompany]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndCompany(user.id, true);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, company, loading, signOut, refreshProfile, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
