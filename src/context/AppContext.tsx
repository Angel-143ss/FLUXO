import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

export type Discipline = 'Drawing' | 'Writing' | 'Photography';
export type CreativeMode = 'Unlock' | 'Practice' | 'Challenge';
export type Theme = 'light' | 'dark';
export type Language = 'es' | 'en';

export interface ChallengeData {
  type: 'text' | 'visual';
  title: string;
  description: string;
  time?: string;
  steps?: string[];
  imageUrl?: string;
}

export interface Reflection {
  id: string;
  date: string; // ISO format
  discipline: Discipline;
  challengeTitle: string;
  content: string; // La reflexión escrita
  moodLevel: number; // 1-5 para medir el bloqueo
  challenge?: ChallengeData;
  duration?: number;
  status?: string;
  type?: string;
}

export interface UserStats {
  totalChallenges: number;
  currentStreak: number;
  lastActiveDate: string | null;
}

export interface Post {
  id: string;
  user: {
    name: string;
    avatar?: string;
    discipline: Discipline;
  };
  discipline: Discipline;
  content: string;
  imageUrl?: string;
  timestamp: string;
  reactions: {
    emoji: string;
    count: number;
    userReacted: boolean;
  }[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  discipline: Discipline;
  setDiscipline: (d: Discipline) => void;
  creativeMode: CreativeMode;
  setCreativeMode: (m: CreativeMode) => void;
  progressNotes: Reflection[];
  addProgressNote: (note: Omit<Reflection, 'id' | 'date'> & { duration?: number; status?: string; type?: string }) => Promise<void>;
  userStats: UserStats;
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (l: Language) => void;
  hasSeenOnboarding: boolean;
  completeOnboarding: (catalizador?: string, saboteador?: string) => Promise<void>;
  userName: string;
  setUserName: (name: string) => void;
  userPhoto: string;
  setUserPhoto: (photo: string) => void;
  userBio: string;
  setUserBio: (bio: string) => void;
  artistPreferences: { spark?: string; saboteur?: string };
  setArtistPreferences: (prefs: { spark?: string; saboteur?: string }) => void;
  userEmail: string;
  isFetchingDbData: boolean;
  writeError: string | null;
  setWriteError: (err: string | null) => void;
  loadProfileFromDb: () => Promise<void>;
  loadProgressFromDb: () => Promise<void>;
  showGuestWarning: boolean;
  setShowGuestWarning: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isYesterday = (d1: Date, d2: Date) => {
  const check = new Date(d2);
  check.setDate(check.getDate() - 1);
  return isSameDay(d1, check);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingDbData, setIsFetchingDbData] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  const [discipline, setDisciplineState] = useState<Discipline>(() => {
    const saved = localStorage.getItem('creative_discipline');
    return (saved as Discipline) || 'Drawing';
  });

  const [creativeMode, setCreativeModeState] = useState<CreativeMode>(() => {
    const saved = localStorage.getItem('creative_mode');
    return (saved as CreativeMode) || 'Unlock';
  });

  const [progressNotes, setProgressNotes] = useState<Reflection[]>(() => {
    const saved = localStorage.getItem('creative_progress');
    return saved ? JSON.parse(saved) : [];
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('creative_user_stats');
    return saved ? JSON.parse(saved) : {
      totalChallenges: 0,
      currentStreak: 0,
      lastActiveDate: null
    };
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('creative_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('creative_language');
    return (saved as Language) || 'es';
  });

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    const saved = localStorage.getItem('creative_onboarding');
    return saved === 'true';
  });

  const [userName, setUserNameState] = useState(() => {
    return localStorage.getItem('creative_user_name') || 'Creative';
  });

  const [userPhoto, setUserPhotoState] = useState(() => {
    return localStorage.getItem('creative_user_photo') || 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=200&auto=format&fit=crop';
  });

  const [userBio, setUserBioState] = useState(() => {
    return localStorage.getItem('creative_user_bio') || '';
  });

  const [artistPreferences, setArtistPreferencesState] = useState<{ spark?: string; saboteur?: string }>(() => {
    const saved = localStorage.getItem('creative_artist_preferences');
    return saved ? JSON.parse(saved) : {};
  });

  const userEmail = user?.email || '';

