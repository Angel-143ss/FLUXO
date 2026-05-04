import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

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

interface AppContextType {
  user: User | null;
  loading: boolean;
  discipline: Discipline;
  setDiscipline: (d: Discipline) => void;
  creativeMode: CreativeMode;
  setCreativeMode: (m: CreativeMode) => void;
  progressNotes: Reflection[];
  addProgressNote: (note: Omit<Reflection, 'id' | 'date'>) => void;
  userStats: UserStats;
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (l: Language) => void;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  userName: string;
  setUserName: (name: string) => void;
  userPhoto: string;
  setUserPhoto: (photo: string) => void;
  userBio: string;
  setUserBio: (bio: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setHasSeenOnboarding(false); // Reset onboarding on every login detection
        if (user.displayName) setUserNameState(user.displayName);
        if (user.photoURL) setUserPhotoState(user.photoURL);
      }
    });
    return unsubscribe;
  }, []);
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

  const setUserName = (name: string) => {
    setUserNameState(name);
    localStorage.setItem('creative_user_name', name);
  };

  const setUserPhoto = (photo: string) => {
    setUserPhotoState(photo);
    localStorage.setItem('creative_user_photo', photo);
  };

  const setUserBio = (bio: string) => {
    setUserBioState(bio);
    localStorage.setItem('creative_user_bio', bio);
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
    localStorage.setItem('creative_discipline', d);
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

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem('creative_onboarding', 'true');
  };

  const addProgressNote = (note: Omit<Reflection, 'id' | 'date'>) => {
    const id = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
    const today = new Date().toISOString();
    const newNote: Reflection = {
      ...note,
      id,
      date: today,
    };
    const updated = [newNote, ...progressNotes];
    setProgressNotes(updated);
    localStorage.setItem('creative_progress', JSON.stringify(updated));

    // Update stats
    const newStats: UserStats = {
      ...userStats,
      totalChallenges: userStats.totalChallenges + 1,
      lastActiveDate: today
    };
    setUserStats(newStats);
    localStorage.setItem('creative_user_stats', JSON.stringify(newStats));
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
      setUserBio
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
