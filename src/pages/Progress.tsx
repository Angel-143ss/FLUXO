import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  Calendar, 
  Target, 
  ChevronRight, 
  X, 
  Trophy, 
  Flame, 
  TrendingUp, 
  Star, 
  Zap,
  LayoutGrid
} from 'lucide-react';
import { useAppContext, ChallengeData, Reflection, UserStats } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { translations } from '../lib/i18n';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import { cn } from '../lib/utils';

interface MilestoneCardProps {
  note: Reflection;
  language: string;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ note, language }) => {
  return (
    <motion.div
      layout
      className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between h-[300px] w-full"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
              {note.challenge ? <Target className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {new Date(note.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={cn(
                  "w-1 h-3 rounded-full",
                  i <= note.moodLevel ? "bg-brand-primary" : "bg-neutral-100 dark:bg-neutral-800"
                )}
                style={i <= note.moodLevel ? { backgroundColor: 'var(--discipline-accent)' } : {}}
              />
            ))}
          </div>
        </div>
        <h3 className="text-lg font-montserrat font-bold text-neutral-900 dark:text-white mb-2 line-clamp-1">
          {note.challengeTitle || (language === 'es' ? 'Reflexión Libre' : 'Free Reflection')}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed line-clamp-4 italic">
          "{note.content}"
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-neutral-50 dark:bg-neutral-800 text-[10px] font-black uppercase tracking-tighter text-neutral-500">
          {note.discipline}
        </span>
        <ChevronRight className="w-4 h-4 text-neutral-200" />
      </div>
    </motion.div>
  );
};

