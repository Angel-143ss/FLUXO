import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Heart, Share2, User, ImagePlus, X, Target, ChevronDown } from 'lucide-react';
import { useAppContext, ChallengeData, Language } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { translations } from '../lib/i18n';

interface Post {
  id: number;
  author: string;
  avatar: string;
  discipline: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  time: string;
  challenge?: ChallengeData;
}

const getInitialMockPosts = (lang: Language): Post[] => [
  {
    id: 1,
    author: 'Elena R.',
    avatar: 'ER',
    discipline: 'Writing',
    content: lang === 'es' ? 'Hoy logré escribir 1000 palabras después de 2 semanas de bloqueo. El ejercicio de "Escritura Automática" realmente me ayudó a apagar mi editor interno.' : 'Today I managed to write 1000 words after 2 weeks of block. The "Automatic Writing" exercise really helped me turn off my internal editor.',
    likes: 24,
    comments: 5,
    time: lang === 'es' ? 'hace 2 horas' : '2 hours ago',
  },
  {
    id: 2,
    author: 'Marcos T.',
    avatar: 'MT',
    discipline: 'Drawing',
    content: lang === 'es' ? 'Intenté dibujar con mi mano no dominante y el resultado fue un desastre hermoso. Me dio una nueva perspectiva sobre las formas imperfectas.' : 'I tried drawing with my non-dominant hand and the result was a beautiful disaster. It gave me a new perspective on imperfect shapes.',
    image: 'https://picsum.photos/seed/drawing/800/600',
    likes: 42,
    comments: 12,
    time: lang === 'es' ? 'hace 5 horas' : '5 hours ago',
  },
  {
    id: 3,
    author: 'Sofía L.',
    avatar: 'SL',
    discipline: 'Music',
    content: lang === 'es' ? '¿Alguien más siente que la inspiración solo llega a las 3 AM? Estoy buscando técnicas para entrar en "la zona" durante el día.' : 'Does anyone else feel like inspiration only hits at 3 AM? I\'m looking for techniques to get into "the zone" during the day.',
    likes: 89,
    comments: 34,
    time: lang === 'es' ? 'hace 1 día' : '1 day ago',
  },
];

