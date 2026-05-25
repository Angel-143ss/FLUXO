import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Sun, Globe, Info, LogOut, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { theme, toggleTheme, language, setLanguage, isInstallable, installApp } = useAppContext();
  const t = translations[language];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl z-50 overflow-hidden border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-50 dark:border-neutral-800">
              <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-white uppercase tracking-widest text-[10px]">{t.settings}</h2>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100">
                  <Globe className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-semibold uppercase tracking-widest">{t.language}</span>
                </div>
                <div className="flex bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-1 border border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => setLanguage('es')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest transition-all ${language === 'es' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                  >
                    ES
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest transition-all ${language === 'en' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-neutral-400" /> : <Sun className="w-4 h-4 text-neutral-400" />}
                  <span className="text-xs font-semibold uppercase tracking-widest">{theme === 'dark' ? t.darkMode : t.lightMode}</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors border ${theme === 'dark' ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6 bg-white' : 'translate-x-1 bg-neutral-900'}`} />
                </button>
              </div>

              {/* PWA Install */}
              {isInstallable ? (
                <div className="pt-6 border-t border-neutral-50 dark:border-neutral-800 space-y-3">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8834A]">{t.installApp}</span>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">{t.installAppDesc}</p>
                  </div>
                  <button
                    onClick={installApp}
                    className="w-full flex items-center justify-center gap-3 px-6 py-2.5 bg-[#E8834A]/10 hover:bg-[#E8834A]/15 text-[#E8834A] border border-[#E8834A]/20 rounded-2xl font-bold tracking-widest text-[10px] uppercase transition-all active:scale-98 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t.installApp}
                  </button>
                </div>
              ) : (
                <div className="pt-6 border-t border-neutral-50 dark:border-neutral-800 flex justify-between items-center text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold select-none">
                  <span className="uppercase tracking-widest">PWA STATUS</span>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase tracking-wider text-[8px]">Ready / Active</span>
                </div>
              )}

              {/* Logout */}
              <div className="pt-6 border-t border-neutral-50 dark:border-neutral-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-bold tracking-widest text-[10px] uppercase hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t.logout}
                </button>
              </div>

              {/* Version */}
              <div className="flex items-center justify-between pt-6 border-t border-neutral-50 dark:border-neutral-800">
                <div className="flex items-center gap-3 text-neutral-400">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.version}</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono tracking-widest">v1.0.0</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