  // Non-blocking Load Profile Helper
  const loadProfileFromDb = async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      setIsFetchingDbData(true);
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const perfilRef = doc(db, 'usuarios', auth.currentUser.uid, 'perfil', 'perfil');
        const perfilDoc = await getDoc(perfilRef);
        if (perfilDoc.exists()) {
          const pData = perfilDoc.data();
          setUserNameState(pData.nombre || auth.currentUser.displayName || 'Creative');
          setDisciplineState(pData.disciplina || 'Drawing');
          setArtistPreferencesState({
            spark: pData.catalizador || '',
            saboteur: pData.saboteador || ''
          });
          setHasSeenOnboarding(pData.onboardingCompleto || false);
          setUserPhotoState(pData.foto || auth.currentUser.photoURL || 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=200&auto=format&fit=crop');
          if (pData.bio) setUserBioState(pData.bio);
        }
      } catch (err) {
        // Fallback: Si Firestore falla al leer -> mostrar los últimos datos cargados en memoria/localStorage
        handleFirestoreError(err, OperationType.GET, `usuarios/${auth.currentUser.uid}/perfil/perfil`);
      } finally {
        setIsFetchingDbData(false);
      }
    }
  };

  // Non-blocking Load Progress Helper
  const loadProgressFromDb = async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      setIsFetchingDbData(true);
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const progRef = doc(db, 'usuarios', auth.currentUser.uid, 'progreso', 'progreso');
        const progDoc = await getDoc(progRef);
        if (progDoc.exists()) {
          const pgData = progDoc.data();
          const localStatsUpdate: UserStats = {
            totalChallenges: pgData.ejerciciosCompletados || 0,
            currentStreak: pgData.rachaActual || 0,
            lastActiveDate: pgData.ultimoEjercicio ? 
              (typeof pgData.ultimoEjercicio.toDate === 'function' ? pgData.ultimoEjercicio.toDate().toISOString() : pgData.ultimoEjercicio)
              : null
          };
          setUserStats(localStatsUpdate);
        }
      } catch (err) {
        // Fallback: Si Firestore falla al leer -> mostrar los últimos datos cargados en memoria/localStorage
        handleFirestoreError(err, OperationType.GET, `usuarios/${auth.currentUser.uid}/progreso/progreso`);
      } finally {
        setIsFetchingDbData(false);
      }
    }
  };

  // Auth changed subscription handler
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (uState) => {
      setUser(uState);
      if (uState) {
        if (uState.isAnonymous) {
          // Guest User mode configuration: transiency
          setUserNameState('Invitado');
          setUserPhotoState('https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=200&auto=format&fit=crop');
          setUserBioState('');
          setDisciplineState('Drawing');
          setArtistPreferencesState({});
          setHasSeenOnboarding(false);
          setUserStats({
            totalChallenges: 0,
            currentStreak: 0,
            lastActiveDate: null
          });
        } else {
          // Standard Google signed-in user mode execution
          setIsFetchingDbData(true);
          try {
            const { doc, getDoc, setDoc } = await import('firebase/firestore');
            const perfilRef = doc(db, 'usuarios', uState.uid, 'perfil', 'perfil');
            const perfilDoc = await getDoc(perfilRef);
            
            if (perfilDoc.exists()) {
              const pData = perfilDoc.data();
              setUserNameState(pData.nombre || uState.displayName || 'Creative');
              setDisciplineState(pData.disciplina || 'Drawing');
              setArtistPreferencesState({
                spark: pData.catalizador || '',
                saboteur: pData.saboteador || ''
              });
              setHasSeenOnboarding(pData.onboardingCompleto || false);
              setUserPhotoState(pData.foto || uState.photoURL || 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=200&auto=format&fit=crop');
              if (pData.bio) setUserBioState(pData.bio);
            } else {
              // Si NO existe perfil -> crear documento vacío (con onboardingCompleto: false) y mostrar onboarding
              const initialPerfil = {
                nombre: uState.displayName || 'Creative',
                disciplina: 'Drawing',
                catalizador: '',
                saboteador: '',
                onboardingCompleto: false,
                foto: uState.photoURL || ''
              };
              await setDoc(perfilRef, initialPerfil);
              setUserNameState(uState.displayName || 'Creative');
              setDisciplineState('Drawing');
              setArtistPreferencesState({});
              setHasSeenOnboarding(false);
              setUserPhotoState(uState.photoURL || 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=200&auto=format&fit=crop');
            }

            // Progression check
            const progRef = doc(db, 'usuarios', uState.uid, 'progreso', 'progreso');
            const progDoc = await getDoc(progRef);
            if (progDoc.exists()) {
              const pgData = progDoc.data();
              const localStatsUpdate: UserStats = {
                totalChallenges: pgData.ejerciciosCompletados || 0,
                currentStreak: pgData.rachaActual || 0,
                lastActiveDate: pgData.ultimoEjercicio ? 
                  (typeof pgData.ultimoEjercicio.toDate === 'function' ? pgData.ultimoEjercicio.toDate().toISOString() : pgData.ultimoEjercicio)
                  : null
              };
              setUserStats(localStatsUpdate);
            } else {
              const initialProg = {
                ejerciciosCompletados: 0,
                rachaActual: 0,
                ultimoEjercicio: null,
                totalSesiones: 0
              };
              await setDoc(progRef, initialProg);
              setUserStats({
                totalChallenges: 0,
                currentStreak: 0,
                lastActiveDate: null
              });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `usuarios/${uState.uid}/perfil/perfil`);
          } finally {
            setIsFetchingDbData(false);
          }
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateProfileField = async (fields: Record<string, any>) => {
    if (user && !user.isAnonymous) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const perfilRef = doc(db, 'usuarios', user.uid, 'perfil', 'perfil');
        await updateDoc(perfilRef, fields);
      } catch (err) {
        // Retry with set merge
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const perfilRef = doc(db, 'usuarios', user.uid, 'perfil', 'perfil');
          await setDoc(perfilRef, fields, { merge: true });
        } catch (innerErr) {
          handleFirestoreError(innerErr, OperationType.WRITE, `usuarios/${user.uid}/perfil/perfil`);
        }
      }
    }
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    if (!user?.isAnonymous) {
      localStorage.setItem('creative_user_name', name);
      updateProfileField({ nombre: name });
    }
  };

  const setUserPhoto = (photo: string) => {
    setUserPhotoState(photo);
    if (!user?.isAnonymous) {
      localStorage.setItem('creative_user_photo', photo);
      updateProfileField({ foto: photo });
    }
  };

  const setUserBio = (bio: string) => {
    setUserBioState(bio);
    if (!user?.isAnonymous) {
      localStorage.setItem('creative_user_bio', bio);
      updateProfileField({ bio: bio });
    }
  };

  const setArtistPreferences = (prefs: { spark?: string; saboteur?: string }) => {
    setArtistPreferencesState(prefs);
    if (!user?.isAnonymous) {
      localStorage.setItem('creative_artist_preferences', JSON.stringify(prefs));
      const updateObj: Record<string, string> = {};
      if (prefs.spark !== undefined) updateObj.catalizador = prefs.spark;
      if (prefs.saboteur !== undefined) updateObj.saboteador = prefs.saboteur;
      if (Object.keys(updateObj).length > 0) {
        updateProfileField(updateObj);
      }
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setDiscipline = (d: Discipline) => {
    setDisciplineState(d);
    if (!user?.isAnonymous) {
      localStorage.setItem('creative_discipline', d);
      updateProfileField({ disciplina: d });
    }
  };

  const setCreativeMode = (m: CreativeMode) => {
    setCreativeModeState(m);
    localStorage.setItem('creative_mode', m);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem('creative_theme', newTheme);
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem('creative_language', l);
  };

  const completeOnboarding = async (catalizadorVal?: string, saboteadorVal?: string) => {
    setHasSeenOnboarding(true);
    localStorage.setItem('creative_onboarding', 'true');
    const finalCatalizador = catalizadorVal || artistPreferences.spark || 'silence';
    const finalSaboteador = saboteadorVal || artistPreferences.saboteur || 'perfectionism';

    if (user && !user.isAnonymous) {
      const writeAction = async () => {
        const { doc, setDoc } = await import('firebase/firestore');
        const perfilRef = doc(db, 'usuarios', user.uid, 'perfil', 'perfil');
        await setDoc(perfilRef, {
          nombre: user.displayName || userName || 'Creative',
          disciplina: discipline || 'Drawing',
          catalizador: finalCatalizador,
          saboteador: finalSaboteador,
          onboardingCompleto: true,
          foto: user.photoURL || userPhoto || ''
        }, { merge: true });

        const progRef = doc(db, 'usuarios', user.uid, 'progreso', 'progreso');
        await setDoc(progRef, {
          ejerciciosCompletados: 0,
          rachaActual: 0,
          ultimoEjercicio: null,
          totalSesiones: 0
        });
      };

      try {
        await writeAction();
      } catch (err) {
        console.warn('Onboarding save failed, retrying once more...', err);
        try {
          await writeAction();
        } catch (retryErr) {
          setWriteError("No se pudo guardar. Revisa tu conexión.");
          handleFirestoreError(retryErr, OperationType.WRITE, `usuarios/${user.uid}/perfil/perfil`);
        }
      }
    }
  };

  const addProgressNote = async (note: Omit<Reflection, 'id' | 'date'> & { duration?: number; status?: string; type?: string }) => {
    const id = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
    const today = new Date().toISOString();
    const newNote: Reflection = {
      ...note,
      id,
      date: today,
    };

    // Keep temporary visual updates in memory instant state
    const updated = [newNote, ...progressNotes];
    setProgressNotes(updated);

    const durVal = note.duration || 5;
    const typeVal = note.type || note.discipline || discipline || 'Drawing';
    const statusVal = note.status || 'Completado';

    if (user && !user.isAnonymous) {
      // Direct local storage saving during normal logged in session
      localStorage.setItem('creative_progress', JSON.stringify(updated));

      try {
        const { doc, getDoc, setDoc } = await import('firebase/firestore');
        const progRef = doc(db, 'usuarios', user.uid, 'progreso', 'progreso');
        
        let currentCompleted = 0;
        let currentRacha = 0;
        let currentSessions = 0;
        let lastExerciseTime: any = null;

        const progSnap = await getDoc(progRef);
        if (progSnap.exists()) {
          const progData = progSnap.data();
          currentCompleted = progData.ejerciciosCompletados || 0;
          currentRacha = progData.rachaActual || 0;
          currentSessions = progData.totalSesiones || 0;
          lastExerciseTime = progData.ultimoEjercicio || null;
        }

        // Racha calculations
        let newRacha = 1;
        const now = new Date();
        if (lastExerciseTime) {
          const lastDate = typeof lastExerciseTime.toDate === 'function'
            ? lastExerciseTime.toDate()
            : new Date(lastExerciseTime);
          
          if (isSameDay(lastDate, now)) {
            newRacha = currentRacha; // today -> same
          } else if (isYesterday(lastDate, now)) {
            newRacha = currentRacha + 1; // yesterday -> increment
          } else {
            newRacha = 1; // > 1 day -> reset
          }
        } else {
          newRacha = 1; // first exercise
        }

        const newStatsObj = {
          ejerciciosCompletados: currentCompleted + 1,
          rachaActual: newRacha,
          ultimoEjercicio: now,
          totalSesiones: currentSessions + 1
        };

        const writeAction = async () => {
          await setDoc(progRef, newStatsObj, { merge: true });
          const histRef = doc(db, 'usuarios', user.uid, 'historial', id);
          await setDoc(histRef, {
            fecha: now,
            tipo: typeVal,
            duracion: durVal,
            estado: statusVal,
            nombre: note.challengeTitle || 'Ejercicio',
            moodLevel: note.moodLevel || 4
          });
        };

        try {
          await writeAction();
        } catch (writeErr) {
          console.warn('Progress write failed, retrying once...', writeErr);
          await writeAction();
        }

        // Sync local representation
        const localStatsUpdate: UserStats = {
          totalChallenges: newStatsObj.ejerciciosCompletados,
          currentStreak: newStatsObj.rachaActual,
          lastActiveDate: today
        };
        setUserStats(localStatsUpdate);
        localStorage.setItem('creative_user_stats', JSON.stringify(localStatsUpdate));

      } catch (err) {
        setWriteError("No se pudo guardar. Revisa tu conexión.");
        handleFirestoreError(err, OperationType.WRITE, `usuarios/${user.uid}/progreso/progreso`);
      }
    } else {
      // Guest logic: Only update local state, do not set localStorage, flag guest warning alert
      const localStatsUpdate: UserStats = {
        ...userStats,
        totalChallenges: userStats.totalChallenges + 1,
        lastActiveDate: today
      };
      setUserStats(localStatsUpdate);
      setShowGuestWarning(true);
    }
  };

  useEffect(() => {
    const accentColors: Record<Discipline, string> = {
      Drawing: '#FFAE7A', // Orange
      Writing: '#A78BFA', // Purple
      Photography: '#22D3EE' // Cyan
    };
    document.documentElement.style.setProperty('--discipline-accent', accentColors[discipline]);
  }, [discipline]);

  return (
    <AppContext.Provider value={{ 
      user,
      loading,
      discipline, 
      setDiscipline, 
      creativeMode, 
      setCreativeMode, 
      progressNotes, 
      addProgressNote,
      userStats,
      theme, 
      toggleTheme, 
      language, 
      setLanguage,
      hasSeenOnboarding,
      completeOnboarding,
      userName,
      setUserName,
      userPhoto,
      setUserPhoto,
      userBio,
      setUserBio,
      artistPreferences,
      setArtistPreferences,
      userEmail,
      isFetchingDbData,
      writeError,
      setWriteError,
      loadProfileFromDb,
      loadProgressFromDb,
      showGuestWarning,
      setShowGuestWarning
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
