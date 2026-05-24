import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Snowflake, Flame, Moon, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

interface StateOption {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

export function Home() {
  const { theme, userName, language } = useAppContext();
  const navigate = useNavigate();

  // Load last used state from localStorage or default to null
  const [selectedState, setSelectedState] = useState<string | null>(() => {
    return localStorage.getItem('creative_selected_block_state');
  });

  // Dynamically set background color to match light/dark theme perfectly
  useEffect(() => {
    const mainEl = document.querySelector('main');
    const bgColor = theme === 'dark' ? '#0e0e0e' : '#fcfcfd';
    if (mainEl) {
      mainEl.style.backgroundColor = bgColor;
    }
    document.body.style.backgroundColor = bgColor;
    return () => {
      if (mainEl) {
        mainEl.style.backgroundColor = '';
      }
      document.body.style.backgroundColor = '';
    };
  }, [theme]);

  const handleSelectState = (stateId: string) => {
    setSelectedState(stateId);
    localStorage.setItem('creative_selected_block_state', stateId);
  };

  const handleStartExercise = () => {
    if (!selectedState) return;
    // Navigate directly to Exercises, triggering Fluxo generation instantly
    navigate('/exercises', {
      state: {
        startWithState: selectedState,
        autoStart: true
      }
    });
  };

  const firstName = userName?.split(' ')[0] || (language === 'es' ? 'Creador' : 'Creator');

  const states: StateOption[] = [
    {
      id: 'Paralizado',
      title: language === 'es' ? 'Paralizado' : 'Paralyzed',
      desc: language === 'es' ? 'No sé por dónde empezar' : 'I don\'t know where to start',
      icon: Snowflake,
      iconBg: 'bg-blue-50 dark:bg-[#1e293b]',
      iconColor: 'text-blue-500 dark:text-blue-400'
    },
    {
      id: 'En loop',
      title: language === 'es' ? 'En loop' : 'In a loop',
      desc: language === 'es' ? 'Empiezo y borro todo' : 'I start and erase everything',
      icon: Flame,
      iconBg: 'bg-orange-50 dark:bg-[#2d1610]',
      iconColor: 'text-orange-500'
    },
    {
      id: 'Sin ideas',
      title: language === 'es' ? 'Sin ideas' : 'No ideas',
      desc: language === 'es' ? 'Me siento vacío' : 'I feel empty',
      icon: Moon,
      iconBg: 'bg-indigo-50 dark:bg-[#172554]',
      iconColor: 'text-indigo-500 dark:text-indigo-400'
    }
  ];

  const labelEstoy = language === 'es' ? 'ESTOY...' : 'I AM FEELING...';
  const labelButton = language === 'es' ? 'Empezar ejercicio →' : 'Start exercise →';

  return (
    <div className="min-h-full flex flex-col justify-between max-w-md mx-auto pt-4 text-neutral-900 dark:text-white">
      {/* Title block */}
      <div className="space-y-4 mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-5xl font-display font-black leading-tight tracking-tight select-none text-neutral-900 dark:text-white"
        >
          {language === 'es' ? 'Hola, ' : 'Hello, '}
          <span className="text-[#E8834A]">{firstName}</span>.
          <br />
          {language === 'es' ? '¿Cómo estás hoy?' : 'How are you today?'}
        </motion.h1>
        
        <p className="text-[#555555] font-medium text-sm md:text-base leading-relaxed">
          {language === 'es' 
            ? 'Elige tu estado y te doy el ejercicio exacto.' 
            : 'Select your state and I will give you the exact exercise.'}
        </p>
      </div>

      {/* Selectable Options block */}
      <div className="space-y-4 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#555555] select-none">
          {labelEstoy}
        </p>

        <div className="space-y-3">
          {states.map((st, idx) => {
            const isActive = selectedState === st.id;
            return (
              <motion.button
                key={st.id}
                onClick={() => handleSelectState(st.id)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                className={cn(
                  "w-full text-left p-5 rounded-3xl transition-all duration-300 flex items-center justify-between cursor-pointer border select-none",
                  isActive
                    ? "bg-[#fdf8f5] dark:bg-[#1c1208] border-[#E8834A]"
                    : "bg-white dark:bg-[#161616] border-neutral-200 dark:border-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-800"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", st.iconBg)}>
                    <st.icon className={cn("w-6 h-6", st.iconColor)} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-neutral-900 dark:text-white leading-tight">
                      {st.title}
                    </h3>
                    <p className="text-[#555555] text-xs font-semibold mt-0.5 leading-snug">
                      {st.desc}
                    </p>
                  </div>
                </div>

                <ChevronRight 
                  className={cn(
                    "w-5 h-5 transition-transform duration-200", 
                    isActive ? "text-[#E8834A] translate-x-0.5" : "text-neutral-400 dark:text-neutral-700"
                  )} 
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Campaign Button CTA at the bottom */}
      <div className="pt-8">
        <button
          onClick={handleStartExercise}
          disabled={!selectedState}
          className={cn(
            "w-full py-4.5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer select-none border border-transparent",
            selectedState 
              ? "bg-[#E8834A] text-white hover:bg-orange-500 active:scale-[0.99]" 
              : "bg-neutral-100 dark:bg-[#222222] text-neutral-400 dark:text-neutral-600 cursor-not-allowed border-neutral-200 dark:border-transparent"
          )}
        >
          {labelButton}
        </button>
      </div>
    </div>
  );
}
