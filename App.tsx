import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Sparkles, BookOpen, Award, Activity, 
  User as UserIcon, LogOut, Smile, Frown, Zap, Monitor, Leaf, PenTool
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { User, MoodType, InterestType, ThemeConfig, JournalEntry } from './types';
import { analyzeMoodFromImage, getHealthTipsForMood, sparkStoryAssistant } from './services/geminiService';
import MoodCalendar from './components/MoodCalendar';

// --- Constants & Themes ---

const THEMES: Record<string, ThemeConfig> = {
  DEFAULT: {
    name: 'Default',
    type: 'default',
    bgGradient: 'bg-gradient-to-br from-slate-50 to-slate-200',
    cardBg: 'bg-white/60',
    textColor: 'text-slate-800',
    accentColor: 'text-indigo-600',
    buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    borderColor: 'border-white/50',
    animation: 'animate-none'
  },
  GAMING_STRESSED: { 
    name: 'Zen Gaming',
    type: 'gaming',
    bgGradient: 'bg-slate-900',
    cardBg: 'bg-black/60',
    textColor: 'text-cyan-100',
    accentColor: 'text-cyan-400',
    buttonPrimary: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]',
    borderColor: 'border-cyan-500/30',
    animation: 'animate-pulse-slow'
  },
  GAMING_HAPPY: { 
    name: 'Neon Arcade',
    type: 'gaming',
    bgGradient: 'bg-purple-900',
    cardBg: 'bg-purple-900/40',
    textColor: 'text-white',
    accentColor: 'text-fuchsia-300',
    buttonPrimary: 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]',
    borderColor: 'border-fuchsia-500/50',
    animation: 'animate-gradient-x'
  },
  NATURE_SAD: { 
    name: 'Sunlit Forest',
    type: 'nature',
    bgGradient: 'bg-emerald-50',
    cardBg: 'bg-white/40',
    textColor: 'text-emerald-900',
    accentColor: 'text-amber-600',
    buttonPrimary: 'bg-amber-500 hover:bg-amber-600 text-white',
    borderColor: 'border-amber-200',
    animation: 'animate-float'
  },
  NATURE_STRESSED: { 
    name: 'Deep Ocean',
    type: 'nature',
    bgGradient: 'bg-slate-900',
    cardBg: 'bg-blue-950/30',
    textColor: 'text-blue-50',
    accentColor: 'text-blue-300',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    borderColor: 'border-blue-400/20',
    animation: 'animate-pulse-slow'
  },
  MINIMAL_ANGRY: { 
    name: 'White Space',
    type: 'minimal',
    bgGradient: 'bg-white',
    cardBg: 'bg-white',
    textColor: 'text-slate-600',
    accentColor: 'text-slate-900',
    buttonPrimary: 'bg-slate-800 hover:bg-slate-900 text-white',
    borderColor: 'border-slate-200',
    animation: 'animate-none'
  }
};

const getTheme = (mood: MoodType, interest: InterestType): ThemeConfig => {
  if (interest === InterestType.GAMING) {
    if (mood === MoodType.STRESSED || mood === MoodType.ANGRY) return THEMES.GAMING_STRESSED;
    return THEMES.GAMING_HAPPY;
  }
  if (interest === InterestType.NATURE) {
    if (mood === MoodType.SAD || mood === MoodType.STRESSED || mood === MoodType.ANGRY) return THEMES.NATURE_STRESSED;
    if (mood === MoodType.HAPPY || mood === MoodType.EXCITED) return THEMES.NATURE_SAD; // Using sad theme base for happy nature for now (sunlit)
    return THEMES.NATURE_SAD;
  }
  if (interest === InterestType.MINIMALISM) return THEMES.MINIMAL_ANGRY;
  
  return THEMES.DEFAULT;
};

// --- Visual Background Component ---

