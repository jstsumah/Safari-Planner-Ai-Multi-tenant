
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, CheckCircle2, Loader2, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ResetPassword: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setSuccess("Your password has been successfully updated. You can now access your account.");
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover" 
          alt="Safari Background"
        />
        <div className="absolute inset-0 bg-safari-900/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-white/70 backdrop-blur-xl rounded-xl shadow-2xl border border-white/40 overflow-hidden animate-fadeIn">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-safari-900/10 backdrop-blur-md rounded-lg flex items-center justify-center text-safari-900">
              <Lock size={28} />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-safari-900 text-center mb-3">
            Secure Your Account
          </h2>
          <p className="text-safari-700 font-medium text-center mb-8">
            Create a new password to regain access to your dashboard.
          </p>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form
                key="reset-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={handleSubmit}
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
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-safari-600 mb-2 px-1">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400 group-focus-within:text-safari-600 transition-colors" size={18} />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-safari-900/10 outline-none transition-all placeholder:text-safari-300 font-bold text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-600 text-xs font-bold bg-red-50/50 backdrop-blur-md p-4 rounded-lg border border-red-100/50">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-safari-900 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-safari-800 transition-all shadow-xl shadow-safari-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                  <CheckCircle2 size={18} />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center text-green-600">
                  <CheckCircle2 size={64} />
                </div>
                <div className="p-4 bg-green-50/50 backdrop-blur-md rounded-lg border border-green-100/50">
                  <p className="text-green-700 font-bold leading-relaxed">
                    {success}
                  </p>
                </div>
                <p className="text-safari-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Redirecting to Login...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center pt-8 border-t border-white/40 mt-8">
            <div className="flex items-center justify-center gap-2 text-safari-900">
              <Compass size={20} />
              <span className="font-extrabold text-sm tracking-tight">SafariPlanner.ai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