export function Progress() {
  const { progressNotes, addProgressNote, userStats, discipline, language } = useAppContext();
  const t = translations[language];
  const location = useLocation();
  const [newNote, setNewNote] = useState('');
  const [moodLevel, setMoodLevel] = useState(3);
  const [attachedChallenge, setAttachedChallenge] = useState<ChallengeData | null>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'write'>('log');

  useEffect(() => {
    if (location.state?.prefill) {
      setNewNote(location.state.prefill);
      setActiveTab('write');
    }
    if (location.state?.challenge) {
      setAttachedChallenge(location.state.challenge);
      setActiveTab('write');
    }
    if (location.state?.prefill || location.state?.challenge) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSave = () => {
    if (!newNote.trim()) return;
    addProgressNote({ 
      content: newNote, 
      discipline, 
      challengeTitle: attachedChallenge?.title || 'Daily Reflection',
      moodLevel,
      challenge: attachedChallenge || undefined 
    });
    setNewNote('');
    setMoodLevel(3);
    setAttachedChallenge(null);
    setActiveTab('log');
  };

  // Metrics Data
  const totalCompleted = userStats.totalChallenges;
  const currentStreak = userStats.currentStreak;

  // Confidence Chart Data (Mocking evolution)
  const confidenceData = useMemo(() => {
    return [
      { val: 10 }, { val: 25 }, { val: 20 }, { val: 45 }, { val: 60 }, { val: 55 }, { val: 80 }
    ];
  }, []);

  // Heatmap Data (Simulated)
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const intensity = Math.random() > 0.7 ? (Math.random() > 0.5 ? 2 : 1) : 0;
      days.push({ intensity, date });
    }
    return days;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12 pb-24"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-neutral-900 dark:text-white mb-3">
            {t.progressTitle}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-montserrat text-sm border-l-2 border-neutral-100 dark:border-neutral-800 pl-4">
            {t.progressSubtitle}
          </p>
        </div>
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-full">
          <button 
            onClick={() => setActiveTab('log')}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'log' ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400"
            )}
          >
            {t.history}
          </button>
          <button 
            onClick={() => setActiveTab('write')}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'write' ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400"
            )}
          >
            {t.newReflection}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'log' ? (
          <motion.div
            key="log"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-12"
          >
            {/* Quick Metrics & Consistency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Challenges Circular Metric */}
              <div className="bg-neutral-900 dark:bg-white rounded-[2.5rem] p-8 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy className="w-20 h-20 text-white dark:text-neutral-900" />
                </div>
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-white/10 dark:text-neutral-100"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={364}
                      strokeDashoffset={364 - (totalCompleted / 50) * 364}
                      strokeLinecap="round"
                      style={{ color: 'var(--discipline-accent)' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white dark:text-neutral-900">{totalCompleted}</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-white/50 dark:text-neutral-400">{t.totalChallenges}</span>
                  </div>
                </div>
              </div>

              {/* Consistency Heatmap */}
              <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-[2.5rem] p-8 md:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-neutral-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">{t.consistency}</h3>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-xl font-black font-montserrat">{currentStreak}</span>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter">{t.currentStreak}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {heatmapDays.map((day, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square rounded-lg transition-all duration-500",
                        day.intensity === 0 ? "bg-neutral-50 dark:bg-neutral-900" : "",
                        day.intensity === 1 ? "opacity-40" : "",
                        day.intensity === 2 ? "opacity-100 shadow-lg shadow-discipline-accent/20" : ""
                      )}
                      style={day.intensity > 0 ? { backgroundColor: 'var(--discipline-accent)' } : {}}
                      title={day.date.toDateString()}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Confidence Line Chart */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUp className="w-4 h-4 text-neutral-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">{t.confidenceEvolution}</h3>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={confidenceData}>
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-neutral-900 text-white p-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                              {payload[0].value}%
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="val" 
                      stroke="var(--discipline-accent)" 
                      strokeWidth={4} 
                      dot={false}
                      activeDot={{ r: 6, fill: 'var(--discipline-accent)', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Milestones List/Carousel-style */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">{t.recentMilestones}</h2>
                <div className="h-[1px] flex-1 mx-6 bg-neutral-100 dark:bg-neutral-800/50" />
              </div>

              {progressNotes.length === 0 ? (
                <div className="text-center py-20 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-neutral-800">
                  <Zap className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                  <p className="text-[10px] uppercase tracking-widest font-black text-neutral-400">{t.noNotesYet}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {progressNotes.map((note) => (
                    <MilestoneCard key={note.id} note={note} language={language} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="write"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-[2.5rem] p-10 shadow-2xl shadow-neutral-100/50 dark:shadow-none">
              <h2 className="text-xl font-montserrat font-black text-neutral-900 dark:text-white mb-8">
                {t.newReflection}
              </h2>

              <div className="mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 block">
                  {language === 'es' ? 'Nivel de Bloqueo / Ánimo' : 'Block / Mood Level'}
                </label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setMoodLevel(level)}
                      className={cn(
                        "flex-1 h-12 rounded-2xl transition-all font-black text-xs",
                        moodLevel === level 
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 scale-105 shadow-lg" 
                          : "bg-neutral-50 dark:bg-neutral-900 text-neutral-300 hover:text-neutral-500"
                      )}
                      style={moodLevel === level ? { backgroundColor: 'var(--discipline-accent)', color: 'white' } : {}}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={t.whatDidYouDiscover}
                className="w-full h-48 p-8 rounded-[2rem] border border-neutral-50 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/50 focus:bg-white dark:focus:bg-neutral-900 focus:border-neutral-200 dark:focus:border-neutral-800 outline-none resize-none transition-all mb-8 text-neutral-800 dark:text-neutral-100 text-base leading-relaxed font-medium"
              />
              
              {attachedChallenge && (
                <div className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                      <Target className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-neutral-400 font-black text-[9px] uppercase tracking-widest mb-0.5">
                        {t.attachedChallenge}
                      </div>
                      <p className="text-neutral-900 dark:text-neutral-100 text-sm font-bold">{attachedChallenge.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAttachedChallenge(null)}
                    className="p-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!newNote.trim() && !attachedChallenge}
                  className="minimal-button-primary rounded-full group px-10 py-5 text-sm font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <Save className="w-5 h-5" />
                  {t.saveNote}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
