import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, ChevronLeft, X, Camera, Trash2, Check, ArrowRight, PenTool, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

// custom text and bold line parser for Gemini response
function FeedbackRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-3.5 text-neutral-700 dark:text-neutral-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        // Headers
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={idx} className="text-xs font-black text-neutral-900 dark:text-white mt-4 first:mt-0 uppercase tracking-wider">
              {trimmed.replace(/^###\s*/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('##')) {
          return (
            <h3 key={idx} className="text-sm font-black text-[#E8834A] mt-5 first:mt-0 uppercase tracking-widest">
              {trimmed.replace(/^##\s*/, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('#')) {
          return (
            <h2 key={idx} className="text-base font-black text-neutral-900 dark:text-white mt-6 first:mt-0 tracking-tight">
              {trimmed.replace(/^#\s*/, '')}
            </h2>
          );
        }

        // Bullet points
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.replace(/^[-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1">
              <span className="text-[#E8834A] text-base select-none leading-none mt-0.5">•</span>
              <p className="text-[12px] leading-relaxed flex-1">
                {renderBoldText(content)}
              </p>
            </div>
          );
        }

        // Numbered list
        if (/^\d+\.\s*/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s*/, '');
          const num = trimmed.match(/^\d+/)?.[0];
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1">
              <span className="text-[#E8834A] text-[11px] font-black select-none mt-0.5">{num}.</span>
              <p className="text-[12px] leading-relaxed flex-1">
                {renderBoldText(content)}
              </p>
            </div>
          );
        }

        // Return formatted paragraph
        return (
          <p key={idx} className="text-[12px] leading-relaxed">
            {renderBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// helper to render inline bold tokens (**text**)
function renderBoldText(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong key={i} className="font-black text-neutral-950 dark:text-white">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export function AiMirror() {
  const { language, discipline, artistPreferences, theme } = useAppContext();
  const t = translations[language];
  const navigate = useNavigate();
  const isEs = language === 'es';

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<'boceto' | 'mitad' | 'casi_listo' | null>(null);
  const [mirada, setMirada] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState<'analyze' | 'question'>('analyze');
  
  const [loading, setLoading] = useState(false);
  const [feedbackResponse, setFeedbackResponse] = useState<string | null>(null);
  const [suggestedRefImage, setSuggestedRefImage] = useState<string | null>(null);
  
  // lightbox reference image
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    const isQuestionMode = mode === 'question';
    if (!inputText.trim() || loading) return;
    if (!isQuestionMode && (!etapa || !mirada)) return;

    setLoading(true);
    setFeedbackResponse(null);
    setSuggestedRefImage(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(isEs ? "Falta la clave de Gemini API. Por favor configúrala." : "Gemini API key is missing. Please configure it.");
      }
      const ai = new GoogleGenAI({ apiKey });

      let parts: any[] = [];
      let systemPrompt = "";

      if (isQuestionMode) {
        systemPrompt = isEs 
          ? "El artista tiene una pregunta técnica o conceptual. Responde de forma directa y concreta en máximo 3 párrafos cortos. No hagas preguntas de vuelta. No des listas largas. Ve al punto."
          : "The artist has a technical or conceptual question. Respond directly and concretely in a maximum of 3 short paragraphs. Do not ask questions back. Do not give long lists. Get straight to the point.";

        parts.push({ text: inputText });
      } else {
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

        const stageLabelsEs: Record<string, string> = {
          boceto: 'Boceto',
          mitad: 'A mitad de desarrollo',
          casi_listo: 'Casi listo'
        };
        const stageLabelsEn: Record<string, string> = {
          boceto: 'Sketch',
          mitad: 'In-progress',
          casi_listo: 'Almost ready'
        };

        const selectedStageLabel = isEs ? stageLabelsEs[etapa] : stageLabelsEn[etapa];

        let userPrompt = `Hola Espejo IA. Te presento mi trabajo en la disciplina de: ${discipline}.
Etapa actual de la obra: ${selectedStageLabel}.
Mirada de análisis solicitada: "${mirada}".

Contexto de lo que estoy trabajando:
"${inputText}"`;

        parts.push({ text: userPrompt });

        if (selectedImage) {
          const mimeMatch = selectedImage.match(/^data:(image\/[a-zA-Z0-9\-\+.#]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const base64Data = selectedImage.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }

        systemPrompt = `${t.aiMirrorSystemPrompt} La disciplina actual es ${discipline}.${personalizationContext} Si necesitas mostrar un ejemplo visual o el usuario pide una referencia de imagen, usa exactamente este formato: [GENERATE_IMAGE: descripción detallada del prompt en inglés] y luego continúa con tu explicación.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: parts,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const aiText = response.text || (isEs ? "Lo siento, no pude reflejar tu obra correctamente." : "Sorry, I couldn't mirror your work correctly.");

      // Parse for image generation syntax
      const imageMatch = aiText.match(/\[GENERATE_IMAGE: (.*?)\]/);
      let processedText = aiText;
      let generatedImageUrl = undefined;

      if (imageMatch) {
        generatedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageMatch[1])}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000)}&enhance=true`;
        processedText = aiText.replace(imageMatch[0], '').trim();
      }

      setFeedbackResponse(processedText);
      if (generatedImageUrl) {
        setSuggestedRefImage(generatedImageUrl);
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMessage = error?.message || '';
      const isApiKeyError = errorMessage.includes('API_KEY_INVALID') || 
                           errorMessage.includes('API key not found') ||
                           errorMessage.includes('Falta la clave de Gemini API') ||
                           errorMessage.includes('Gemini API key is missing');
      
      setFeedbackResponse(
        isApiKeyError
          ? (isEs 
              ? "Error de Configuración: No se ha detectado o configurado la clave API de Gemini correctamente." 
              : "Configuration Error: Gemini API key is missing or invalid.")
          : (isEs 
              ? `Hubo un error al conectar con el Espejo IA: ${errorMessage || 'Intente de nuevo.'}` 
              : `Connection error with AI Mirror: ${errorMessage || 'Please try again.'}`)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFeedbackResponse(null);
    setSuggestedRefImage(null);
    setInputText('');
    setSelectedImage(null);
    setSelectedImageName(null);
    setEtapa(null);
    setMirada(null);
    setCurrentStep(1);
  };

  // subtitles as requested
  const headerSubtitle = isEs ? 'Una mirada honesta a tu trabajo.' : 'An honest look at your work.';

  return (
    <div className="-mx-5 md:-mx-10 -my-6 md:-my-12 p-5 md:p-10 min-h-screen bg-[#f5f5f5] dark:bg-[#0e0e0e] transition-colors duration-200">
      <div className="max-w-xl mx-auto space-y-5 select-none pb-24 pt-2">
        
        {/* Header Block with Back button and text size matching standard pages */}
        <header className="flex items-center gap-3.5 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-full bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-850 text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[20px] md:text-[22px] font-display font-black tracking-tight flex items-center gap-2 text-neutral-950 dark:text-white leading-none mb-1">
              <Sparkles className="w-5 h-5 text-brand-primary" style={{ color: 'var(--discipline-accent)' }} />
              {t.aiMirrorTitle}
            </h1>
            <p className="text-[#555555] dark:text-neutral-400 font-medium text-[13px] leading-tight">
              {headerSubtitle}
            </p>
          </div>
        </header>

        {/* Dynamic Inner Panel View Stack */}
        <AnimatePresence mode="wait">
          
          {/* Loading mirrored view */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4"
            >
              <Loader2 className="w-10 h-10 animate-spin text-[#E8834A]" />
              <div className="space-y-1">
                <p className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest animate-pulse">
                  {t.aiMirrorThinking}
                </p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 max-w-xs leading-normal">
                  {isEs 
                    ? 'Consultando al espejo para darte una perspectiva libre de prejuicios...' 
                    : 'Consulting the mirror to give you an unbiased creative review...'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Feedback assessment review display */}
          {!loading && feedbackResponse && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Submission Overview Metadata Header */}
              <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {mode === 'analyze' ? (
                      <>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#E8834A]/10 text-[#E8834A] border border-[#E8834A]/15">
                          {isEs ? 'Etapa: ' : 'Stage: '}{etapa === 'boceto' ? (isEs ? 'Boceto' : 'Sketch') : etapa === 'mitad' ? (isEs ? 'A mitad' : 'In-progress') : (isEs ? 'Casi listo' : 'Almost ready')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200/40 dark:border-neutral-700/50">
                          {mirada}
                        </span>
                      </>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#E8834A]/10 text-[#E8834A] border border-[#E8834A]/15">
                        {isEs ? 'Pregunta' : 'Question'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 italic line-clamp-2 leading-relaxed">
                    "{inputText}"
                  </p>
                </div>

                {/* Micro Thumbnail of uploaded image */}
                {mode === 'analyze' && selectedImage && (
                  <img 
                    src={selectedImage} 
                    alt="Uploaded work"
                    onClick={() => setLightboxImage(selectedImage)} 
                    className="w-12 h-12 object-cover rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0 cursor-zoom-in hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Core Audit Assessment Response */}
              <div className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-5.5 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800/60">
                  <div className="w-5.5 h-5.5 rounded-md bg-[#E8834A]/10 flex items-center justify-center text-[#E8834A] shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {isEs ? 'Resultados del Espejo IA' : 'AI Mirror Assessment'}
                  </span>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <FeedbackRenderer text={feedbackResponse} />
                </div>

                {/* GenAI visual reference generation display if suggested */}
                {suggestedRefImage && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#E8834A] block">
                      {isEs ? 'Referencia Visual Sugerida' : 'Suggested Visual Reference'}
                    </span>
                    <div className="rounded-xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/60 shadow-sm bg-neutral-50 dark:bg-neutral-850 group relative">
                      <div className="absolute inset-0 flex items-center justify-center opacity-25 group-hover:opacity-0 transition-opacity">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                      <img 
                        src={suggestedRefImage} 
                        alt="Suggested AI Reference" 
                        onClick={() => setLightboxImage(suggestedRefImage)}
                        className="w-full h-auto object-cover max-h-[350px] relative z-10 cursor-zoom-in hover:opacity-95 transition-all duration-300"
                        referrerPolicy="no-referrer"
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.opacity = '1';
                        }}
                        style={{ opacity: 0 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reset to ask another question button */}
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer select-none active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>{isEs ? 'Nueva consulta' : 'New perspective audit'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* Form Stack of 3 Steps in Sequential Flow */}
          {!loading && !feedbackResponse && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-[#161616] border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl p-5.5 shadow-sm space-y-4 overflow-hidden"
            >
              {/* INDICADOR DE PROGRESO */}
              {mode === 'analyze' && (
                <div className="flex gap-1.5 w-full mb-5" id="step-progress-bar">
                  {[1, 2, 3].map((step) => {
                    let bgColor = '#252525';
                    let opacity = 1;
                    if (step < currentStep) {
                      bgColor = '#E8834A';
                      opacity = 1;
                    } else if (step === currentStep) {
                      bgColor = '#E8834A';
                      opacity = 0.5;
                    }
                    return (
                      <div
                        key={step}
                        className="h-[3px] rounded-[2px] flex-1 transition-all duration-300"
                        style={{ backgroundColor: bgColor, opacity }}
                      />
                    );
                  })}
                </div>
              )}

              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* TWO MODES TABS */}
                    <div className="flex flex-row gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => setMode('analyze')}
                        className={cn(
                          "flex-1 py-3 px-3 border text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-[10px] cursor-pointer select-none",
                          mode === 'analyze'
                            ? "bg-[#2a1a0e] border-[#E8834A] text-[#E8834A]"
                            : "bg-[#161616] border-[#252525] text-[#555555]"
                        )}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Analizar mi trabajo' : 'Analyze my work'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('question')}
                        className={cn(
                          "flex-1 py-3 px-3 border text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-[10px] cursor-pointer select-none",
                          mode === 'question'
                            ? "bg-[#2a1a0e] border-[#E8834A] text-[#E8834A]"
                            : "bg-[#161616] border-[#252525] text-[#555555]"
                        )}
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Tengo una pregunta' : 'I have a question'}</span>
                      </button>
                    </div>

                    {mode === 'analyze' ? (
                      <>
                        {/* PASO 1 — Entrada del trabajo */}
                        <div className="space-y-2">
                          <label className="text-[#444] dark:text-neutral-400 font-black uppercase text-[10px] tracking-wider block select-none">
                            {isEs ? 'PASO 1 — Entrada del trabajo' : 'STEP 1 — Work context'}
                          </label>
                          
                          <div className="space-y-2.5">
                            {/* Small upload button layout with actual upload utilities */}
                            <div className="flex items-center gap-2">
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageChange} 
                                accept="image/*" 
                                className="hidden" 
                              />
                              {!selectedImage ? (
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-[#E8834A] dark:hover:text-[#E8834A] hover:bg-neutral-50 dark:hover:bg-neutral-850 text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer select-none"
                                >
                                  <Camera className="w-3.5 h-3.5 mt-[-1px]" />
                                  <span>{isEs ? 'Subir imagen (opcional)' : 'Upload image (optional)'}</span>
                                </button>
                              ) : (
                                <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800/50 w-full">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img 
                                      src={selectedImage} 
                                      alt="Upload thumb" 
                                      className="w-10 h-10 object-cover rounded-md border border-neutral-150 dark:border-neutral-800 shrink-0" 
                                    />
                                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 truncate max-w-[150px]">
                                      {selectedImageName || 'image.jpg'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedImage(null);
                                      setSelectedImageName(null);
                                      if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="p-1 px-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-500 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>{isEs ? 'Eliminar' : 'Remove'}</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Context input textarea */}
                            <textarea
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              placeholder={isEs ? '¿Qué estás trabajando?' : 'What are you working on?'}
                              rows={3}
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-[#161616] text-[12px] font-medium outline-none focus:border-[#E8834A] dark:focus:border-[#E8834A] focus:ring-1 focus:ring-[#E8834A]/25 transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none leading-relaxed"
                            />
                          </div>
                          
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold tracking-tight block">
                            {isEs ? 'Sé específico — entre más contexto, mejor el feedback.' : 'Be specific — the more context, the better the feedback.'}
                          </span>
                        </div>

                        {/* CONTINUE BUTTON */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            disabled={!inputText.trim()}
                            className={cn(
                              "w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer select-none border border-transparent",
                              inputText.trim()
                                ? "bg-[#E8834A] text-white hover:bg-orange-500 active:scale-[0.99] shadow-sm shadow-[#E8834A]/20" 
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border-neutral-200 dark:border-transparent"
                            )}
                          >
                            {isEs ? 'Continuar →' : 'Continue →'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* MODO 2: Tengo una pregunta */}
                        <div className="space-y-2">
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isEs ? '¿Qué quieres saber? Ej: ¿Cómo dibujo un brazo con perspectiva?' : 'What do you want to know? E.g., How do I draw an arm in perspective?'}
                            rows={5}
                            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 bg-white dark:bg-[#161616] text-[12px] font-medium outline-none focus:border-[#E8834A] dark:focus:border-[#E8834A] focus:ring-1 focus:ring-[#E8834A]/25 transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none leading-relaxed"
                          />
                        </div>

                        {/* DIRECT ASK BUTTON */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSend}
                            disabled={!inputText.trim() || loading}
                            className={cn(
                              "w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer select-none border border-transparent",
                              inputText.trim() && !loading
                                ? "bg-[#E8834A] text-white hover:bg-orange-500 active:scale-[0.99] shadow-sm shadow-[#E8834A]/20"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border-neutral-200 dark:border-transparent"
                            )}
                          >
                            {isEs ? 'Preguntar →' : 'Ask →'}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* PASO 2 — Etapa */}
                    <div className="space-y-2">
                      <label className="text-[#444] dark:text-neutral-400 font-black uppercase text-[10px] tracking-wider block select-none">
                        {isEs ? '¿En qué etapa está tu trabajo?' : 'What stage is your work currently in?'}
                      </label>
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-3 gap-2">
                          {(['boceto', 'mitad', 'casi_listo'] as const).map((stageId) => {
                            const labelsEs = { boceto: 'Boceto', mitad: 'A mitad', casi_listo: 'Casi listo' };
                            const labelsEn = { boceto: 'Sketch', mitad: 'In-progress', casi_listo: 'Almost done' };
                            const label = isEs ? labelsEs[stageId] : labelsEn[stageId];
                            const isSelected = etapa === stageId;
                            
                            return (
                              <button
                                key={stageId}
                                type="button"
                                onClick={() => setEtapa(stageId)}
                                className={cn(
                                  "py-2 px-1 rounded-xl border text-center text-xs transition-all active:scale-95 cursor-pointer select-none",
                                  isSelected 
                                    ? "border-[#E8834A] bg-[#E8834A]/5 text-[#E8834A] font-black" 
                                    : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-850 bg-white dark:bg-[#161616]"
                                )}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* BACK AND CONTINUE BUTTONS */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-[#202020] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-transparent transition-all select-none cursor-pointer"
                      >
                        {isEs ? '← Atrás' : '← Back'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        disabled={!etapa}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer select-none border border-transparent",
                          etapa
                            ? "bg-[#E8834A] text-white hover:bg-orange-500 active:scale-[0.99] shadow-sm shadow-[#E8834A]/20" 
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border-neutral-200 dark:border-transparent"
                        )}
                      >
                        {isEs ? 'Continuar →' : 'Continue →'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* PASO 3 — Tipo de mirada */}
                    <div className="space-y-2">
                      <label className="text-[#444] dark:text-neutral-400 font-black uppercase text-[10px] tracking-wider block select-none">
                        {isEs ? '¿Qué quieres saber?' : 'What do you want to analyze?'}
                      </label>
                      <div className="space-y-1.5 flex flex-col">
                        <div className="space-y-2 flex flex-col">
                          {[
                            { id: 'no_funcionando', labelEs: '¿Qué no está funcionando?', labelEn: 'What is not working?' },
                            { id: 'si_funcionando', labelEs: '¿Qué sí está funcionando?', labelEn: 'What is working?' },
                            { id: 'perfeccionista', labelEs: '¿Estoy siendo perfeccionista?', labelEn: 'Am I being a perfectionist?' },
                            { id: 'diferente', labelEs: '¿Qué haría diferente?', labelEn: 'What would you do differently?' }
                          ].map((item) => {
                            const label = isEs ? item.labelEs : item.labelEn;
                            const isSelected = mirada === label;
                            
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setMirada(label)}
                                className={cn(
                                  "py-3 px-4 rounded-xl border text-left text-xs transition-all active:scale-99 flex items-center justify-between cursor-pointer select-none",
                                  isSelected 
                                    ? "border-[#E8834A] bg-[#E8834A]/5 text-neutral-900 dark:text-white font-black" 
                                    : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-850 bg-white dark:bg-[#161616]"
                                )}
                              >
                                <span>{label}</span>
                                <div className={cn(
                                  "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                                  isSelected 
                                    ? "border-[#E8834A] bg-[#E8834A]" 
                                    : "border-neutral-300 dark:border-neutral-700"
                                )}>
                                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* BACK AND VIEW MIRROR BUTTONS */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-[#202020] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-transparent transition-all select-none cursor-pointer"
                      >
                        {isEs ? '← Atrás' : '← Back'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!mirada || loading}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer select-none border border-transparent",
                          mirada
                            ? "bg-[#E8834A] text-white hover:bg-orange-500 active:scale-[0.99] shadow-sm shadow-[#E8834A]/20" 
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border-neutral-200 dark:border-transparent"
                        )}
                      >
                        {isEs ? 'Ver mi espejo →' : 'See my mirror →'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Enlarged Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[90vh] rounded-3xl overflow-hidden bg-neutral-900 border border-white/10"
            >
              <img 
                src={lightboxImage} 
                alt="Enlarged reference review" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
