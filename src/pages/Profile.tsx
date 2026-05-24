import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Edit2, 
  Moon, 
  Sun, 
  Bell, 
  LogOut, 
  Zap, 
  Shield, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Discipline } from '../context/AppContext';

export function Profile() {
  const { 
    language, 
    userName, 
    setUserName,
    userPhoto, 
    userEmail,
    discipline,
    setDiscipline,
    userStats: localUserStats,
    artistPreferences,
    setArtistPreferences,
    theme,
    toggleTheme
  } = useAppContext();

  const t = translations[language];
  const isGuest = auth.currentUser?.isAnonymous;

  // Modals / Overlay States
  const [showDisciplineModal, setShowDisciplineModal] = useState(false);
  const [showSparkModal, setShowSparkModal] = useState(false);
  const [showSaboteurModal, setShowSaboteurModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'main' | 'notifications'>('main');

  // Daily Reminder state
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('creative_daily_reminder_time') || '9:00 AM';
  });

  const saveReminderTime = (time: string) => {
    setReminderTime(time);
    localStorage.setItem('creative_daily_reminder_time', time);
  };

  // Real-time Database stats sync matching Progress page
  const [dbUserStats, setDbUserStats] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      setDbUserStats({
        rachaActual: localUserStats.currentStreak,
        ejerciciosCompletados: localUserStats.totalChallenges
      });
      const savedProgress = localStorage.getItem('creative_progress');
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          setHistoryList(parsed.map((item: any) => ({
            id: item.id || String(Math.random()),
            fecha: item.date || item.fecha || new Date().toISOString(),
            tipo: item.type || item.discipline || 'Drawing',
            duracion: item.duration || 5,
            nombre: item.challengeTitle || 'Ejercicio'
          })));
        } catch (e) {
          console.error('Failed to parse stats in profile: ', e);
        }
      }
      setLoadingStats(false);
      return;
    }

    const userUid = auth.currentUser.uid;
    const progDocRef = doc(db, 'usuarios', userUid, 'progreso', 'progreso');
    const unsubProg = onSnapshot(progDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setDbUserStats(snapshot.data());
      } else {
        setDbUserStats({
          rachaActual: 0,
          ejerciciosCompletados: 0
        });
      }
    }, (error) => {
      console.warn('Profile statistics snapshot warned: ', error);
    });

    const histCollectionRef = collection(db, 'usuarios', userUid, 'historial');
    const histQuery = query(histCollectionRef, orderBy('fecha', 'desc'));
    
    const unsubHist = onSnapshot(histQuery, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data
        });
      });
      setHistoryList(items);
      setLoadingStats(false);
    }, (error) => {
      console.warn('Profile history list snapshot warned: ', error);
      setLoadingStats(false);
    });

    return () => {
      unsubProg();
      unsubHist();
    };
  }, [localUserStats]);

  // Derived Values
  const stats = useMemo(() => {
    return {
      rachaActual: dbUserStats ? (dbUserStats.rachaActual ?? 0) : (localUserStats.currentStreak ?? 0),
      ejerciciosCompletados: dbUserStats ? (dbUserStats.ejerciciosCompletados ?? 0) : (localUserStats.totalChallenges ?? 0)
    };
  }, [dbUserStats, localUserStats]);

  const weeklyCount = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    return historyList.filter(item => {
      if (!item.fecha) return false;
      const itemDate = item.fecha.toDate ? item.fecha.toDate() : new Date(item.fecha);
      return itemDate >= sevenDaysAgo && itemDate <= now;
    }).length;
  }, [historyList]);

  // Onboarding options configuration
  const sparks = [
    { value: 'silence', labelEs: 'Silencio', labelEn: 'Silence', descEs: 'Cuando todo está tranquilo y puedo concentrarme.', descEn: 'When everything is quiet and I can focus.', icon: '🧘' },
    { value: 'chaos', labelEs: 'Ruido y caos', labelEn: 'Noise and chaos', descEs: 'Música fuerte, desorden, energía a mi alrededor.', descEn: 'Loud music, clutter, energy all around me.', icon: '⚡' },
    { value: 'pressure', labelEs: 'Con presión', labelEn: 'Under pressure', descEs: 'Un deadline o un reto me activa.', descEn: 'A deadline or challenge gets me going.', icon: '⏳' },
    { value: 'chance', labelEs: 'Al azar', labelEn: 'By chance', descEs: 'Sin plan, dejando que las cosas pasen solas.', descEn: 'No plan, letting things happen on their own.', icon: '🎲' }
  ];

  const saboteurs = [
    { value: 'perfectionism', labelEs: 'Quiero que quede perfecto', labelEn: 'I want it perfect', descEs: 'Borro todo si no se ve bien desde el inicio.', descEn: 'I erase everything if it looks bad upfront.', icon: '🔍' },
    { value: 'scatter', labelEs: 'Tengo mil ideas y ninguna', labelEn: 'A thousand ideas but none', descEs: 'No sé por cuál empezar.', descEn: 'I don\'t know where to start.', icon: '🌊' },
    { value: 'criticism', labelEs: 'Me da miedo que sea malo', labelEn: 'I fear being bad', descEs: 'Pienso demasiado en lo que dirán.', descEn: 'I think too much about what others say.', icon: '👥' },
    { value: 'fatigue', labelEs: 'Estoy aburrido de lo mismo', labelEn: 'Bored of the same', descEs: 'Siento que siempre hago lo mismo.', descEn: 'I feel like I always do the same.', icon: '🥱' }
  ];

  const activeSpark = sparks.find(s => s.value === artistPreferences.spark) || sparks[0];
  const activeSaboteur = saboteurs.find(s => s.value === artistPreferences.saboteur) || saboteurs[0];

  // Derive display user identities
  const googleUser = auth.currentUser;
  
  // Define if the currently held userPhoto is indeed from Google / genuine (not mock)
  const isUnsplashStock = userPhoto && userPhoto.includes('unsplash.com/photo-1554151228-14d9def656e4');
  const googlePhoto = googleUser?.photoURL;
  const showPhoto = !isUnsplashStock ? (userPhoto || googlePhoto) : googlePhoto;

  const displayName = googleUser?.displayName || userName || (language === 'es' ? 'Creador Autónomo' : 'Independent Creator');

  // Compute clean display initials
  const initials = useMemo(() => {
    if (!displayName) return 'CR';
    const cleanLetters = displayName.trim().replace(/[^a-zA-Z\s]/g, '');
    const words = cleanLetters.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0] ? words[0].slice(0, 2).toUpperCase() : 'CR';
  }, [displayName]);

  // Get discipline localized label
  const getDisciplineLabel = (disc: Discipline) => {
    if (language === 'es') {
      if (disc === 'Drawing') return 'Dibujo / Pintura';
      if (disc === 'Writing') return 'Escritura';
      return 'Fotografía';
    } else {
      if (disc === 'Drawing') return 'Drawing / Painting';
      if (disc === 'Writing') return 'Writing';
      return 'Photography';
    }
  };

  const handleConfirmLogout = () => {
    signOut(auth);
    setShowLogoutModal(false);
  };

  return (
    <div className="max-w-xl mx-auto pb-24 font-sans select-none px-4 pt-2">
      <AnimatePresence mode="wait">
        {activeSubView === 'main' ? (
          <motion.div
            key="profile-main"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold uppercase tracking-tight text-neutral-900 dark:text-neutral-100">
                {language === 'es' ? 'Tu perfil' : 'Your profile'}
              </h1>
            </div>

            {/* HERO — Identidad del usuario */}
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="relative">
                {showPhoto ? (
                  <img 
                    src={showPhoto} 
                    referrerPolicy="no-referrer"
                    alt={displayName} 
                    className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white dark:border-[#161616] shadow-md bg-neutral-100"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#E8834A] text-white font-black text-3xl md:text-4xl flex items-center justify-center shadow-md">
                    {initials}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl md:text-2xl font-black text-neutral-950 dark:text-white tracking-tight">
                  {displayName}
                </h2>
                
                {/* Discipline interactive Pill */}
                <button
                  onClick={() => setShowDisciplineModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E8834A]/10 hover:bg-[#E8834A]/20 text-[#E8834A] rounded-full text-xs font-black uppercase tracking-wider border border-[#E8834A]/20 transition-all active:scale-95 cursor-pointer"
                >
                  <span>{getDisciplineLabel(discipline)}</span>
                  <Edit2 className="w-3.5 h-3.5 mt-[-2px]" />
                </button>
              </div>
            </div>

            {/* ESTADÍSTICAS — 3 cajas en fila */}
            <div className="grid grid-cols-3 gap-3">
              {/* Card 1: Ejercicios Completados */}
              <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 flex flex-col justify-between min-h-[96px] shadow-sm">
                <span className="text-2xl md:text-3xl font-black text-[#E8834A] leading-none">
                  {stats.ejerciciosCompletados}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1.5 leading-tight">
                  {language === 'es' ? 'ejercicios' : 'exercises'}
                </span>
              </div>

              {/* Card 2: Racha actual con 🔥 */}
              <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 flex flex-col justify-between min-h-[96px] shadow-sm">
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-lg">🔥</span>
                  <span className="text-2xl md:text-3xl font-black text-[#E8834A]">
                    {stats.rachaActual}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1.5 leading-tight">
                  {language === 'es' ? 'días racha' : 'day streak'}
                </span>
              </div>

              {/* Card 3: Esta semana (últimos 7 días) */}
              <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 flex flex-col justify-between min-h-[96px] shadow-sm">
                <span className="text-2xl md:text-3xl font-black text-[#E8834A] leading-none">
                  {weeklyCount}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1.5 leading-tight">
                  {language === 'es' ? 'esta semana' : 'this week'}
                </span>
              </div>
            </div>

            {/* SOBRE TI — editable */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                {language === 'es' ? 'Sobre ti' : 'About you'}
              </h3>

              <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl divide-y divide-neutral-100 dark:divide-neutral-800/40 overflow-hidden shadow-sm">
                {/* Catalyst Item */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E8834A]/10 flex items-center justify-center text-[#E8834A] shrink-0 text-lg">
                      {activeSpark.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">
                        {language === 'es' ? 'Tu catalizador' : 'Your catalyst'}
                      </p>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {language === 'es' ? activeSpark.labelEs : activeSpark.labelEn}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSparkModal(true)}
                    className="p-2 text-neutral-400 hover:text-[#E8834A] dark:hover:text-[#E8834A] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Saboteur Item */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0 text-lg">
                      {activeSaboteur.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">
                        {language === 'es' ? 'Tu saboteador' : 'Your saboteur'}
                      </p>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {language === 'es' ? activeSaboteur.labelEs : activeSaboteur.labelEn}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSaboteurModal(true)}
                    className="p-2 text-neutral-400 hover:text-[#E8834A] dark:hover:text-[#E8834A] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* PREFERENCIAS */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                {language === 'es' ? 'Preferencias' : 'Preferences'}
              </h3>

              <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl divide-y divide-neutral-100 dark:divide-neutral-800/40 overflow-hidden shadow-sm">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0">
                      {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-[#E8834A]" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {language === 'es' ? 'Modo oscuro' : 'Dark mode'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={theme === 'dark'} 
                      onChange={toggleTheme} 
                    />
                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#E8834A]"></div>
                  </label>
                </div>

                {/* Notifications Link */}
                <button
                  onClick={() => setActiveSubView('notifications')}
                  className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-normal">
                        {language === 'es' ? 'Notificaciones' : 'Notifications'}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-bold">
                        {language === 'es' ? `Recordatorio diario: ${reminderTime}` : `Daily reminder: ${reminderTime}`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
            </div>

            {/* CUENTA */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                {language === 'es' ? 'Cuenta' : 'Account'}
              </h3>

              <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-[#D46B6B]/5 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#D46B6B]/10 flex items-center justify-center text-[#D46B6B] shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#D46B6B]">
                    {language === 'es' ? 'Cerrar sesión' : 'Sign out'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* NOTIFICATIONS SUBVIEW WITH HOUR PICKER */
          <motion.div
            key="profile-notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSubView('main')}
                className="p-2 -ml-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white">
                {language === 'es' ? 'Recordatorio Diario' : 'Daily Reminder'}
              </h2>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-semibold">
              {language === 'es' 
                ? 'Elige la hora en la que prefieres recibir un mensaje diario para romper tu bloqueo creativo y reactivar tu flujo.' 
                : 'Choose the preferred slot to receive a daily message designed to break your creative blocks and power up your flow.'
              }
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3">
              {[
                '8:00 AM',
                '9:00 AM',
                '10:00 AM',
                '1:00 PM',
                '5:00 PM',
                '8:00 PM',
                '9:00 PM',
                '10:00 PM'
              ].map((timeOption) => {
                const isSelected = reminderTime === timeOption;
                return (
                  <button
                    key={timeOption}
                    onClick={() => saveReminderTime(timeOption)}
                    className={`p-4 rounded-2xl text-xs font-black tracking-wider uppercase transition-all duration-150 border active:scale-95 cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-[#E8834A] border-[#E8834A] text-white shadow-sm shadow-[#E8834A]/20'
                        : 'bg-white dark:bg-[#161616] border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-[#E8834A]/40'
                    }`}
                  >
                    <span>{timeOption}</span>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-6">
              <button
                onClick={() => setActiveSubView('main')}
                className="w-full py-4 bg-[#E8834A] text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-[#E8834A]/10 active:scale-98 transition-all cursor-pointer"
              >
                {language === 'es' ? 'Guardar y volver' : 'Save and return'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISCIPLINE EDIT MODAL */}
      <AnimatePresence>
        {showDisciplineModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisciplineModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800 rounded-3xl p-6 overflow-hidden shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                  {language === 'es' ? 'Cambiar disciplina' : 'Change discipline'}
                </h3>
                <button 
                  onClick={() => setShowDisciplineModal(false)}
                  className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {([
                  { key: 'Drawing', text: language === 'es' ? 'Dibujo / Pintura' : 'Drawing / Painting' },
                  { key: 'Writing', text: language === 'es' ? 'Escritura' : 'Writing' },
                  { key: 'Photography', text: language === 'es' ? 'Fotografía' : 'Photography' }
                ] as const).map((item) => {
                  const isCur = discipline === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setDiscipline(item.key);
                        setShowDisciplineModal(false);
                      }}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all border ${
                        isCur 
                          ? 'bg-[#E8834A]/10 border-[#E8834A] text-[#E8834A]'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-transparent text-neutral-800 dark:text-neutral-200 hover:border-neutral-200 dark:hover:border-neutral-800'
                      }`}
                    >
                      <span>{item.text}</span>
                      {isCur && <Check className="w-4 h-4 text-[#E834A]" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SPARK EDIT MODAL */}
      <AnimatePresence>
        {showSparkModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSparkModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800 rounded-3xl p-6 overflow-hidden shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                  {language === 'es' ? 'Elige tu Catalizador' : 'Choose your Catalyst'}
                </h3>
                <button 
                  onClick={() => setShowSparkModal(false)}
                  className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {sparks.map((sparkObj) => {
                  const isCur = artistPreferences.spark === sparkObj.value;
                  return (
                    <button
                      key={sparkObj.value}
                      onClick={() => {
                        setArtistPreferences({
                          ...artistPreferences,
                          spark: sparkObj.value
                        });
                        setShowSparkModal(false);
                      }}
                      className={`w-full p-4 rounded-2xl flex gap-3 text-left transition-all border ${
                        isCur 
                          ? 'bg-[#E8834A]/10 border-[#E8834A]'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{sparkObj.icon}</span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                          {language === 'es' ? sparkObj.labelEs : sparkObj.labelEn}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                          {language === 'es' ? sparkObj.descEs : sparkObj.descEn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SABOTEUR EDIT MODAL */}
      <AnimatePresence>
        {showSaboteurModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaboteurModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800 rounded-3xl p-6 overflow-hidden shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                  {language === 'es' ? 'Elige tu Saboteador' : 'Choose your Saboteur'}
                </h3>
                <button 
                  onClick={() => setShowSaboteurModal(false)}
                  className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {saboteurs.map((saboteurObj) => {
                  const isCur = artistPreferences.saboteur === saboteurObj.value;
                  return (
                    <button
                      key={saboteurObj.value}
                      onClick={() => {
                        setArtistPreferences({
                          ...artistPreferences,
                          saboteur: saboteurObj.value
                        });
                        setShowSaboteurModal(false);
                      }}
                      className={`w-full p-4 rounded-2xl flex gap-3 text-left transition-all border ${
                        isCur 
                          ? 'bg-[#E8834A]/10 border-[#E8834A]'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{saboteurObj.icon}</span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                          {language === 'es' ? saboteurObj.labelEs : saboteurObj.labelEn}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                          {language === 'es' ? saboteurObj.descEs : saboteurObj.descEn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xs bg-white dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center shadow-2xl z-10 space-y-4"
            >
              <div className="w-12 h-12 bg-[#D46B6B]/10 text-[#D46B6B] rounded-full mx-auto flex items-center justify-center text-xl">
                <LogOut className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                  {language === 'es' ? '¿Cerrar sesión?' : 'Cerrar sesión?'}
                </h4>
                <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed">
                  {language === 'es' 
                    ? '¿Estás seguro de que quieres cerrar la sesión de tu cuenta creativa?' 
                    : 'Are you sure you want to log out of your creative account?'
                  }
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 bg-[#D46B6B] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#D46B6B]/90 transition-colors cursor-pointer"
                >
                  {language === 'es' ? 'Salir' : 'Sign out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
