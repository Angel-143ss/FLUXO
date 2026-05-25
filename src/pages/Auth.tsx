import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Chrome, User, Loader2 } from 'lucide-react';
import { 
  signInWithPopup, 
  signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';

export function Auth() {
  const { language } = useAppContext();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPopupTip, setShowPopupTip] = useState(false);

  // Check if we have a saved name from a previous session
  const lastUserName = localStorage.getItem('creative_last_user_name');
  const hasSavedSession = !!lastUserName && lastUserName !== 'Creative' && lastUserName !== 'Invitado' && lastUserName !== 'Guest';

  const titleText = hasSavedSession
    ? (language === 'es' ? `De vuelta, ${lastUserName}.` : `Welcome back, ${lastUserName}.`)
    : (language === 'es' ? 'Empieza a fluir.' : 'Start flowing.');

  const subtitleText = language === 'es'
    ? 'Tu espacio para desbloquear la creatividad.'
    : 'Your space to unlock creativity.';

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError(null);
    setShowPopupTip(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError(language === 'es' 
          ? 'El navegador bloqueó la ventana emergente. Por favor, actívalas o abre la app en una nueva pestaña (icono superior derecho).' 
          : 'Browser blocked the popup. Please allow popups or open the app in a new tab.');
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
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#f5f5f5] dark:bg-[#0e0e0e] flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-[2.5rem] bg-white dark:bg-[#161616] border border-neutral-200 dark:border-[#252525] p-8 md:p-10 shadow-xl space-y-8"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 flex items-center justify-center">
            <img src="/assets/Fluxo.svg" alt="Fluxo Logo" className="w-20 h-20 object-contain" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-display font-bold text-[#111] dark:text-white tracking-tight leading-tight">
              {titleText}
            </h1>
            <p className="text-sm text-[#888] dark:text-[#555] font-medium leading-relaxed">
              {subtitleText}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Primary Button: Continuar con Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-black text-xs uppercase tracking-widest bg-[#E8834A] text-white hover:bg-[#d6723b] shadow-lg shadow-[#E8834A]/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              {loading === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-current" />}
            </div>
            <span>{language === 'es' ? 'Continuar con Google' : 'Continue with Google'}</span>
          </button>

          {/* Separator line with "o" */}
          <div className="py-2 flex items-center gap-4 text-neutral-300 dark:text-[#252525]">
            <div className="flex-1 h-px bg-current" />
            <span className="text-xs text-[#888] dark:text-[#555] font-semibold lowercase">o</span>
            <div className="flex-1 h-px bg-current" />
          </div>

          {/* Secondary Button: Explorar sin cuenta */}
          <button
            onClick={handleGuestSignIn}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-black text-xs uppercase tracking-widest bg-transparent border border-neutral-200 dark:border-[#252525] text-[#111] dark:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              {loading === 'guest' ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5 text-current" />}
            </div>
            <span>{language === 'es' ? 'Explorar sin cuenta' : 'Explore as guest'}</span>
          </button>

          {showPopupTip && !error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-center text-[#888] dark:text-[#555] bg-neutral-50/50 dark:bg-neutral-800/10 p-3 rounded-xl border border-neutral-150 dark:border-[#252525] italic leading-tight"
            >
              {language === 'es' 
                ? '💡 Si el login no se abre, asegúrate de permitir ventanas emergentes o abre la app en una nueva pestaña (icono de arriba a la derecha).' 
                : '💡 If login does not open, make sure to allow popups or open the app in a new tab (icon at top-right).'}
            </motion.div>
          )}
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-500 text-center font-medium bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-150 dark:border-red-500/20"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
