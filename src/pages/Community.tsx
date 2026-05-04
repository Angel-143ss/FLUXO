import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  MoreHorizontal, 
  Heart, 
  MessageCircle, 
  Share2, 
  User, 
  Sparkles,
  Users,
  Search,
  Plus
} from 'lucide-react';
import { useAppContext, Post, Discipline } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { cn } from '../lib/utils';

// Mock data generator for initial posts
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user: { name: 'Elena V.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150', discipline: 'Drawing' },
    discipline: 'Drawing',
    content: 'Hoy experimenté con carboncillo por primera vez. El caos controlado me ayudó a soltar el perfeccionismo que me tenía bloqueada.',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800',
    timestamp: '2h',
    reactions: [
      { emoji: '✨', count: 12, userReacted: true },
      { emoji: '🔥', count: 5, userReacted: false }
    ]
  },
  {
    id: '2',
    user: { name: 'Marco S.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150', discipline: 'Writing' },
    discipline: 'Writing',
    content: '¿Cómo manejáis el síndrome de la hoja en blanco cuando se trata de diálogos? Siento que mis personajes hablan todos igual.',
    timestamp: '5h',
    reactions: [
      { emoji: '💡', count: 8, userReacted: false },
      { emoji: '🖋️', count: 3, userReacted: false }
    ]
  },
  {
    id: '3',
    user: { name: 'Julian D.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150', discipline: 'Photography' },
    discipline: 'Photography',
    content: 'La luz de hoy a las 6pm era mágica. Capturé este rincón de mi jardín y sentí que el tiempo se detenía.',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800',
    timestamp: '8h',
    reactions: [
      { emoji: '📸', count: 15, userReacted: true },
      { emoji: '🌿', count: 7, userReacted: false }
    ]
  }
];

export function Community() {
  const { language, discipline: userDiscipline, userName, userPhoto } = useAppContext();
  const t = translations[language];
  const [activeFilter, setActiveFilter] = useState<Discipline | 'All'>('All');
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'All') return posts;
    return posts.filter(p => p.discipline === activeFilter);
  }, [posts, activeFilter]);

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newPost: Post = {
        id: Date.now().toString(),
        user: { name: userName, avatar: userPhoto, discipline: userDiscipline },
        discipline: userDiscipline,
        content: newPostContent,
        timestamp: t.justNow,
        reactions: []
      };
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setIsPosting(false);
    }, 600);
  };

  const disciplines: (Discipline | 'All')[] = ['All', 'Drawing', 'Writing', 'Photography'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto space-y-10 pb-20"
    >
      {/* Header */}
      <header className="px-4">
        <h1 className="text-4xl font-display font-black tracking-tight text-neutral-900 dark:text-white mb-2">
          {t.communityTitle}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
          {t.communitySubtitle}
        </p>
      </header>

      {/* Quick Post Component */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-[2.5rem] shadow-xl shadow-neutral-100/50 dark:shadow-none mx-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-neutral-100 dark:border-neutral-800">
            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {t.shareWithCommunity}
            </div>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={t.postPlaceholder}
              className="w-full bg-transparent border-none outline-none resize-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 min-h-[80px]"
            />
            <div className="flex items-center justify-between border-t border-neutral-50 dark:border-neutral-800 pt-4">
              <button className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{t.attachImage}</span>
              </button>
              <button
                onClick={handlePost}
                disabled={!newPostContent.trim() || isPosting}
                className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-lg"
                style={{ backgroundColor: !newPostContent.trim() ? undefined : 'var(--discipline-accent)' }}
              >
                {isPosting ? t.thinkingIdea : t.publish}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-2">
          {disciplines.map((d) => (
            <button
              key={d}
              onClick={() => setActiveFilter(d)}
              className={cn(
                "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                activeFilter === d 
                  ? "bg-white dark:bg-neutral-800 border-transparent shadow-lg scale-105" 
                  : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900"
              )}
              style={activeFilter === d ? { color: 'var(--discipline-accent)' } : {}}
            >
              {d === 'All' ? t.allDisciplines : d}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post) => (
            <motion.article
              key={post.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-100 dark:border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
            >
              {/* Post Header */}
              <div className="p-6 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 shrink-0">
                    <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
                      {post.user.name}
                      <span 
                        className="w-1 h-4 rounded-full" 
                        style={{ backgroundColor: post.discipline === 'Drawing' ? '#FFAE7A' : post.discipline === 'Writing' ? '#A78BFA' : '#22D3EE' }}
                      />
                    </h3>
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-400">
                      <span>{post.discipline}</span>
                      <span className="opacity-30">•</span>
                      <span>{post.timestamp}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <div className="p-6 py-4 space-y-4">
                <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                  {post.content}
                </p>
                {post.imageUrl && (
                  <div className="rounded-[1.5rem] overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-inner bg-neutral-100 dark:bg-neutral-800">
                    <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[400px] hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
              </div>

              {/* Post Footer / Actions */}
              <div className="px-6 pb-6 pt-2 flex items-center justify-between">
                <div className="flex gap-4">
                  <button className="flex items-center gap-1.5 group">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-300 group-hover:text-red-500 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 transition-all">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">24</span>
                  </button>
                  <button className="flex items-center gap-1.5 group">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-300 group-hover:text-brand-primary group-hover:bg-brand-primary/5 transition-all">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">12</span>
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {post.reactions.map((r, i) => (
                    <button 
                      key={i}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 border transition-all hover:scale-110",
                        r.userReacted 
                          ? "bg-neutral-100 dark:bg-neutral-800 border-transparent" 
                          : "bg-transparent border-neutral-100 dark:border-neutral-800 text-neutral-400"
                      )}
                    >
                      <span>{r.emoji}</span>
                      <span className="text-[10px] font-black">{r.count}</span>
                    </button>
                  ))}
                  <button className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all hover:rotate-12">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {filteredPosts.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <Users className="w-16 h-16 mx-auto mb-4 text-neutral-200" />
            <p className="text-[10px] font-black uppercase tracking-widest">{t.noPostsYet}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
