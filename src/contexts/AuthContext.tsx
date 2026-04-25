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
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile yet, meant for onboarding
          setProfile(null);
          setCompany(null);
          return;
        }
        throw profileError;
      }
      if (profileData?.status === 'suspended' && !profileData.is_super_user) {
        toast.error("Your account has been suspended. Please contact support.");
        await supabase.auth.signOut();
        setProfile(null);
        setCompany(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      if (profileData?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .single();

        if (companyError) throw companyError;

        if (companyData?.status === 'suspended' && !profileData.is_super_user) {
          toast.error("Your agency access has been suspended. Please contact support.");
          await supabase.auth.signOut();
          setProfile(null);
          setCompany(null);
          setLoading(false);
          return;
        }

        setCompany(companyData);
      }
    } catch (error: any) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - check if Supabase URL is correct or blocked by a browser extension:', error);
      } else {
        console.error('Error fetching profile/company:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndCompany(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndCompany(session.user.id);
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