export function Community() {
  const { discipline, language } = useAppContext();
  const t = translations[language];
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>(getInitialMockPosts(language));
  const [activeTab, setActiveTab] = useState<'all' | 'discipline'>('all');
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [attachedChallenge, setAttachedChallenge] = useState<ChallengeData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state?.prefill) {
      setNewPost(location.state.prefill);
    }
    if (location.state?.challenge) {
      setAttachedChallenge(location.state.challenge);
    }
    if (location.state?.prefill || location.state?.challenge) {
      // Clear the state so it doesn't prefill again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredPosts = activeTab === 'all' 
    ? posts 
    : posts.filter(p => p.discipline === discipline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6"
    >
      <div className="mb-12">
        <h1 className="text-3xl font-display font-semibold tracking-tight text-neutral-900 dark:text-white mb-3">{t.communityTitle}</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t.communitySubtitle}
        </p>
      </div>

      <div className="minimal-card p-6 mb-12">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-neutral-100 font-bold text-[10px] uppercase tracking-widest shrink-0 border border-neutral-200 dark:border-neutral-700">
            {t.you.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={t.shareUpdate}
              className="w-full h-24 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 focus:border-neutral-900 dark:focus:border-neutral-100 outline-none resize-none transition-all mb-4 text-neutral-800 dark:text-neutral-100 text-sm"
            />
            
            {selectedImage && (
              <div className="relative inline-block mb-6">
                <img src={selectedImage} alt="Preview" className="h-32 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 grayscale hover:grayscale-0 transition-all" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-neutral-900 text-white rounded-full p-1 hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {attachedChallenge && (
              <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                    <Target className="w-4 h-4" strokeWidth={1.5} />
                    {t.attachedChallenge}
                  </div>
                  <p className="text-neutral-900 dark:text-neutral-100 text-sm font-medium">{attachedChallenge.title}</p>
                </div>
                <button
                  onClick={() => setAttachedChallenge(null)}
                  className="text-neutral-400 hover:text-neutral-900 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-xl border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
                  title={t.attachImage}
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <button
                disabled={!newPost.trim() && !selectedImage && !attachedChallenge}
                className="minimal-button-primary px-8"
                onClick={() => {
                  const newPostObj: Post = {
                    id: Date.now(),
                    author: t.you,
                    avatar: t.you.substring(0, 2).toUpperCase(),
                    discipline: discipline,
                    content: newPost,
                    image: selectedImage || undefined,
                    challenge: attachedChallenge || undefined,
                    likes: 0,
                    comments: 0,
                    time: t.justNow,
                  };
                  setPosts([newPostObj, ...posts]);
                  setNewPost('');
                  setSelectedImage(null);
                  setAttachedChallenge(null);
                }}
              >
                {t.post}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8 mb-8 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-4 text-[10px] uppercase font-bold tracking-[0.2em] transition-colors relative ${activeTab === 'all' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
        >
          {t.allArtists}
          {activeTab === 'all' && (
            <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-px bg-neutral-900 dark:bg-neutral-100" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('discipline')}
          className={`pb-4 text-[10px] uppercase font-bold tracking-[0.2em] transition-colors relative ${activeTab === 'discipline' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
        >
          {t.onlyDiscipline} {discipline}
          {activeTab === 'discipline' && (
            <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-px bg-neutral-900 dark:bg-neutral-100" />
          )}
        </button>
      </div>

      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="minimal-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-neutral-100 font-bold text-[10px] uppercase tracking-widest border border-neutral-200 dark:border-neutral-700">
                {post.avatar}
              </div>
              <div>
                <h3 className="text-sm font-display font-semibold text-neutral-900 dark:text-white">{post.author}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  <span>{post.time}</span>
                  <span className="opacity-30">•</span>
                  <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-300">{post.discipline}</span>
                </div>
              </div>
            </div>
            
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base leading-relaxed mb-6">
              {post.content}
            </p>

            {post.image && (
              <img 
                src={post.image} 
                alt="Post attachment" 
                className="w-full max-h-[500px] object-cover rounded-xl mb-6 border border-neutral-100 dark:border-neutral-800 grayscale hover:grayscale-0 transition-all duration-700" 
                referrerPolicy="no-referrer"
              />
            )}

            {post.challenge && (
              <details className="mb-6 group bg-neutral-50/50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                <summary className="cursor-pointer p-4 font-medium text-neutral-900 dark:text-neutral-100 flex items-center justify-between select-none hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Target className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm">{t.challengePrefix} {post.challenge.title}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-6 pt-0 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                    {post.challenge.type === 'visual' ? t.visualChallenge : t.conceptualChallenge}
                    {post.challenge.time && (
                      <>
                        <span className="opacity-30">•</span>
                        <span>{post.challenge.time}</span>
                      </>
                    )}
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">{post.challenge.description}</p>
                  
                  {post.challenge.steps && post.challenge.steps.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100 mb-3">{t.steps}</h4>
                      <ul className="space-y-3">
                        {post.challenge.steps.map((step: string, idx: number) => (
                          <li key={idx} className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                            <span className="flex-shrink-0 w-5 h-5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {post.challenge.imageUrl && (
                    <img src={post.challenge.imageUrl} alt={t.challengeReference} className="w-full max-w-sm rounded-xl border border-neutral-100 dark:border-neutral-800 mt-4 grayscale" />
                  )}
                </div>
              </details>
            )}
            
            <div className="flex items-center gap-8 border-t border-neutral-50 dark:border-neutral-800/50 pt-6">
              <button className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors group">
                <Heart className="w-4 h-4 group-hover:fill-current transition-all" />
                <span className="text-[10px] font-bold uppercase tracking-widest transition-colors">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest transition-colors">{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors ml-auto">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-16 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">{t.noPostsYet}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
