import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Bot, Loader2, ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
}

export function AiMirror() {
  const { language, discipline, artistPreferences } = useAppContext();
  const t = translations[language];
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize AI safely
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      let personalizationContext = "";
      if (artistPreferences && (artistPreferences.spark || artistPreferences.saboteur)) {
        const sparkMap: Record<string, string> = {
          silence: "El usuario prefiere un ambiente de silencio y reflexión profunda. Ofrécele perspectivas muy centradas, directas y zen.",
          chaos: "El usuario se alimenta de caos dinámico y alta energía. Ofrécele respuestas audaces, ideas rápidas y vibrantes.",
          pressure: "El usuario se motiva por límites de tiempo y urgencia. Proponle retos breves o cronometrados para salir de las dudas.",
          chance: "El usuario se inspira con experimentos aleatorios libres. Invítalo a resolver dilemas integrando elementos o materiales imprevistos al azar."
        };
        const saboteurMap: Record<string, string> = {
          perfectionism: "Su saboteador principal es el perfeccionismo agudo. Recuérdale frecuentemente que la fealdad en las fases iniciales es vital, y evítalo sobre-complicar con detalles técnicos excesivos.",
          scatter: "Su saboteador es la dispersión mental (exceso de ideas). No le des listas largas de ideas; ordénale amablemente elegir UN solo elemento simple hoy para ejecutar.",
          criticism: "Padece autocrítica y miedo al juicio ajeno. Sé incondicionalmente alentador, consolida su confianza artística interna y ensalza el valor de experimentar en privado.",
          fatigue: "Su saboteador es la fatiga de rutina. Atráelo con giros de pensamiento sumamente abstractos, metáforas locas y analogías divertidas."
        };
        const sparkText = artistPreferences.spark ? (sparkMap[artistPreferences.spark] || "") : "";
        const saboteurText = artistPreferences.saboteur ? (saboteurMap[artistPreferences.saboteur] || "") : "";
        personalizationContext = `\nPERFIL DEL ARTISTA RECEPTOR (Adáptate silenciosamente en tus explicaciones):\n- Estilo De Enfoque/Catalizador: ${sparkText}\n- Saboteador Creativo Principal: ${saboteurText}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `${t.aiMirrorSystemPrompt} La disciplina actual es ${discipline}.${personalizationContext} Si necesitas mostrar un ejemplo visual o el usuario pide una referencia de imagen, usa exactamente este formato: [GENERATE_IMAGE: descripción detallada del prompt en inglés] y luego continúa con tu explicación.`,
        },
      });

      const aiText = response.text || "Lo siento, no pude procesar eso.";
      
      // Parse for image generation syntax
      const imageMatch = aiText.match(/\[GENERATE_IMAGE: (.*?)\]/);
      let processedText = aiText;
      let generatedImageUrl = undefined;

      if (imageMatch) {
        // Use the direct image endpoint which is more reliable
        generatedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageMatch[1])}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000)}&enhance=true`;
        processedText = aiText.replace(imageMatch[0], '').trim();
      }

      setMessages(prev => [...prev, { role: 'model', text: processedText || (generatedImageUrl ? "Aquí tienes una referencia visual:" : ""), imageUrl: generatedImageUrl }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Hubo un error al conectar con el Espejo IA. Por favor, intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-brand-primary" style={{ color: 'var(--discipline-accent)' }} />
            {t.aiMirrorTitle}
          </h1>
          <p className="text-neutral-500 text-sm font-medium">{t.aiMirrorSubtitle}</p>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-none mb-6">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-neutral-300" />
              </div>
              <p className="text-neutral-400 font-medium italic">{t.aiMirrorIntro}</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  m.role === 'user' ? "bg-neutral-900 text-white" : "bg-neutral-50 dark:bg-neutral-800 text-neutral-400"
                )}>
                  {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-4 rounded-3xl text-sm leading-relaxed",
                  m.role === 'user' 
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-tr-none shadow-lg shadow-neutral-200 dark:shadow-none" 
                    : "bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-none border border-neutral-100 dark:border-neutral-700/50"
                )}>
                  {m.text}
                  {m.imageUrl && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-700/50 shadow-inner bg-neutral-100 dark:bg-neutral-900 group relative">
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-0 transition-opacity">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                      <img 
                        src={m.imageUrl} 
                        alt="Reference Generated" 
                        onClick={() => setSelectedImage(m.imageUrl || null)}
                        className="w-full h-auto object-cover max-h-[400px] hover:scale-105 transition-transform duration-700 relative z-10 cursor-pointer"
                        referrerPolicy="no-referrer"
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.opacity = '1';
                        }}
                        style={{ opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-[85%]"
            >
              <div className="w-10 h-10 rounded-2xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-neutral-300" />
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-3xl rounded-tl-none border border-neutral-100 dark:border-neutral-700/50 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                <span className="text-xs font-bold text-neutral-400 tracking-wider uppercase">{t.aiMirrorThinking}</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 p-6">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.aiMirrorPlaceholder}
              className="w-full pl-6 pr-16 py-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50 rounded-full text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-black dark:focus:border-white outline-none transition-all dark:text-white"
            />
            <button 
              id="send-message"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-lg"
              style={{ 
                backgroundColor: !input.trim() || loading ? undefined : 'var(--discipline-accent)'
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[90vh] rounded-[2.5rem] overflow-hidden bg-neutral-900 border border-white/10"
            >
              <img 
                src={selectedImage} 
                alt="Enlarged Reference" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
