/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  Moon, 
  Sun, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  XCircle, 
  Check,
  Trophy, 
  Flame, 
  ArrowLeft,
  ArrowRight,
  Search,
  AlertCircle,
  RefreshCw,
  SkipForward,
  Filter,
  Clock,
  Target,
  Layers,
  X,
  Calculator,
  Divide,
  Minus,
  Plus,
  Equal,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, UserProgress, AppState } from './types';
import { MOCK_QUESTIONS, playClickSound, playSuccessSound, playErrorSound, RICKROLL_GIF, RICKROLL_AUDIO } from './constants';

const INITIAL_PROGRESS: UserProgress = {
  completedQuestions: [],
  questionStatus: {},
  accuracy: 0,
  streak: 0,
  lastAttemptDate: null,
  totalCorrect: 0,
  totalAttempted: 0,
  badges: []
};

function CalculatorComponent() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setShouldReset(true);
  };

  const handleEqual = () => {
    try {
      const fullEquation = equation + display;
      // Simple eval-like logic for basic arithmetic
      const tokens = fullEquation.split(' ');
      if (tokens.length < 3) return;
      
      const a = parseFloat(tokens[0]);
      const op = tokens[1];
      const b = parseFloat(tokens[2]);
      
      let result = 0;
      switch(op) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        case '/': result = a / b; break;
      }
      
      const resultStr = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, "");
      setDisplay(resultStr);
      setEquation('');
      setShouldReset(true);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setShouldReset(false);
  };

  const CalcButton = ({ label, onClick, variant = 'default' }: { label: string | React.ReactNode, onClick: () => void, variant?: 'default' | 'operator' | 'action', key?: any }) => (
    <button
      onClick={() => { playClickSound(); onClick(); }}
      className={`h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center ${
        variant === 'operator' 
          ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20' 
          : variant === 'action'
          ? 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400 hover:bg-earth-200 dark:hover:bg-earth-700'
          : 'bg-white dark:bg-earth-900 text-earth-900 dark:text-earth-100 border border-earth-100 dark:border-earth-800 hover:bg-earth-50 dark:hover:bg-earth-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="bg-earth-50 dark:bg-earth-950 p-6 rounded-3xl border border-earth-100 dark:border-earth-900 text-right overflow-hidden">
        <div className="text-[10px] font-black uppercase tracking-widest text-earth-400 h-4 mb-1">
          {equation}
        </div>
        <div className="text-4xl font-black tracking-tighter text-earth-900 dark:text-earth-50 truncate">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <CalcButton label="C" onClick={clear} variant="action" />
        <CalcButton label={<Divide size={20} />} onClick={() => handleOperator('/')} variant="action" />
        <CalcButton label={<X size={20} />} onClick={() => handleOperator('*')} variant="action" />
        <CalcButton label={<Minus size={20} />} onClick={() => handleOperator('-')} variant="action" />
        
        {[7, 8, 9].map(n => <CalcButton key={n} label={n.toString()} onClick={() => handleNumber(n.toString())} />)}
        <CalcButton label={<Plus size={20} />} onClick={() => handleOperator('+')} variant="operator" />
        
        {[4, 5, 6].map(n => <CalcButton key={n} label={n.toString()} onClick={() => handleNumber(n.toString())} />)}
        <div className="row-span-2 grid grid-rows-2 gap-2">
          <CalcButton label={<Equal size={20} />} onClick={handleEqual} variant="operator" />
        </div>
        
        {[1, 2, 3].map(n => <CalcButton key={n} label={n.toString()} onClick={() => handleNumber(n.toString())} />)}
        
        <div className="col-span-2">
          <CalcButton label="0" onClick={() => handleNumber('0')} />
        </div>
        <CalcButton label="." onClick={() => handleNumber('.')} />
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const savedUsername = localStorage.getItem('ecostudy_username');
    const savedProgress = savedUsername 
      ? localStorage.getItem(`ecostudy_progress_${savedUsername}`) 
      : localStorage.getItem('ecostudy_progress');
      
    const progress = savedProgress ? JSON.parse(savedProgress) : INITIAL_PROGRESS;

    return {
      questions: MOCK_QUESTIONS,
      progress,
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      currentView: savedUsername ? 'dashboard' : 'login',
      isAuthenticated: !!savedUsername,
      username: savedUsername,
      currentQuestionIndex: 0,
      showPrank: false,
      searchQuery: '',
      activeSubject: 'All',
      activeYear: 'All',
      selectedChapter: null,
      selectedSubject: null,
      selectedOption: null,
      showSolution: false,
      showCalculator: false,
      isExplanationExpanded: false
    };
  });

  const [prankStep, setPrankStep] = useState<'none' | 'error' | 'fixing' | 'reveal'>('none');
  const [prankProgress, setPrankProgress] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const audioTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state.username) {
      localStorage.setItem(`ecostudy_progress_${state.username}`, JSON.stringify(state.progress));
    } else {
      localStorage.setItem('ecostudy_progress', JSON.stringify(state.progress));
    }
  }, [state.progress, state.username]);

  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  useEffect(() => {
    if (audioRef.current) {
      console.log("Audio element mounted. Initial state:", {
        src: audioRef.current.src,
        readyState: audioRef.current.readyState
      });
      audioRef.current.load();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
      }
    };
  }, []);

  const [settingsClicks, setSettingsClicks] = useState(0);

  const handleSettingsClick = () => {
    playClickSound();
    setSettingsClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setPrankStep('error');
        return 0;
      }
      return next;
    });
  };

  const toggleDarkMode = () => {
    playClickSound();
    setState(s => ({ ...s, isDarkMode: !s.isDarkMode }));
  };

  const handleAnswer = (questionId: string, isCorrect: boolean) => {
    if (isCorrect) {
      playSuccessSound();
    } else {
      playErrorSound();
    }
    setState(s => {
      const newTotalAttempted = s.progress.totalAttempted + 1;
      const newTotalCorrect = s.progress.totalCorrect + (isCorrect ? 1 : 0);
      const newAccuracy = Math.round((newTotalCorrect / newTotalAttempted) * 100);
      
      // Streak logic
      const today = new Date().toDateString();
      let newStreak = s.progress.streak;
      if (isCorrect) {
        newStreak += 1;
      } else {
        newStreak = 0;
      }

      const newProgress: UserProgress = {
        ...s.progress,
        completedQuestions: [...new Set([...s.progress.completedQuestions, questionId])],
        questionStatus: {
          ...(s.progress.questionStatus || {}),
          [questionId]: isCorrect ? 'correct' : 'incorrect'
        },
        totalAttempted: newTotalAttempted,
        totalCorrect: newTotalCorrect,
        accuracy: newAccuracy,
        streak: newStreak,
        lastAttemptDate: today
      };

      // Prank trigger: removed to prevent black screen issues
      // if (Math.random() < 0.05 && prankStep === 'none') {
      //   setTimeout(() => setPrankStep('error'), 1000);
      // }

      return { ...s, progress: newProgress };
    });
  };

  const startPrankFix = () => {
    playClickSound();
    setPrankStep('fixing');
    setPrankProgress(0);
    
    let p = 0;
    const interval = setInterval(() => {
      // Fidgety progress: sometimes it goes back a bit, sometimes it jumps
      const jump = Math.random() > 0.8 ? Math.random() * 25 : Math.random() * 8;
      const glitch = Math.random() > 0.9 ? -Math.random() * 5 : 0;
      
      p = Math.min(99.9, Math.max(0, p + jump + glitch));
      
      if (p >= 99.9) {
        setPrankProgress(100);
        clearInterval(interval);

        // Play audio only when progress reaches 100%
        if (audioRef.current) {
          audioRef.current.volume = 0.5;
          
          const playAudio = () => {
            if (!audioRef.current) return;
            console.log("Playing audio now. Ready state:", audioRef.current.readyState);
            
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log("Audio playback started successfully.");
                // Stop after 10 seconds
                if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
                audioTimeoutRef.current = setTimeout(() => {
                  if (audioRef.current) {
                    console.log("Stopping audio after 10 seconds.");
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                }, 10000);
              }).catch(err => {
                console.error("Audio play failed:", err);
                if (audioRef.current) {
                  audioRef.current.load();
                }
              });
            }
          };

          if (audioRef.current.readyState >= 3) {
            playAudio();
          } else {
            audioRef.current.addEventListener('canplaythrough', playAudio, { once: true });
            audioRef.current.load();
          }
        }

        setTimeout(() => {
          setPrankStep('reveal');
        }, 1000);
      } else {
        setPrankProgress(p);
      }
    }, 150);
  };

  const allGroupedQuestions = useMemo(() => {
    const groups: Record<string, Record<string, Question[]>> = {};
    state.questions.forEach(q => {
      if (!groups[q.subject]) groups[q.subject] = {};
      if (!groups[q.subject][q.chapter]) groups[q.subject][q.chapter] = [];
      groups[q.subject][q.chapter].push(q);
    });
    Object.keys(groups).forEach(subject => {
      Object.keys(groups[subject]).forEach(chapter => {
        groups[subject][chapter].sort((a, b) => b.year - a.year);
      });
    });
    return groups;
  }, [state.questions]);

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Record<string, Question[]>> = {};
    const filtered = state.questions.filter(q => {
      const matchesSearch = q.text.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                          q.chapter.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesSubject = state.activeSubject === 'All' || q.subject === state.activeSubject;
      const matchesYear = state.activeYear === 'All' || q.year.toString() === state.activeYear;
      return matchesSearch && matchesSubject && matchesYear;
    });

    filtered.forEach(q => {
      if (!groups[q.subject]) groups[q.subject] = {};
      if (!groups[q.subject][q.chapter]) groups[q.subject][q.chapter] = [];
      groups[q.subject][q.chapter].push(q);
    });
    
    // Sort chapters' questions by year newest to oldest
    Object.keys(groups).forEach(subject => {
      Object.keys(groups[subject]).forEach(chapter => {
        groups[subject][chapter].sort((a, b) => b.year - a.year);
      });
    });
    
    return groups;
  }, [state.questions, state.searchQuery, state.activeSubject]);

  const subjectStats = useMemo(() => {
    const stats: Record<string, { total: number, solved: number }> = { 
      'All': { total: state.questions.length, solved: state.progress.completedQuestions.length } 
    };
    state.questions.forEach(q => {
      if (!stats[q.subject]) stats[q.subject] = { total: 0, solved: 0 };
      stats[q.subject].total++;
      if (state.progress.completedQuestions.includes(q.id)) {
        stats[q.subject].solved++;
      }
    });
    return stats;
  }, [state.questions, state.progress.completedQuestions]);

  const subjects = useMemo(() => {
    return ['All', ...new Set(state.questions.map(q => q.subject))];
  }, [state.questions]);

  const years = useMemo(() => {
    const yearsSet = new Set<string>(state.questions.map(q => q.year.toString()));
    return ['All', ...Array.from(yearsSet)].sort((a, b) => b.localeCompare(a));
  }, [state.questions]);

  const renderLogin = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');

    return (
      <div className="min-h-screen bg-earth-50 dark:bg-earth-950 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-earth-900 p-8 rounded-3xl shadow-xl max-w-md w-full border border-earth-100 dark:border-earth-800"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <BookOpen size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-earth-900 dark:text-earth-50">
              Eco<span className="text-brand-500">Study</span>
            </h1>
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setError('');
              const form = e.target as HTMLFormElement;
              const usernameInput = form.elements.namedItem('username') as HTMLInputElement;
              const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
              const username = usernameInput.value.trim();
              const password = passwordInput.value;
              
              if (username && password) {
                const usersStr = localStorage.getItem('ecostudy_users');
                const users = usersStr ? JSON.parse(usersStr) : {};

                if (isSignUp) {
                  if (users[username]) {
                    setError('Username already exists');
                    return;
                  }
                  users[username] = password;
                  localStorage.setItem('ecostudy_users', JSON.stringify(users));
                } else {
                  if (!users[username] || users[username] !== password) {
                    setError('Invalid username or password');
                    return;
                  }
                }

                playClickSound();
                localStorage.setItem('ecostudy_username', username);
                const saved = localStorage.getItem(`ecostudy_progress_${username}`);
                const progress = saved ? JSON.parse(saved) : INITIAL_PROGRESS;
                
                setState(s => ({ 
                  ...s, 
                  isAuthenticated: true, 
                  currentView: 'dashboard',
                  username,
                  progress
                }));
              }
            }}
            className="space-y-4"
          >
            {error && (
              <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-600 dark:text-danger-400 text-sm font-medium text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-earth-700 dark:text-earth-300 mb-1.5">Username</label>
              <input 
                type="text" 
                name="username"
                required
                className="w-full px-4 py-3 rounded-xl bg-earth-50 dark:bg-earth-950 border border-earth-200 dark:border-earth-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-earth-900 dark:text-earth-50"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-earth-700 dark:text-earth-300 mb-1.5">Password</label>
              <input 
                type="password" 
                name="password"
                required
                className="w-full px-4 py-3 rounded-xl bg-earth-50 dark:bg-earth-950 border border-earth-200 dark:border-earth-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-earth-900 dark:text-earth-50"
                placeholder="Enter your password"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 mt-6 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm font-medium text-earth-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-10 p-6 md:p-12 max-w-5xl mx-auto">
      <header className="flex justify-between items-end border-b border-earth-200 dark:border-earth-800 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-earth-900 dark:text-earth-50">Dashboard</h1>
          <p className="text-earth-500 dark:text-earth-400 mt-1">Track your progress and continue learning.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success-500/10 text-success-600 dark:text-success-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" />
            Live Session
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-clean group hover:border-brand-400 dark:hover:border-brand-600 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-earth-400 mb-1">Accuracy</p>
              <p className="text-3xl font-bold font-mono text-success-500">{state.progress.accuracy}%</p>
            </div>
            <div className="p-2.5 bg-success-500/10 text-success-500 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
        <div className="card-clean group hover:border-brand-400 dark:hover:border-brand-600 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-earth-400 mb-1">Streak</p>
              <p className="text-3xl font-bold font-mono text-warning-500">{state.progress.streak}</p>
            </div>
            <div className="p-2.5 bg-warning-500/10 text-warning-500 rounded-xl">
              <Flame size={20} />
            </div>
          </div>
        </div>
        <div className="card-clean group hover:border-brand-400 dark:hover:border-brand-600 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-earth-400 mb-1">Completed</p>
              <p className="text-3xl font-bold font-mono text-info-500">{state.progress.completedQuestions.length}</p>
            </div>
            <div className="p-2.5 bg-info-500/10 text-info-500 rounded-xl">
              <Trophy size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-clean flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Practice</h2>
            <p className="text-earth-500 text-sm mb-6">Dive back into your studies with personalized practice sessions.</p>
          </div>
          <button 
            onClick={() => { playClickSound(); setState(s => ({ ...s, currentView: 'browser' })) }}
            className="btn-primary w-full"
          >
            Browse Questions
          </button>
        </div>
        
        <div className="card-clean">
          <h2 className="text-xl font-bold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {state.progress.badges.length > 0 ? (
              state.progress.badges.map(badge => (
                <div key={badge} className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 dark:bg-brand-500/20 rounded-full text-xs font-bold text-brand-600 dark:text-brand-300 border border-brand-500/20">
                  <Trophy size={14} className="text-warning-500" />
                  {badge}
                </div>
              ))
            ) : (
              <p className="text-earth-400 text-sm italic">No badges earned yet. Keep studying!</p>
            )}
          </div>
        </div>

        <div className="card-clean bg-brand-500/5 border-brand-500/20 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all" />
          <div>
            <h2 className="text-xl font-bold mb-2 text-brand-600 dark:text-brand-400">Secret Resource</h2>
            <p className="text-earth-500 text-sm mb-6">Unlock a hidden study guide to boost your performance by 200%.</p>
          </div>
          <button 
            onClick={() => { playClickSound(); setPrankStep('error'); }}
            className="btn-primary w-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            Unlock Now
          </button>
        </div>
      </div>
    </div>
  );

  const renderBrowser = () => {
    const isChapterSelected = state.selectedChapter !== null;
    const selectedChapterQuestions = (isChapterSelected && state.selectedSubject)
      ? groupedQuestions[state.selectedSubject]?.[state.selectedChapter!] || []
      : [];

    return (
      <div className="min-h-screen bg-earth-50 dark:bg-earth-950 flex flex-col md:flex-row">
        {/* Sidebar for Subjects */}
        <aside className="w-full md:w-72 bg-white dark:bg-earth-900 border-r border-earth-200 dark:border-earth-800 p-8 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { playClickSound(); setState(s => ({ ...s, currentView: 'dashboard' })) }}
              className="p-3 rounded-xl bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400 hover:bg-brand-500 hover:text-white transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-black tracking-tight">Subjects</h2>
          </div>

          <nav className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-earth-400 mt-4 mb-2 px-2">Year</h3>
            <div className="flex flex-wrap gap-2 px-2">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => { 
                    playClickSound(); 
                    setState(s => ({ ...s, activeYear: year, selectedChapter: null, selectedSubject: null })); 
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    state.activeYear === year 
                      ? 'bg-brand-500 text-white' 
                      : 'bg-earth-100 dark:bg-earth-800 text-earth-500 hover:bg-earth-200 dark:hover:bg-earth-700'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-widest text-earth-400 mt-6 mb-2 px-2">Subject</h3>
            {subjects.map(subject => (
              <button
                key={subject}
                onClick={() => { 
                  playClickSound(); 
                  setState(s => ({ ...s, activeSubject: subject, selectedChapter: null, selectedSubject: null })); 
                }}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all group ${
                  state.activeSubject === subject 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-earth-500 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers size={18} className={state.activeSubject === subject ? 'text-white' : 'text-earth-400'} />
                  {subject}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    state.activeSubject === subject 
                      ? 'bg-white/20 text-white' 
                      : 'bg-earth-100 dark:bg-earth-800 text-earth-500'
                  }`}>
                    {subjectStats[subject].solved}/{subjectStats[subject].total}
                  </span>
                  {state.activeSubject === subject && <ChevronRight size={16} />}
                </div>
              </button>
            ))}
          </nav>

          <div className="mt-auto p-6 bg-brand-500/5 dark:bg-brand-500/10 rounded-3xl border border-brand-500/10">
            <div className="flex items-center gap-3 mb-3">
              <Target size={18} className="text-brand-600 dark:text-brand-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">Daily Goal</span>
            </div>
            <div className="h-2 bg-earth-200 dark:bg-earth-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-brand-500 w-[65%]" />
            </div>
            <p className="text-[10px] font-bold text-earth-500">13/20 Questions solved</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-12">
            {/* Header with Search and Stats */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
              <div className="space-y-2">
                <h1 className="text-5xl font-black tracking-tight text-earth-900 dark:text-earth-50">
                  {isChapterSelected ? state.selectedChapter : state.activeSubject === 'All' ? 'Question Bank' : state.activeSubject}
                </h1>
                <p className="text-earth-500 dark:text-earth-400 font-medium">
                  {isChapterSelected 
                    ? `Practicing ${selectedChapterQuestions.length} questions from this chapter.` 
                    : `Explore ${state.questions.length} questions across all subjects.`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-80 group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-earth-400 group-focus-within:text-brand-500 transition-colors">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Search questions..."
                    value={state.searchQuery}
                    onChange={(e) => setState(s => ({ ...s, searchQuery: e.target.value }))}
                    className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm font-medium text-sm"
                  />
                  {state.searchQuery && (
                    <button 
                      onClick={() => { playClickSound(); setState(s => ({ ...s, searchQuery: '' })) }}
                      className="absolute right-4 inset-y-0 flex items-center text-earth-400 hover:text-earth-600 dark:hover:text-earth-200 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                    <BookOpen size={16} />
                    <span className="text-sm font-bold">{state.questions.length}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-success-500/10 text-success-600 dark:text-success-400 rounded-xl">
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-bold">{state.progress.completedQuestions.length}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-warning-500/10 text-warning-600 dark:text-warning-400 rounded-xl">
                    <Flame size={16} />
                    <span className="text-sm font-bold">{state.progress.streak}</span>
                  </div>
                </div>
              </div>
            </header>

            {!isChapterSelected ? (
              <div className="space-y-16">
                {Object.entries(groupedQuestions).length > 0 ? (
                  Object.entries(groupedQuestions).map(([subject, chapters]) => (
                    <div key={subject} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black tracking-tight text-earth-900 dark:text-earth-50">{subject}</h2>
                        <div className="h-px flex-1 bg-earth-200 dark:bg-earth-800" />
                        <span className="px-3 py-1 bg-earth-100 dark:bg-earth-800 rounded-full text-[10px] font-black uppercase tracking-widest text-earth-500">
                          {Object.keys(chapters).length} Chapters
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Object.entries(chapters).map(([chapter, questions]) => {
                          const solvedCount = questions.filter(q => state.progress.completedQuestions.includes(q.id)).length;
                          const progress = Math.round((solvedCount / questions.length) * 100);
                          
                          return (
                            <motion.div 
                              key={chapter}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ y: -4 }}
                              className="group"
                            >
                              <div 
                                onClick={() => { 
                                  playClickSound(); 
                                  setState(s => ({ 
                                    ...s, 
                                    selectedChapter: chapter, 
                                    selectedSubject: subject,
                                    currentQuestionIndex: 0,
                                    selectedOption: null,
                                    showSolution: false
                                  }));
                                }}
                                className="h-full p-6 bg-white dark:bg-earth-900 rounded-[2rem] border border-earth-200 dark:border-earth-800 shadow-sm hover:shadow-xl hover:border-brand-500/50 transition-all flex flex-col cursor-pointer"
                              >
                                <div className="flex justify-between items-start mb-6">
                                  <div className="w-12 h-12 flex items-center justify-center bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl group-hover:bg-brand-500 group-hover:text-white transition-all">
                                    <BookOpen size={20} />
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-earth-400 mb-1">
                                      {subject}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={12} className="text-earth-400" />
                                      <span className="text-[10px] font-bold text-earth-500">~{questions.length * 2}m</span>
                                    </div>
                                  </div>
                                </div>

                                <h3 className="text-lg font-bold text-earth-900 dark:text-earth-50 mb-4 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                                  {chapter}
                                </h3>

                                <div className="mt-auto space-y-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                      <span className="text-earth-400">{questions.length} Questions</span>
                                      <span className="text-success-500">{progress}% Done</span>
                                    </div>
                                    <div className="h-1.5 bg-earth-100 dark:bg-earth-800 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-success-500"
                                      />
                                    </div>
                                  </div>

                                  <div className="w-full py-3.5 bg-earth-50 dark:bg-earth-950 text-earth-900 dark:text-earth-50 font-bold rounded-xl border border-earth-200 dark:border-earth-800 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all flex items-center justify-center gap-2 group/btn text-sm">
                                    View Questions
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-earth-100 dark:bg-earth-900 rounded-full flex items-center justify-center text-earth-300 dark:text-earth-700 mb-6">
                      <Search size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-earth-900 dark:text-earth-50 mb-2">No chapters found</h3>
                    <p className="text-earth-500 dark:text-earth-400">Try adjusting your search or subject filters.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Question List View */
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { playClickSound(); setState(s => ({ ...s, selectedChapter: null })) }}
                      className="flex items-center gap-2 text-earth-500 hover:text-earth-900 dark:hover:text-earth-50 transition-colors font-bold text-sm uppercase tracking-widest"
                    >
                      <ArrowLeft size={16} />
                      Back to Chapters
                    </button>
                    <div className="h-4 w-px bg-earth-200 dark:bg-earth-800" />
                    <span className="text-sm font-bold text-earth-400 uppercase tracking-widest">{state.selectedSubject}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        playClickSound();
                        setState(s => ({ 
                          ...s, 
                          currentView: 'practice',
                          currentQuestionIndex: 0,
                          selectedOption: null,
                          showSolution: false
                        }));
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                    >
                      <Target size={14} />
                      Practice Now
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl text-xs font-bold text-earth-500">
                      <Filter size={14} />
                      Filter
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                  {selectedChapterQuestions.map((q, idx) => {
                    const isSolved = state.progress.completedQuestions.includes(q.id);
                    const status = state.progress.questionStatus?.[q.id];
                    
                    let iconClass = "border-earth-200 dark:border-earth-800 text-earth-600 dark:text-earth-400 hover:border-brand-500 hover:text-brand-500 bg-white dark:bg-earth-900";
                    
                    if (status === 'correct') {
                      iconClass = "bg-success-500 border-success-500 text-white shadow-md shadow-success-500/20";
                    } else if (status === 'incorrect') {
                      iconClass = "bg-danger-500 border-danger-500 text-white shadow-md shadow-danger-500/20";
                    } else if (isSolved) {
                      iconClass = "bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/20";
                    }

                    return (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.01 }}
                      >
                        <button
                          onClick={() => {
                            playClickSound();
                            setState(s => ({ 
                              ...s, 
                              currentView: 'practice',
                              currentQuestionIndex: idx,
                              selectedOption: null,
                              showSolution: false,
                              isExplanationExpanded: false
                            }));
                          }}
                          className={`w-full aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 ${iconClass}`}
                          title={q.text}
                        >
                          <span className="text-lg font-black">{idx + 1}</span>
                          {status === 'correct' && <Check size={14} strokeWidth={3} />}
                          {status === 'incorrect' && <X size={14} strokeWidth={3} />}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  };

  const renderPractice = () => {
    if (!state.selectedSubject || !state.selectedChapter) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <AlertCircle size={48} className="text-danger-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Session Error</h2>
          <p className="text-earth-500 mb-6">We couldn't find the selected chapter. Please go back and try again.</p>
          <button 
            onClick={() => setState(s => ({ ...s, currentView: 'browser', selectedChapter: null }))}
            className="btn-primary"
          >
            Back to Browser
          </button>
        </div>
      );
    }

    const chapterQuestions = allGroupedQuestions[state.selectedSubject]?.[state.selectedChapter] || [];
    const question = chapterQuestions[state.currentQuestionIndex];

    if (!question) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <AlertCircle size={48} className="text-danger-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Question Not Found</h2>
          <p className="text-earth-500 mb-6">The question you're looking for doesn't exist in this chapter.</p>
          <button 
            onClick={() => setState(s => ({ ...s, currentView: 'browser' }))}
            className="btn-primary"
          >
            Back to Browser
          </button>
        </div>
      );
    }

    const { selectedOption, showSolution } = state;
    const progress = chapterQuestions.length > 0 ? ((state.currentQuestionIndex + 1) / chapterQuestions.length) * 100 : 0;

    const handleNext = () => {
      playClickSound();
      if (state.currentQuestionIndex < chapterQuestions.length - 1) {
        setState(s => ({ 
          ...s, 
          currentQuestionIndex: s.currentQuestionIndex + 1,
          selectedOption: null,
          showSolution: false,
          isExplanationExpanded: false
        }));
      } else {
        setState(s => ({ ...s, currentView: 'browser', selectedChapter: null, isExplanationExpanded: false }));
      }
    };

    return (
      <div className="min-h-screen bg-white dark:bg-earth-950 flex flex-col">
        {/* Top Navigation & Progress */}
        <nav className="sticky top-0 z-30 bg-white/80 dark:bg-earth-950/80 backdrop-blur-md border-b border-earth-100 dark:border-earth-900 px-4 py-3 md:px-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
            <button 
              onClick={() => { playClickSound(); setState(s => ({ ...s, currentView: 'browser' })) }}
              className="p-2 hover:bg-earth-100 dark:hover:bg-earth-900 rounded-full transition-colors text-earth-500"
            >
              <X size={24} />
            </button>
            
            <div className="flex-1 max-w-md">
              <div className="flex justify-between items-center mb-1.5 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-earth-400">
                  Question {state.currentQuestionIndex + 1} of {chapterQuestions.length}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 bg-earth-100 dark:bg-earth-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => { playClickSound(); setState(s => ({ ...s, showCalculator: true })) }}
                className="p-2.5 bg-earth-100 dark:bg-earth-900 text-earth-600 dark:text-earth-400 hover:bg-brand-500 hover:text-white rounded-xl transition-all shadow-sm"
                title="Open Calculator"
              >
                <Calculator size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-warning-500/10 text-warning-600 dark:text-warning-400 rounded-full">
                <Flame size={14} />
                <span className="text-xs font-bold">{state.progress.streak}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Question Content */}
        <main className="flex-1 overflow-y-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto space-y-10">
            {/* Question Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    question.difficulty === 'Easy' ? 'bg-success-500/10 text-success-600' :
                    question.difficulty === 'Medium' ? 'bg-warning-500/10 text-warning-600' :
                    'bg-danger-500/10 text-danger-600'
                  }`}>
                    {question.difficulty}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-earth-400">
                    {question.year} • {state.selectedSubject}
                  </span>
                </div>
                <button 
                  onClick={() => { playClickSound(); setState(s => ({ ...s, showCalculator: true })) }}
                  className="p-2 text-earth-400 hover:text-brand-500 transition-colors"
                  title="Calculator"
                >
                  <Calculator size={18} />
                </button>
              </div>
              <h2 className="text-xl md:text-2xl font-bold leading-snug text-earth-900 dark:text-earth-50">
                {question.text}
              </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === question.correctAnswer;
                const isWrong = isSelected && !isCorrect;
                
                let cardClass = "border-earth-200 dark:border-earth-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-earth-50 dark:hover:bg-earth-900/50";
                let letterClass = "bg-earth-50 dark:bg-earth-900 text-earth-500 border-earth-200 dark:border-earth-800";

                if (showSolution) {
                  if (isCorrect) {
                    cardClass = "border-success-500 bg-success-50 dark:bg-success-950/20 text-success-700 dark:text-success-400";
                    letterClass = "bg-success-500 text-white border-success-500";
                  } else if (isWrong) {
                    cardClass = "border-danger-500 bg-danger-50 dark:bg-danger-950/20 text-danger-700 dark:text-danger-400";
                    letterClass = "bg-danger-500 text-white border-danger-500";
                  } else {
                    cardClass = "border-earth-100 dark:border-earth-900 opacity-40 grayscale-[0.5]";
                    letterClass = "bg-earth-50 dark:bg-earth-900 text-earth-400 border-earth-100 dark:border-earth-900";
                  }
                } else if (isSelected) {
                  cardClass = "border-brand-500 bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 ring-2 ring-brand-500/20";
                  letterClass = "bg-brand-500 text-white border-brand-500";
                }

                return (
                  <button
                    key={idx}
                    disabled={showSolution}
                    onClick={() => { 
                      setState(s => ({ ...s, selectedOption: idx, showSolution: true }));
                      handleAnswer(question.id, idx === question.correctAnswer);
                    }}
                    className={`w-full p-4 md:p-5 rounded-2xl text-left border-2 transition-all duration-200 flex items-center justify-between group ${cardClass}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all ${letterClass}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-bold text-sm md:text-base">{option}</span>
                    </div>
                    {showSolution && isCorrect && <CheckCircle2 size={20} className="text-success-500" />}
                    {showSolution && isWrong && <XCircle size={20} className="text-danger-500" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation Section */}
            <AnimatePresence>
              {showSolution && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-earth-50 dark:bg-earth-900/50 rounded-3xl border border-earth-100 dark:border-earth-800 overflow-hidden"
                >
                  <button
                    onClick={() => setState(s => ({ ...s, isExplanationExpanded: !s.isExplanationExpanded }))}
                    className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-earth-100 dark:hover:bg-earth-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
                        <AlertCircle size={18} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-earth-500">Explanation</h4>
                    </div>
                    {state.isExplanationExpanded ? <ChevronDown size={20} className="text-earth-400" /> : <ChevronRight size={20} className="text-earth-400" />}
                  </button>
                  <AnimatePresence>
                    {state.isExplanationExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 md:px-8 pb-6 md:pb-8"
                      >
                        <p className="text-earth-700 dark:text-earth-300 leading-relaxed font-medium pt-4 border-t border-earth-100 dark:border-earth-800">
                          {question.explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom Action Bar */}
        <footer className="sticky bottom-0 bg-white dark:bg-earth-950 border-t border-earth-100 dark:border-earth-900 p-4 md:p-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 md:flex-none">
              {showSolution && (
                <div className={`flex items-center gap-2 font-bold ${selectedOption === question.correctAnswer ? 'text-success-600' : 'text-danger-600'}`}>
                  {selectedOption === question.correctAnswer ? (
                    <><CheckCircle2 size={20} /> Correct!</>
                  ) : (
                    <><XCircle size={20} /> Incorrect</>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playClickSound();
                  if (state.currentQuestionIndex > 0) {
                    setState(s => ({
                      ...s,
                      currentQuestionIndex: s.currentQuestionIndex - 1,
                      selectedOption: null,
                      showSolution: false,
                      isExplanationExpanded: false
                    }));
                  }
                }}
                disabled={state.currentQuestionIndex === 0}
                className={`flex-1 md:flex-none md:min-w-[140px] py-4 px-6 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                  state.currentQuestionIndex === 0
                    ? 'opacity-50 cursor-not-allowed bg-earth-100 dark:bg-earth-900 text-earth-400'
                    : 'bg-earth-100 dark:bg-earth-900 text-earth-600 dark:text-earth-400 hover:bg-earth-200 dark:hover:bg-earth-800'
                }`}
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <button 
                onClick={handleNext}
                className={`flex-1 md:flex-none md:min-w-[200px] py-4 px-6 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                  showSolution 
                    ? 'bg-earth-900 dark:bg-white text-white dark:text-black hover:opacity-90' 
                    : 'bg-earth-100 dark:bg-earth-900 text-earth-600 dark:text-earth-400 hover:bg-earth-200 dark:hover:bg-earth-800'
                }`}
              >
                {state.currentQuestionIndex < chapterQuestions.length - 1 ? (showSolution ? 'Next Question' : 'Skip Question') : 'Finish Module'}
                {showSolution ? <ArrowRight size={20} /> : <SkipForward size={20} />}
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  const renderPrank = () => {
    if (prankStep === 'error') {
      return (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-earth-950/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="relative z-10 w-full md:w-[450px] h-full bg-earth-50 dark:bg-earth-900 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] border-l border-earth-200 dark:border-earth-800 p-8 md:p-12 flex flex-col justify-center"
          >
            <div className="space-y-8">
              <div className="inline-flex p-5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl">
                <AlertCircle size={56} />
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl font-black tracking-tighter leading-none uppercase italic">Error <span className="text-red-600">404</span></h1>
                <h2 className="text-2xl text-earth-500 font-bold tracking-tight">Motivation Not Found</h2>
                <p className="text-earth-400 text-lg leading-relaxed">The system has detected a critical drop in inspiration. Immediate recalibration is required to prevent total productivity collapse.</p>
              </div>
              <button 
                onClick={() => {
                  try { playClickSound(); } catch(e) {}
                  startPrankFix();
                }} 
                className="w-full bg-earth-900 dark:bg-white text-white dark:text-black py-6 rounded-2xl text-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                Initiate Fix
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    if (prankStep === 'fixing') {
      return (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-earth-950/40 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="relative z-10 w-full md:w-[450px] h-full bg-earth-50 dark:bg-earth-900 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] border-l border-earth-200 dark:border-earth-800 p-8 md:p-12 flex flex-col justify-center"
          >
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <RefreshCw className="animate-spin text-forest-600" size={32} />
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                    Restructuring <span className="text-forest-600">Reality</span>
                  </h2>
                </div>
                <p className="text-earth-400 font-medium">Synchronizing neural pathways and optimizing motivational flux...</p>
              </div>
              
              <div className="space-y-6">
                <div className="h-6 w-full bg-earth-200 dark:bg-earth-800 rounded-full overflow-hidden border-2 border-earth-300 dark:border-earth-700 p-1.5">
                  <motion.div 
                    className="h-full bg-forest-600 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${prankProgress}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="absolute inset-0 bg-white/30 blur-sm"
                    />
                  </motion.div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-earth-400">Current Task</p>
                    <motion.p
                      key={Math.floor(prankProgress / 20)}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm font-bold text-earth-900 dark:text-earth-100"
                    >
                      {prankProgress < 20 ? 'Mapping Synapses' : 
                       prankProgress < 40 ? 'Injecting Enthusiasm' : 
                       prankProgress < 60 ? 'Bypassing Procrastination' : 
                       prankProgress < 80 ? 'Finalizing Dopamine' : 'Ready for Deployment'}
                    </motion.p>
                  </div>
                  <span className="text-4xl font-black italic tracking-tighter text-forest-600">{Math.floor(prankProgress)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[...Array(12)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      opacity: [0.1, 0.4, 0.1],
                      height: [4, 12, 4]
                    }}
                    transition={{ duration: Math.random() * 0.5 + 0.5, repeat: Infinity, delay: i * 0.05 }}
                    className="w-full bg-forest-600/30 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    if (prankStep === 'reveal') {
      return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="w-full h-full relative"
          >
            <img 
              className="absolute inset-0 w-full h-full object-cover"
              src={RICKROLL_GIF}
              alt="Rickroll" 
              referrerPolicy="no-referrer"
            />
            
            {/* Glitch Overlay */}
            <motion.div 
              animate={{ 
                opacity: [0, 0.05, 0],
                x: [-10, 10, -5, 0]
              }}
              transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 bg-white pointer-events-none mix-blend-overlay"
            />

            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-black/80 via-transparent to-transparent" />
            
            <div className="absolute top-0 bottom-0 right-0 w-full md:w-[450px] flex flex-col items-center justify-center gap-8 p-8 md:p-12 pointer-events-auto z-20">
              {/* Glitch Intro Animation - Now inside the sidebar area */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="absolute inset-0 z-30 bg-white flex items-center justify-center pointer-events-none"
              >
                <motion.h1 
                  animate={{ 
                    scale: [1, 1.5, 1],
                    rotate: [0, 5, -5, 0],
                    filter: ["blur(0px)", "blur(10px)", "blur(0px)"]
                  }}
                  transition={{ duration: 0.2, repeat: 5 }}
                  className="text-5xl font-black italic tracking-tighter text-black"
                >
                  GOTCHA!
                </motion.h1>
              </motion.div>

              <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 3, type: 'spring' }}
                className="glass-panel p-8 rounded-3xl border-white/20 text-center w-full shadow-2xl backdrop-blur-xl"
              >
                <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic leading-none">
                  System <span className="text-brand-400">Restored</span>
                </h2>
                <p className="text-white/60 text-sm mb-6 font-medium">You survived the motivation glitch. Your reward awaits.</p>
                <div className="flex items-center justify-center gap-3 bg-brand-500 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-brand-500/40">
                  <Trophy size={18} className="text-warning-400" />
                  <span>Badge: Glitch Survivor</span>
                </div>
              </motion.div>
              
              <motion.button 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  boxShadow: ["0 0 0 0 rgba(255,255,255,0)", "0 0 30px 10px rgba(255,255,255,0.3)", "0 0 0 0 rgba(255,255,255,0)"]
                }}
                transition={{ 
                  delay: 5,
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
                onClick={() => {
                  try { playClickSound(); } catch(e) {}
                  if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                  setPrankStep('none');
                  setState(s => ({ 
                    ...s, 
                    progress: { ...s.progress, badges: [...new Set([...s.progress.badges, 'Glitch Survivor'])] }
                  }));
                }}
                className="group w-full flex items-center justify-center gap-4 bg-white text-black px-8 py-6 rounded-3xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl cursor-pointer"
              >
                <SkipForward size={24} className="group-hover:translate-x-1 transition-transform" />
                <span className="text-lg">Back to Reality</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    return null;
  };

  const renderCalculator = () => {
    if (!state.showCalculator) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setState(s => ({ ...s, showCalculator: false }))}
          className="absolute inset-0 bg-earth-950/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-[320px] bg-white dark:bg-earth-900 rounded-[2.5rem] border border-earth-200 dark:border-earth-800 shadow-2xl overflow-hidden"
        >
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-earth-400">
                <Calculator size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Calculator</span>
              </div>
              <button 
                onClick={() => setState(s => ({ ...s, showCalculator: false }))}
                className="p-2 hover:bg-earth-100 dark:hover:bg-earth-800 rounded-full transition-colors text-earth-400"
              >
                <X size={18} />
              </button>
            </div>

            <CalculatorComponent />
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans">
      <main className={state.currentView !== 'login' ? "pb-20 md:pb-0 md:pl-20" : ""}>
        {state.currentView === 'login' && renderLogin()}
        {state.currentView === 'dashboard' && renderDashboard()}
        {state.currentView === 'browser' && renderBrowser()}
        {state.currentView === 'practice' && renderPractice()}
      </main>

      {/* Navigation Bar (Mobile Bottom / Desktop Left) */}
      {state.currentView !== 'login' && (
        <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-20 bg-white dark:bg-earth-950 border-t md:border-t-0 md:border-r border-earth-200 dark:border-earth-900 flex md:flex-col items-center justify-around md:justify-center md:gap-8 p-4 z-40">
          <button 
            onClick={() => { playClickSound(); setState(s => ({ ...s, currentView: 'dashboard' })) }}
            className={`p-3 rounded-xl transition-all ${state.currentView === 'dashboard' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-earth-400 hover:text-brand-600 dark:hover:text-brand-400'}`}
            title="Dashboard"
          >
            <LayoutDashboard size={20} />
          </button>
          <button 
            onClick={() => { playClickSound(); setState(s => ({ ...s, currentView: 'browser' })) }}
            className={`p-3 rounded-xl transition-all ${state.currentView === 'browser' || state.currentView === 'practice' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-earth-400 hover:text-brand-600 dark:hover:text-brand-400'}`}
            title="Question Bank"
          >
            <BookOpen size={20} />
          </button>
          <div className="hidden md:block w-8 h-px bg-earth-200 dark:bg-earth-800 my-2" />
          <button 
            onClick={toggleDarkMode}
            className="p-3 rounded-xl text-earth-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
            title="Toggle Theme"
          >
            {state.isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={handleSettingsClick}
            className="p-3 rounded-xl text-earth-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all" 
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <div className="hidden md:block w-8 h-px bg-earth-200 dark:bg-earth-800 my-2" />
          <button 
            onClick={() => {
              playClickSound();
              localStorage.removeItem('ecostudy_username');
              setState(s => ({ ...s, currentView: 'login', isAuthenticated: false, username: null }));
            }}
            className="p-3 rounded-xl text-earth-400 hover:text-danger-500 transition-all" 
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </nav>
      )}

      {renderPrank()}
      {renderCalculator()}
      <audio 
        ref={audioRef} 
        src={RICKROLL_AUDIO} 
        loop 
        preload="auto"
        onLoadStart={() => console.log("Audio load started.")}
        onLoadedMetadata={() => console.log("Audio metadata loaded.")}
        onLoadedData={() => console.log("Audio data loaded.")}
        onProgress={() => console.log("Audio loading progress...")}
        onCanPlay={() => console.log("Audio can play now.")}
        onCanPlayThrough={() => console.log("Audio can play through now.")}
        onPlay={() => console.log("Audio started playing.")}
        onPause={() => console.log("Audio paused.")}
        onVolumeChange={() => console.log("Audio volume changed to:", audioRef.current?.volume)}
        onWaiting={() => console.log("Audio is buffering...")}
        onStalled={() => console.log("Audio stalled.")}
        onEmptied={() => console.log("Audio emptied.")}
        onSuspend={() => console.log("Audio suspended.")}
        onAbort={() => console.log("Audio aborted.")}
        onError={(e) => console.error("Audio tag error:", e)}
      />
    </div>
  );
}
