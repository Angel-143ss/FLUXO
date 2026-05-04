import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Square, Clock, CheckCircle2 } from 'lucide-react';
import { useAppContext, Discipline, Language } from '../context/AppContext';
import { translations } from '../lib/i18n';

const getExercisesByDiscipline = (lang: Language): Record<Discipline, { title: string; description: string; duration: number }[]> => ({
  Writing: [
    { 
      title: lang === 'es' ? 'Escritura Automática' : 'Automatic Writing', 
      description: lang === 'es' ? 'Escribe sin parar durante 5 minutes. No corrijas, no pienses, solo deja que las palabras fluyan.' : 'Write non-stop for 5 minutes. Do not correct, do not think, just let the words flow.', 
      duration: 5 
    },
    { 
      title: lang === 'es' ? 'Perspectiva Inversa' : 'Reverse Perspective', 
      description: lang === 'es' ? 'Describe tu escena actual desde el punto de vista de un objeto inanimado en la habitación.' : 'Describe your current scene from the point of view of an inanimate object in the room.', 
      duration: 10 
    },
  ],
  Drawing: [
    { 
      title: lang === 'es' ? 'Dibujo a Ciegas' : 'Blind Drawing', 
      description: lang === 'es' ? 'Dibuja un objeto frente a ti sin mirar el papel. Concéntrate solo en los contornos.' : 'Draw an object in front of you without looking at the paper. Focus only on the contours.', 
      duration: 3 
    },
    { 
      title: lang === 'es' ? 'Mano No Dominante' : 'Non-Dominant Hand', 
      description: lang === 'es' ? 'Intenta hacer un boceto rápido usando tu mano no dominante.' : 'Try to make a quick sketch using your non-dominant hand.', 
      duration: 5 
    },
  ],
  Photography: [
    { 
      title: lang === 'es' ? 'Un Solo Color' : 'Single Color', 
      description: lang === 'es' ? 'Toma 5 fotos donde un color específico sea el protagonista absoluto.' : 'Take 5 photos where a specific color is the absolute protagonist.', 
      duration: 15 
    },
    { 
      title: lang === 'es' ? 'Ángulo Extremo' : 'Extreme Angle', 
      description: lang === 'es' ? 'Fotografía un objeto cotidiano desde un ángulo completamente inusual (muy desde abajo o arriba).' : 'Photograph an everyday object from a completely unusual angle (very from below or above).', 
      duration: 10 
    },
  ],
});

export function Exercises() {
  const { discipline, language } = useAppContext();
  const t = translations[language];
  const exercisesByDiscipline = getExercisesByDiscipline(language);
  const exercises = exercisesByDiscipline[discipline];
  
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  React.useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Play a sound or show notification here ideally
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const startExercise = (index: number) => {
    setActiveExercise(index);
    setTimeLeft(exercises[index].duration * 60);
    setIsRunning(true);
  };

  const stopExercise = () => {
    setIsRunning(false);
    setActiveExercise(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-12">
        <h1 className="text-3xl font-display font-semibold tracking-tight text-neutral-900 dark:text-white mb-3">{t.exercisesTitle}</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t.exercisesSubtitle.replace('{discipline}', discipline.toLowerCase())}
        </p>
      </div>

      {activeExercise !== null ? (
        <div className="minimal-card p-6 md:p-12 text-center">
          <h2 className="text-xl md:text-2xl font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{exercises[activeExercise].title}</h2>
          <p className="text-sm md:text-lg text-neutral-500 dark:text-neutral-400 mb-8 md:mb-12 max-w-2xl mx-auto">
            {exercises[activeExercise].description}
          </p>
          
          <div className="text-6xl md:text-8xl font-mono font-light text-neutral-900 dark:text-neutral-100 mb-10 md:mb-16 tracking-tighter">
            {formatTime(timeLeft)}
          </div>
 
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="minimal-button-primary flex items-center justify-center gap-2 px-8 py-3 w-full sm:w-auto"
            >
              {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? t.pause : t.resume}
            </button>
            <button
              onClick={stopExercise}
              className="minimal-button-secondary flex items-center justify-center gap-2 px-8 py-3 w-full sm:w-auto"
            >
              {t.finish}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map((ex, idx) => (
            <div key={idx} className="minimal-card p-6 md:p-8 flex flex-col group hover:border-neutral-400 dark:hover:border-neutral-600">
               <div className="flex justify-between items-start mb-4 md:mb-6">
                <h3 className="text-lg font-display font-semibold text-neutral-900 dark:text-neutral-100">{ex.title}</h3>
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 px-2 py-1 rounded shrink-0 ml-4">
                  <Clock className="w-3 h-3" />
                  {ex.duration} {t.min}
                </span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-sm leading-relaxed flex-1">
                {ex.description}
              </p>
              <button
                onClick={() => startExercise(idx)}
                className="minimal-button-secondary w-full flex items-center justify-center gap-2 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-900 dark:hover:bg-neutral-100 hover:text-white dark:hover:text-neutral-900 border-transparent"
              >
                <Play className="w-4 h-4" />
                {t.startExercise}
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
