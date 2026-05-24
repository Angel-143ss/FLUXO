import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db } from '../lib/firebase';
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Progress() {
  const { user, userStats: localUserStats, language, isFetchingDbData } = useAppContext();
  const navigate = useNavigate();

  const [dbUserStats, setDbUserStats] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for user PROGRESS stats and HISTORY completions
  useEffect(() => {
    if (!user || user.isAnonymous) {
      // Offline/Guest fallback setting up metrics from local React context (safely stored in state/localStorage)
      setDbUserStats({
        rachaActual: localUserStats.currentStreak,
        ejerciciosCompletados: localUserStats.totalChallenges
      });

      // Guest fallback for history listing
      const savedProgress = localStorage.getItem('creative_progress');
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          const historyItems = parsed.map((item: any) => ({
            id: item.id || String(Math.random()),
            fecha: item.date || item.fecha || new Date().toISOString(),
            tipo: item.type || item.discipline || 'Drawing',
            duracion: item.duration || 5,
            estado: item.status || 'Completado',
            nombre: item.challengeTitle || 'Ejercicio',
            moodLevel: item.moodLevel || 4
          }));
          setHistoryList(historyItems);
        } catch (e) {
          console.error('Failed to load guest progress history: ', e);
        }
      }
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Snapshot for aggregate stats: "progreso"
    const progDocRef = doc(db, 'usuarios', user.uid, 'progreso', 'progreso');
    const unsubProg = onSnapshot(progDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setDbUserStats(data);
      } else {
        setDbUserStats({
          rachaActual: 0,
          ejerciciosCompletados: 0
        });
      }
    }, (error) => {
      console.warn('Real-time progress listener warned: ', error);
    });

    // 2. Snapshot for exercises history: "historial" subcollection
    const histCollectionRef = collection(db, 'usuarios', user.uid, 'historial');
    const histQuery = query(histCollectionRef, orderBy('fecha', 'desc'));
    
    const unsubHist = onSnapshot(histQuery, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          fecha: data.fecha // Will handle converting Timestamp gracefully
        });
      });
      setHistoryList(items);
      setLoading(false);
    }, (error) => {
      console.warn('Real-time history listener warned: ', error);
      setLoading(false);
    });

    return () => {
      unsubProg();
      unsubHist();
    };
  }, [user, localUserStats]);

  // Read raw current values with safe fallback to memory context
  const stats = useMemo(() => {
    return {
      rachaActual: dbUserStats ? (dbUserStats.rachaActual ?? 0) : (localUserStats.currentStreak ?? 0),
      ejerciciosCompletados: dbUserStats ? (dbUserStats.ejerciciosCompletados ?? 0) : (localUserStats.totalChallenges ?? 0)
    };
  }, [dbUserStats, localUserStats]);

  // Calculate exercises completed in the last 7 days
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

  // Calculate grid mapping (last 28 days - 7 columns, 4 rows)
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Use deep midnight comparison
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    for (let i = 27; i >= 0; i--) {
      const targetDate = new Date(todayMidnight);
      targetDate.setDate(todayMidnight.getDate() - i);
      
      const count = historyList.filter(item => {
        if (!item.fecha) return false;
        const itemDate = item.fecha.toDate ? item.fecha.toDate() : new Date(item.fecha);
        return itemDate.getFullYear() === targetDate.getFullYear() &&
               itemDate.getMonth() === targetDate.getMonth() &&
               itemDate.getDate() === targetDate.getDate();
      }).length;
      
      let intensity = 0; // 0: no activity, 1: partial (1 exercise completed), 2: completed (>= 2 exercises)
      if (count === 1) {
        intensity = 1;
      } else if (count >= 2) {
        intensity = 2;
      }
      
      days.push({ 
        date: targetDate, 
        intensity, 
        isToday: targetDate.getFullYear() === todayMidnight.getFullYear() &&
                 targetDate.getMonth() === todayMidnight.getMonth() &&
                 targetDate.getDate() === todayMidnight.getDate()
      });
    }
    return days;
  }, [historyList]);

  // Get metadata info based on the history item blockage
  const getBlockageMetadata = (item: any) => {
    const blockText = (item.tipo || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    const title = (item.nombre || item.challengeTitle || '').toLowerCase();
    const mood = item.moodLevel;

    // Detect Paralizado ❄️
    if (mood === 2 || blockText.includes('parálisis') || content.includes('parálisis') || content.includes('paralizado') || title.includes('parálisis') || title.includes('paraliza')) {
      return {
        icon: '❄️',
        label: language === 'es' ? 'paralizado' : 'paralyzed',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400'
      };
    }
    // Detect Loop 🔥
    if (mood === 3 || blockText.includes('loop') || content.includes('loop') || title.includes('loop') || content.includes('bucle')) {
      return {
        icon: '🔥',
        label: language === 'es' ? 'en loop' : 'in loop',
        bgColor: 'bg-[#fc6a3f]/10 dark:bg-[#fc6a3f]/20 text-[#fc6a3f]'
      };
    }
    // Default / Sin ideas 😶
    return {
      icon: '😶',
      label: language === 'es' ? 'sin ideas' : 'no ideas',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400'
    };
  };

  // Convert dates relative in spanish/english: "hoy", "ayer", "hace 2d"
  const getRelativeTime = (fechaVal: any) => {
    if (!fechaVal) return '';
    const dateObj = fechaVal.toDate ? fechaVal.toDate() : new Date(fechaVal);
    if (isNaN(dateObj.getTime())) return '';
    
    const today = new Date();
    const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const midnightDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    
    const diffTime = midnightToday.getTime() - midnightDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return language === 'es' ? 'hoy' : 'today';
    } else if (diffDays === 1) {
      return language === 'es' ? 'ayer' : 'yesterday';
    } else {
      return language === 'es' ? `hace ${diffDays}d` : `${diffDays}d ago`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto space-y-6 pb-24 px-4 pt-4 select-none"
    >
      
      {/* HEADER SECTION */}
      <h1 className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100 uppercase text-center md:text-left">
        {language === 'es' ? 'Progreso' : 'Progress'}
      </h1>

      {/* BLOQUE 1: "Tu racha" */}
      <div className="space-y-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400/80 dark:text-neutral-500">
          {language === 'es' ? 'Tu racha' : 'Your streak'}
        </h2>
        
        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Días seguidos */}
          <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between min-h-[84px] shadow-sm">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xl md:text-2xl font-black text-[#E8834A]">{stats.rachaActual}</span>
              <span className="text-base">🔥</span>
            </div>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mt-1 leading-tight">
              {language === 'es' ? 'Días seguidos' : 'Day streak'}
            </span>
          </div>

          {/* Card 2: Ejercicios */}
          <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between min-h-[84px] shadow-sm">
            <span className="text-xl md:text-2xl font-black text-[#E8834A] leading-none">{stats.ejerciciosCompletados}</span>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mt-1 leading-tight">
              {language === 'es' ? 'Ejercicios' : 'Exercises'}
            </span>
          </div>

          {/* Card 3: Esta semana */}
          <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between min-h-[84px] shadow-sm">
            <span className="text-xl md:text-2xl font-black text-[#E8834A] leading-none">{weeklyCount}</span>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mt-1 leading-tight">
              {language === 'es' ? 'Esta semana' : 'This week'}
            </span>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: "Consistencia" */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400/80 dark:text-neutral-500">
          {language === 'es' ? 'Consistencia' : 'Consistency'}
        </h3>
        
        <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-4 shadow-sm">
          {/* Calendar Grid (7 columns, 4 rows) */}
          <div className="grid grid-cols-7 gap-2 max-w-[320px] mx-auto">
            {calendarDays.map((day, i) => {
              let bgClass = "bg-neutral-100 dark:bg-[#1e1e1e]";
              if (day.intensity === 1) bgClass = "bg-[#E8834A]/30 dark:bg-[#E8834A]/25";
              if (day.intensity === 2) bgClass = "bg-[#E8834A] dark:bg-[#E8834A]";
              
              if (day.isToday && day.intensity === 0) {
                bgClass = "bg-neutral-100 dark:bg-[#1e1e1e]";
              } else if (day.isToday) {
                bgClass = "bg-[#E8834A]";
              }

              return (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-md transition-all duration-300 relative",
                    bgClass,
                    day.isToday && "ring-2 ring-[#E8834A] ring-offset-2 ring-offset-white dark:ring-offset-[#161616]"
                  )}
                  title={day.date.toLocaleDateString()}
                />
              );
            })}
          </div>

          {/* Visual Legend */}
          <div className="flex items-center justify-center gap-3 text-[9px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wide mt-3.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-[#E8834A]" />
              <span>{language === 'es' ? 'Completado' : 'Completed'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-[#E8834A]/30 dark:bg-[#E8834A]/25" />
              <span>{language === 'es' ? 'Parcial' : 'Partial'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-neutral-100 dark:bg-[#1e1e1e]" />
              <span>{language === 'es' ? 'Sin actividad' : 'No activity'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: "Lo que hiciste" */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400/80 dark:text-neutral-500">
          {language === 'es' ? 'Lo que hiciste' : 'What you did'}
        </h3>

        {historyList.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-400 mb-3">
              <Zap className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
            </div>
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-4">
              {language === 'es' ? 'Aún no hay ejercicios. ¿Empezamos hoy?' : 'No exercises yet. Shall we start today?'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#E8834A] hover:bg-[#d9743c] active:scale-95 text-white text-[10px] font-medium uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{language === 'es' ? 'Ir a inicio' : 'Go to home'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* List of recent items */
          <div className="space-y-2">
            {historyList.map((item) => {
               const info = getBlockageMetadata(item);
               const nameText = item.nombre || item.challengeTitle || (language === 'es' ? 'Ejercicio de Creatividad' : 'Creativity Exercise');
               // Format nicely
               const cleanTitle = nameText.replace(/^(Fluxo:|Clásico:)\s*/i, '');

               return (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Blockage soft colored background icon */}
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0", info.bgColor)}>
                      {info.icon}
                    </div>
                    
                    <div className="min-w-0 leading-tight">
                      <p className="font-bold text-[13px] text-neutral-900 dark:text-white truncate">
                        {cleanTitle}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-medium mt-0.5 capitalize leading-normal">
                        {info.label} · {item.duracion || 5} min
                      </p>
                    </div>
                  </div>

                  {/* Relative time indicator */}
                  <div className="text-[10px] text-neutral-400 dark:text-[#444] font-bold shrink-0">
                    {getRelativeTime(item.fecha)}
                  </div>
                </div>
               );
            })}
          </div>
        )}
      </div>

    </motion.div>
  );
}
