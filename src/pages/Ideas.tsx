import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Loader2, Image as ImageIcon, ListChecks, Share2, Save, Zap, Edit3, Trophy, Wind } from 'lucide-react';
import { useAppContext, CreativeMode } from '../context/AppContext';
import { GoogleGenAI, Type } from '@google/genai';
import { useNavigate, useLocation } from 'react-router-dom';
import { translations } from '../lib/i18n';


import { cn } from '../lib/utils';


interface IdeaData {
  type: 'text' | 'visual';
  title: string;
  description: string;
  time?: string;
  steps?: string[];
  imageUrl?: string;
}

export function Ideas() {
  const { discipline, language, creativeMode, setCreativeMode } = useAppContext();
  const t = translations[language];
  const navigate = useNavigate();
  const location = useLocation();
  const [idea, setIdea] = useState<IdeaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  const modes: { id: CreativeMode; label: string; desc: string; icon: React.ElementType }[] = [
    { id: 'Unlock', label: t.modeUnlock, desc: t.modeUnlockDesc, icon: Zap },
    { id: 'Practice', label: t.modePractice, desc: t.modePracticeDesc, icon: Edit3 },
    { id: 'Challenge', label: t.modeChallenge, desc: t.modeChallengeDesc, icon: Trophy },
  ];

  const generateIdea = async () => {
    setLoading(true);
    setLoadingStep(t.thinkingIdea);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(language === 'es' ? 'Falta la clave API de Gemini' : 'Gemini API Key is missing');
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const modeConfig = {
        Unlock: {
          goal: "Romper el bloqueo creativo rápidamente.",
          duration: "1 a 5 minutos",
          complexity: "Muy simple y sin presión.",
          elements: "Máximo 1-2 objetos o conceptos.",
          focus: "Explorar, jugar y producir algo rápido, no en la perfección.",
          examples: "Dibuja un objeto cotidiano usando una sola línea continua. Escribe 3 palabras que describan tu estado de ánimo. Crea un ritmo simple golpeando la mesa durante 30 segundos."
        },
        Practice: {
          goal: "Activar la creatividad y practicar habilidades básicas.",
          duration: "10 a 20 minutos",
          complexity: "Dificultad moderada.",
          elements: "2-4 elementos o conceptos.",
          focus: "Experimentar con técnicas o combinaciones creativas.",
          examples: "Dibuja un animal usando solo formas geométricas. Escribe un microcuento de 5 frases inspirado en la lluvia. Crea una melodía corta inspirada en la palabra 'noche'."
        },
        Challenge: {
          goal: "Profundizar en la creatividad cuando el bloqueo ya fue superado.",
          duration: "30 minutos o más",
          complexity: "Más complejo y elaborado.",
          elements: "Puede incluir escenas, combinaciones de conceptos o técnicas específicas.",
          focus: "Producir una obra más detallada y profunda.",
          examples: "Dibuja una escena donde un objeto cotidiano tenga vida. Escribe una historia corta donde el protagonista encuentre algo inesperado. Compón una melodía que transmita nostalgia."
        }
      };

      const currentConfig = modeConfig[creativeMode];

      const prompt = `Actúa como un coach de creatividad para un artista de la disciplina: ${discipline}.
      Genera un reto creativo para el MODO: ${creativeMode}.
      
      OBJETIVO: ${currentConfig.goal}
      DURACIÓN: ${currentConfig.duration}
      COMPLEJIDAD: ${currentConfig.complexity}
      ELEMENTOS: ${currentConfig.elements}
      ENFOQUE: ${currentConfig.focus}
      
      EJEMPLOS DE REFERENCIA: ${currentConfig.examples}
      
      REGLAS CRÍTICAS:
      - Instrucciones claras, simples y directas.
      - Si es visual, la imagen debe ser coherente con la complejidad del modo.
      - Prioriza la exploración y el juego.
      
      Tienes dos opciones (elige aleatoriamente):
      1. 'text': Un reto conceptual breve y muy inspirador.
      2. 'visual': Un reto concreto paso a paso basado en una imagen.
      
      IMPORTANTE PARA EL IMAGE PROMPT: Si eliges 'visual', el 'imagePrompt' (en inglés) debe describir una imagen coherente con el modo. Para 'Unlock' debe ser extremadamente minimalista. Para 'Challenge' puede ser más detallada.

      Devuelve un JSON con la estructura solicitada.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "Debe ser 'text' o 'visual'" },
              title: { type: Type.STRING, description: "Título corto del reto" },
              description: { type: Type.STRING, description: "Descripción del reto" },
              time: { type: Type.STRING, description: "Tiempo sugerido (ej: '5 minutos', '10 minutos')" },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Pasos a seguir (opcional, útil para retos visuales)"
              },
              imagePrompt: { type: Type.STRING, description: "Prompt detallado en inglés para generar una imagen minimalista por IA que acompañe el reto (solo si type es 'visual')" }
            },
            required: ["type", "title", "description", "time"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}') as IdeaData & { imagePrompt?: string };

      if (data.type === 'visual' && data.imagePrompt) {
        setLoadingStep(language === 'es' ? 'Generando imagen de referencia...' : 'Generating reference image...');
        try {
          const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{
              parts: [{ text: data.imagePrompt }]
            }],
            config: {
              imageConfig: { aspectRatio: "1:1" }
            }
          });

          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              data.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (imgError) {
          console.error('Error generating image:', imgError);
          // Fallback to text if image fails
          data.type = 'text';
        }
      }

      setIdea(data);
    } catch (error: any) {
      console.error('Error generating idea:', error);
      const errorMessage = error?.message || '';
      const isApiKeyError = errorMessage.includes('API_KEY_INVALID') || 
                           errorMessage.includes('API key not found') ||
                           errorMessage.includes('Falta la clave API') ||
                           errorMessage.includes('Gemini API Key is missing');
      
      setIdea({
        type: 'text',
        title: language === 'es' ? 'Error de conexión' : 'Connection error',
        description: isApiKeyError 
          ? (language === 'es' ? 'Error de configuración: No se ha configurado la clave API de Gemini en las variables de entorno.' : 'Configuration error: Gemini API Key has not been configured in environment variables.')
          : (language === 'es' ? 'Hubo un error al generar la idea. Por favor, intenta de nuevo.' : 'There was an error generating the idea. Please try again.')
      });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  useEffect(() => {
    const shouldGenerate = location.state?.generateTrigger || (!idea && !loading);
    
    if (shouldGenerate) {
      generateIdea();
      // Clear navigation state to avoid re-triggering on manual navigation/refresh
      if (location.state?.generateTrigger) {
        window.history.replaceState({}, document.title);
      }
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-12">
        <h1 className="text-3xl font-display font-semibold tracking-tight text-neutral-900 dark:text-white mb-3">{t.ideasTitle}</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t.ideasSubtitle} {discipline.toLowerCase()}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {modes.map((mode) => {
          const isSelected = creativeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setCreativeMode(mode.id)}
              className={cn(
                "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm active:scale-95",
                isSelected 
                  ? "bg-white dark:bg-neutral-800 border-transparent shadow-lg scale-105" 
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

      <div className="minimal-card p-6 md:p-8 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden mb-8">
        {loading ? (
          <div className="flex flex-col items-center text-neutral-500 py-12 animate-in fade-in zoom-in duration-500">
            <div className="relative mb-6">
              <Loader2 className="w-12 h-12 animate-spin text-brand-primary" style={{ color: 'var(--discipline-accent)' }} />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: 'var(--discipline-accent)' }}
              />
            </div>
            <motion.p 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="font-bold text-xs tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-500"
            >
              {loadingStep}
            </motion.p>
          </div>
        ) : idea ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 w-full"
          >
            {idea.type === 'visual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-left">
                <div className="order-2 md:order-1">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] uppercase font-bold tracking-widest text-neutral-500 dark:text-neutral-400">{t.visualChallenge}</span>
                    {idea.time && (
                      <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-500">{idea.time}</span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold text-neutral-900 dark:text-white mb-4 leading-tight">{idea.title}</h2>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed text-sm md:text-base">{idea.description}</p>
                  
                  {idea.steps && idea.steps.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">{t.stepsToFollow}</h3>
                      <ul className="space-y-4">
                        {idea.steps.map((step, i) => (
                          <li key={i} className="flex gap-4 text-neutral-600 dark:text-neutral-400 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="order-1 md:order-2 relative rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-800/50 aspect-square flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-700">
                  {idea.imageUrl ? (
                    <img src={idea.imageUrl} alt={idea.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-neutral-300 dark:text-neutral-700 flex flex-col items-center">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">{t.imageNotAvailable}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 max-w-2xl mx-auto">
                <div className="flex justify-center items-center gap-2 mb-6 md:mb-8">
                  {idea.time && (
                    <span className="border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">
                      {idea.time}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 dark:text-white mb-6 leading-tight">{idea.title}</h2>
                <p className="text-lg md:text-xl font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed italic px-4">
                  "{idea.description}"
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="z-10 text-neutral-300 dark:text-neutral-600 flex flex-col items-center py-12">
            <Wind className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-20" />
            <p className="text-xs uppercase tracking-widest font-bold">{t.clickToGenerate}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
        <button
          onClick={generateIdea}
          disabled={loading}
          className="minimal-button-primary rounded-full flex items-center justify-center gap-3 px-10 py-5 h-16 w-full sm:w-auto relative text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="opacity-70">{t.thinkingIdea}...</span>
            </>
          ) : idea ? (
            <>
              <RefreshCw className="w-6 h-6" />
              {t.generateAnother}
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              {t.inspireMeNow}
            </>
          )}
        </button>

        {idea && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                navigate('/community', { 
                  state: { 
                    prefill: t.completedChallengeText.replace('{title}', idea.title),
                    challenge: idea
                  } 
                });
              }}
              className="minimal-button-secondary rounded-full flex items-center justify-center gap-3 px-8 py-5 h-16 w-full sm:w-auto text-sm font-bold"
            >
              <Share2 className="w-5 h-5" />
              {t.shareProgress}
            </button>
            <button
              onClick={() => {
                navigate('/progress', { 
                  state: { 
                    prefill: t.completedChallengeText.replace('{title}', idea.title),
                    challenge: idea
                  } 
                });
              }}
              className="minimal-button-secondary rounded-full flex items-center justify-center gap-3 px-8 py-5 h-16 w-full sm:w-auto text-sm font-bold"
            >
              <Save className="w-5 h-5" />
              {t.saveToProgress}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LightbulbIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}
