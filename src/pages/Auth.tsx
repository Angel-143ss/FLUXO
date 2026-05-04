import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Chrome, Facebook, Apple, User, Mail, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { 
  signInWithPopup, 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  OAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';

type AuthMode = 'options' | 'email-signup' | 'email-signin';

export function Auth() {
  const { language } = useAppContext();
  const t = translations[language];
  
  const [mode, setMode] = useState<AuthMode>('options');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPopupTip, setShowPopupTip] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError(null);
    setShowPopupTip(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError(language === 'es' ? 'El navegador bloqueó la ventana emergente. Por favor, actívalas o abre la app en una nueva pestaña.' : 'Browser blocked the popup. Please allow popups or open the app in a new tab.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading('facebook');
    setError(null);
    setShowPopupTip(true);
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (err: any) {
      console.error('Facebook Auth Error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        setError(`${t.authConfigError} (Facebook Authentication)`);
      } else if (err.code === 'auth/popup-blocked') {
        setError(language === 'es' ? 'Ventana emergente bloqueada. Intenta abrir la app en una nueva pestaña.' : 'Popup blocked. Try opening the app in a new tab.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    setError(null);
    setShowPopupTip(true);
    try {
      const appleProvider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, appleProvider);
    } catch (err: any) {
      console.error('Apple Auth Error:', err);
      setError(`${t.authConfigError} (Apple Authentication)`);
    } finally {
      setLoading(null);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading('guest');
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error('Guest Auth Error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        setError(t.authGuestDisabled);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading('email');
    setError(null);
    try {
      if (mode === 'email-signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(var(--brand-primary-rgb),0.05),transparent)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-12"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-primary/30">
            <Wind className="w-10 h-10" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {mode === 'options' ? t.welcomeBack : (mode === 'email-signup' ? t.createAccount : t.signIn)}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              {t.authSubtitle}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'options' ? (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <AuthButton 
                onClick={handleGoogleSignIn}
                icon={<Chrome className="w-5 h-5 text-[#4285F4]" />}
                label={t.signInWithGoogle}
                loading={loading === 'google'}
              />

              <AuthButton 
                onClick={handleFacebookSignIn}
                icon={<Facebook className="w-5 h-5 text-[#1877F2]" />}
                label={t.signInWithFacebook}
                loading={loading === 'facebook'}
              />

              <AuthButton 
                onClick={handleAppleSignIn}
                icon={<Apple className="w-5 h-5" />}
                label={t.signInWithApple}
                loading={loading === 'apple'}
              />

              <div className="py-4 flex items-center gap-4 text-neutral-300 dark:text-neutral-700">
                <div className="flex-1 h-px bg-current" />
                <span className="text-xs font-bold uppercase tracking-widest">{t.or}</span>
                <div className="flex-1 h-px bg-current" />
              </div>

              <AuthButton 
                onClick={() => setMode('email-signup')}
                icon={<Mail className="w-5 h-5" />}
                label={t.createAccount}
                secondary
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => setMode('email-signin')}
                  className="flex-1 text-sm font-bold text-neutral-500 hover:text-brand-primary transition-colors text-center py-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl"
                >
                  {t.signIn}
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); handleGuestSignIn(); }}
                  disabled={loading === 'guest'}
                  className="flex-1 text-sm font-bold text-neutral-500 hover:text-brand-primary transition-colors text-center py-3 flex items-center justify-center gap-2 bg-neutral-50 dark:bg-neutral-800 rounded-2xl"
                >
                  {loading === 'guest' ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                  {t.signInGuest}
                </button>
              </div>

              {showPopupTip && !error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-center text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/20 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 italic"
                >
                  {language === 'es' 
                    ? '💡 Si las ventanas no aparecen, asegúrate de permitir ventanas emergentes o abre la app en una nueva pestaña (ícono superior derecho).' 
                    : '💡 If windows don\'t appear, make sure to allow popups or open the app in a new tab (icon at the top right).'}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailAuth}
              className="space-y-6"
            >
              <button 
                type="button"
                onClick={() => setMode('options')}
                className="flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-brand-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToLogin}
              </button>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 px-1">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-brand-primary/20 focus:bg-white transition-all outline-none rounded-2xl text-neutral-900 dark:text-white font-medium"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 px-1">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-brand-primary/20 focus:bg-white transition-all outline-none rounded-2xl text-neutral-900 dark:text-white font-medium pr-14"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading === 'email'}
                className="minimal-button-primary w-full py-5 flex items-center justify-center gap-3 text-lg"
              >
                {loading === 'email' ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  mode === 'email-signup' ? t.createAccount : t.signIn
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-500 text-center font-medium bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-100 dark:border-red-500/20"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

function AuthButton({ 
  onClick, 
  icon, 
  label, 
  loading, 
  secondary = false 
}: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  loading?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
        secondary 
          ? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-2 border-transparent' 
          : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-100 dark:border-neutral-800 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5'
      }`}
    >
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      </div>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}
