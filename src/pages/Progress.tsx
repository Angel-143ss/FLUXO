import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Calendar, Tag, Target, ChevronDown, X } from 'lucide-react';
import { useAppContext, ChallengeData } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { translations } from '../lib/i18n';

export function Progress() {
  const { progressNotes, addProgressNote, discipline, language } = useAppContext();
  const t = translations[language];
  const location = useLocation();
  const [newNote, setNewNote] = useState('');
  const [attachedChallenge, setAttachedChallenge] = useState<ChallengeData | null>(null);

  useEffect(() => {
    if (location.state?.prefill) {
      setNewNote(location.state.prefill);
    }
    if (location.state?.challenge) {
      setAttachedChallenge(location.state.challenge);
    }
    if (location.state?.prefill || location.state?.challenge) {
      // Clear the state so it doesn't prefill again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSave = () => {
    if (!newNote.trim()) return;
    addProgressNote({ content: newNote, discipline, challenge: attachedChallenge || undefined });
    setNewNote('');
    setAttachedChallenge(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-12">
        <h1 className="text-3xl font-display font-semibold tracking-tight text-neutral-900 dark:text-white mb-3">{t.progressTitle}</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t.progressSubtitle}
        </p>
      </div>

      <div className="minimal-card p-8 mb-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100 mb-6">{t.newReflection}</h2>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t.whatDidYouDiscover}
          className="w-full h-32 p-6 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 focus:border-neutral-900 dark:focus:border-neutral-100 outline-none resize-none transition-all mb-6 text-neutral-800 dark:text-neutral-100 text-sm leading-relaxed"
        />
        
        {attachedChallenge && (
          <div className="mb-6 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                <Target className="w-4 h-4" strokeWidth={1.5} />
                {t.attachedChallenge}
              </div>
              <p className="text-neutral-900 dark:text-neutral-100 text-sm font-medium">{attachedChallenge.title}</p>
            </div>
            <button
              onClick={() => setAttachedChallenge(null)}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!newNote.trim() && !attachedChallenge}
            className="minimal-button-primary rounded-full w-full sm:w-auto px-8 py-4 text-base"
          >
            <Save className="w-5 h-5 mr-2 inline" />
            {t.saveNote}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white mb-6 pl-4 border-l border-neutral-900 dark:border-neutral-100">{t.history}</h2>
        
        {progressNotes.length === 0 ? (
          <div className="text-center py-16 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <p className="text-xs uppercase tracking-widest font-bold text-neutral-400 dark:text-neutral-600">{t.noNotesYet}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {progressNotes.map((note) => (
              <div key={note.id} className="minimal-card p-6">
                <div className="flex items-center gap-4 mb-4 text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800/50 px-2 py-0.5 rounded">
                    <Tag className="w-3 h-3" />
                    {note.discipline}
                  </span>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">{note.content}</p>

                {note.challenge && (
                  <details className="group bg-neutral-50/50 dark:bg-neutral-800/30 rounded-[1.5rem] border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                    <summary className="cursor-pointer p-5 font-medium text-neutral-900 dark:text-neutral-100 flex items-center justify-between select-none hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <Target className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm">{t.challengePrefix} {note.challenge.title}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="p-6 pt-0 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                        {note.challenge.type === 'visual' ? t.visualChallenge : t.conceptualChallenge}
                        {note.challenge.time && (
                          <>
                            <span className="opacity-30">•</span>
                            <span>{note.challenge.time}</span>
                          </>
                        )}
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">{note.challenge.description}</p>
                      
                      {note.challenge.steps && note.challenge.steps.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100 mb-3">{t.steps}</h4>
                          <ul className="space-y-3">
                            {note.challenge.steps.map((step: string, idx: number) => (
                              <li key={idx} className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                                <span className="flex-shrink-0 w-5 h-5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {note.challenge.imageUrl && (
                        <img src={note.challenge.imageUrl} alt={t.challengeReference} className="w-full max-w-sm rounded-xl border border-neutral-100 dark:border-neutral-800 mt-4 grayscale" />
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
