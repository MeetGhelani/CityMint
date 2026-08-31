'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, RotateCcw, BookOpen, Settings, History, QrCode } from 'lucide-react';
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
            // LocalStorage fallback recovery
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
        // LocalStorage fallback recovery
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
    <main className="min-h-screen flex flex-col px-6 py-12 bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] relative overflow-y-auto">
      
      {/* Visual Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[var(--accent-mint)]/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[var(--accent-gold)]/5 blur-3xl" />
      </div>

      {/* Header / Brand */}
      <div className="flex flex-col items-center text-center mt-8 z-10">
        {/* Board Game Token Logo */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--accent-mint)] to-[var(--accent-gold)] p-[3px] shadow-2xl mb-6 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo.jpg" 
            alt="CityMint Logo" 
            className="w-full h-full rounded-[21px] object-cover"
          />
        </div>

        <h1 className="text-5xl uppercase mb-2 select-none flex items-center justify-center">
          <span className="brand-title-gold-solid">City</span>
          <span className="brand-title-gold-outline ml-1">Mint</span>
        </h1>
        <p className="text-[var(--text-secondary)] font-semibold tracking-wider uppercase text-xs">
          Own. Build. Prosper.
        </p>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col gap-4 w-full max-w-sm mx-auto mt-10 mb-8 z-10">
        {activeGameId && (
          <Link
            href="/game/active"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-display font-extrabold text-base bg-[var(--accent-gold)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-gold)]/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Continue Current Game
          </Link>
        )}

        <Link
          href="/game/setup"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-display font-extrabold text-base bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-mint)]/20 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          New Game Setup
        </Link>

        <div className="grid grid-cols-3 gap-3 mt-2">
          <button
            onClick={() => setShowRules(true)}
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all"
          >
            <BookOpen className="w-5 h-5 text-[var(--accent-mint)]" />
            <span className="text-xs font-semibold">Rulebook</span>
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all"
          >
            <History className="w-5 h-5 text-[var(--accent-gold)]" />
            <span className="text-xs font-semibold">History ({historyItems.length})</span>
          </button>

          <Link
            href="/qr-cards"
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all"
          >
            <QrCode className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-semibold">QR Cards</span>
          </Link>
        </div>
      </div>

      {/* Brand Feature Highlights */}
      <div className="w-full max-w-sm mx-auto z-10 mb-6">
        <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] text-center mb-4">
          Everything you need to run the game
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🏦', label: 'Smart Banker', sub: 'Auto rent & buy logic' },
            { icon: '📱', label: 'QR Scanning', sub: 'Instant card detection' },
            { icon: '⚡', label: 'Offline First', sub: 'No internet needed' },
          ].map((feat) => (
            <div
              key={feat.label}
              className="flex flex-col items-center text-center p-3 rounded-2xl border border-[var(--border-custom)] bg-[var(--bg-secondary)]/60"
            >
              <span className="text-xl mb-2">{feat.icon}</span>
              <p className="text-[10px] font-bold text-[var(--text-primary)] leading-tight">{feat.label}</p>
              <p className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">{feat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Settings Trigger */}
      <div className="flex justify-between items-center w-full max-w-sm mx-auto z-10 border-t border-[var(--border-custom)] pt-6 pb-8 mt-auto">
        <span className="text-xs text-[var(--text-secondary)] font-medium">
          CityMint Banker PWA Version 1.0
        </span>
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-secondary)] active:bg-[var(--bg-elevated)] transition-all"
        >
          <Settings className="w-4 h-4 text-[var(--text-primary)]" />
        </button>
      </div>

      {/* MODAL overlays */}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col animate-in slide-in-from-bottom duration-250">
          <div className="flex-1 overflow-hidden relative">
            <RulebookSearch onClose={() => setShowRules(false)} />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-250">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-extrabold text-xl text-[var(--text-primary)]">Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-xs font-bold bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full text-[var(--text-secondary)]"
              >
                Close
              </button>
            </div>

            {/* Audio Toggle */}
            <div className="flex items-center justify-between py-4 border-b border-[var(--border-custom)]">
              <div>
                <h4 className="font-semibold text-sm text-[var(--text-primary)]">Sound Alerts</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Synthesize game scanner beeps</p>
              </div>
              <button
                onClick={handleAudioToggle}
                className={`w-12 h-6 rounded-full p-1 transition-all ${audioEnabled ? 'bg-[var(--accent-mint)]' : 'bg-[var(--border-custom)]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-[var(--bg-primary)] transition-all ${audioEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Themes Option */}
            <div className="py-4">
              <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Color Themes</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'theme-citymint', name: 'CityMint', color: 'bg-[#080F26] border-[#00E5A0]' },
                  { id: 'theme-light',    name: 'Light',    color: 'bg-[#F4F7FF] border-[#00A67E]' },
                  { id: 'theme-dark',     name: 'Dark',     color: 'bg-[#0A0A0F] border-[#4FACFF]' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => handleThemeChange(th.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      theme === th.id 
                        ? 'border-[var(--accent-mint)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold' 
                        : 'border-[var(--border-custom)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full mb-2 border ${th.color}`} />
                    {th.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col p-6 animate-in slide-in-from-bottom duration-250">
          <div className="flex justify-between items-center mb-6 safe-padding-top">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[var(--accent-gold)]" />
              <h3 className="font-display font-extrabold text-xl text-[var(--text-primary)]">Game History</h3>
            </div>
            <button 
              onClick={() => setShowHistory(false)}
              className="text-xs font-bold bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full text-[var(--text-secondary)]"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {historyItems.length > 0 ? (
              historyItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(item.date || item.createdAt).toLocaleDateString()} at{' '}
                      {new Date(item.date || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] px-2 py-0.5 rounded uppercase">
                      Finished
                    </span>
                  </div>
                  
                  <h4 className="font-display font-extrabold text-lg text-[var(--text-primary)] mb-3">
                    🏆 Winner: <span className="text-[var(--accent-gold)]">{item.winnerName}</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-[var(--text-secondary)] border-t border-[var(--border-custom)] pt-3">
                    <div>Game ID: <strong className="text-[var(--text-primary)]">{item.id}</strong></div>
                    <div>Turns Played: <strong className="text-[var(--text-primary)]">{item.turnNumber}</strong></div>
                    <div>Net Worth: <strong className="text-[var(--text-primary)]">₹{item.winnerNetWorth?.toLocaleString() || 'N/A'}</strong></div>
                    <div>Players Count: <strong className="text-[var(--text-primary)]">{item.playerCount}</strong></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <History className="w-12 h-12 text-[var(--text-secondary)] mb-3 opacity-30" />
                <p className="text-sm text-[var(--text-secondary)]">No completed games found yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
    </InstallGate>
  );
}
