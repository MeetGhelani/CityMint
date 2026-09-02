'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, User, CheckCircle, ChevronLeft, ArrowRight, Sparkles, RefreshCcw } from 'lucide-react';
import { createGame } from '@/lib/gameEngine';
import { localSaveGame, localSaveSetting } from '@/lib/db';
import { syncGameStateToSupabase } from '@/lib/syncEngine';
import QRScanner from '@/components/QRScanner';

interface RegisteredPlayer {
  name: string;
  color: string;
  playerCode: string;
  isRegistered: boolean;
}

function extractDynamicColor(code: string): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();

  const hexMatch = code.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
  if (hexMatch) return hexMatch[0];

  const COLOR_MAP: Record<string, string> = {
    BLUE: '#3B82F6',
    RED: '#EF4444',
    GREEN: '#10B981',
    GOLD: '#F59E0B',
    YELLOW: '#F59E0B',
    PURPLE: '#8B5CF6',
    VIOLET: '#8B5CF6',
    ORANGE: '#F97316',
    PINK: '#EC4899',
    MAGENTA: '#EC4899',
    CYAN: '#06B6D4',
    TEAL: '#06B6D4',
  };

  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (upper.includes(key)) return hex;
  }

  return null;
}

export default function GameSetup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(3);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTargetIndex, setScanTargetIndex] = useState<number | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [startingBalance, setStartingBalance] = useState<number | string>(10000);

  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>([
    { name: 'Player 1', color: '#EF4444', playerCode: '', isRegistered: false },
    { name: 'Player 2', color: '#3B82F6', playerCode: '', isRegistered: false },
    { name: 'Player 3', color: '#10B981', playerCode: '', isRegistered: false },
    { name: 'Player 4', color: '#F59E0B', playerCode: '', isRegistered: false },
  ]);

  const handleUpdatePlayer = (index: number, fields: Partial<RegisteredPlayer>) => {
    setRegisteredPlayers((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, ...fields } : p))
    );
    setSetupError(null);
  };

  const handleScanClick = (index: number) => {
    setScanTargetIndex(index);
    setShowScanner(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    if (scanTargetIndex === null) return;

    const duplicate = registeredPlayers.some(
      (p, idx) => idx !== scanTargetIndex && p.playerCode === decodedText && p.isRegistered
    );

    if (duplicate) {
      setSetupError('This Player Card has already been scanned in this game!');
      setShowScanner(false);
      setScanTargetIndex(null);
      return;
    }

    const dynamicColor = extractDynamicColor(decodedText);

    const updateFields: Partial<RegisteredPlayer> = {
      playerCode: decodedText,
      isRegistered: true,
    };

    if (dynamicColor) {
      updateFields.color = dynamicColor;
    }

    handleUpdatePlayer(scanTargetIndex, updateFields);
    setShowScanner(false);
    setScanTargetIndex(null);
  };

  const handleStartGame = async () => {
    const activeList = registeredPlayers.slice(0, playerCount);

    const incomplete = activeList.some((p) => !p.name.trim() || !p.playerCode);
    if (incomplete) {
      setSetupError('Please scan a unique Player Card QR for all players before starting.');
      return;
    }

    const balanceNum = typeof startingBalance === 'string' ? Number(startingBalance) : startingBalance;
    if (isNaN(balanceNum) || balanceNum <= 0) {
      setSetupError('Please enter a valid starting balance greater than 0.');
      return;
    }

    try {
      const gameData = activeList.map((p) => ({
        name: p.name,
        color: p.color,
        playerCode: p.playerCode,
      }));

      const gameState = createGame(gameData, balanceNum);

      await localSaveGame(gameState);
      await localSaveSetting('activeGameId', gameState.id);
      syncGameStateToSupabase(gameState);

      router.push('/game/active');
    } catch (err) {
      console.error('Failed to setup game:', err);
      setSetupError('Failed to initialize game record.');
    }
  };

  return (
    <main className="h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none overflow-hidden relative">
      
      {/* Visual Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute bottom-10 -right-32 w-80 h-80 bg-amber-500/5 blur-3xl rounded-full" />
      </div>

      {/* ── FIXED MODERN HEADER ── */}
      <div className="flex-none px-5 sm:px-6 pt-6 sm:pt-8 pb-4 border-b border-[var(--border-custom)] bg-[var(--bg-primary)]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-custom)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-display font-black text-lg sm:text-xl text-[var(--text-primary)] tracking-wide flex items-center gap-2">
              <span>Match Setup</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">Configure players &amp; scan physical QR cards</p>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE SETUP CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6 pt-6 pb-36 space-y-6 z-10 no-scrollbar">
        <div className="w-full max-w-md mx-auto space-y-6">

          {/* Error Alert */}
          {setupError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
              <span className="text-base shrink-0">⚠️</span>
              <span>{setupError}</span>
            </div>
          )}

          {/* STEP 1: Select Player Count */}
          <div className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] space-y-3 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[var(--text-secondary)]">
                Step 1 · Player Count
              </span>
              <span className="text-xs font-extrabold text-[var(--accent-mint)]">
                {playerCount} Active Players
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count as 2 | 3 | 4)}
                  className={`py-3 rounded-2xl font-display font-extrabold text-sm transition-all cursor-pointer ${
                    playerCount === count
                      ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-custom)] hover:border-[var(--border-bright)]'
                  }`}
                >
                  {count} Players
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Register Player Cards */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[var(--text-secondary)]">
                Step 2 · Register Player QR Cards
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">
                {registeredPlayers.slice(0, playerCount).filter((p) => p.isRegistered).length} / {playerCount} Ready
              </span>
            </div>

            {registeredPlayers.slice(0, playerCount).map((player, idx) => {
              const isConfigured = player.isRegistered && player.playerCode !== '';

              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    isConfigured
                      ? 'border-emerald-500/40 bg-emerald-500/5 shadow-md shadow-emerald-950/20'
                      : 'border-[var(--border-custom)] bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {isConfigured && (
                        <span
                          className="w-4 h-4 rounded-full border-2 border-white/40 shadow-xs shrink-0 animate-in zoom-in duration-200"
                          style={{ backgroundColor: player.color }}
                        />
                      )}
                      <span className="font-display font-black text-sm text-[var(--text-primary)]">
                        Player {idx + 1}
                      </span>
                    </div>

                    {isConfigured ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">
                        <CheckCircle className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Scan Card
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <div className="flex-1 relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Enter name..."
                        value={player.name}
                        onChange={(e) => handleUpdatePlayer(idx, { name: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-custom)] text-[var(--text-primary)] text-xs font-bold focus:outline-none focus:border-[var(--accent-mint)] placeholder-[var(--text-muted)]"
                      />
                    </div>

                    <button
                      onClick={() => handleScanClick(idx)}
                      className={`px-4 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-extrabold active:scale-95 transition-all cursor-pointer ${
                        isConfigured
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/15 hover:bg-emerald-300'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isConfigured ? 'Re-scan' : 'Scan'}</span>
                    </button>
                  </div>

                  {isConfigured && (
                    <div
                      className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl border"
                      style={{
                        backgroundColor: `${player.color}15`,
                        borderColor: `${player.color}30`,
                        borderLeftWidth: '3px',
                        borderLeftColor: player.color,
                      }}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-[var(--text-secondary)]">Linked QR Token</span>
                      <span className="font-mono font-bold text-xs tracking-wider" style={{ color: player.color }}>
                        {player.playerCode}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* STEP 3: Starting Economy */}
          <div className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] space-y-3 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[var(--text-secondary)]">
                Step 3 · Starting Cash Capital (₹)
              </span>
              <button
                onClick={() => setStartingBalance(10000)}
                className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCcw className="w-3 h-3 text-amber-400" />
                Reset ₹10k
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={startingBalance === 0 ? '' : startingBalance}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '-') {
                    setStartingBalance(val);
                  } else {
                    const parsed = Number(val);
                    setStartingBalance(isNaN(parsed) ? 0 : parsed);
                  }
                }}
                onFocus={(e) => {
                  if (startingBalance === 0 || startingBalance === '0') {
                    e.target.select();
                  }
                }}
                placeholder="10000"
                className="flex-1 px-4 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-custom)] text-[var(--text-primary)] font-mono text-sm font-extrabold focus:outline-none focus:border-[var(--accent-mint)]"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2.5 pt-1">
              {[10000, 15000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setStartingBalance(preset)}
                  className={`flex-1 py-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                    Number(startingBalance) === preset
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-custom)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  ₹{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── FIXED FLOATING FOOTER ── */}
      <div className="flex-none px-5 pt-3 pb-8 border-t border-[var(--border-custom)] bg-[var(--bg-primary)]/95 backdrop-blur-md z-20" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
        <button
          onClick={handleStartGame}
          className="flex items-center justify-center gap-2.5 w-full max-w-md mx-auto py-4 rounded-2xl font-display font-black text-base bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
        >
          <span>Start Match</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* QR Scanner Overlay */}
      {showScanner && (
        <QRScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
          title={`Register Player ${scanTargetIndex !== null ? scanTargetIndex + 1 : ''}`}
        />
      )}

    </main>
  );
}