const DynamicBackground = ({ theme }: { theme: ThemeConfig }) => {
  if (theme.type === 'gaming') {
    return (
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        {/* Base Gradient */}
        <div className={`absolute inset-0 ${theme.bgGradient} transition-colors duration-1000`}></div>
        
        {/* Grid Overlay */}
        <div className={`absolute inset-0 bg-grid-pattern opacity-20 ${theme.animation === 'animate-gradient-x' ? 'animate-pulse' : ''}`}></div>
        
        {/* Moving Glows */}
        <div className={`absolute top-0 left-1/4 w-96 h-96 ${theme.name === 'Neon Arcade' ? 'bg-purple-500' : 'bg-cyan-900'} rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 ${theme.name === 'Neon Arcade' ? 'bg-pink-500' : 'bg-blue-900'} rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000`}></div>
        
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
      </div>
    );
  }

  if (theme.type === 'nature') {
    return (
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
         <div className={`absolute inset-0 ${theme.bgGradient} transition-colors duration-1000`}></div>
         
         {/* Organic Blobs */}
         <div className={`absolute top-10 left-10 w-64 h-64 ${theme.name === 'Deep Ocean' ? 'bg-blue-400' : 'bg-yellow-200'} rounded-full mix-blend-multiply filter blur-[60px] opacity-40 animate-float`}></div>
         <div className={`absolute top-1/2 right-10 w-80 h-80 ${theme.name === 'Deep Ocean' ? 'bg-teal-600' : 'bg-green-200'} rounded-full mix-blend-multiply filter blur-[60px] opacity-40 animate-float-delayed`}></div>
         <div className={`absolute -bottom-20 left-1/3 w-96 h-96 ${theme.name === 'Deep Ocean' ? 'bg-indigo-600' : 'bg-emerald-200'} rounded-full mix-blend-multiply filter blur-[60px] opacity-40 animate-blob`}></div>
         
         {/* Overlay Texture */}
         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>
      </div>
    );
  }

  if (theme.type === 'minimal') {
     return (
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none bg-white">
         <div className="absolute inset-0 bg-dot-pattern opacity-50"></div>
      </div>
     );
  }

  // Default
  return (
    <div className={`fixed inset-0 -z-10 ${theme.bgGradient} transition-colors duration-1000`}></div>
  );
};

// --- Components ---

const Notification = ({ message, onClose, theme }: { message: string, onClose: () => void, theme: ThemeConfig }) => (
  <div className={`fixed top-4 right-4 z-50 animate-float backdrop-blur-md border shadow-xl rounded-lg p-4 flex items-center gap-3 max-w-sm ${theme.cardBg} ${theme.borderColor} ${theme.textColor}`}>
    <Sparkles className={`w-5 h-5 ${theme.accentColor}`} />
    <p className="text-sm font-medium">{message}</p>
    <button onClick={onClose} className="ml-auto opacity-50 hover:opacity-100">×</button>
  </div>
);

