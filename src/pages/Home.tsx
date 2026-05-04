import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Palette, Edit3, Camera, Search, ChevronRight } from 'lucide-react';
import { useAppContext, Discipline, Language, CreativeMode } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { cn } from '../lib/utils';

const getDisciplines = (lang: Language): { id: Discipline; label: string; icon: React.ElementType; accent: string }[] => [
  { id: 'Drawing', label: lang === 'es' ? 'Dibujo/Pintura' : 'Drawing/Painting', icon: Palette, accent: 'bg-brand-secondary' },
  { id: 'Writing', label: lang === 'es' ? 'Escritura' : 'Writing', icon: Edit3, accent: 'bg-brand-accent' },
  { id: 'Photography', label: lang === 'es' ? 'Fotografía' : 'Photography', icon: Camera, accent: 'bg-brand-cyan' },
];

export function Home() {
  const { discipline, setDiscipline, creativeMode, setCreativeMode, language, userName } = useAppContext();
  const t = translations[language];
  const disciplines = getDisciplines(language);
  const navigate = useNavigate();

  const accentColors: Record<Discipline, string> = {
    Drawing: '#FFAE7A', // Orange
    Writing: '#A78BFA', // Purple
    Photography: '#22D3EE' // Cyan
  };

  const modeMapping: Record<string, CreativeMode> = {
    'unlock': 'Unlock',
    'practice': 'Practice',
    'quick': 'Challenge'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Greeting Section */}
      <div className="mb-10 pt-4">
        <div className="flex flex-col gap-6">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-display font-black tracking-tight text-neutral-900 dark:text-white leading-[1.1]"
          >
            {t.homeTitle} <span style={{ color: 'var(--discipline-accent)' }}>{userName?.split(' ')[0] || 'Maria'}</span>
          </motion.h1>

          <div className="flex flex-wrap gap-3">
            {[
              { id: 'unlock', label: language === 'es' ? 'Modo Desbloqueo' : 'Unlock Mode' },
              { id: 'practice', label: language === 'es' ? 'Modo Práctica' : 'Practice Mode' },
              { id: 'quick', label: language === 'es' ? 'Reto Rápido' : 'Quick Challenge' }
            ].map((mode) => {
              const isSelected = creativeMode === modeMapping[mode.id];
              return (
                <button
                  key={mode.id}
                  onClick={() => setCreativeMode(modeMapping[mode.id])}
                  className={cn(
                    "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm active:scale-95",
                    isSelected 
                      ? "bg-white dark:bg-neutral-800 border-transparent shadow-lg" 
                      : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  )}
                  style={isSelected ? { 
                    color: 'var(--discipline-accent)',
                    boxShadow: '0 10px 20px -5px rgb(from var(--discipline-accent) r g b / 0.2)'
                  } : {}}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stacked Discipline Selection */}
      <div className="relative h-[320px] mb-8 flex items-center justify-center">
        <div className="relative w-full max-w-[240px] h-[280px] preserve-3d">
          {disciplines.map((item, index) => {
            const isActive = discipline === item.id;
            const disciplineIndex = disciplines.findIndex(d => d.id === discipline);
            const relativePos = index - disciplineIndex;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => setDiscipline(item.id)}
                initial={false}
                animate={{
                  x: isActive ? 0 : relativePos * 50,
                  y: isActive ? 0 : Math.abs(relativePos) * 10,
                  rotateZ: isActive ? 0 : relativePos * 8,
                  scale: isActive ? 1.1 : 0.9,
                  opacity: isActive ? 1 : 0.4,
                  zIndex: isActive ? 50 : 50 - Math.abs(relativePos)
                }}
                whileTap={{ scale: isActive ? 1.05 : 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "absolute inset-0 rounded-[2.5rem] p-8 flex flex-col justify-between transition-shadow group",
                  "bg-white dark:bg-neutral-900 border-2",
                  isActive ? "border-transparent" : "border-neutral-100 dark:border-neutral-800"
                )}
                style={{ 
                  boxShadow: isActive 
                    ? `0 40px 80px -20px rgb(from var(--discipline-accent) r g b / 0.4)`
                    : `0 10px 30px -10px rgb(from ${accentColors[item.id]} r g b / 0.1)`,
                  borderColor: isActive 
                    ? 'rgb(from var(--discipline-accent) r g b / 0.2)'
                    : `rgb(from ${accentColors[item.id]} r g b / 0.15)`
                }}
              >
                <div 
                  className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl transition-transform duration-500 group-hover:rotate-12",
                    item.accent
                  )}
                  style={{ backgroundColor: isActive ? 'var(--discipline-accent)' : undefined }}
                >
                  <item.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                
                <div className="text-left">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-300 dark:text-neutral-600 mb-1 block">
                    {language === 'es' ? 'DISCIPLINA' : 'DISCIPLINE'}
                  </span>
                  <h3 className={cn(
                    "text-2xl font-display font-black leading-tight",
                    isActive ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-600"
                  )}>
                    {item.label}
                  </h3>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn("w-1 h-1 rounded-full", isActive ? "bg-neutral-200" : "bg-neutral-100")} />
                    ))}
                  </div>
                  <ChevronRight className={cn("w-5 h-5", isActive ? "text-neutral-300" : "text-neutral-100")} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => navigate('/ideas', { state: { generateTrigger: true } })}
          className="minimal-button-primary px-12 py-5 rounded-full text-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          {t.inspireMeNow || "Continuar"}
        </button>
      </div>
    </motion.div>
  );
}
