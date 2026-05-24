import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause,
  Square, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Send, 
  RefreshCw, 
  RotateCcw, 
  Check, 
  Plus, 
  Brain, 
  Flame, 
  Ban, 
  Zap, 
  MessageSquare,
  BookmarkPlus,
  ArrowLeft,
  X
} from 'lucide-react';
import { useAppContext, Discipline, Language } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { translations } from '../lib/i18n';
import { GoogleGenAI, Type } from '@google/genai';
import { Mascot } from '../components/Mascot';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface FluxoExercise {
  title: string;
  description: string;
  materials: string;
  steps: string[];
  howToKnowItWorked: string;
}

const getExercisesByDiscipline = (lang: Language): Record<Discipline, { title: string; description: string; duration: number }[]> => ({
  Writing: [
    { 
      title: lang === 'es' ? 'Escritura Automática' : 'Automatic Writing', 
      description: lang === 'es' ? 'Escribe sin parar durante 5 minutos. No corrijas, no pienses, solo deja que las palabras fluyan.' : 'Write non-stop for 5 minutes. Do not correct, do not think, just let the words flow.', 
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

const getStepSubtext = (index: number, discipline: Discipline, lang: Language): string => {
  if (lang === 'es') {
    if (index === 0) return 'Cualquier lápiz o material básico disponible sirve.';
    if (index === 1) return 'Tómate el tiempo que necesites, mantén el ritmo.';
    return '¡Ya casi!';
  } else {
    if (index === 0) return 'Any basic pencil or material available will do.';
    if (index === 1) return 'Take all the time you need, maintain the stroke.';
    return 'Almost there!';
  }
};

const parseStepText = (stepStr: string) => {
  if (!stepStr) return { mainText: '', remains: '' };
  let clean = stepStr.replace(/^(paso\s*\d+[:\-]?|step\s*\d+[:\-]?|\d+[\.\s]*[:\-]?)\s*/i, '').trim();
  const sentences = clean.split(/(?<=\.|\!|\?)\s+/);
  const mainText = sentences[0] || clean;
  const remains = sentences.slice(1).join(' ').trim();
  return { mainText, remains };
};

const getClassicalSteps = (title: string, lang: Language): string[] => {
  const isEs = lang === 'es';
  const t = title.toLowerCase();
  
  if (t.includes('automática') || t.includes('automatic')) {
    return isEs ? [
      "Apoya tu lápiz o bolígrafo en el papel para comenzar.",
      "Sigue escribiendo continuamente sin detenerte bajo ninguna circunstancia.",
      "Mira el resultado. Así se siente vaciar de la mente el juicio inicial."
    ] : [
      "Place your pencil or pen on clean paper to start.",
      "Keep writing continuously without pausing for any reason whatsoever.",
      "Look at the result. This is what empty thoughts feel like."
    ];
  }
  if (t.includes('inversa') || t.includes('reverse')) {
    return isEs ? [
      "Elige un objeto inanimado cercano en la habitación.",
      "Imagina que ese objeto te observa a ti y a la habitación.",
      "Escribe un breve texto describiéndolo todo desde sus ojos."
    ] : [
      "Pick a nearby inanimate object in the room.",
      "Imagine that object is observing you and the whole room.",
      "Write a short paragraph describing everything from its eyes."
    ];
  }
  if (t.includes('ciegas') || t.includes('blind')) {
    return isEs ? [
      "Apoya el lápiz en el papel. No lo levantes hasta terminar.",
      "Dibuja tu mano izquierda lentamente sin mirar la hoja en absoluto.",
      "Mira el resultado. Así se siente crear sin juzgar la estética."
    ] : [
      "Place your pencil on the paper. Do not lift it until finished.",
      "Draw your left hand slowly without looking at the sheet at all.",
      "Look at the outcome. This is what non-judgmental art feels like."
    ];
  }
  if (t.includes('dominante') || t.includes('non-dominant')) {
    return isEs ? [
      "Sostén tu herramienta de dibujo con tu mano no dominante.",
      "Haz un boceto rápido e imperfecto de un objeto que tengas enfrente.",
      "Disfruta las líneas temblorosas como una huella libre de control."
    ] : [
      "Hold your drawing tool in your non-dominant hand.",
      "Make a quick, imperfect sketch of any object in front of you.",
      "Enjoy the shaky lines as a footprint free from critical control."
    ];
  }
  if (t.includes('color') || t.includes('single')) {
    return isEs ? [
      "Decide un color protagonista visible a tu alcance hoy.",
      "Busca y fotografía 5 cosas diferentes con ese tono.",
      "Observa cómo tu ojo se programó para filtrar la realidad."
    ] : [
      "Decide on a single protagonist color visible near you.",
      "Find and take photos of 5 different items featuring that hue.",
      "Observe how your eye gets trained to filter visual reality."
    ];
  }
  if (t.includes('extremo') || t.includes('extreme')) {
    return isEs ? [
      "Párate al lado de cualquier objeto cotidiano ordinario.",
      "Coloca tu lente casi tocando el suelo o mirando desde arriba.",
      "Captura el encuadre buscando alterar toda percepción habitual."
    ] : [
      "Stand next to any common everyday object.",
      "Position your lens almost touching the ground or looking straight down.",
      "Capture the frame attempting to disrupt all normal scale perception."
    ];
  }
  
  return isEs ? [
    "Apoya tu herramienta de trabajo y respira hondo.",
    "Comienza la ejecución enfocándote sólo en el tacto, no en el resultado.",
    "Completa con orgullo la sesión incómoda. ¡Has roto la inercia!"
  ] : [
    "Sit with your workflow tool and take a deep breath.",
    "Begin executing by focusing purely on raw sensory action, not logic.",
    "Complete the unblocking session. You broke the creative friction!"
  ];
};

const fluxoTranslations = {
  es: {
    tabClassical: 'Ejercicios Clásicos',
    tabFluxo: 'Método Fluxo AI ✨',
    fluxoHelp: 'Fluxo: Tu Acompañante de Flujo',
    fluxoDesc: 'Herramienta neuro-creativa diseñada para romper bloqueos creativos incómodos y llevarte a hacer cosas concretas.',
    artistType: 'Tipo de Artista / Rol',
    artistPlaceholder: 'ej. ilustrador, escritor, músico, fotógrafo, diseñador...',
    blockType: 'Tipo de Bloqueo',
    blockParalisis: 'Parálisis por análisis',
    blockParalisisDesc: 'Darle mil vueltas a las ideas antes de comenzar.',
    blockLoop: 'Bucle Repetitivo',
    blockLoopDesc: 'Dificultad para salir de tus estilos o caminos ultra conocidos.',
    blockVacio: 'Vacío Creativo',
    blockVacioDesc: 'Tener enfrente el lienzo o página vacía y no saber por dónde ir.',
    timeAvailable: 'Tiempo Disponible',
    additionalContext: 'Contexto Adicional (Opcional)',
    contextPlaceholder: 'ej. Estoy dibujando en una servilleta de café ruidoso, me pesa la mano, sólo tengo tinta verde...',
    generateBtn: 'Despertar a Fluxo y Crear',
    generating: 'Fluxo está calculando tu antídoto creativo...',
    descriptionLabel: 'Descripción',
    needs: 'Materiales mínimos',
    steps: 'El ejercicio paso a paso',
    knowWorked: 'Comprobación de éxito',
    timeLimit: 'Tiempo disponible',
    startTimer: 'Empezar Ejercicio',
    stopTimer: 'Pausar',
    resetTimer: 'Reiniciar',
    finishExercise: '¡He Terminado! 🌟',
    fluxoQuestionHeader: 'Reflexión guiada por Fluxo:',
    userReplyPlaceholder: 'Cuéntale sinceramente cómo te fue en una frase...',
    thinking: 'Fluxo está escuchando tu vibración...',
    evaluationHeader: 'La recomendación de Fluxo:',
    saveNoteSuccess: '¡Ejercicio guardado exitosamente en tu Bitácora!',
    saveToProgress: 'Guardar sesión en Bitácora',
    actionA: 'Repetir reto de este estilo',
    actionB: 'Probar un bloqueo diferente',
    actionC: 'Listo, volver al taller real',
    saved: '¡Misión Registrada!',
    minutesSuffix: 'minutos',
    classicHeader: 'Ejercicios Guiados Clásicos',
    classicSub: 'Prácticas cronometradas diseñadas específicamente para'
  },
  en: {
    tabClassical: 'Classical Exercises',
    tabFluxo: 'Fluxo AI Method ✨',
    fluxoHelp: 'Fluxo: Your Flow Companion',
    fluxoDesc: 'Neuro-creative companion to disrupt analysis paralysis, boring ruts, or empty canvases with active trials.',
    artistType: 'Type of Artist / Role',
    artistPlaceholder: 'e.g. illustrator, writer, musician, photographer, designer...',
    blockType: 'Type of Block',
    blockParalisis: 'Analysis Paralysis',
    blockParalisisDesc: 'Overthinking options and never starting the first actual stroke.',
    blockLoop: 'Repetitive Loop',
    blockLoopDesc: 'Stuck repeating comfortable patterns or secure creative ideas.',
    blockVacio: 'Creative Void',
    blockVacioDesc: 'Staring at a blank paper or project with zero initial orientation.',
    timeAvailable: 'Available Time',
    additionalContext: 'Additional Context (Optional)',
    contextPlaceholder: 'e.g., Working on a noisy café napkin, feeling sleepy, only using a green pen...',
    generateBtn: 'Activate Fluxo & Generate',
    generating: 'Fluxo is fabricating your custom creative antidote...',
    descriptionLabel: 'Description',
    needs: 'Materials needed',
    steps: 'Step-by-step',
    knowWorked: 'Success indicator',
    timeLimit: 'Time available',
    startTimer: 'Start Practice',
    stopTimer: 'Pause',
    resetTimer: 'Reset',
    finishExercise: 'I am Done! 🌟',
    fluxoQuestionHeader: 'Guided reflection by Fluxo:',
    userReplyPlaceholder: 'Tell Fluxo how it went in a simple honest phrase...',
    thinking: 'Fluxo is absorbing your feedback...',
    evaluationHeader: 'Fluxo\'s Advice:',
    saveNoteSuccess: 'Successfully added to your Journey Log!',
    saveToProgress: 'Save Session to Journey Log',
    actionA: 'Generate another similar challenge',
    actionB: 'Try another type of block',
    actionC: 'Done, back to actual production',
    saved: 'Journey Saved!',
    minutesSuffix: 'minutes',
    classicHeader: 'Classic Guided Exercises',
    classicSub: 'Timed practices designed specifically for'
  }
};

export function Exercises() {
  const { discipline, language, artistPreferences, addProgressNote } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const t = translations[language];
  const ft = fluxoTranslations[language] || fluxoTranslations.es;
  
  // Traditional exercises variables
  const exercisesByDiscipline = getExercisesByDiscipline(language);
  const exercises = exercisesByDiscipline[discipline];
  
  // Traditional states
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Dynamic custom exercise from Inspiration
  const [customExercise, setCustomExercise] = useState<{
    title: string;
    description: string;
    duration: number;
    steps: string[];
  } | null>(null);

  // Fluxo customized states
  const defaultArtistType = {
    Drawing: language === 'es' ? 'ilustrador' : 'illustrator',
    Writing: language === 'es' ? 'escritor' : 'writer',
    Photography: language === 'es' ? 'fotógrafo' : 'photographer'
  }[discipline] || 'artista';

  const [artistType, setArtistType] = useState(defaultArtistType);
  const [blockType, setBlockType] = useState<'Parálisis' | 'Loop' | 'Vacío'>('Parálisis');
  const [timeAvailable, setTimeAvailable] = useState<'5' | '15' | '30'>('15');
  const [additionalContext, setAdditionalContext] = useState('');
  
  // States of exercise execution
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExercise, setGeneratedExercise] = useState<FluxoExercise | null>(null);
  const [startedGenerated, setStartedGenerated] = useState(false);
  const [fluxoTimeLeft, setFluxoTimeLeft] = useState(15 * 60);
  const [fluxoTimerRunning, setFluxoTimerRunning] = useState(false);

  // Step-by-step active navigation states
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showClassicCompletedMsg, setShowClassicCompletedMsg] = useState(false);
  const [timeAddedAlert, setTimeAddedAlert] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Mascot visual states
  const [mascotStyle, setMascotStyle] = useState<'normal' | 'stars' | 'closed'>('stars');

  // Follow-up states
  const [isReflecting, setIsReflecting] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [fluxoQuestion, setFluxoQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [fluxoEvaluation, setFluxoEvaluation] = useState('');
  const [saveNoteStatus, setSaveNoteStatus] = useState<boolean>(false);

  // Setup traditional timer
  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Setup Fluxo custom timer
  useEffect(() => {
    let interval: number;
    if (fluxoTimerRunning && fluxoTimeLeft > 0) {
      interval = window.setInterval(() => {
        setFluxoTimeLeft((prev) => prev - 1);
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (fluxoTimeLeft === 0 && fluxoTimerRunning) {
      setFluxoTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [fluxoTimerRunning, fluxoTimeLeft]);

  // Listen to navigation state from Home or Inspiration
  useEffect(() => {
    if (location.state && location.state.startWithState && location.state.autoStart) {
      const stateToBlockType: Record<string, 'Parálisis' | 'Loop' | 'Vacío'> = {
        'Paralizado': 'Parálisis',
        'En loop': 'Loop',
        'Sin ideas': 'Vacío'
      };
      const mappedBlock = stateToBlockType[location.state.startWithState];
      if (mappedBlock) {
        setBlockType(mappedBlock);
        generateFluxoAntidote(mappedBlock);
      }
      // Clear the location state to prevent double triggers on reload/back
      window.history.replaceState({}, document.title);
    } else if (location.state && location.state.startCustomExercise) {
      const customEx = location.state.startCustomExercise;
      setCustomExercise(customEx);
      setActiveExercise(-2); // Flag for custom
      setTimeLeft(customEx.duration * 60);
      setIsRunning(false);
      setCurrentStepIndex(0);
      setElapsedSeconds(0);
      // Clear the location state to prevent double triggers on reload/back
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Redirect directly to Home '/' if no exercise is active, generating, reflecting or being initiated
  useEffect(() => {
    const hasNavState = location.state && (location.state.startWithState || location.state.startCustomExercise);
    if (!hasNavState && !isGenerating && !generatedExercise && activeExercise === null && !isReflecting) {
      navigate('/', { replace: true });
    }
  }, [location.state, isGenerating, generatedExercise, activeExercise, isReflecting, navigate]);

  // Initialize AI Client
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Start classic exercise
  const startExercise = (index: number) => {
    setActiveExercise(index);
    setTimeLeft(exercises[index].duration * 60);
    setIsRunning(false);
    setCurrentStepIndex(0);
    setElapsedSeconds(0);
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

  // Generate customized Fluxo exercise
  const generateFluxoAntidote = async (overrideBlockType?: 'Parálisis' | 'Loop' | 'Vacío') => {
    setIsGenerating(true);
    setMascotStyle('closed');
    setGeneratedExercise(null);
    setStartedGenerated(false);
    setFluxoTimerRunning(false);
    setIsReflecting(false);
    setFluxoQuestion('');
    setUserAnswer('');
    setFluxoEvaluation('');
    setSaveNoteStatus(false);
    setCurrentStepIndex(0);
    setElapsedSeconds(0);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(language === 'es' ? 'Falta la clave API de Gemini' : 'Gemini API Key is missing');
      }

      // Fetch user profile stats if defined
      let sparkText = "";
      let saboteurText = "";
      if (artistPreferences) {
        if (artistPreferences.spark) sparkText = artistPreferences.spark;
        if (artistPreferences.saboteur) saboteurText = artistPreferences.saboteur;
      }

      const currentBlockType = overrideBlockType || blockType;
      const blockLabel = {
        Parálisis: language === 'es' ? 'Parálisis por análisis (dar mil vueltas antes de actuar)' : 'Analysis Paralysis (overthinking options instead of executing)',
        Loop: language === 'es' ? 'Bucle o repetir recursos cómodos (rutina)' : 'Repetitive loop (always playing safe)',
        Vacío: language === 'es' ? 'Vacío creativo absoluto (estancado frente a página vacía)' : 'Total creative blank void (loss of inspiration at start)'
      }[currentBlockType];

      const prompt = `Según el estado emocional del usuario, genera ejercicios con esta intención específica:

PARALIZADO (Bloqueo de tipo "Parálisis" / "Parálisis por análisis"):
- El objetivo es eliminar la parálisis por análisis
- El paso 1 siempre debe ser una acción física e inmediata
- Ejemplos: poner el lápiz en el papel sin pensar, hacer una marca cualquiera, timer de 30 segundos
- NUNCA empieces con "piensa en..." o "imagina..."

EN LOOP (Bloqueo de tipo "Loop" / "Bucle"):
- El objetivo es romper el ciclo perfeccionista
- El ejercicio debe incluir una restricción que haga imposible borrar o corregir
- Ejemplos: dibujar sin levantar el lápiz, usar bolígrafo en vez de lápiz, hacer la peor versión posible intencionalmente
- NUNCA sugieres revisar o mejorar lo hecho

SIN IDEAS (Bloqueo de tipo "Vacío" / "Vacío creativo"):
- El objetivo es generar input externo, no crear
- El ejercicio debe involucrar observar, copiar o robar de algo que ya existe
- Ejemplos: copiar la estructura de una obra ajena, salir y fotografiar 3 texturas, cambiar de medio
- NUNCA pidas al usuario que "invente" o "imagine" algo

REGLA ABSOLUTA:
Nunca generes el mismo tipo de ejercicio para los 3 estados. Cada estado tiene una lógica completamente diferente.

Actúa como Fluxo, un acompañante creativo para artistas que enfrentan bloqueo creativo. Tu tono es cálido, directo, humano y de artista a artista (como un amigo artista experimentado, no un coach de negocios o corporativo). No uses frases genéricas como "explora tu creatividad" o "deja fluir tu imaginación". Ve al grano y diseña un reto específico, tangible e incómodo en el buen sentido: que saque al artista de su cabeza y lo lleve a hacer algo concreto. Nada de journaling genérico ni "escribe lo que sientes".

Genera un ejercicio incómodo en el buen sentido adaptado al siguiente perfil:
- Tipo de artista: ${artistType}
- Tipo de bloqueo: ${blockLabel}
- Tiempo de ejercicio: ${timeAvailable} minutos
- Contexto ambiental o limitaciones actuales: ${additionalContext || "Ninguno"}

Preferencias del perfil del artista:
- Spark preferido: ${sparkText || "No definido"}
- Saboteador principal: ${saboteurText || "No definido"}

REGLAS DE FORMATO ESTRICTAS:
1. NOMBRE (campo "title"): Máximo 4 palabras. Debe describir la acción física o directa del ejercicio, nunca una metáfora o título poético.
2. DESCRIPCIÓN (campo "description"): Exactamente 1 oración simple. Sin adornos ni explicaciones cognitivas/psicológicas innecesarias.
3. PASOS (campo "steps"): Máximo 3 pasos secuenciales de acción directa. Cada paso debe tener como MÁXIMO 15 palabras. Solo la acción directa, sin explicar por qué ni justificar psicológicamente ningún paso.
4. POR QUÉ FUNCIONA: Omítelo completamente de la explicación o justificación. El usuario debe descubrirlo al hacer.

Devuelve obligatoriamente un formato JSON con la siguiente estructura y datos reales en el idioma "${language === 'es' ? 'español' : 'inglés'}":
{
  "title": "[NOMBRE del ejercicio, máximo 4 palabras descriptivas de la acción, p. ej. 'Dibuja sin mirar']",
  "description": "[DESCRIPCIÓN del ejercicio, exactamente 1 oración sin adornos]",
  "materials": "[Los materiales mínimos indispensables]",
  "steps": [
    "[Paso 1: acción directa, máx 15 palabras]",
    "[Paso 2: acción directa, máx 15 palabras]",
    "[Paso 3: acción directa, máx 15 palabras]"
  ],
  "howToKnowItWorked": "[Señal física o resultado concreto que denota éxito al final]"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Nombre de acción física para el ejercicio. Máximo 4 palabras de acción real." },
              description: { type: Type.STRING, description: "Descripción del ejercicio. Exactamente 1 oración simple sin adornos." },
              materials: { type: Type.STRING, description: "Los materiales mínimos indispensables" },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Ejecución paso a paso. Máximo 3 pasos, con un límite riguroso de 15 palabras cada uno, enfocados solo en acción."
              },
              howToKnowItWorked: { type: Type.STRING, description: "Señal física o resultado concreto inmediato que denota éxito" }
            },
            required: ["title", "description", "materials", "steps", "howToKnowItWorked"]
          }
        }
      });

      const parsed: FluxoExercise = JSON.parse(response.text || '{}');
      setGeneratedExercise(parsed);
      setFluxoTimeLeft(parseInt(timeAvailable) * 60);
      setMascotStyle('normal');
    } catch (error) {
      console.error("Error generating exercise:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger follow up after clicking completed
  const handleFluxoFinished = async () => {
    if (!generatedExercise) return;
    
    setFluxoTimerRunning(false);
    setIsReflecting(true);
    setLoadingQuestion(true);
    setMascotStyle('closed');

    try {
      const prompt = `Eres Fluxo, el acompañante creativo de artistas. El artista de tipo "${artistType}" acaba de terminar tu ejercicio titulado "${generatedExercise.title}".
Pregúntale exactamente UNA sola cosa — la más útil para entender cómo le fue en el proceso de romper su bloqueo de tipo "${blockType}". No hagas múltiples preguntas ni uses fórmulas corporativas. Sé extremadamente breve, cálido, sincero y directo (de amigo a amigo). Responde en el idioma ${language === 'es' ? 'español' : 'inglés'}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });

      setFluxoQuestion(response.text || (language === 'es' ? "¿Qué sentiste en el segundo paso del ejercicio?" : "What did you feel during the second step of the exercise?"));
      setMascotStyle('normal');
    } catch (error) {
      console.error("Error fetching question:", error);
      setFluxoQuestion(language === 'es' ? "¿Cómo te sentiste al forzar la incomodidad de este ejercicio?" : "How did it feel forcing the discomfort of this exercise?");
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Evaluate the feedback and give tailored recommendation (a, b, c)
  const submitFluxoAnswer = async () => {
    if (!userAnswer.trim() || !generatedExercise) return;

    setIsEvaluating(true);
    setMascotStyle('closed');

    try {
      const prompt = `Eres Fluxo, el compañero artístico y neuro-creativo. El artista de tipo "${artistType}" completó el ejercicio "${generatedExercise.title}" para combatir su bloqueo de tipo "${blockType}". Te ha respondido exactamente esto sobre su experiencia: "${userAnswer}".
Basándose en su respuesta, debes evaluar de forma breve, empática y muy humana (como un amigo sensato) qué necesita a continuación. Tienes que emitir tu juicio de manera natural y elegir explícitamente una recomendación/acción de entre estas tres:
a) Otro ejercicio del mismo tipo (si ves que apenas empezó a soltarse o necesita más tracción).
b) Un ejercicio diferente (si detectas que este reto no hizo clic, o le causó excesivo estrés contraproducente).
c) Simplemente validación y cierre (si el artista logró desactivar su juicio crítico y está listo para avanzar con su proyecto real).

Escribe tu respuesta final en el idioma ${language === 'es' ? 'español' : 'inglés'}. Mantén tu tono sumamente directo, humano, cálido, de amigo experimentador y sin rodeos corporativos. Termina tu respuesta sugiriendo con total claridad si es mejor seguir con a, b o c.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });

      setFluxoEvaluation(response.text || (language === 'es' ? "¡Lograste dar el paso con excelente disciplina de juego! Ve por la obra real hoy." : "You made the step with great playful discipline! Go build the real piece today."));
      setMascotStyle('stars');
    } catch (error) {
      console.error("Error evaluating response:", error);
      setFluxoEvaluation(language === 'es' ? "¡Excelente trabajo! Has roto la inercia mental. Te recomiendo avanzar directo a tu propio canvas o lienzo." : "Excellent work! You broke the mental inertia. I recommend going straight to your canvas.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Save progress dynamically inside App state
  const saveSessionToLog = () => {
    if (!generatedExercise) return;

    const savedDisciplineMapping: Record<string, Discipline> = {
      ilustrador: 'Drawing',
      illustrator: 'Drawing',
      escritor: 'Writing',
      writer: 'Writing',
      fotógrafo: 'Photography',
      photographer: 'Photography'
    };

    const finalDiscipline: Discipline = savedDisciplineMapping[artistType.toLowerCase()] || discipline;

    addProgressNote({
      discipline: finalDiscipline,
      challengeTitle: `Fluxo: ${generatedExercise.title}`,
      content: `Bloqueo Original: ${blockType}\nTiempo: ${timeAvailable} ${ft.minutesSuffix}\nRespuesta del artista: "${userAnswer}"\nRecomendaciones de Fluxo:\n${fluxoEvaluation}`,
      moodLevel: blockType === 'Parálisis' ? 2 : blockType === 'Loop' ? 3 : 5,
      challenge: {
        type: 'text',
        title: generatedExercise.title,
        description: generatedExercise.steps.join('\n')
      }
    });

    setSaveNoteStatus(true);
  };

  const runningTitle = activeExercise !== null 
    ? (activeExercise === -2 ? (customExercise?.title || '') : exercises[activeExercise].title)
    : (generatedExercise ? generatedExercise.title : '');

  const runningDescription = activeExercise !== null 
    ? (activeExercise === -2 ? (customExercise?.description || '') : exercises[activeExercise].description)
    : (generatedExercise ? generatedExercise.description : '');

  const runningSteps = activeExercise !== null 
    ? (activeExercise === -2 ? (customExercise?.steps || []) : getClassicalSteps(exercises[activeExercise].title, language))
    : (generatedExercise ? generatedExercise.steps : []);

  const runningTimeLeft = activeExercise !== null 
    ? timeLeft 
    : fluxoTimeLeft;

  const runningTimerActive = activeExercise !== null 
    ? isRunning 
    : fluxoTimerRunning;

  const toggleTimerActive = () => {
    if (activeExercise !== null) {
      setIsRunning(!isRunning);
    } else {
      setFluxoTimerRunning(!fluxoTimerRunning);
    }
  };

  const addTimeBonus = () => {
    const isClassic = activeExercise !== null;
    
    // Pause the timer
    if (isClassic) {
      setIsRunning(false);
      setTimeLeft(prev => prev + 120);
    } else {
      setFluxoTimerRunning(false);
      setFluxoTimeLeft(prev => prev + 120);
    }
    
    // Show "+ 2 min" animation
    setTimeAddedAlert(true);
    
    // Automatically resume after 1200ms
    setTimeout(() => {
      setTimeAddedAlert(false);
      if (isClassic) {
        setIsRunning(true);
      } else {
        setFluxoTimerRunning(true);
      }
    }, 1200);
  };

  const handleExitExercise = () => {
    if (activeExercise !== null) {
      if (activeExercise === -2) {
        setCustomExercise(null);
      }
      stopExercise();
    } else {
      setGeneratedExercise(null);
      setStartedGenerated(false);
      setFluxoTimerRunning(false);
    }
    setCurrentStepIndex(0);
    navigate('/');
  };

  const handleFinishStepByStep = () => {
    // 1. Guardar en Firestore si es un ejercicio de Fluxo
    if (generatedExercise) {
      const saveToDb = async () => {
        if (auth.currentUser && !auth.currentUser.isAnonymous) {
          try {
            const exerciseId = typeof crypto.randomUUID === 'function' 
              ? crypto.randomUUID() 
              : Math.random().toString(36).substring(2) + Date.now().toString(36);
              
            const histRef = doc(db, 'usuarios', auth.currentUser.uid, 'historial', exerciseId);
            const estadoElegido = {
              'Parálisis': 'paralizado',
              'Loop': 'en loop',
              'Vacío': 'sin ideas'
            }[blockType] || 'paralizado';

            await setDoc(histRef, {
              fecha: new Date().toISOString(),
              nombre: generatedExercise.title,
              nombre_ejercicio: generatedExercise.title,
              estado: estadoElegido,
              estado_elegido: estadoElegido,
              duracion: elapsedSeconds,
              duracion_segundos: elapsedSeconds,
              tipo: discipline
            });
            console.log("Saved completed Fluxo exercise to Firestore:", generatedExercise.title);
          } catch (writeError) {
            console.error("Error saving completed Fluxo exercise to Firestore:", writeError);
          }
        }
      };
      saveToDb();
    } else if (activeExercise !== null) {
      // It's traditional/classic exercise
      const finalTitle = activeExercise === -2 ? (customExercise?.title || 'Ejercicio') : exercises[activeExercise].title;
      const saveToDb = async () => {
        if (auth.currentUser && !auth.currentUser.isAnonymous) {
          try {
            const exerciseId = typeof crypto.randomUUID === 'function' 
              ? crypto.randomUUID() 
              : Math.random().toString(36).substring(2) + Date.now().toString(36);
              
            const histRef = doc(db, 'usuarios', auth.currentUser.uid, 'historial', exerciseId);
            
            await setDoc(histRef, {
              fecha: new Date().toISOString(),
              nombre: finalTitle,
              nombre_ejercicio: finalTitle,
              estado: 'completado',
              estado_elegido: 'completado',
              duracion: elapsedSeconds,
              duracion_segundos: elapsedSeconds,
              tipo: discipline
            });
            console.log("Saved completed Classic exercise to Firestore:", finalTitle);
          } catch (writeError) {
            console.error("Error saving completed Classic exercise to Firestore:", writeError);
          }
        }
      };
      saveToDb();
    }

    // 2. Original state transition/saves
    if (activeExercise !== null) {
      const finalTitle = activeExercise === -2 ? (customExercise?.title || 'Ejercicio') : exercises[activeExercise].title;
      const finalDesc = activeExercise === -2 ? (customExercise?.description || '') : exercises[activeExercise].description;
      
      addProgressNote({
        discipline,
        challengeTitle: `Clásico: ${finalTitle}`,
        content: `Sesión Clásica Completada exitosamente en ${elapsedSeconds} segundos.`,
        moodLevel: 4,
        challenge: {
          type: 'text',
          title: finalTitle,
          description: finalDesc
        },
        duration: elapsedSeconds
      });
      if (activeExercise === -2) {
        setCustomExercise(null);
      }
      stopExercise();
      navigate('/progress');
    } else if (generatedExercise) {
      handleFluxoFinished();
    }
  };

  const labelDesbloqueo = language === 'es' ? 'Desbloqueo' : 'Unblocking';
  const labelSiguiente = language === 'es' ? 'Listo, siguiente \u2192' : 'Ready, next \u2192';
  const labelMasTiempo = language === 'es' ? 'Necesito más tiempo' : 'Need more time';
  const labelTimeAdded = '+ 2 min';
  const labelPasoDe = (curr: number, tot: number) => language === 'es' ? `Paso ${curr} de ${tot}` : `Step ${curr} of ${tot}`;
  const labelUltimo = language === 'es' ? 'Último paso' : 'Final step';
  const labelTerminar = language === 'es' ? 'Terminar ejercicio ✓' : 'Complete exercise ✓';
  const labelVolverStep = language === 'es' ? '← Volver al paso anterior' : '← Back to previous step';

  const isClassicalRunning = activeExercise !== null;
  const isFluxoRunning = generatedExercise !== null && !isReflecting;
  const hasRunningExercise = isClassicalRunning || isFluxoRunning;

  if (isGenerating) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0e0e0e] z-50">
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
            className="absolute -inset-4 rounded-full border-2 border-dashed border-orange-500"
          />
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 z-10 relative" />
        </div>
        <p className="font-semibold select-none text-[13px]" style={{ color: '#555' }}>
          {language === 'es' ? 'Generando tu ejercicio...' : 'Generating your exercise...'}
        </p>
      </div>
    );
  }

  if (hasRunningExercise) {
    const currentStepText = runningSteps[currentStepIndex] || '';
    const { mainText, remains } = parseStepText(currentStepText);
    const subtextHint = remains || getStepSubtext(currentStepIndex, discipline, language);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-xl mx-auto py-4 px-2"
      >
        <div className="bg-white dark:bg-[#0e0e11] text-neutral-900 dark:text-white p-6 md:p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[610px]">
          
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleExitExercise}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#f0854c] hover:text-orange-400 select-none cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 animate-pulse" />
              {labelDesbloqueo}
            </button>
            <button
              onClick={handleExitExercise}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#f0854c] bg-[#ea580c]/10 border border-[#ea580c]/20 rounded-full select-none">
                ⚡ {{
                  Writing: language === 'es' ? 'Reto de escritura' : 'Writing challenge',
                  Drawing: language === 'es' ? 'Reto de dibujo' : 'Drawing challenge',
                  Photography: language === 'es' ? 'Reto fotográfico' : 'Photo challenge'
                }[discipline] || discipline}
              </span>
              {currentStepIndex > 0 && currentStepIndex < 2 && (
                <button
                  onClick={toggleTimerActive}
                  className="px-3.5 py-1.5 text-[10px] font-mono font-black bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
                  style={{ color: runningTimerActive ? '#E8834A' : '#555' }}
                  title={language === 'es' ? 'Clic para pausar/reanudar' : 'Click to pause/resume'}
                >
                  ⏱️ {formatTime(runningTimeLeft)}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-display font-black text-neutral-950 dark:text-white leading-tight tracking-tight select-none">
                {runningTitle}
              </h2>
              <p className="text-xs md:text-sm text-neutral-550 dark:text-neutral-400 font-medium leading-relaxed max-w-lg">
                {runningDescription}
              </p>
            </div>
          </div>

          {/* Prominent digital timer component */}
          {currentStepIndex > 0 && currentStepIndex < 2 && (
            <div className="mt-5 p-5 rounded-3xl bg-neutral-50 dark:bg-[#121217] border border-neutral-200/60 dark:border-neutral-800 flex flex-col items-center justify-center gap-2 select-none relative overflow-hidden shadow-inner font-semibold">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f0854c] flex items-center gap-1.5 leading-none">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                {runningTimerActive 
                  ? (language === 'es' ? 'TIEMPO CORRIENDO' : 'COUNTDOWN ACTIVE') 
                  : (language === 'es' ? 'TIEMPO EN PAUSA' : 'COUNTDOWN PAUSED')}
              </span>
              <div 
                className={cn(
                  "text-5xl md:text-6xl font-mono font-black tracking-wider transition-all duration-300 my-1",
                  runningTimerActive ? "scale-100 animate-pulse" : "scale-95"
                )}
                style={{ color: runningTimerActive ? '#E8834A' : '#555' }}
              >
                {formatTime(runningTimeLeft)}
              </div>
              
              {/* Direct controller inside the timer box */}
              <div className="flex items-center gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={toggleTimerActive}
                  className="px-4.5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  {runningTimerActive ? (
                    <>
                      <Pause className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{language === 'es' ? 'Pausar' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                      <span>{language === 'es' ? 'Reanudar' : 'Resume'}</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={addTimeBonus}
                  className="px-4.5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 text-[#ea580c] hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#ea580c]" />
                  <span>{language === 'es' ? '+2 MIN' : '+2 MIN'}</span>
                </button>
              </div>
            </div>
          )}

          {currentStepIndex === 2 && (
            <div className="mt-5 p-5 rounded-3xl bg-neutral-50 dark:bg-[#121217] border border-neutral-200/60 dark:border-neutral-800 flex flex-col items-center justify-center gap-2 select-none relative overflow-hidden shadow-inner min-h-[100px]">
              <span className="text-[13px] font-semibold text-center" style={{ color: '#555' }}>
                {language === 'es' ? 'Tómate el tiempo que necesites.' : 'Take all the time you need.'}
              </span>
            </div>
          )}

          <div className="mt-5 space-y-2.5 font-semibold">
            <div className="flex items-center justify-between gap-6">
              <div className="h-1 bg-neutral-100 dark:bg-neutral-850 rounded-full flex-1 overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ width: `${((currentStepIndex + 1) / 3) * 100}%`, backgroundColor: 'var(--discipline-accent, #ea580c)' }}
                />
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400 dark:text-neutral-500 select-none">
                {currentStepIndex === 2 ? labelUltimo : labelPasoDe(currentStepIndex + 1, 3)}
              </span>
            </div>
          </div>

          <div className="mt-5 bg-neutral-50/60 dark:bg-[#15151b] border border-neutral-200 dark:border-neutral-800/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 relative">
            <div className="space-y-5">
              {currentStepIndex < 2 ? (
                <div 
                  className="w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center text-white shadow-md select-none"
                  style={{ backgroundColor: 'var(--discipline-accent, #ea580c)' }}
                >
                  {currentStepIndex + 1}
                </div>
              ) : (
                <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl select-none flex items-center justify-center shadow-md">
                  <Check className="w-5 h-5 font-bold" />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-lg md:text-xl font-black text-neutral-950 dark:text-white leading-snug tracking-tight">
                  {mainText}
                </p>
                <p className={cn(
                  "text-xs md:text-sm font-medium leading-normal",
                  currentStepIndex === 2 
                    ? "text-orange-600 dark:text-orange-400 font-bold" 
                    : "text-neutral-500 dark:text-neutral-400"
                )}>
                  {subtextHint}
                </p>
                {currentStepIndex === 0 && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-550 font-semibold italic mt-2">
                    {language === 'es' ? 'El tiempo empieza cuando estés listo.' : 'Time starts when you are ready.'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-6 pt-2">
              <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStepIndex === 0 ? "w-5 bg-orange-500" : "w-1.5 bg-neutral-200 dark:bg-neutral-850")} style={currentStepIndex === 0 ? { backgroundColor: 'var(--discipline-accent, #ea580c)' } : {}} />
              <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStepIndex === 1 ? "w-5 bg-orange-500" : "w-1.5 bg-neutral-200 dark:bg-neutral-850")} style={currentStepIndex === 1 ? { backgroundColor: 'var(--discipline-accent, #ea580c)' } : {}} />
              <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStepIndex === 2 ? "w-5 bg-orange-500" : "w-1.5 bg-neutral-200 dark:bg-neutral-850")} style={currentStepIndex === 2 ? { backgroundColor: 'var(--discipline-accent, #ea580c)' } : {}} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {currentStepIndex < 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (currentStepIndex === 0) {
                      if (activeExercise !== null) {
                        setIsRunning(true);
                      } else {
                        setFluxoTimerRunning(true);
                      }
                    }
                    setCurrentStepIndex(prev => prev + 1);
                  }}
                  className={cn(
                    "w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] select-none cursor-pointer",
                    currentStepIndex === 0 
                      ? "text-white shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20"
                      : "border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 text-neutral-800 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-850/30"
                  )}
                  style={currentStepIndex === 0 ? { backgroundColor: 'var(--discipline-accent, #ea580c)' } : {}}
                >
                  {currentStepIndex === 0 
                    ? (language === 'es' ? 'Listo, empezar \u2192' : 'Ready, start \u2192') 
                    : labelSiguiente}
                </button>
                {currentStepIndex === 0 ? null : (
                  <>
                    <button
                      type="button"
                      onClick={addTimeBonus}
                      className="w-full text-center py-2 text-[#ea580c] hover:text-orange-600 font-bold text-xs uppercase tracking-widest transition-colors select-none cursor-pointer"
                    >
                      {labelMasTiempo}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const prevIdx = currentStepIndex - 1;
                        if (prevIdx === 0) {
                          if (activeExercise !== null) {
                            setIsRunning(false);
                          } else {
                            setFluxoTimerRunning(false);
                          }
                        }
                        setCurrentStepIndex(prevIdx);
                      }}
                      className="w-full text-center py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-bold text-[11px] uppercase tracking-wider transition-colors select-none cursor-pointer"
                    >
                      {labelVolverStep}
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleFinishStepByStep}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] select-none cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                >
                  {labelTerminar}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prevIdx = currentStepIndex - 1;
                    if (prevIdx === 0) {
                      if (activeExercise !== null) {
                        setIsRunning(false);
                      } else {
                        setFluxoTimerRunning(false);
                      }
                    }
                    setCurrentStepIndex(prevIdx);
                  }}
                  className="w-full text-center py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-bold text-[11px] uppercase tracking-wider transition-colors select-none cursor-pointer"
                >
                  {labelVolverStep}
                </button>
              </>
            )}

            {timeAddedAlert && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs font-black text-emerald-500 dark:text-emerald-400 select-none animate-pulse"
              >
                {labelTimeAdded}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <header className="mb-6 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-display font-black tracking-tight text-neutral-900 dark:text-white flex justify-center md:justify-start items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" style={{ color: 'var(--discipline-accent)' }} />
            {t.exercisesTitle}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl mt-0.5 font-medium">
            {t.exercisesSubtitle.replace('{discipline}', discipline.toLowerCase())}
          </p>
        </div>


      </header>

      <AnimatePresence mode="wait">
        {false ? (
          <motion.div
            key="classical-view"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
          >
            {showClassicCompletedMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {language === 'es' ? '¡Reto guiado completado con éxito! Se ha añadido una nota a tu bitácora.' : 'Guided challenge completed successfully! A note has been logged in your journey history.'}
                </span>
              </motion.div>
            )}

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850/30 border border-neutral-100 dark:border-neutral-800/40 mb-1">
                <h3 className="font-display font-black text-sm text-neutral-850 dark:text-white mb-0.5">
                  {ft.classicHeader}
                </h3>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  {ft.classicSub} <span className="font-bold underline" style={{ color: 'var(--discipline-accent)' }}>{discipline}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="minimal-card p-3.5 flex flex-col justify-between group hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800/70 shadow-sm transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-2.5">
                        <h3 className="text-[14px] font-display font-black text-neutral-900 dark:text-neutral-100 leading-tight">
                          {ex.title}
                        </h3>
                        <span className="flex items-center gap-1 text-[9px] uppercase font-black tracking-widest text-[#f0854c] bg-[#ea580c]/10 border border-[#ea580c]/20 rounded-full py-0.5 px-2 ml-3 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {ex.duration} {t.min}
                        </span>
                      </div>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-4 text-xs leading-relaxed">
                        {ex.description}
                      </p>
                    </div>
                    <button
                      onClick={() => startExercise(idx)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-xs uppercase tracking-widest border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-neutral-950 transition-all active:scale-98 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {t.startExercise}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="fluxo-view"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="space-y-4"
          >
            {/* Fluxo Companion Banner */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-center gap-4 shadow-sm">
              <Mascot 
                shape="pentagon"
                color="var(--discipline-accent)" 
                eyes={mascotStyle} 
                className="w-14 h-14 shrink-0 transition-transform hover:scale-105 duration-300"
              />
              <div className="text-center md:text-left space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary" style={{ color: 'var(--discipline-accent)' }}>
                  Fluxo AI Co-Pilot
                </span>
                <h2 className="text-base font-display font-black text-neutral-950 dark:text-white tracking-tight">
                  {ft.fluxoHelp}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl">
                  {ft.fluxoDesc}
                </p>
              </div>
            </div>

            {/* Main Interactive Workspace Area */}
            {!generatedExercise ? (
              /* State 1: Configuration Form */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800/40 p-4 shadow-md space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Artist Type Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block">
                      {ft.artistType}
                    </label>
                    <input
                      type="text"
                      value={artistType}
                      onChange={(e) => setArtistType(e.target.value)}
                      placeholder={ft.artistPlaceholder}
                      className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-neutral-400/20 outline-none transition-all dark:text-white font-semibold"
                    />
                    {/* Suggestions Chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['ilustrador', 'músico', 'escritor', 'fotógrafo', 'pintor'].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setArtistType(suggestion)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                            artistType.toLowerCase() === suggestion
                              ? "bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                              : "bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 text-neutral-500 border-neutral-200/50 dark:border-neutral-700"
                          )}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Time Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block">
                      {ft.timeAvailable}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['5', '15', '30'] as const).map((tVal) => (
                        <button
                          key={tVal}
                          type="button"
                          onClick={() => setTimeAvailable(tVal)}
                          className={cn(
                            "py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-1",
                            timeAvailable === tVal
                              ? "bg-neutral-950 border-neutral-950 text-white dark:bg-white dark:border-white dark:text-neutral-950 shadow-md"
                              : "bg-white dark:bg-neutral-900 border-neutral-200/70 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700"
                          )}
                        >
                          <span className="text-sm font-black">{tVal}</span>
                          <span className="text-[9px] font-bold opacity-60 uppercase">{t.min}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Block Type Selector */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block">
                    {ft.blockType}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'Parálisis' as const, title: ft.blockParalisis, desc: ft.blockParalisisDesc, icon: Brain },
                      { id: 'Loop' as const, title: ft.blockLoop, desc: ft.blockLoopDesc, icon: Flame },
                      { id: 'Vacío' as const, title: ft.blockVacio, desc: ft.blockVacioDesc, icon: Ban }
                    ].map((item) => {
                      const isSelected = blockType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBlockType(item.id)}
                          className={cn(
                            "p-5 rounded-[2rem] border text-left flex flex-col gap-3 transition-all",
                            isSelected
                              ? "bg-white dark:bg-neutral-900 border-2 text-neutral-950 dark:text-white shadow-xl"
                              : "bg-white dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700"
                          )}
                          style={isSelected ? { borderColor: 'var(--discipline-accent)', borderWidth: '2px' } : {}}
                        >
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ 
                              backgroundColor: isSelected ? 'var(--discipline-accent)' : undefined, 
                              color: isSelected ? '#fff' : 'currentColor' 
                            }}
                          >
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-neutral-900 dark:text-white mb-1">{item.title}</p>
                            <p className="text-[11px] leading-relaxed opacity-80">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional context optional input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block">
                    {ft.additionalContext}
                  </label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder={ft.contextPlaceholder}
                    rows={3}
                    className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/50 rounded-2xl text-xs focus:ring-2 focus:ring-neutral-400/25 outline-none transition-all dark:text-white leading-relaxed font-medium"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={generateFluxoAntidote}
                    className="w-full py-4 rounded-full font-black text-sm uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-98 cursor-pointer"
                    style={{ backgroundColor: 'var(--discipline-accent)' }}
                  >
                    <Sparkles className="w-4 h-4 fill-white animate-pulse" />
                    {ft.generateBtn}
                  </button>
                </div>
              </motion.div>
            ) : generatedExercise && !isReflecting ? (
              /* State 3: Generated custom exercise execution list */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-xl overflow-hidden"
              >
                {/* Header card info */}
                <div className="p-6 md:p-10 border-b border-neutral-50 dark:border-neutral-800 md:pb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-black bg-neutral-100 dark:bg-neutral-850 dark:text-white border border-neutral-200/50 dark:border-neutral-700">
                        ⚡ {ft.blockType}: {blockType}
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                        style={{ backgroundColor: 'var(--discipline-accent)' }}
                      >
                        ⏱️ {timeAvailable} {ft.minutesSuffix}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-black text-neutral-950 dark:text-white tracking-tight leading-tight">
                      {generatedExercise.title}
                    </h2>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">{ft.descriptionLabel}</p>
                      <p className="text-xs md:text-sm text-neutral-550 dark:text-neutral-400 font-medium italic select-none">
                        "{generatedExercise.description}"
                      </p>
                    </div>
                  </div>

                  {/* Materials Card */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-150/60 dark:border-neutral-800/80 max-w-sm shrink-0 flex flex-col gap-1 md:w-64">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block">
                      🎒 {ft.needs}
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed">
                      {generatedExercise.materials}
                    </p>
                  </div>
                </div>

                {/* Steps Section */}
                <div className="p-6 md:p-10 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    👣 {ft.steps}
                  </h3>
                  
                  <div className="relative pl-6 border-l border-neutral-100 dark:border-neutral-800 space-y-8">
                    {generatedExercise.steps.map((stepStr, sIdx) => (
                      <div key={sIdx} className="relative">
                        {/* Number bullet */}
                        <div 
                          className="absolute -left-11 top-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white border-2 border-white dark:border-neutral-900 shadow-sm"
                          style={{ backgroundColor: 'var(--discipline-accent)' }}
                        >
                          {sIdx + 1}
                        </div>
                        <p className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 font-medium leading-relaxed">
                          {stepStr}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Concrete Success Checkbox */}
                  <div className="mt-10 p-5 rounded-[2rem] bg-neutral-50/50 dark:bg-neutral-850/30 border border-dashed border-neutral-200 dark:border-neutral-800/50 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 flex items-center justify-center text-xl shadow-inner shrink-0 leading-none">
                      🎯
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                        {ft.knowWorked}
                      </p>
                      <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 font-semibold leading-relaxed">
                        {generatedExercise.howToKnowItWorked}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-workspace timer area */}
                <div className="bg-neutral-50/75 dark:bg-neutral-850/60 border-t border-neutral-100 dark:border-neutral-850 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Circular Timer view */}
                  <div className="flex items-center gap-6">
                    <div className="text-3xl md:text-5xl font-mono font-black tracking-tight text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800 px-6 py-3 rounded-2xl min-w-[130px] text-center shadow-inner">
                      {formatTime(fluxoTimeLeft)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFluxoTimerRunning(!fluxoTimerRunning)}
                        className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 shadow-sm transition-transform active:scale-95 hover:text-black hover:bg-neutral-50"
                      >
                        {fluxoTimerRunning ? <Square className="w-4 h-4 fill-current text-red-500 border-none" /> : <Play className="w-4 h-4 fill-current text-green-500 border-none" />}
                      </button>
                      <button
                        onClick={() => { setFluxoTimerRunning(false); setFluxoTimeLeft(parseInt(timeAvailable) * 60); }}
                        className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-white shadow-sm transition-transform active:scale-95"
                        title={ft.resetTimer}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Completion buttons */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={() => { setGeneratedExercise(null); setStartedGenerated(false); }}
                      className="flex-1 md:flex-none px-6 py-4 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold text-xs uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-all active:scale-95"
                    >
                      {language === 'es' ? 'Volver a configurar' : 'Re-configure'}
                    </button>
                    <button
                      onClick={handleFluxoFinished}
                      className="flex-1 md:flex-none px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-neutral-300 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
                      style={{ backgroundColor: 'var(--text-color, #10B981)' }}
                    >
                      {ft.finishExercise}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* State 4: Interactive Reflection & Evaluation from Fluxo Mascot */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 p-6 md:p-10 shadow-2xl flex flex-col md:flex-row gap-8 items-start relative min-h-[400px]"
              >
                {/* Visual companion anchor */}
                <div className="flex flex-col items-center gap-4 text-center shrink-0 w-full md:w-44">
                  <Mascot 
                    shape="pentagon"
                    color="var(--discipline-accent)" 
                    eyes={mascotStyle} 
                    className="w-28 h-28" 
                  />
                  <div>
                    <h4 className="font-black text-sm text-neutral-900 dark:text-white leading-none">Fluxo</h4>
                    <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-medium">{language === 'es' ? 'Amigo creativo' : 'Creative pal'}</span>
                  </div>
                </div>

                {/* Conversational reflection engine */}
                <div className="flex-1 space-y-6 w-full">
                  {!fluxoEvaluation ? (
                    /* Step A: Ask and get user reply */
                    <div className="space-y-4">
                      <div className="bg-neutral-50 dark:bg-neutral-850 p-6 rounded-3xl border border-neutral-150 dark:border-neutral-800 relative">
                        <div className="absolute left-6 -top-3 w-4 h-4 bg-neutral-50 dark:bg-neutral-850 rotate-45 border-l border-t border-neutral-150 dark:border-neutral-800 md:-left-4 md:top-10 md:rotate-[-45deg] md:border-t-0 md:border-r-0 md:border-b-0 hidden md:block" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                          💬 {ft.fluxoQuestionHeader}
                        </p>
                        
                        {loadingQuestion ? (
                          <div className="flex items-center gap-2 py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">{ft.thinking}</span>
                          </div>
                        ) : (
                          <p className="text-base font-bold text-neutral-900 dark:text-white leading-relaxed italic">
                            "{fluxoQuestion}"
                          </p>
                        )}
                      </div>

                      {/* Answer space */}
                      {!loadingQuestion && (
                        <div className="space-y-3">
                          <textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder={ft.userReplyPlaceholder}
                            rows={3}
                            disabled={isEvaluating}
                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-neutral-400/25 outline-none transition-all dark:text-white leading-relaxed font-semibold"
                          />
                          
                          <div className="flex justify-end">
                            <button
                              onClick={submitFluxoAnswer}
                              disabled={!userAnswer.trim() || isEvaluating}
                              className="px-6 py-3.5 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-40 transition-transform active:scale-95"
                            >
                              {isEvaluating ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {language === 'es' ? 'Pensando...' : 'Thinking...'}
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  {language === 'es' ? 'Enviar a Fluxo' : 'Submit response'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Step B: Display customized Evaluation results */
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-neutral-50 dark:bg-neutral-850 p-6 rounded-3xl border border-neutral-150 dark:border-neutral-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                          🔮 {ft.evaluationHeader}
                        </p>
                        <p className="text-sm md:text-base font-semibold text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line">
                          {fluxoEvaluation}
                        </p>
                      </div>

                      {/* Journey Note Persistence Controls */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[2rem] bg-neutral-50/50 dark:bg-neutral-850/45 border border-neutral-150 dark:border-neutral-850">
                        <div className="text-center sm:text-left space-y-1">
                          <p className="text-xs font-black text-neutral-850 dark:text-white">
                            {language === 'es' ? '¿Quieres rememorar esta lección?' : 'Want to recall this lesson?'}
                          </p>
                          <p className="text-[11px] text-neutral-400 leading-none">
                            {language === 'es' ? 'Agrégalo automáticamente a tu bitácora de viaje' : 'Log it automatically in your travel history'}
                          </p>
                        </div>

                        <button
                          onClick={saveSessionToLog}
                          disabled={saveNoteStatus}
                          className={cn(
                            "px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                            saveNoteStatus
                              ? "bg-emerald-500 border-transparent text-white"
                              : "bg-white border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          )}
                        >
                          {saveNoteStatus ? (
                            <>
                              <Check className="w-3.5 h-3.5 font-bold" />
                              {ft.saved}
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              {ft.saveToProgress}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Success confirmation toast toast */}
                      {saveNoteStatus && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-250 font-bold text-xs flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{ft.saveNoteSuccess}</span>
                        </motion.div>
                      )}

                      {/* Nav paths / decisions buttons block (a, b, c) */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-850">
                        <button
                          onClick={generateFluxoAntidote}
                          className="px-5 py-4 rounded-full border border-neutral-200 dark:border-neutral-850 text-neutral-700 dark:text-neutral-200 font-black text-xs uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all active:scale-95"
                        >
                          🔄 {ft.actionA}
                        </button>
                        <button
                          onClick={() => {
                            setGeneratedExercise(null);
                            setStartedGenerated(false);
                            setIsReflecting(false);
                            setFluxoEvaluation('');
                            setSaveNoteStatus(false);
                            setUserAnswer('');
                            navigate('/');
                          }}
                          className="px-5 py-4 rounded-full border border-neutral-200 dark:border-neutral-850 text-neutral-700 dark:text-neutral-200 font-black text-xs uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all active:scale-95"
                        >
                          🎨 {ft.actionB}
                        </button>
                        <button
                          onClick={() => {
                            setGeneratedExercise(null);
                            setStartedGenerated(false);
                            setIsReflecting(false);
                            setFluxoEvaluation('');
                            setSaveNoteStatus(false);
                            setUserAnswer('');
                            navigate('/');
                          }}
                          className="px-6 py-4 rounded-full text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                          style={{ backgroundColor: 'var(--discipline-accent)' }}
                        >
                          🏡 {ft.actionC}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
