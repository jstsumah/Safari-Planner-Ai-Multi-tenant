import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Building2, User, Mail, Lock, CheckCircle2, ArrowRight, Loader2, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandingConfig } from '../types';

const INITIAL_BRANDING: BrandingConfig = {
  appName: '',
  appTagline: '',
  primaryColor: '#8f8664',
  secondaryColor: '#413c31',
  titleFont: 'Playfair Display',
  bodyFont: 'Inter',
  titleFontSize: '32px',
  bodyFontSize: '16px',
  titleFontWeight: '800',
  bodyFontWeight: '400',
  titleLetterSpacing: '-0.02em',
  bodyLineHeight: '1.6',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  whatsappNumber: '',
};

interface OnboardingProps {
  initialMode?: 'signup' | 'signin';
  userType?: 'agency' | 'user' | 'provider';
  onBack?: () => void;
  onComplete?: (userType: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ initialMode = 'signup', userType = 'agency', onBack, onComplete }) => {
  const { user, profile, loading: authLoading, refreshProfile, resetPassword, updatePassword } = useAuth();
  const [regType, setRegType] = useState<'agency' | 'user' | 'provider'>(userType);
  const [view, setView] = useState<'auth' | 'company' | 'forgot' | 'reset'>('auth');
  const [step, setStep] = useState(1);
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Local user state to bridge the gap while AuthContext is updating
  const [localUser, setLocalUser] = useState<any>(null);

  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Company Form
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');

  const checkJoiningStatus = React.useCallback(async (currentUser: any) => {
    if (!currentUser?.email) return false;
    
    setLoading(true);
    try {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('company_id, name, role')
        .eq('email', currentUser.email)
        .limit(1)
        .maybeSingle();
        
      if (teamMember) {
        // Create profile automatically for the invited user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: currentUser.id,
            company_id: teamMember.company_id,
            full_name: fullName || currentUser.user_metadata?.full_name || teamMember.name,
            email: currentUser.email,
            user_type: currentUser.user_metadata?.user_type || 'agency',
            role: 'staff'
          }]);
          
        if (profileError && profileError.code !== '23505') { // Ignore if already registered
          throw profileError;
        }
        
        await refreshProfile();
        return true;
      }
    } catch (err) {
      console.warn("Auto-join check failed:", err);
    } finally {
      setLoading(false);
    }
    return false;
  }, [fullName, refreshProfile]);

  // Sync step if user becomes available via context
  React.useEffect(() => {
    if (authLoading) return; // Wait for initial auth check

    let subscription: { unsubscribe: () => void } | null = null;

    const setupAuthEvents = async () => {
      const { data } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setView('reset');
        }
      });
      subscription = data.subscription;
    };

    const initUser = async () => {
      // If we are LOGGING IN (not signing up) and user exists, check status
      if (user && !isSignUp) {
        // If profile exists, check if they are already setup
        if (profile) {
          if (profile.company_id || profile.user_type === 'user') {
            onComplete?.(profile.user_type);
            return;
          }
        }

        // Only check join status if currently in the auth view (initial detection stage)
        if (view === 'auth') {
          const joined = await checkJoiningStatus(user);
          if (!joined) {
            // If we've confirmed they have no company after checking joins
            setView('company');
          } else {
            // They logged in and are fully joined! Fix self-healing and trigger complete.
            await refreshProfile();
            if (onComplete) {
              const utype = user.user_metadata?.user_type || (profile?.company_id ? 'agency' : 'user');
              onComplete(utype);
            }
          }
        }
      }
    };

    setupAuthEvents();
    initUser();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [user, isSignUp, checkJoiningStatus, view, profile, onComplete, refreshProfile, authLoading]);

  const formatAuthError = (err: any) => {
    if (err.message?.toLowerCase().includes('rate limit')) {
      return "Security limit reached. Please wait about an hour before trying to register or sign in again, or try a different email.";
    }
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      return "Network error: Unable to reach the database. Please check your internet connection or verify the Supabase configuration.";
    }
    return err.message;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: regType === 'user' ? 'user' : regType
        }
      }
    });
      if (error) throw error;
      if (data.user) {
        // If it's a general user, create profile and finish
        if (regType === 'user') {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([{
              id: data.user.id,
              full_name: fullName,
              email: email,
              user_type: 'user',
              role: 'user'
            }]);
          if (profileError) throw profileError;
          setSuccess("Account created! Please sign in with your credentials.");
          setIsSignUp(false);
          setStep(1);
          setShowPasswordField(false);
          setEmail(email); // Keep email for convenience
          setPassword('');
          await supabase.auth.signOut();
          return;
        }
        // Now that we have the user, we create the company and profile
        await finalizeOnboarding(data.user);
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const { data: exists, error } = await supabase
        .rpc('check_email_exists', { email_to_check: email.trim().toLowerCase() });

      if (error) throw error;

      if (exists) {
        setShowPasswordField(true);
      } else {
        setError("Account not found. Please sign up to create your agency.");
        setTimeout(() => {
          setIsSignUp(true);
          setStep(1);
          setError(null);
        }, 2000);
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        setLocalUser(data.user);
        // We don't set view to 'company' here anymore. 
        // We let the useEffect with initUser handle the logic 
        // once profile and joining status are checked.
        await refreshProfile();
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await resetPassword(email);
      setSuccess("If an account exists with this email, you will receive a password reset link shortly.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setSuccess("Password updated successfully. You can now sign in.");
      setTimeout(() => {
        setView('auth');
        setIsSignUp(false);
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSlugFromName = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').trim();
    setCompanySlug(slug);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const slug = companySlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').trim();
      if (!slug) throw new Error("Please enter a valid URL slug.");

      // Check if slug already exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .limit(1);

      if (existingCompany && existingCompany.length > 0) {
        throw new Error("This company web address (slug) is already taken. Please try a slightly different company name to generate a unique URL.");
      }

      // If slug is okay, proceed to next step (User signup)
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizeOnboarding = async (currentUser: any) => {
    try {
      const slug = companySlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').trim();
      
      // 1. Create Company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: companyName,
          slug: slug,
          branding: { 
            ...INITIAL_BRANDING, 
            appName: companyName, 
            contactEmail: currentUser.email,
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          }
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Create Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: currentUser.id,
          company_id: company.id,
          full_name: fullName || currentUser.user_metadata?.full_name || 'Admin',
          email: currentUser.email!,
          user_type: regType,
          role: 'admin'
        }]);

      if (profileError) throw profileError;

      // 3. Automatically add creator to the Team Members list
      await supabase
        .from('team_members')
        .insert([{
          company_id: company.id,
          name: fullName || currentUser.user_metadata?.full_name || 'Company Owner',
          role: 'Managing Director',
          email: currentUser.email!,
          bio: 'Founder and Lead Safari Specialist.',
          photo_url: currentUser.user_metadata?.avatar_url || ''
        }]);

      if (isSignUp) {
        setSuccess("Agency setup complete! Please sign in with your credentials to access your dashboard.");
        setIsSignUp(false);
        setStep(1);
        setShowPasswordField(false);
        setPassword('');
        await supabase.auth.signOut();
      } else {
        await refreshProfile();
        if (onComplete) onComplete(regType);
      }
    } catch (err: any) {
      console.error("Finalization error:", err);
      setError("Account created but company setup failed. Please contact support.");
    }
  };

  const handleCreateCompanyForExistingUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let currentUser = user || localUser;
      if (!currentUser) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        currentUser = authUser;
      }

      if (!currentUser) throw new Error("Please log in again to continue.");

      await finalizeOnboarding(currentUser);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && view === 'auth' && !isSignUp && !profile && loading)) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-50" 
            alt="Savanna"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4 text-white">
          <Loader2 className="animate-spin" size={48} />
          <p className="font-black uppercase tracking-widest text-xs">Synchronizing Account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover" 
          alt="Savanna Background"
        />
        <div className="absolute inset-0 bg-safari-900/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-white/70 backdrop-blur-xl rounded-xl shadow-2xl border border-white/40 overflow-hidden animate-fadeIn">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-safari-900/10 backdrop-blur-md rounded-lg flex items-center justify-center text-safari-900">
              <Building2 size={28} />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-safari-900 text-center mb-3">
            {view === 'auth' ? (
              isSignUp ? (
                step === 1 ? 'Join the Network' : 'Create your Account'
              ) : 'Welcome Back'
            ) : view === 'company' ? (
              'Setup Agency Profile'
            ) : view === 'forgot' ? (
              'Reset Password'
            ) : (
              'Update Password'
            )}
          </h2>
          <p className="text-safari-700 font-medium text-center mb-8">
            {view === 'auth' ? (
              isSignUp ? (
                step === 1 
                  ? 'Choose how you want to use the platform.'
                  : regType !== 'user' ? 'Secure your professional management dashboard.' : 'Start your personal safari journey.'
              ) : 'Log in to manage your professional safari business.'
            ) : view === 'company' ? (
              'Tell us about your company to get started.'
            ) : view === 'forgot' ? (
              'Enter your email to receive a reset link.'
            ) : (
              'Enter your new secure password below.'
            )}
          </p>

          <AnimatePresence mode="wait">
            {view === 'auth' && isSignUp && step === 1 && (
              <motion.form
                key="signup-step1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={handleCompanySubmit}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-4 px-1">I am registering as...</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegType('agency')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2 text-center h-full ${
                        regType === 'agency' 
                          ? 'border-safari-900 bg-safari-900/5 ring-4 ring-safari-900/10' 
                          : 'border-white/60 bg-white/30 hover:border-safari-400'
                      }`}
                    >
                      <Building2 size={20} className={regType === 'agency' ? 'text-safari-900' : 'text-safari-400'} />
                      <span className={`text-[9px] font-black uppercase tracking-tight leading-tight ${regType === 'agency' ? 'text-safari-900' : 'text-safari-500'}`}>Accommodation Provider</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegType('provider')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2 text-center h-full ${
                        regType === 'provider' 
                          ? 'border-safari-900 bg-safari-900/5 ring-4 ring-safari-900/10' 
                          : 'border-white/60 bg-white/30 hover:border-safari-400'
                      }`}
                    >
                      <Map size={20} className={regType === 'provider' ? 'text-safari-900' : 'text-safari-400'} />
                      <span className={`text-[9px] font-black uppercase tracking-tight leading-tight ${regType === 'provider' ? 'text-safari-900' : 'text-safari-500'}`}>Tour Operator</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegType('user')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2 text-center h-full ${
                        regType === 'user' 
                          ? 'border-safari-900 bg-safari-900/5 ring-4 ring-safari-900/10' 
                          : 'border-white/60 bg-white/30 hover:border-safari-400'
                      }`}
                    >
                      <User size={20} className={regType === 'user' ? 'text-safari-900' : 'text-safari-400'} />
                      <span className={`text-[9px] font-black uppercase tracking-tight leading-tight ${regType === 'user' ? 'text-safari-900' : 'text-safari-500'}`}>Individual traveler</span>
                    </button>
                  </div>
                </div>

                {regType !== 'user' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">
                        {regType === 'provider' ? 'Company Name' : 'Property/Hotel Name'}
                      </label>
                      <input
                        type="text"
                        required={regType !== 'user'}
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          updateSlugFromName(e.target.value);
                        }}
                        className="w-full px-5 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                        placeholder={regType === 'provider' ? "e.g. Serengeti Tours" : "e.g. Serengeti Luxury Lodge"}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">Handled Slug (URL)</label>
                      <div className="text-safari-400 text-[10px] mb-2 font-bold px-1 truncate">
                        safariplanner.ai/{regType === 'provider' ? 'operator' : 'accommodation'}/<span className="text-safari-900 font-black">{companySlug || '...'}</span>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={companySlug}
                        className="w-full px-5 py-3 bg-safari-50/50 border border-safari-100 rounded-lg outline-none cursor-not-allowed font-bold text-sm text-safari-400"
                        placeholder="Auto-generated from name"
                      />
                    </div>
                  </motion.div>
                )}
                
                {error && <p className="text-red-600 text-xs font-bold bg-red-50/50 backdrop-blur-md p-4 rounded-lg border border-red-100/50">{error}</p>}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-safari-900 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-safari-800 transition-all shadow-xl shadow-safari-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  onClick={(e) => {
                    if (regType === 'user') {
                      e.preventDefault();
                      setStep(2);
                    }
                  }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Next: Account Details'}
                  <ArrowRight size={18} />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setStep(1);
                      setView('auth');
                      setError(null);
                    }}
                    className="text-safari-900 font-black text-[10px] uppercase tracking-widest hover:underline"
                  >
                    Already a member? Sign In
                  </button>
                </div>
              </motion.form>
            )}

            {view === 'auth' && isSignUp && step === 2 && (
              <motion.form
                key="signup-step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={handleSignUp}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400 group-focus-within:text-safari-600 transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400 group-focus-within:text-safari-600 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                      placeholder="email@agency.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">Secure Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400 group-focus-within:text-safari-600 transition-colors" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                {error && <p className="text-red-600 text-xs font-bold bg-red-50/50 backdrop-blur-md p-4 rounded-lg border border-red-100/50">{error}</p>}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-safari-900 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-safari-800 transition-all shadow-xl shadow-safari-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
                  <CheckCircle2 size={18} />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-safari-900 font-black text-[10px] uppercase tracking-widest hover:underline"
                  >
                    ← Back to Details
                  </button>
                </div>
              </motion.form>
            )}

            {view === 'auth' && !isSignUp && (
              <motion.form
                key="signin-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={showPasswordField ? handleSignIn : handleEmailCheck}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400 group-focus-within:text-safari-600 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      readOnly={showPasswordField}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm ${
                        showPasswordField 
                          ? 'bg-safari-50/50 border-safari-100 text-safari-400 cursor-not-allowed' 
                          : 'bg-white/50 border-white/60 focus:bg-white'
                      }`}
                      placeholder="email@agency.com"
                    />
                    {showPasswordField && (
                      <button 
                        type="button"
                        onClick={() => setShowPasswordField(false)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-safari-400 hover:text-safari-900"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>

                {showPasswordField && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between items-center mb-2 px-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600">Password</label>
                      <button 
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-[10px] font-black uppercase tracking-widest text-safari-400 hover:text-safari-900 transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400 group-focus-within:text-safari-600 transition-colors" size={18} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                        placeholder="••••••••"
                        autoFocus
                      />
                    </div>
                  </motion.div>
                )}

                {error && <p className="text-red-600 text-xs font-bold bg-red-50/50 backdrop-blur-md p-4 rounded-lg border border-red-100/50">{error}</p>}
                {success && <p className="text-green-600 text-xs font-bold bg-green-50/50 backdrop-blur-md p-4 rounded-lg border border-green-100/50">{success}</p>}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-safari-900 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-safari-800 transition-all shadow-xl shadow-safari-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      {showPasswordField ? 'Sign In' : 'Continue'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {view === 'company' && (
              <motion.form
                key="setup-company-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={handleCreateCompanyForExistingUser}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">I am a...</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setRegType('agency')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2 text-center ${
                        regType === 'agency' 
                          ? 'border-safari-900 bg-safari-900/5 ring-4 ring-safari-900/10' 
                          : 'border-white/60 bg-white/30 hover:border-safari-400'
                      }`}
                    >
                      <Building2 size={20} className={regType === 'agency' ? 'text-safari-900' : 'text-safari-400'} />
                      <span className={`text-[9px] font-black uppercase tracking-tight leading-tight ${regType === 'agency' ? 'text-safari-900' : 'text-safari-500'}`}>Accommodation Provider</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegType('provider')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2 text-center ${
                        regType === 'provider' 
                          ? 'border-safari-900 bg-safari-900/5 ring-4 ring-safari-900/10' 
                          : 'border-white/60 bg-white/30 hover:border-safari-400'
                      }`}
                    >
                      <Map size={20} className={regType === 'provider' ? 'text-safari-900' : 'text-safari-400'} />
                      <span className={`text-[9px] font-black uppercase tracking-tight leading-tight ${regType === 'provider' ? 'text-safari-900' : 'text-safari-500'}`}>Tour Operator</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">
                    {regType === 'provider' ? 'Company Name' : 'Property/Hotel Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      updateSlugFromName(e.target.value);
                    }}
                    className="w-full px-5 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                    placeholder={regType === 'provider' ? "e.g. Serengeti Tours" : "e.g. Serengeti Luxury Lodge"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">Handled Slug (URL)</label>
                  <div className="text-safari-400 text-[10px] mb-2 font-bold px-1 truncate">
                    safariplanner.ai/{regType === 'provider' ? 'operator' : 'accommodation'}/<span className="text-safari-900 font-black">{companySlug || '...'}</span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={companySlug}
                    className="w-full px-5 py-3 bg-safari-50/50 border border-safari-100 rounded-lg outline-none cursor-not-allowed font-bold text-sm text-safari-400"
                    placeholder="Auto-generated from name"
                  />
                </div>
                {error && <p className="text-red-500 text-sm font-bold bg-red-50/50 backdrop-blur-md p-4 rounded-lg">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-safari-900 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-safari-800 transition-all shadow-xl shadow-safari-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Launch Partner Hub'}
                  <CheckCircle2 size={18} />
                </button>
              </motion.form>
            )}

            {view === 'forgot' && (
              <motion.form
                key="forgot-password"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={handleResetPassword}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400 group-focus-within:text-safari-600 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                      placeholder="email@agency.com"
                    />
                  </div>
                </div>
                {error && <p className="text-red-600 text-xs font-bold bg-red-50/50 backdrop-blur-md p-4 rounded-lg border border-red-100/50">{error}</p>}
                {success && <p className="text-green-600 text-xs font-bold bg-green-50/50 backdrop-blur-md p-4 rounded-lg border border-green-100/50">{success}</p>}
                
                <button
                  type="submit"
                  disabled={loading || !!success}
                  className="w-full py-4 bg-safari-900 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-safari-800 transition-all shadow-xl shadow-safari-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
                  <ArrowRight size={18} />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setView('auth')}
                    className="text-safari-900 font-black text-[10px] uppercase tracking-widest hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </motion.form>
            )}

            {view === 'reset' && (
              <motion.form
                key="update-password"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={handleUpdatePassword}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400 group-focus-within:text-safari-600 transition-colors" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                {error && <p className="text-red-600 text-xs font-bold bg-red-50/50 backdrop-blur-md p-4 rounded-lg border border-red-100/50">{error}</p>}
                {success && <p className="text-green-600 text-xs font-bold bg-green-50/50 backdrop-blur-md p-4 rounded-lg border border-green-100/50">{success}</p>}
                
                <button
                  type="submit"
                  disabled={loading || !!success}
                  className="w-full py-4 bg-safari-900 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-safari-800 transition-all shadow-xl shadow-safari-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                  <CheckCircle2 size={18} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {onBack && step === 1 && (
            <div className="text-center pt-2 border-t border-white/40 mt-4">
              <button
                type="button"
                onClick={onBack}
                className="text-safari-500 text-[10px] font-black uppercase tracking-widest hover:text-safari-900 transition-colors py-2"
              >
                ← Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
