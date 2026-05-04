import { useState, useEffect } from 'react';
import { Reflection } from '../context/AppContext';

export const useProgress = () => {
  const [history, setHistory] = useState<Reflection[]>([]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('creative_progress');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse progress history", e);
      }
    }
  }, []);

  // Save new entry
  const saveEntry = (newEntry: Reflection) => {
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('creative_progress', JSON.stringify(updatedHistory));
  };

  return { 
    history, 
    setHistory,
    saveEntry 
  };
};
