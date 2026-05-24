import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Dumbbell, LineChart, Zap, Wrench, Wind, Settings, Home as HomeIcon, User, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SettingsModal } from './SettingsModal';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { 
    language, 
    userName, 
    userPhoto, 
    showGuestWarning, 
    setShowGuestWarning, 
    writeError, 
    setWriteError 
  } = useAppContext();
  const t = translations[language];

  const navItems = [
    { to: '/', icon: HomeIcon, label: t.homeTitle?.split(' ')[0] || 'Home' },
    { to: '/ai-mirror', icon: Sparkles, label: t.aiMirrorTitle },
    { to: '/progress', icon: LineChart, label: t.progress },
    { to: '/community', icon: Zap, label: t.community },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#fcfcfd] dark:bg-[#0a0a0a] text-[#2d2d2d] dark:text-neutral-100 font-sans transition-colors duration-200">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 flex-col transition-colors duration-200 px-4">
        <button 
          onClick={() => navigate('/profile')}
          className="py-10 px-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-3xl transition-all text-left"
        >
          <div className="w-12 h-12 rounded-[1.25rem] overflow-hidden border-2 border-brand-primary/10 shadow-xl shadow-brand-primary/10">
            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Welcome</span>
            <span className="font-display font-bold text-neutral-900 dark:text-white tracking-tight leading-none">{userName}</span>
          </div>
        </button>
        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "font-bold" 
                    : "text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-700 dark:hover:text-neutral-200"
                )
              }
              style={({ isActive }) => isActive ? { 
                backgroundColor: 'rgb(from var(--discipline-accent) r g b / 0.1)',
                color: 'var(--discipline-accent)'
              } : {}}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[15px]">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="py-8 px-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all font-semibold text-[15px]"
          >
            <Settings className="w-5 h-5" />
            {t.settings}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 overflow-y-auto md:pb-0", isHome ? "pb-20" : "pb-32")}>
        <div className={cn("max-w-4xl mx-auto px-5 md:px-10 md:py-12", isHome ? "pt-4 pb-2" : "py-6")}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        {/* Background Notch SVG */}
        <div className="absolute inset-0 -top-6 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
            <path 
              d="M0,40 Q0,0 40,0 L145,0 Q162,0 172,18 A22,22 0 0,0 228,18 Q238,0 255,0 L360,0 Q400,0 400,40 L400,100 L0,100 Z" 
              fill="currentColor"
              className="text-white/95 dark:text-neutral-900/95 backdrop-blur-xl"
            />
          </svg>
        </div>

        {/* Navigation Content */}
        <div className="relative flex items-center justify-between px-2 h-[64px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-neutral-200/50 dark:shadow-none border border-white/20 dark:border-neutral-800/50 overflow-hidden">
          {/* Left Group (2) */}
          <div className="flex flex-1 justify-around items-center">
            <NavLink
              to="/"
              className={({ isActive }) => cn("flex flex-col items-center gap-1 transition-all", isActive ? "" : "text-neutral-400")}
              style={({ isActive }) => isActive ? { color: 'var(--discipline-accent)' } : {}}
            >
              <HomeIcon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{t.homeTitle?.split(' ')[0] || 'Home'}</span>
            </NavLink>
            <NavLink
              to="/progress"
              className={({ isActive }) => cn("flex flex-col items-center gap-1 transition-all", isActive ? "" : "text-neutral-400")}
              style={({ isActive }) => isActive ? { color: 'var(--discipline-accent)' } : {}}
            >
              <LineChart className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{t.progress}</span>
            </NavLink>
          </div>

          {/* Center Space for Floating Button */}
          <div className="w-16" />

          {/* Right Group (2) */}
          <div className="flex flex-1 justify-around items-center">
            <NavLink
              to="/community"
              className={({ isActive }) => cn("flex flex-col items-center gap-1 transition-all", isActive ? "" : "text-neutral-400")}
              style={({ isActive }) => isActive ? { color: 'var(--discipline-accent)' } : {}}
            >
              <Zap className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{t.community}</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => cn("flex flex-col items-center gap-1 transition-all", isActive ? "" : "text-neutral-400")}
              style={({ isActive }) => isActive ? { color: 'var(--discipline-accent)' } : {}}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{t.profileTitle}</span>
            </NavLink>
          </div>
        </div>

        {/* Central Floating Button */}
        <button
          onClick={() => navigate('/ai-mirror')}
          className="absolute -top-5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-2xl shadow-neutral-400/50 dark:shadow-none hover:scale-110 active:scale-95 transition-all z-10 border-4 border-white dark:border-neutral-900"
          style={{ 
            backgroundColor: 'var(--discipline-accent)',
            boxShadow: '0 10px 20px -5px rgb(from var(--discipline-accent) r g b / 0.4)'
          }}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </nav>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Floating Notifications / Warnings Banners */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 space-y-3 z-[110] w-full max-w-sm px-4 pointer-events-auto">
        <AnimatePresence>
          {showGuestWarning && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-[#E8834A] text-white p-4 rounded-3xl shadow-xl border border-orange-400/30 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-black tracking-wide leading-tight">
                  {language === 'es' 
                    ? 'Crea una cuenta para guardar tu progreso.' 
                    : 'Create an account to save your progress.'}
                </span>
              </div>
              <button 
                onClick={() => setShowGuestWarning(false)}
                className="p-1 hover:bg-white/10 active:scale-95 rounded-full transition-all text-white shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {writeError && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-red-500 text-white p-4 rounded-3xl shadow-xl border border-red-400/30 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-black tracking-wide leading-tight">
                  {writeError}
                </span>
              </div>
              <button 
                onClick={() => setWriteError(null)}
                className="p-1 hover:bg-white/10 active:scale-95 rounded-full transition-all text-white shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
