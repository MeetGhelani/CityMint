'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Play, RotateCcw, BookOpen, Settings, History, QrCode, 
  Menu, Bell, Crown, ChevronRight, Landmark, Scan, WifiOff, X
} from 'lucide-react';
import { localGetSetting, localSaveSetting, localGetHistory, localGetGame } from '@/lib/db';
import { loadGameStateFromStorage } from '@/lib/gameEngine';
import { soundEffects } from '@/lib/soundEffects';
import RulebookSearch from '@/components/RulebookSearch';
import InstallGate from '@/components/InstallGate';

export default function Home() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  // Settings State
  const [theme, setTheme] = useState('theme-citymint');
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    // Check for active game
    localGetSetting<string | null>('activeGameId', null).then((id) => {
      if (id) {
        localGetGame(id).then((game) => {
          if (game) {
            setActiveGameId(id);
          } else {
            const savedState = loadGameStateFromStorage();
            if (savedState && savedState.status === 'ACTIVE') {
              setActiveGameId(savedState.id);
              localSaveSetting('activeGameId', savedState.id);
            } else {
              localSaveSetting('activeGameId', null);
            }
          }
        });
      } else {
        const savedState = loadGameStateFromStorage();
        if (savedState && savedState.status === 'ACTIVE') {
          setActiveGameId(savedState.id);
          localSaveSetting('activeGameId', savedState.id);
        }
      }
    });

    // Load History
    localGetHistory().then((items) => {
      setHistoryItems(items);
    });

    // Load Settings
    localGetSetting<string>('theme', 'theme-citymint').then((t) => setTheme(t));
    localGetSetting<boolean>('audioEnabled', true).then((a) => {
      setAudioEnabled(a);
      soundEffects.setAudioEnabled(a);
    });
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localSaveSetting('theme', newTheme);
    document.body.classList.remove('theme-citymint', 'theme-light', 'theme-dark');
    document.body.classList.add(newTheme);
  };

  const handleAudioToggle = () => {
    const nextVal = !audioEnabled;
    setAudioEnabled(nextVal);
    soundEffects.setAudioEnabled(nextVal);
    localSaveSetting('audioEnabled', nextVal);
  };

  return (
    <InstallGate>
      <main className="min-h-screen flex flex-col justify-between px-4 sm:px-6 py-4 sm:py-6 bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden font-sans select-none">
        
        {/* Visual Skyline Glow Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl rounded-full" />
          <div className="absolute top-1/4 -right-32 w-80 h-80 bg-amber-500/5 blur-3xl rounded-full" />
          <div className="absolute bottom-10 -left-32 w-80 h-80 bg-purple-500/5 blur-3xl rounded-full" />
        </div>



        {/* ── HERO BRAND TITLE & ROUND LOGO ── */}
        <div className="flex flex-col items-center text-center z-10 pt-3 pb-2 relative">
          
          {/* Simple Small Round Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-emerald-400 to-cyan-400 shadow-xl shadow-emerald-500/20 mb-3 relative group transition-transform hover:scale-105 cursor-pointer">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0A0B10] flex items-center justify-center border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.jpg" 
                alt="CityMint Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Redesigned Modern Typography */}
          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-widest uppercase select-none mb-1 flex items-center gap-1.5 justify-center">
            <span className="bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,166,35,0.4)]">
              CITY
            </span>
            <span className="bg-gradient-to-br from-emerald-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(0,229,160,0.4)] ml-1">
              MINT
            </span>
          </h1>

          {/* Subtitle Divider */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mt-1">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-amber-500/60" />
            <span className="text-amber-300/90 font-mono tracking-[0.25em]">OWN. BUILD. PROSPER.</span>
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-amber-500/60" />
          </div>
        </div>

        {/* ── MAIN HERO ACTION CARD (NEW GAME / RESUME) ── */}
        <div className="w-full max-w-sm mx-auto z-10 space-y-3 my-2">
          {activeGameId && (
            <Link
              href="/game/active"
              className="group relative w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-display font-bold shadow-xl shadow-amber-500/20 flex items-center justify-between active:scale-[0.98] transition-all overflow-hidden"
            >
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-950/20 border border-slate-950/10 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6 text-slate-950 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-wide leading-tight">RESUME MATCH</h3>
                  <p className="text-[10px] font-semibold text-slate-900/80">Continue active game in progress</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
                <ChevronRight className="w-5 h-5 text-slate-950" />
              </div>
            </Link>
          )}

          <Link
            href="/game/setup"
            className="group relative w-full p-4.5 rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 font-display font-bold shadow-xl shadow-emerald-500/20 flex items-center justify-between active:scale-[0.98] transition-all overflow-hidden border border-emerald-300/30"
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-950/15 border border-slate-950/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
                🎲
              </div>
              <div>
                <h3 className="font-black text-base tracking-wide leading-tight">NEW GAME SETUP</h3>
                <p className="text-[10px] font-bold text-slate-900/80">Start a new CityMint game</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
              <ChevronRight className="w-5 h-5 text-slate-950" />
            </div>
          </Link>
        </div>

        {/* ── 3 MAIN QUICK ACCESS CARDS ── */}
        <div className="w-full max-w-sm mx-auto z-10 my-2">
          <div className="grid grid-cols-3 gap-2.5">
            
            {/* 1. Rulebook Card */}
            <button
              onClick={() => setShowRules(true)}
              className="p-3.5 sm:p-4 rounded-3xl bg-[var(--bg-secondary)] border border-purple-500/30 flex flex-col justify-between h-36 text-left group hover:border-purple-500/60 active:scale-95 transition-all shadow-md shadow-purple-500/10 cursor-pointer relative overflow-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-lg mb-2">
                📖
              </div>
              <div>
                <h4 className="font-display font-extrabold text-xs text-[var(--text-primary)] uppercase tracking-wider leading-tight">RULEBOOK</h4>
                <p className="text-[9px] text-[var(--text-secondary)] leading-tight mt-1">Learn the game rules</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/20 flex items-center justify-center self-start mt-2 group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              </div>
            </button>

            {/* 2. History Card */}
            <button
              onClick={() => setShowHistory(true)}
              className="p-3.5 sm:p-4 rounded-3xl bg-[var(--bg-secondary)] border border-amber-500/30 flex flex-col justify-between h-36 text-left group hover:border-amber-500/60 active:scale-95 transition-all shadow-md shadow-amber-500/10 cursor-pointer relative overflow-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg mb-2">
                🕒
              </div>
              <div>
                <h4 className="font-display font-extrabold text-xs text-[var(--text-primary)] uppercase tracking-wider leading-tight">HISTORY ({historyItems.length})</h4>
                <p className="text-[9px] text-[var(--text-secondary)] leading-tight mt-1">View your past games</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center self-start mt-2 group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              </div>
            </button>

            {/* 3. QR Cards Card */}
            <Link
              href="/qr-cards"
              className="p-3.5 sm:p-4 rounded-3xl bg-[var(--bg-secondary)] border border-cyan-500/30 flex flex-col justify-between h-36 text-left group hover:border-cyan-500/60 active:scale-95 transition-all shadow-md shadow-cyan-500/10 cursor-pointer relative overflow-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-lg mb-2">
                🔲
              </div>
              <div>
                <h4 className="font-display font-extrabold text-xs text-[var(--text-primary)] uppercase tracking-wider leading-tight">QR CARDS</h4>
                <p className="text-[9px] text-[var(--text-secondary)] leading-tight mt-1">Manage player &amp; property cards</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center self-start mt-2 group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              </div>
            </Link>

          </div>
        </div>

        {/* ── EVERYTHING YOU NEED DIVIDER & BADGES ── */}
        <div className="w-full max-w-sm mx-auto z-10 my-2 space-y-2.5">
          <div className="flex items-center gap-2 justify-center">
            <span className="w-10 h-[1px] bg-gradient-to-r from-transparent to-amber-500/40" />
            <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-amber-400/90 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              EVERYTHING YOU NEED
            </span>
            <span className="w-10 h-[1px] bg-gradient-to-l from-transparent to-amber-500/40" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { title: 'SMART BANKER', desc: 'Auto rent & buy calculation', color: 'border-emerald-500/20 bg-[var(--bg-secondary)]', icon: Landmark, iconColor: 'text-emerald-400' },
              { title: 'QR SCANNING', desc: 'Scan cards & play instantly', color: 'border-cyan-500/20 bg-[var(--bg-secondary)]', icon: Scan, iconColor: 'text-cyan-400' },
              { title: 'OFFLINE FIRST', desc: 'Play anytime, anywhere', color: 'border-pink-500/20 bg-[var(--bg-secondary)]', icon: WifiOff, iconColor: 'text-pink-400' },
            ].map((b) => {
              const IconComp = b.icon;
              return (
                <div
                  key={b.title}
                  className={`p-3 rounded-2xl border ${b.color} flex flex-col items-center text-center space-y-1 shadow-sm`}
                >
                  <IconComp className={`w-5 h-5 ${b.iconColor} mb-0.5`} />
                  <h5 className="font-display font-extrabold text-[9px] text-[var(--text-primary)] uppercase tracking-wider leading-tight">{b.title}</h5>
                  <p className="text-[8px] text-[var(--text-secondary)] leading-tight">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FLOATING BOTTOM DOCK FOOTER ── */}
        <div className="w-full max-w-sm mx-auto z-10 pt-2 pb-1">
          <div className="px-4 py-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] backdrop-blur-md flex items-center justify-between shadow-2xl">
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
              CityMint Banker PWA v1.0
            </span>

            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-custom)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all cursor-pointer"
              title="App Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── MODALS ── */}

        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col animate-in slide-in-from-bottom duration-250">
            <div className="flex-1 overflow-hidden relative">
              <RulebookSearch onClose={() => setShowRules(false)} />
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-xs bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-3xl p-5 shadow-2xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-lg">
                🔔
              </div>
              <h3 className="font-display font-extrabold text-base text-[var(--text-primary)]">App System Status</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                CityMint Banker PWA is running smoothly in offline-first mode. All local games are saved automatically.
              </p>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full py-2.5 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-250 text-left relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-black text-xl text-[var(--text-primary)]">App Settings</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-custom)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Audio Toggle */}
              <div className="flex items-center justify-between py-4 border-b border-[var(--border-custom)]">
                <div>
                  <h4 className="font-semibold text-xs text-[var(--text-primary)]">Sound Effects</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Scanner beeps &amp; cash chimes</p>
                </div>
                <button
                  onClick={handleAudioToggle}
                  className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${audioEnabled ? 'bg-[var(--accent-mint)]' : 'bg-[var(--bg-elevated)]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${audioEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Themes Option */}
              <div className="py-4 space-y-3">
                <h4 className="font-semibold text-xs text-[var(--text-primary)]">Visual Color Theme</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'theme-citymint', name: 'Obsidian', color: '#00E5A0' },
                    { id: 'theme-dark',     name: 'Cyber',    color: '#4FACFF' },
                    { id: 'theme-light',    name: 'Light',    color: '#FFFFFF' },
                  ].map((th) => (
                    <button
                      key={th.id}
                      onClick={() => handleThemeChange(th.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                        theme === th.id 
                          ? 'border-[var(--accent-mint)] bg-[var(--accent-mint)]/10 text-[var(--text-primary)] font-bold' 
                          : 'border-[var(--border-custom)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full mb-1.5 border border-white/20" style={{ backgroundColor: th.color }} />
                      {th.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-3 mt-2 rounded-xl font-display font-bold bg-[var(--bg-elevated)] border border-[var(--border-custom)] text-[var(--text-primary)] text-xs hover:bg-[var(--bg-primary)] active:scale-95 transition-all cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col p-6 animate-in slide-in-from-bottom duration-250 text-left">
            <div className="flex justify-between items-center mb-6 safe-padding-top">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-black text-xl text-[var(--text-primary)]">Game History</h3>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-custom)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] space-y-3 shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-[var(--text-secondary)]">
                        {new Date(item.date || item.createdAt).toLocaleDateString()} at{' '}
                        {new Date(item.date || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] font-extrabold tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                        Match Completed
                      </span>
                    </div>
                    
                    <h4 className="font-display font-extrabold text-lg text-[var(--text-primary)]">
                      🏆 Champion: <span className="text-amber-400">{item.winnerName}</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-secondary)] border-t border-[var(--border-custom)] pt-3">
                      <div>Game Code: <strong className="text-[var(--text-primary)] font-mono">{item.id}</strong></div>
                      <div>Turns Played: <strong className="text-[var(--text-primary)] font-mono">{item.turnNumber}</strong></div>
                      <div>Net Worth: <strong className="text-amber-400 font-mono">₹{item.winnerNetWorth?.toLocaleString() || 'N/A'}</strong></div>
                      <div>Players Count: <strong className="text-[var(--text-primary)] font-mono">{item.playerCount}</strong></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <History className="w-12 h-12 text-[var(--text-secondary)] mb-3" />
                  <p className="text-sm text-[var(--text-secondary)]">No completed game matches found yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </InstallGate>
  );
}
