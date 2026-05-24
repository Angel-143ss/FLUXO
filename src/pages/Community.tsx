import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Quote, 
  ArrowRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface QuoteItem {
  es: { frase: string; autor: string; disciplina: string };
  en: { frase: string; autor: string; disciplina: string };
}

const INSPIRATION_QUOTES: QuoteItem[] = [
  { 
    es: { frase: "El enemigo de la creatividad es el miedo.", autor: "Twyla Tharp", disciplina: "Coreógrafa" },
    en: { frase: "The enemy of creativity is fear.", autor: "Twyla Tharp", disciplina: "Choreographer" }
  },
  { 
    es: { frase: "No esperes la inspiración. Sal a buscarla a golpes.", autor: "Jack London", disciplina: "Escritor" },
    en: { frase: "You can't wait for inspiration. You have to go after it with a club.", autor: "Jack London", disciplina: "Writer" }
  },
  { 
    es: { frase: "La perfección es el enemigo de lo hecho.", autor: "Voltaire", disciplina: "Filósofo" },
    en: { frase: "Perfection is the enemy of done.", autor: "Voltaire", disciplina: "Philosopher" }
  },
  { 
    es: { frase: "Crea con el corazón, construye con la mente.", autor: "Criss Jami", disciplina: "Poeta" },
    en: { frase: "Create with the heart, build with the mind.", autor: "Criss Jami", disciplina: "Poet" }
  },
  { 
    es: { frase: "El arte nunca termina, solo se abandona.", autor: "Leonardo da Vinci", disciplina: "Artista" },
    en: { frase: "Art is never finished, only abandoned.", autor: "Leonardo da Vinci", disciplina: "Artist" }
  },
  { 
    es: { frase: "Haz la cosa que crees que no puedes hacer.", autor: "Eleanor Roosevelt", disciplina: "Activista" },
    en: { frase: "Do the thing you think you cannot do.", autor: "Eleanor Roosevelt", disciplina: "Activist" }
  },
  { 
    es: { frase: "La creatividad es la inteligencia divirtiéndose.", autor: "Albert Einstein", disciplina: "Científico" },
    en: { frase: "Creativity is intelligence having fun.", autor: "Albert Einstein", disciplina: "Scientist" }
  }
];

const DID_YOU_KNOW = [
  {
    es: "El 80% de los artistas profesionales reporta bloqueo creativo al menos una vez al mes.",
    en: "80% of professional artists report creative block at least once a month."
  },
  {
    es: "Picasso completó más de 20,000 obras en su vida. La mayoría nunca las consideró perfectas.",
    en: "Picasso completed more than 20,000 works in his lifetime. Most of them he never considered perfect."
  },
  {
    es: "Escribir a mano activa más áreas del cerebro creativo que escribir en teclado.",
    en: "Writing by hand activates more areas of the creative brain than typing on a keyboard."
  },
  {
    es: "David Bowie usaba recortes aleatorios de periódicos para romper su bloqueo al escribir letras.",
    en: "David Bowie used random newspaper cutouts to break his writer's block when writing lyrics."
  },
  {
    es: "El bloqueo creativo suele durar menos de 20 minutos si el artista empieza a hacer cualquier cosa.",
    en: "Creative block usually lasts less than 20 minutes if the artist just starts doing anything."
  }
];

interface Technique {
  titleEs: string;
  titleEn: string;
  disciplineEs: string;
  disciplineEn: string;
  duration: number;
  stepsEs: string[];
  stepsEn: string[];
}

const TECHNIQUES: Technique[] = [
  {
    titleEs: "Dibuja sin mirar",
    titleEn: "Draw without looking",
    disciplineEs: "Visual / Dibujo",
    disciplineEn: "Visual / Drawing",
    duration: 7,
    stepsEs: [
      "Elige un objeto cotidiano de tu entorno inmediato o tu mano izquierda.",
      "Apoya el lápiz en el papel para comenzar tu boceto.",
      "Dibuja continuamente durante 7 minutos sin mirar la hoja en absoluto. Concéntrate en la línea pura."
    ],
    stepsEn: [
      "Choose any everyday object near you or your left hand.",
      "Place your pencil on the paper to start your sketch.",
      "Draw continuously for 7 minutes without looking at the sheet at all. Focus entirely on the pure outline."
    ]
  },
  {
    titleEs: "Escribe sin borrar",
    titleEn: "Write without deleting",
    disciplineEs: "Escritura",
    disciplineEn: "Writing",
    duration: 10,
    stepsEs: [
      "Abre un editor de texto vacío o prepara lápiz y papel.",
      "Escribe cualquier pensamiento libre o historia que venga a tu mente.",
      "Sigue escribiendo por 10 minutos. Está estrictamente prohibido usar backspace o rectificar palabras."
    ],
    stepsEn: [
      "Open an empty text editor or prepare paper and pen.",
      "Write any free thoughts or stories that cross your mind.",
      "Keep writing for 10 minutes. Backspacing, delete, or word correction is strictly forbidden."
    ]
  },
  {
    titleEs: "El peor resultado",
    titleEn: "The absolute worst outcome",
    disciplineEs: "Cualquier disciplina",
    disciplineEn: "Any discipline",
    duration: 5,
    stepsEs: [
      "Comienza un boceto rápido, un texto breve, o un encuadre fotográfico ordinario.",
      "Intenta de manera totalmente deliberada que el resultado sea lo más horrible o ridículo posible.",
      "Disfruta la anarquía de liberarte de expectativas estéticas durante estos 5 minutos."
    ],
    stepsEn: [
      "Start a fast sketch, a short text, or an ordinary photo framing.",
      "Deliberately attempt to make the result look as horrible, ridiculous, or chaotic as possible.",
      "Enjoy the sheer anarchy of freeing yourself from aesthetic expectations during these 5 minutes."
    ]
  }
];

