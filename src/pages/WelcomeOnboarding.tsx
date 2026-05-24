import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowRight, Chrome, User, Loader2, AlertCircle } from 'lucide-react';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { Mascot } from '../components/Mascot';

export function WelcomeOnboarding() {
  const { language, completeOnboarding, setArtistPreferences, user } = useAppContext();
  const t = translations[language];
  const [step, setStep] = useState(0);
  const [selectedSpark, setSelectedSpark] = useState<string | null>(null);
  const [selectedSaboteur, setSelectedSaboteur] = useState<string | null>(null);

  const [authLoading, setAuthLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPopupTip, setShowPopupTip] = useState(false);

  const nextStep = () => {
    if (step < 4) setStep(prev => prev + 1);
    else finishOnboarding();
  };

  const finishOnboarding = (finalSaboteur?: string) => {
    const spark = selectedSpark || 'silence';
    const saboteur = finalSaboteur || selectedSaboteur || 'perfectionism';
    setArtistPreferences({ spark, saboteur });
    completeOnboarding(spark, saboteur);
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading('google');
    setAuthError(null);
    setShowPopupTip(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const perfilRef = doc(db, 'usuarios', result.user.uid, 'perfil', 'perfil');
        const perfilDoc = await getDoc(perfilRef);
        if (perfilDoc.exists() && perfilDoc.data()?.onboardingCompleto) {
          const pData = perfilDoc.data();
          await completeOnboarding(pData.catalizador || 'silence', pData.saboteador || 'perfectionism');
        } else {
          setStep(3);
        }
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError(language === 'es' 
          ? 'El navegador bloqueó la ventana emergente. Por favor, actívalas o abre la app en una nueva pestaña (icono superior derecho).' 
          : 'Browser blocked the popup. Please allow popups or open the app in a new tab.');
      } else {
        setAuthError(err.message);
      }
    } finally {
      setAuthLoading(null);
    }
  };

  const handleGuestSignIn = async () => {
    setAuthLoading('guest');
    setAuthError(null);
    try {
      await signInAnonymously(auth);
      setStep(3);
    } catch (err: any) {
      console.error('Guest Auth Error:', err);
      setAuthError(err.message);
    } finally {
      setAuthLoading(null);
    }
  };

  const questions = {
    es: [
      {
        id: 'spark',
        title: 'Tu Catalizador',
        question: '¿Cuándo fluyes mejor?',
        options: [
          { value: 'silence', label: 'Silencio', desc: 'Cuando todo está tranquilo y puedo concentrarme.', icon: '🧘' },
          { value: 'chaos', label: 'Ruido y caos', desc: 'Música fuerte, desorden, energía a mi alrededor.', icon: '⚡' },
          { value: 'pressure', label: 'Con presión', desc: 'Un deadline o un reto me activa.', icon: '⏳' },
          { value: 'chance', label: 'Al azar', desc: 'Sin plan, dejando que las cosas pasen solas.', icon: '🎲' }
        ]
      },
      {
        id: 'saboteur',
        title: 'Tu Saboteador',
        question: '¿Qué te frena?',
        options: [
          { value: 'perfectionism', label: 'Quiero que quede perfecto', desc: 'Borro todo si no se ve bien desde el inicio.', icon: '🔍' },
          { value: 'scatter', label: 'Tengo mil ideas y ninguna', desc: 'No sé por cuál empezar.', icon: '🌊' },
          { value: 'criticism', label: 'Me da miedo que sea malo', desc: 'Pienso demasiado en lo que dirán.', icon: '👥' },
          { value: 'fatigue', label: 'Estoy aburrido de lo mismo', desc: 'Siento que siempre hago lo mismo.', icon: '🥱' }
        ]
      }
    ],
    en: [
      {
        id: 'spark',
        title: 'Your Catalyst',
        question: 'When do you flow best?',
        options: [
          { value: 'silence', label: 'Silence', desc: 'When everything is quiet and I can focus.', icon: '🧘' },
          { value: 'chaos', label: 'Noise and chaos', desc: 'Loud music, clutter, energy all around me.', icon: '⚡' },
          { value: 'pressure', label: 'Under pressure', desc: 'A deadline or challenge gets me going.', icon: '⏳' },
          { value: 'chance', label: 'By chance', desc: 'No plan, letting things happen on their own.', icon: '🎲' }
        ]
      },
      {
        id: 'saboteur',
        title: 'Your Saboteur',
        question: 'What holds you back?',
        options: [
          { value: 'perfectionism', label: 'I want it perfect', desc: 'I erase everything if it looks bad upfront.', icon: '🔍' },
          { value: 'scatter', label: 'A thousand ideas but none', desc: 'I don\'t know where to start.', icon: '🌊' },
          { value: 'criticism', label: 'I fear being bad', desc: 'I think too much about what others say.', icon: '👥' },
          { value: 'fatigue', label: 'Bored of the same', desc: 'I feel like I always do the same.', icon: '🥱' }
        ]
      }
    ]
  };

  const currentQuestions = questions[language] || questions.es;

  const handleSparkSelect = (val: string) => {
    setSelectedSpark(val);
    setTimeout(() => {
      setStep(4);
    }, 300);
  };

  const handleSaboteurSelect = (val: string) => {
    setSelectedSaboteur(val);
    setTimeout(() => {
      finishOnboarding(val);
    }, 300);
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
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0e0e0e] overflow-hidden flex flex-col font-sans">
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
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#0e0e0e]"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) nextStep();
            }}
          >
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 w-full max-w-lg">
              {/* Central Mascot with Blob */}
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-pink-100/40 dark:bg-pink-900/10 rounded-full blur-3xl scale-150 opacity-60"
                />
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [-3, -1, -3],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <Mascot shape="pill" color="#FAA7C9" eyes="semiclosed" size="w-56 h-56 md:w-72 md:h-72" />
                </motion.div>
              </div>

              <div className="space-y-4">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl md:text-5xl font-display font-bold text-[#111] dark:text-white tracking-tight leading-tight"
                >
                  Para artistas que se traban.
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-base md:text-lg text-[#888] dark:text-[#666] leading-relaxed font-medium mx-auto max-w-sm"
                >
                  No es falta de talento. Es bloqueo. Y tiene solución.
                </motion.p>
              </div>

              <div className="flex flex-col items-center gap-6 w-full max-w-sm pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="bg-[#E8834A] text-white rounded-full px-12 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#E8834A]/25 hover:shadow-xl transition-all w-full flex items-center justify-center gap-2"
                >
                  <span>Siguiente →</span>
                </motion.button>

                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E8834A]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-[#252525]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-[#252525]" />
                </div>
              </div>
            </div>
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
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#0e0e0e]"
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
                  className="absolute inset-0 bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl scale-150 opacity-60"
                />
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [3, 5, 3],
                  }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <Mascot shape="pentagon" color="#7986CB" eyes="stars" size="w-56 h-56 md:w-72 md:h-72" />
                </motion.div>
              </div>

              <div className="space-y-4">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl md:text-5xl font-display font-bold text-[#111] dark:text-white tracking-tight leading-tight"
                >
                  Ejercicios que funcionan.
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-base md:text-lg text-[#888] dark:text-[#666] leading-relaxed font-medium mx-auto max-w-sm"
                >
                  No prompts genéricos. Técnicas reales usadas por artistas de verdad.
                </motion.p>
              </div>

              <div className="flex flex-col items-center gap-6 w-full max-w-sm pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="bg-[#E8834A] text-white rounded-full px-12 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#E8834A]/25 hover:shadow-xl transition-all w-full flex items-center justify-center gap-2"
                >
                  <span>Siguiente →</span>
                </motion.button>

                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-[#252525]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E8834A]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-[#252525]" />
                </div>
              </div>
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
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#0e0e0e]"
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
                  className="absolute inset-0 bg-green-100/40 dark:bg-green-900/10 rounded-full blur-3xl scale-150 opacity-60"
                />
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [-2, 0, -2],
                  }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <Mascot shape="circle" color="#E57373" eyes="closed" size="w-56 h-56 md:w-72 md:h-72" />
                </motion.div>
              </div>

              <div className="space-y-4">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl md:text-5xl font-display font-bold text-[#111] dark:text-white tracking-tight leading-tight"
                >
                  Listo cuando tú lo seas.
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-base md:text-lg text-[#888] dark:text-[#666] leading-relaxed font-medium mx-auto max-w-sm"
                >
                  Abre la app, elige cómo te sientes, empieza.
                </motion.p>
              </div>

              <div className="flex flex-col items-center gap-4 w-full max-w-sm pt-4">
                {!user ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGoogleSignIn}
                      disabled={authLoading !== null}
                      className="bg-[#E8834A] text-white rounded-full px-12 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#E8834A]/25 hover:shadow-xl transition-all w-full flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {authLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4 text-current" />}
                      </div>
                      <span>{language === 'es' ? 'Iniciar sesión con Google' : 'Sign in with Google'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleGuestSignIn}
                      disabled={authLoading !== null}
                      className="bg-transparent border border-neutral-200 dark:border-[#252525] text-[#111] dark:text-white rounded-full px-12 py-3 text-xs font-black uppercase tracking-widest hover:bg-neutral-100/50 dark:hover:bg-neutral-800/20 transition-all w-full flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {authLoading === 'guest' ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4 text-current" />}
                      </div>
                      <span>{language === 'es' ? 'Explorar sin cuenta' : 'Explore as guest'}</span>
                    </motion.button>

                    {showPopupTip && !authError && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-center text-[#888] dark:text-[#555] bg-neutral-50/50 dark:bg-[#161616]/40 p-3 rounded-xl border border-neutral-150 dark:border-[#252525] italic leading-tight"
                      >
                        {language === 'es' 
                          ? '💡 Si el login no se abre, asegúrate de permitir ventanas emergentes o abre la app en una nueva pestaña (icono de arriba a la derecha).' 
                          : '💡 If login does not open, make sure to allow popups or open the app in a new tab (icon at top-right).'}
                      </motion.div>
                    )}

                    {authError && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 text-center font-medium bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-150 dark:border-red-500/20"
                      >
                        {authError}
                      </motion.p>
                    )}
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(3)}
                      className="bg-[#E8834A] text-white rounded-full px-12 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#E8834A]/25 hover:shadow-xl transition-all w-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{language === 'es' ? 'Personalizar mi perfil (3 min)' : 'Customize my profile (3 min)'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => finishOnboarding()}
                      className="bg-transparent border border-neutral-200 dark:border-[#252525] text-[#111] dark:text-white rounded-full px-12 py-3 text-xs font-black uppercase tracking-widest hover:bg-neutral-100/50 dark:hover:bg-neutral-800/20 transition-all w-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{language === 'es' ? 'Omitir y empezar a explorar' : 'Skip and start exploring'}</span>
                    </motion.button>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-250 dark:bg-[#252525]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-250 dark:bg-[#252525]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E8834A]" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="question-spark"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 35 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 bg-[#fcfcfd] dark:bg-[#0e0e0e] overflow-y-auto"
          >
            <div className="w-full max-w-2xl flex flex-col space-y-8 my-auto">
              <div className="space-y-3 text-center md:text-left">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#E8834A] block">
                  {currentQuestions[0].title}
                </span>
                <h2 className="text-2xl md:text-4xl font-display font-black text-[#111] dark:text-white tracking-tight leading-tight">
                  {currentQuestions[0].question}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestions[0].options.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSparkSelect(opt.value)}
                    className={`flex items-start gap-4 p-5 rounded-[2rem] border text-left transition-all ${
                      selectedSpark === opt.value
                        ? 'bg-[#fdf8f5] dark:bg-[#1c1208] border-[#E8834A] shadow-lg shadow-[#E8834A]/5'
                        : 'bg-white dark:bg-[#161616] border-neutral-200 dark:border-[#252525] hover:border-neutral-300 dark:hover:border-neutral-800'
                    }`}
                  >
                    <span className="text-3xl mt-1 shrink-0">{opt.icon}</span>
                    <div className="space-y-1">
                      <p className={`font-bold text-sm ${
                        selectedSpark === opt.value ? 'text-[#E8834A] font-black' : 'text-[#111] dark:text-white'
                      }`}>
                        {opt.label}
                      </p>
                      <p className={`text-xs leading-relaxed ${
                        selectedSpark === opt.value ? 'text-[#E8834A]/80 dark:text-[#E8834A]/70 font-medium' : 'text-[#888] dark:text-[#555]'
                      }`}>
                        {opt.desc}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center items-center gap-2 pt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-[#252525]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-[#252525]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-[#252525]" />
                <div className="w-6 h-1.5 rounded-full bg-[#E8834A]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-[#252525]" />
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="question-saboteur"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 35 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 bg-[#fcfcfd] dark:bg-[#0e0e0e] overflow-y-auto"
          >
            <div className="w-full max-w-2xl flex flex-col space-y-8 my-auto">
              <div className="space-y-3 text-center md:text-left">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#E8834A] block">
                  {currentQuestions[1].title}
                </span>
                <h2 className="text-2xl md:text-4xl font-display font-black text-[#111] dark:text-white tracking-tight leading-tight">
                  {currentQuestions[1].question}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestions[1].options.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSaboteurSelect(opt.value)}
                    className={`flex items-start gap-4 p-5 rounded-[2rem] border text-left transition-all ${
                      selectedSaboteur === opt.value
                        ? 'bg-[#fdf8f5] dark:bg-[#1c1208] border-[#E8834A] shadow-lg shadow-[#E8834A]/5'
                        : 'bg-white dark:bg-[#161616] border-neutral-200 dark:border-[#252525] hover:border-neutral-300 dark:hover:border-neutral-800'
                    }`}
                  >
                    <span className="text-3xl mt-1 shrink-0">{opt.icon}</span>
                    <div className="space-y-1">
                      <p className={`font-bold text-sm ${
                        selectedSaboteur === opt.value ? 'text-[#E8834A] font-black' : 'text-[#111] dark:text-white'
                      }`}>
                        {opt.label}
                      </p>
                      <p className={`text-xs leading-relaxed ${
                        selectedSaboteur === opt.value ? 'text-[#E8834A]/80 dark:text-[#E8834A]/70 font-medium' : 'text-[#888] dark:text-[#555]'
                      }`}>
                        {opt.desc}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center items-center gap-2 pt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-250 dark:bg-[#252525]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-250 dark:bg-[#252525]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-250 dark:bg-[#252525]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-250 dark:bg-[#252525]" />
                <div className="w-6 h-1.5 rounded-full bg-[#E8834A]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

