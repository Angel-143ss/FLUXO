import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { Mascot } from '../components/Mascot';

export function WelcomeOnboarding() {
  const { language, completeOnboarding } = useAppContext();
  const t = translations[language];
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < 2) setStep(prev => prev + 1);
    else completeOnboarding();
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FDFCFD] dark:bg-[#0a0a0a] overflow-hidden flex flex-col font-sans">
      <AnimatePresence initial={false} custom={1} mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 35 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex flex-col p-10 md:p-16"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) nextStep();
            }}
          >
            <div className="flex flex-col gap-4 mb-20 z-10">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-7xl md:text-9xl font-display font-black text-neutral-900 dark:text-white leading-none"
              >
                FLUXO
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 font-medium max-w-sm"
              >
                {t.onboardingDesc}
              </motion.p>
            </div>

            {/* Mascot Pile (Bottom Layout) */}
            <div className="mt-auto relative h-64 md:h-80 w-full opacity-80 dark:opacity-60">
              <Mascot shape="pill" color="#FAA7C9" className="absolute bottom-0 left-0 -rotate-12 translate-y-4" size="w-32 h-32 md:w-44 md:h-44" />
              <Mascot shape="pentagon" color="#7986CB" eyes="closed" className="absolute bottom-10 left-16 rotate-6" size="w-32 h-32 md:w-44 md:h-44" />
              <Mascot shape="diamond" color="#4DB6AC" eyes="stars" className="absolute bottom-0 left-36 -rotate-6" size="w-32 h-32 md:w-44 md:h-44" />
              <Mascot shape="square" color="#FFB74D" className="absolute bottom-16 left-56 rotate-12" size="w-32 h-32 md:w-44 md:h-44" />
              <Mascot shape="circle" color="#E57373" eyes="closed" className="absolute bottom-4 left-72 -rotate-12" size="w-32 h-32 md:w-44 md:h-44" />
              <Mascot shape="cloud" color="#90CAF9" className="absolute bottom-0 left-[24rem] rotate-12" size="w-32 h-32 md:w-44 md:h-44" />
            </div>

            <button 
              onClick={nextStep}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 group"
            >
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors flex items-center gap-2">
                {t.swipeLeft} <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="explanation"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 35 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#0a0a0a]"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) nextStep();
              if (info.offset.x > 100) setStep(0);
            }}
          >
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 w-full max-w-lg">
              {/* Central Mascot with Blob */}
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-pink-100 dark:bg-pink-900/20 rounded-full blur-3xl scale-150 opacity-60"
                />
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [6, 8, 6],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <Mascot shape="pentagon" color="#7986CB" eyes="stars" size="w-64 h-64 md:w-80 md:h-80" />
                </motion.div>
              </div>

              <div className="space-y-6">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl md:text-6xl font-display font-black text-neutral-900 dark:text-white tracking-tight leading-tight"
                >
                  {t.onboardingSlide2}
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl md:text-2xl text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium"
                >
                  {t.onboardingDesc}
                </motion.p>
              </div>

              <button 
                onClick={nextStep}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 group"
              >
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors flex items-center gap-2">
                  {t.swipeLeft} <ChevronRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="intro"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 35 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#0a0a0a]"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) setStep(1);
            }}
          >
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 w-full max-w-lg">
              {/* Central Mascot with Blob */}
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl scale-150 opacity-60"
                />
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [-4, -2, -4],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <Mascot shape="circle" color="#E57373" eyes="closed" size="w-64 h-64 md:w-80 md:h-80" />
                </motion.div>
              </div>

              <div className="space-y-6">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl md:text-6xl font-display font-black text-neutral-900 dark:text-white tracking-tight leading-tight"
                >
                  {t.onboardingSlide3}
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl md:text-2xl text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium"
                >
                  {t.onboardingIntro}
                </motion.p>
              </div>

              <div className="pt-8 flex flex-col items-center gap-8 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={completeOnboarding}
                  className="bg-brand-primary text-white rounded-full px-12 py-3.5 text-base font-semibold drop-shadow-xl hover:shadow-2xl transition-all w-full md:w-auto"
                >
                  {t.getStarted}
                </motion.button>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

