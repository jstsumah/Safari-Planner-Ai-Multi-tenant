import React, { createContext, useEffect, useState } from 'react';
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

  const fetchProfileAndCompany = async (userId: string) => {
    setLoading(true);

    // Initial check for placeholder/missing credentials to prevent hanging on invalid URLs
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.warn('Supabase not configured properly. Skipping profile fetch.');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting profile fetch for user:', userId);
      // Create a promise that rejects after 30 seconds as a final safety net for the loading state
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timed out')), 30000)
      );

      const fetchPromise = (async () => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Supabase profile error:', profileError);
          if (profileError.code === 'PGRST116') {
            return { profileData: null, companyData: null };
          }
          throw profileError;
        }

        console.log('Profile data fetched successfully');

        let companyData = null;
        if (profileData?.company_id) {
          console.log('Fetching company data for ID:', profileData.company_id);
          const { data, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profileData.company_id)
            .single();

          if (companyError) {
            console.error('Supabase company error:', companyError);
            throw companyError;
          }
          companyData = data;
          console.log('Company data fetched successfully');
        }
        return { profileData, companyData };
      })();

      const result = await Promise.race([fetchPromise, timeoutPromise]) as { profileData: any, companyData: any };
      
      if (result) {
        setProfile(result.profileData);
        setCompany(result.companyData);
      }
    } catch (error: any) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - check if Supabase URL is correct or blocked by a browser extension:', error);
      } else {
        console.error('Error fetching profile/company:', error.message || error);
      }
    } finally {
      setLoading(false);
      console.log('Profile fetch workflow completed');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session fetch error:', error);
        if (error.message.includes('Refresh Token Not Found')) {
          supabase.auth.signOut();
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndCompany(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event change:', event);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileAndCompany(session.user.id);
      } else {
        setProfile(null);
        setCompany(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndCompany(user.id);
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