const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [interests, setInterests] = useState<InterestType[]>([]);

  const toggleInterest = (i: InterestType) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && interests.length === 0) {
      alert("Please select at least one interest.");
      return;
    }
    onLogin({
      username: username || 'User',
      email: 'user@example.com',
      interests: interests.length > 0 ? interests : [InterestType.NATURE],
      points: 0,
      unlockedThemes: []
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Auth Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10"></div>
      <div className="absolute w-96 h-96 bg-white rounded-full blur-[100px] opacity-20 animate-blob top-[-10%] left-[-10%]"></div>
      <div className="absolute w-96 h-96 bg-blue-400 rounded-full blur-[100px] opacity-20 animate-blob bottom-[-10%] right-[-10%] animation-delay-2000"></div>

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 mx-4">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Activity className="text-white w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-display font-bold text-center text-slate-800 mb-2">IRIS</h2>
          <p className="text-center text-slate-500 mb-8">Change your view through emotions.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(InterestType).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleInterest(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        interests.includes(type) 
                          ? 'bg-indigo-600 text-white shadow-md scale-105' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 mt-4"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {isLogin ? "New to Iris? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [mood, setMood] = useState<MoodType>(MoodType.NEUTRAL);
  const [theme, setTheme] = useState<ThemeConfig>(THEMES.DEFAULT);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'story' | 'journal' | 'rewards'>('dashboard');
  const [moodHistory, setMoodHistory] = useState<{date: string, mood: MoodType}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [healthTip, setHealthTip] = useState<string>('Scan your mood to get started!');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Journal State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [newJournalText, setNewJournalText] = useState('');

  // Story State
  const [storyText, setStoryText] = useState('');

  useEffect(() => {
    if (user) {
      const primaryInterest = user.interests[0] || InterestType.NATURE;
      setTheme(getTheme(mood, primaryInterest));
      
      if (mood !== MoodType.NEUTRAL) {
         getHealthTipsForMood(mood, primaryInterest).then(tip => {
            setHealthTip(`${tip.title}: ${tip.actionItem}`);
         });
      }
    }
  }, [mood, user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please ensure permissions are granted.");
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;
    
    setIsAnalyzing(true);
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg');

    const result = await analyzeMoodFromImage(base64);
    
    setMood(result.mood);
    setMoodHistory(prev => [...prev, { date: new Date().toISOString(), mood: result.mood }]);
    setShowNotification(`Mood detected: ${result.mood}. Applying ${result.mood === 'Stressed' || result.mood === 'Angry' ? 'calming' : 'enhancing'} visuals...`);
    
    if (user) {
      setUser({ ...user, points: user.points + 50 });
    }

    setIsAnalyzing(false);
    setTimeout(() => setShowNotification(null), 4000);
  };

  const handleLogout = () => {
    setUser(null);
    setMood(MoodType.NEUTRAL);
    setTheme(THEMES.DEFAULT);
  };

  const handleSpark = async () => {
    if (!storyText) return;
    const spark = await sparkStoryAssistant(storyText, mood);
    setStoryText(prev => prev + " " + spark);
    if (user) setUser({ ...user, points: user.points + 20 });
  };

  const addJournalEntry = () => {
    if (!newJournalText.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      content: newJournalText,
      mood: mood,
      stickers: mood === MoodType.HAPPY ? ['🌟'] : mood === MoodType.SAD ? ['🌧️'] : ['🌿']
    };
    setJournalEntries([entry, ...journalEntries]);
    setNewJournalText('');
    if (user) setUser({ ...user, points: user.points + 30 });
  };

  if (!user) {
    return <AuthScreen onLogin={(u) => { setUser(u); startCamera(); }} />;
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden transition-all duration-1000 ${theme.textColor}`}>
      
      <DynamicBackground theme={theme} />
      
      {showNotification && <Notification message={showNotification} onClose={() => setShowNotification(null)} theme={theme} />}

      {/* Navigation */}
      <nav className={`fixed bottom-0 w-full sm:top-0 sm:bottom-auto z-40 backdrop-blur-md border-t sm:border-b sm:border-t-0 transition-all duration-500 ${theme.borderColor} ${theme.cardBg}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className={`font-display font-bold text-2xl tracking-tighter ${theme.accentColor}`}>IRIS</span>
              <span className="text-xs opacity-60 hidden sm:block">| {mood} Mode</span>
            </div>
            
            <div className="flex space-x-8">
              <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-lg transition-all ${activeTab === 'dashboard' ? theme.accentColor + ' bg-white/10' : 'opacity-60 hover:opacity-100'}`}>
                <Monitor size={24} />
              </button>
              <button onClick={() => setActiveTab('story')} className={`p-2 rounded-lg transition-all ${activeTab === 'story' ? theme.accentColor + ' bg-white/10' : 'opacity-60 hover:opacity-100'}`}>
                <BookOpen size={24} />
              </button>
              <button onClick={() => setActiveTab('journal')} className={`p-2 rounded-lg transition-all ${activeTab === 'journal' ? theme.accentColor + ' bg-white/10' : 'opacity-60 hover:opacity-100'}`}>
                <PenTool size={24} />
              </button>
              <button onClick={() => setActiveTab('rewards')} className={`p-2 rounded-lg transition-all ${activeTab === 'rewards' ? theme.accentColor + ' bg-white/10' : 'opacity-60 hover:opacity-100'}`}>
                <Award size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4">
               <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold">{user.points} PTS</span>
                  <span className="text-xs opacity-60">{user.username}</span>
               </div>
               <button onClick={handleLogout} className="opacity-60 hover:opacity-100"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-6 pb-24 sm:pt-24 max-w-6xl mx-auto px-4 relative z-10">
        
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Mood Scanner */}
            <div className="lg:col-span-2 space-y-6">
              <div className={`relative rounded-3xl overflow-hidden shadow-2xl aspect-video ${theme.borderColor} border-2 transition-all duration-500`}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                />
                {/* Scanner Overlay */}
                {isAnalyzing && (
                   <div className="absolute inset-0 bg-black/20 z-10">
                      <div className="w-full h-1 bg-white/50 absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                   </div>
                )}
                
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex justify-between items-center">
                  <div>
                     <p className="text-white/80 text-sm">Current Atmosphere</p>
                     <h2 className="text-white text-3xl font-display font-bold flex items-center gap-2">
                       {mood} {mood === MoodType.HAPPY ? <Smile className="text-yellow-400"/> : mood === MoodType.SAD ? <Frown className="text-blue-400"/> : <Activity className="text-green-400"/>}
                     </h2>
                  </div>
                  <button 
                    onClick={captureAndAnalyze}
                    disabled={isAnalyzing}
                    className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all ${theme.buttonPrimary} ${isAnalyzing ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <Camera size={20} />
                    {isAnalyzing ? 'Sensing...' : 'Update View'}
                  </button>
                </div>
              </div>
              
              {/* Recommendations Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className={`p-6 rounded-2xl border backdrop-blur-md transition-all duration-500 ${theme.cardBg} ${theme.borderColor}`}>
                    <h3 className={`font-bold mb-2 flex items-center gap-2 ${theme.accentColor}`}>
                      <Zap size={18} /> Energy Balancer
                    </h3>
                    <p className="opacity-80 text-sm leading-relaxed">{healthTip}</p>
                 </div>
                 <div className={`p-6 rounded-2xl border backdrop-blur-md transition-all duration-500 ${theme.cardBg} ${theme.borderColor}`}>
                    <h3 className={`font-bold mb-2 flex items-center gap-2 ${theme.accentColor}`}>
                      <Leaf size={18} /> Visual Context
                    </h3>
                    <p className="opacity-80 text-sm">
                       Active Theme: <strong>{theme.name}</strong>. <br/>
                       Visuals optimized for {mood.toLowerCase()} state.
                    </p>
                 </div>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="space-y-6">
               <MoodCalendar history={moodHistory} currentTheme={theme} />
               
               <div className={`p-6 rounded-2xl backdrop-blur-md border shadow-lg transition-all duration-500 ${theme.cardBg} ${theme.borderColor}`}>
                  <h3 className="font-bold mb-4">Quick Shifts</h3>
                  <div className="space-y-3">
                    <button className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-colors hover:bg-white/10 border border-transparent hover:border-white/20`}>
                       🎵 Ambient Sound: {theme.type === 'gaming' ? 'Synthwave' : theme.type === 'nature' ? 'Rainfall' : 'Silence'}
                    </button>
                    <button className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-colors hover:bg-white/10 border border-transparent hover:border-white/20`}>
                       🧘 Guide: {mood === 'Stressed' ? 'Deep Breathing' : 'Focus Sprint'}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'story' && (
          <div className={`max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden border transition-all duration-500 ${theme.borderColor} ${theme.cardBg} backdrop-blur-xl`}>
            <div className="p-8 h-[70vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-3xl font-display font-bold ${theme.textColor}`}>DIY Storybook</h2>
                <button 
                  onClick={handleSpark}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:shadow-lg ${theme.buttonPrimary}`}
                >
                  <Sparkles size={16} /> Spark Idea
                </button>
              </div>
              <textarea 
                className={`flex-1 w-full p-6 rounded-xl bg-transparent border-2 border-dashed focus:border-opacity-100 outline-none resize-none text-lg leading-relaxed font-serif transition-colors ${theme.textColor} ${theme.borderColor} border-opacity-50`}
                placeholder="Once upon a time..."
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
              />
              <p className="text-xs opacity-50 mt-4 text-center">Story sparks adapt to your current {mood} mood.</p>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="max-w-3xl mx-auto">
             <div className={`mb-8 p-6 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-500 ${theme.cardBg} ${theme.borderColor}`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.accentColor}`}>My Journal</h2>
                <div className="relative">
                  <textarea
                    value={newJournalText}
                    onChange={(e) => setNewJournalText(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/10 border border-transparent focus:border-white/30 outline-none min-h-[100px] placeholder-current opacity-90"
                    placeholder="Reflect on your day..."
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Add Sticker">😊</button>
                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Add Photo">📷</button>
                  </div>
                </div>
                <button 
                  onClick={addJournalEntry}
                  className={`mt-4 w-full py-3 rounded-xl font-bold shadow-md transition-all ${theme.buttonPrimary}`}
                >
                  Save Entry
                </button>
             </div>

             <div className="space-y-4">
                {journalEntries.map(entry => (
                  <div key={entry.id} className={`p-6 rounded-2xl shadow-sm border backdrop-blur-sm hover:shadow-md transition-all ${theme.cardBg} ${theme.borderColor}`}>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold opacity-60 uppercase tracking-wider">{entry.date}</span>
                      <span className={`text-xs px-2 py-1 rounded-full bg-white/20`}>{entry.mood}</span>
                    </div>
                    <p className="opacity-90 mb-3">{entry.content}</p>
                    <div className="flex gap-2 text-lg">
                      {entry.stickers.map((s, i) => <span key={i}>{s}</span>)}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="max-w-4xl mx-auto">
             <div className="text-center mb-12">
                <h2 className={`text-4xl font-display font-bold mb-2 ${theme.textColor}`}>Rewards</h2>
                <p className="opacity-70">Unlock new visual experiences.</p>
                <div className={`mt-6 inline-block p-6 rounded-3xl backdrop-blur border ${theme.cardBg} ${theme.borderColor}`}>
                   <span className="block text-sm uppercase tracking-widest opacity-60">Total Points</span>
                   <span className={`text-6xl font-bold ${theme.accentColor}`}>{user.points}</span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((item) => (
                  <div key={item} className={`relative group overflow-hidden rounded-2xl aspect-[3/4] bg-black shadow-xl border border-white/10`}>
                     <div className={`absolute inset-0 bg-gradient-to-b ${item === 1 ? 'from-purple-500' : item === 2 ? 'from-cyan-500' : 'from-emerald-500'} to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-500`}></div>
                     {/* Preview Pattern */}
                     <div className={`absolute inset-0 ${item === 1 ? 'bg-grid-pattern' : 'bg-dot-pattern'} opacity-30`}></div>
                     
                     <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h4 className="text-white font-bold text-xl mb-1">Visual Pack {item}</h4>
                        <p className="text-white/60 text-sm mb-4">Unlock exclusive {item === 1 ? 'Cyber' : item === 2 ? 'Ethereal' : 'Organic'} themes.</p>
                        <button className="w-full py-2 rounded-lg bg-white/20 backdrop-blur hover:bg-white text-white hover:text-black font-bold transition-all">
                           {item * 100 > user.points ? `Locked (${item * 100} pts)` : 'Activate'}
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

      </main>
    </div>
  );
}