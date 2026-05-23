import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowLeft, Camera, Save, CheckCircle2, User as UserIcon, Bell, LogOut, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { Mascot } from '../components/Mascot';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

type ProfileView = 'menu' | 'edit' | 'notifications';

export function Profile() {
  const { 
    language, 
    userName, 
    setUserName,
    userPhoto, 
    setUserPhoto,
    userBio,
    setUserBio,
    userEmail
  } = useAppContext();
  
  const [view, setView] = useState<ProfileView>('menu');
  const [tempName, setTempName] = useState(userName || '');
  const [tempBio, setTempBio] = useState(userBio || '');
  const [tempPhoto, setTempPhoto] = useState(userPhoto || '');
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    reminders: true,
    daily: true,
    community: true,
    challenges: true,
    updates: true,
    achievements: true
  });

  const t = translations[language];
  const isGuest = auth.currentUser?.isAnonymous;
  const displayEmail = isGuest ? t.guestUser : (userEmail || '...');
  const displayName = userName || (isGuest ? t.guestUser : 'Maria Eduarda');

  const handleSave = () => {
    setUserName(tempName);
    setUserBio(tempBio);
    setUserPhoto(tempPhoto);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setView('menu');
    }, 1500);
  };

  const menuItems = [
    { label: t.editProfile, icon: UserIcon, action: () => setView('edit') },
    { label: t.notificationPrefs, icon: Bell, action: () => setView('notifications') },
    { label: t.logoutLabel, icon: LogOut, action: () => signOut(auth) }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => setTempPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="-mt-8 md:-mt-16 -mx-6 md:-mx-12 min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col font-sans">
      <AnimatePresence mode="wait">
        {view === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 flex items-center">
              <button 
                onClick={() => window.history.back()}
                className="p-2 -ml-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 px-6 pb-24 flex flex-col items-center">
              {/* Avatar Section */}
              <div className="relative mt-4 mb-10">
                <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-full scale-[1.2]" />
                <div className="relative z-10 w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-neutral-900 bg-neutral-100 shadow-sm">
                  {userPhoto ? (
                    <img src={userPhoto} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                      <Mascot shape="circle" color="#CBD5E1" size="w-20 h-20" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -left-1 z-20">
                  <Mascot shape="cloud" color="#A5B4FC" eyes="closed" size="w-14 h-14" className="drop-shadow-lg" />
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-12">
                <h2 className="text-2xl font-display font-black text-neutral-900 dark:text-white mb-1">
                  {displayName}
                </h2>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 font-medium">
                  {displayEmail}
                </p>
              </div>

              {/* Menu Items */}
              <div className="w-full max-w-md space-y-3">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.98 }}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-5 px-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-[2rem] transition-colors group text-left border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-neutral-500 dark:text-neutral-400 group-hover:text-brand-primary transition-colors">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-brand-primary transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'edit' && (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col p-6 pb-24"
          >
            <div className="flex items-center mb-8">
              <button 
                onClick={() => setView('menu')}
                className="p-2 -ml-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-display font-black text-neutral-900 dark:text-white ml-2">
                {t.editProfile}
              </h2>
            </div>

            <div className="max-w-md mx-auto w-full space-y-10">
              {/* Photo Edit */}
              <div className="flex flex-col items-center">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-900 bg-neutral-100 shadow-xl">
                    {tempPhoto ? (
                      <img src={tempPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                        <Mascot shape="circle" color="#CBD5E1" size="w-20 h-20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-neutral-900 text-white p-2.5 rounded-full border-4 border-white group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">
                    {t.userNameLabel}
                  </label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-2 border-transparent focus:border-neutral-200 outline-none transition-all font-medium"
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">
                    {t.userBioLabel}
                  </label>
                  <textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    rows={4}
                    className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-2 border-transparent focus:border-neutral-200 outline_none transition-all font-medium resize-none"
                    placeholder="Cuéntanos un poco sobre ti..."
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaved}
                className={`w-full py-5 rounded-full font-black text-xl flex items-center justify-center gap-3 transition-all ${
                  isSaved ? 'bg-green-500 text-white' : 'bg-brand-primary text-white hover:scale-105'
                }`}
              >
                {isSaved ? <CheckCircle2 className="w-6 h-6" /> : <Save className="w-6 h-6" />}
                {isSaved ? t.profileUpdated : t.saveProfile}
              </button>
            </div>
          </motion.div>
        )}

        {view === 'notifications' && (
          <motion.div 
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col p-6 pb-24 font-sans"
          >
            <div className="flex items-center mb-10">
              <button 
                onClick={() => setView('menu')}
                className="p-2 -ml-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-display font-black text-neutral-900 dark:text-white ml-2">
                {t.notificationPrefs}
              </h2>
            </div>

            <div className="max-w-md mx-auto w-full space-y-3">
              {[
                { label: t.notifReminders, key: 'reminders' },
                { label: t.notifDaily, key: 'daily' },
                { label: t.notifCommunity, key: 'community' },
                { label: t.notifChallenges, key: 'challenges' },
                { label: t.notifUpdates, key: 'updates' },
                { label: t.notifAchievements, key: 'achievements' }
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-[2rem] border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800 transition-colors cursor-pointer select-none">
                  <span className="text-base font-bold text-neutral-900 dark:text-white text-left">{item.label}</span>
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications[item.key]} 
                      onChange={() => setNotifications(prev => ({...prev, [item.key]: !prev[item.key]}))} 
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-brand-primary"></div>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
