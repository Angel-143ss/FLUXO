import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wind, Chrome, User, Loader2 } from 'lucide-react';
import { 
  signInWithPopup, 
  signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';

export function Auth() {
  const { language } = useAppContext();
  const t = translations[language];
  
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPopupTip, setShowPopupTip] = useState(false);

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

  return (
    <div className="fixed inset-0 z-[110] bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(var(--brand-primary-rgb),0.05),transparent)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-12"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-primary/30">
            <Wind className="w-10 h-10" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {t.welcomeBack}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              {t.authSubtitle}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <AuthButton 
            onClick={handleGoogleSignIn}
            icon={<Chrome className="w-5 h-5 text-[#4285F4]" />}
            label={t.signInWithGoogle}
            loading={loading === 'google'}
          />

          <div className="py-2 flex items-center gap-4 text-neutral-200 dark:text-neutral-800">
            <div className="flex-1 h-px bg-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{t.or}</span>
            <div className="flex-1 h-px bg-current" />
          </div>

          <AuthButton 
            onClick={handleGuestSignIn}
            icon={<User className="w-5 h-5" />}
            label={t.signInGuest}
            loading={loading === 'guest'}
            secondary
          />

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
        </div>

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