export function Community() {
  const { language } = useAppContext();
  const navigate = useNavigate();

  // Rotate based on current date so everyone gets the exact same values per day
  const rotationIndex = useMemo(() => {
    const today = new Date();
    // seed calculation
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return seed;
  }, []);

  const selectedQuote = useMemo(() => {
    const idx = rotationIndex % INSPIRATION_QUOTES.length;
    const item = INSPIRATION_QUOTES[idx];
    return language === 'es' ? item.es : item.en;
  }, [rotationIndex, language]);

  const selectedFact = useMemo(() => {
    const idx = rotationIndex % DID_YOU_KNOW.length;
    const item = DID_YOU_KNOW[idx];
    return language === 'es' ? item.es : item.en;
  }, [rotationIndex, language]);

  const handleStartTechnique = (tech: Technique) => {
    const title = language === 'es' ? tech.titleEs : tech.titleEn;
    const description = language === 'es' 
      ? `Técnica rápida para desbloquear tu creatividad: ${tech.titleEs}`
      : `Quick technique to unlock your creativity: ${tech.titleEn}`;
    const steps = language === 'es' ? tech.stepsEs : tech.stepsEn;

    navigate('/exercises', {
      state: {
        startCustomExercise: {
          title,
          description,
          duration: tech.duration,
          steps
        }
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto space-y-8 pb-24 px-4 pt-4 select-none"
    >
      {/* HEADER */}
      <header className="text-center md:text-left">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 uppercase mb-1">
          {language === 'es' ? 'Inspiración' : 'Inspiration'}
        </h1>
        <p className="text-xs text-neutral-500 font-medium">
          {language === 'es' ? 'Para cuando necesitas recordar por qué creas.' : 'For when you need to remember why you create.'}
        </p>
      </header>

      {/* BLOQUE 1: Frase del día */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-400/80 dark:text-neutral-500">
          {language === 'es' ? 'Frase del día' : 'Quote of the day'}
        </h2>
        
        <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 relative overflow-hidden shadow-sm">
          {/* Quote Mark Decoration */}
          <div className="absolute top-4 right-6 text-[#E8834A]/10 dark:text-[#E8834A]/5">
            <Quote className="w-16 h-16 pointer-events-none stroke-[2.5]" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="text-[#E8834A] flex items-center">
              <Quote className="w-6 h-6 rotate-180 text-[#E8834A] fill-[#E8834A]/10 shrink-0" />
            </div>
            
            <p className="text-base md:text-lg font-bold text-neutral-800 dark:text-neutral-100 leading-relaxed italic tracking-wide">
              {selectedQuote.frase}
            </p>

            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
              <p className="text-xs font-black uppercase tracking-wider text-[#E8834A]">
                {selectedQuote.autor}
              </p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                {selectedQuote.disciplina}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: Técnicas rápidas */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-400/80 dark:text-neutral-500">
          {language === 'es' ? 'Técnicas rápidas' : 'Quick techniques'}
        </h2>

        {/* Horizontal Scroll Containers */}
        <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TECHNIQUES.map((tech, idx) => {
            const titleText = language === 'es' ? tech.titleEs : tech.titleEn;
            const discText = language === 'es' ? tech.disciplineEs : tech.disciplineEn;

            return (
              <div 
                key={idx}
                className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-[20px] p-5 w-[240px] shrink-0 snap-align-center flex flex-col justify-between min-h-[160px] shadow-sm relative overflow-hidden"
              >
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    {discText}
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug mt-1 max-w-[190px]">
                    {titleText}
                  </h3>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/40">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    {tech.duration} Min
                  </span>
                  <button
                    onClick={() => handleStartTechnique(tech)}
                    className="px-3.5 py-1.5 border border-[#E8834A] text-[#E8834A] bg-transparent hover:bg-[#E8834A]/5 active:scale-95 text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>{language === 'es' ? 'Intentarlo' : 'Try it'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOQUE 3: ¿Sabías que? */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-400/80 dark:text-neutral-500">
          {language === 'es' ? '¿Sabías que?' : 'Did you know?'}
        </h2>

        <div className="bg-neutral-50 dark:bg-[#121215] border-l-[3px] border-[#E8834A] border-y border-r border-neutral-200/55 dark:border-neutral-800/60 rounded-r-2xl rounded-l-none p-5 shadow-sm min-h-[84px] flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-[#E8834A]/80 shrink-0" />
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed">
            {selectedFact}
          </p>
        </div>
      </div>

    </motion.div>
  );
}
