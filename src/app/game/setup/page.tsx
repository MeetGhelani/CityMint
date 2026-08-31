'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, User, Palette, CheckCircle, ChevronLeft, ArrowRight } from 'lucide-react';
import { createGame, generateGameId } from '@/lib/gameEngine';
import { localSaveGame, localSaveSetting } from '@/lib/db';
import { syncGameStateToSupabase } from '@/lib/syncEngine';
import QRScanner from '@/components/QRScanner';

interface RegisteredPlayer {
  name: string;
  color: string;
  playerCode: string;
  isRegistered: boolean;
}

const PLAYER_COLORS = [
  { name: 'Blue', colorCode: '#3B82F6', hoverClass: 'border-blue-500 bg-blue-500/10' },
  { name: 'Red', colorCode: '#EF4444', hoverClass: 'border-red-500 bg-red-500/10' },
  { name: 'Green', colorCode: '#10B981', hoverClass: 'border-green-500 bg-green-500/10' },
  { name: 'Purple', colorCode: '#8B5CF6', hoverClass: 'border-purple-500 bg-purple-500/10' },
];

/**
 * Dynamically extracts a color hex code or color keyword from any scanned player QR code.
 */
function extractDynamicColor(code: string): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();

  // 1. Direct hex color match (e.g. #3B82F6 or #EF4444)
  const hexMatch = code.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
  if (hexMatch) return hexMatch[0];

  // 2. Dynamic keyword matching from card code payload
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
    if (upper.includes(key)) {
      return hex;
    }
  }

  return null;
}

export default function GameSetup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(3);
  const [activeSetupSlot, setActiveSetupSlot] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTargetIndex, setScanTargetIndex] = useState<number | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [startingBalance, setStartingBalance] = useState<number | ''>(10000);

  // Setup list initialized with placeholders
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>([
    { name: 'Player 1', color: '#EF4444', playerCode: '', isRegistered: false }, // Placeholder Red
    { name: 'Player 2', color: '#3B82F6', playerCode: '', isRegistered: false }, // Placeholder Blue
    { name: 'Player 3', color: '#10B981', playerCode: '', isRegistered: false }, // Placeholder Green
    { name: 'Player 4', color: '#F59E0B', playerCode: '', isRegistered: false }, // Placeholder Gold
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

    // Check if playerCode is already registered
    const duplicate = registeredPlayers.some(
      (p, idx) => idx !== scanTargetIndex && p.playerCode === decodedText && p.isRegistered
    );

    if (duplicate) {
      setSetupError('This Player Card has already been scanned in this game!');
      setShowScanner(false);
      setScanTargetIndex(null);
      return;
    }

    // Dynamically extract card color from scanned payload
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

    // Validate that all active players have name and code scanned
    const incomplete = activeList.some((p) => !p.name.trim() || !p.playerCode);
    if (incomplete) {
      setSetupError('Please scan a unique Player Card QR for all players before starting.');
      return;
    }

    const balanceNum = startingBalance === '' ? 0 : Number(startingBalance);
    if (isNaN(balanceNum) || balanceNum <= 0) {
      setSetupError('Please enter a valid starting balance greater than 0.');
      return;
    }

    try {
      // 1. Create a new GameState
      const gameData = activeList.map((p) => ({
        name: p.name,
        color: p.color,
        playerCode: p.playerCode,
      }));

      const gameState = createGame(gameData, balanceNum);

      // 2. Save Game state locally
      await localSaveGame(gameState);
      await localSaveSetting('activeGameId', gameState.id);

      // 3. Sync to Supabase in background (optimistic)
      syncGameStateToSupabase(gameState);

      // 4. Redirect to the Active Game Banker Dashboard
      router.push('/game/active');
    } catch (err) {
      console.error('Failed to setup game:', err);
      setSetupError('Failed to initialize local IndexedDB game record.');
    }
  };

  return (
    <main className="h-screen flex flex-col bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">

      {/* ── FIXED HEADER ── */}
      <div className="flex-none px-6 pt-10 pb-4 border-b border-[var(--border-custom)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-display font-extrabold text-xl text-[var(--text-primary)]">Board Setup</h2>
            <p className="text-xs text-[var(--text-secondary)]">Configure banker &amp; register cards</p>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE STEPS AREA ── */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-6">
        <div className="w-full max-w-md mx-auto space-y-6">

          {/* Step 1: Select Player Count */}
          <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)]">
            <h3 className="font-display font-bold text-sm text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Step 1: Player Count
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count as 2 | 3 | 4)}
                  className={`py-3 rounded-xl font-display font-extrabold text-base transition-all ${
                    playerCount === count
                      ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-md shadow-[var(--accent-mint)]/10'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-custom)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {count} Players
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Register Player Cards */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-secondary)] uppercase tracking-wider px-1">
              Step 2: Register Players
            </h3>

            {setupError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                ⚠️ {setupError}
              </div>
            )}

            {registeredPlayers.slice(0, playerCount).map((player, idx) => {
              const isConfigured = player.isRegistered && player.playerCode !== '';

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl bg-[var(--bg-secondary)] border transition-all ${
                    isConfigured
                      ? 'border-[var(--accent-mint)]/40 bg-[var(--accent-mint)]/5'
                      : 'border-[var(--border-custom)]'
                  }`}
                >
                  <div className="flex items-center gap-3 justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {/* Color dot only visible after card is scanned */}
                      {isConfigured && (
                        <span
                          className="w-4 h-4 rounded-full border-2 border-white/40 shadow-sm"
                          style={{ backgroundColor: player.color }}
                        />
                      )}
                      <span className="font-display font-bold text-sm text-[var(--text-primary)]">Player {idx + 1}</span>
                    </div>

                    {isConfigured && (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--accent-mint)]">
                        <CheckCircle className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
                      <input
                        type="text"
                        placeholder="Enter name..."
                        value={player.name}
                        onChange={(e) => handleUpdatePlayer(idx, { name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-custom)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)] text-sm font-semibold placeholder-[var(--text-muted)]"
                      />
                    </div>

                    <button
                      onClick={() => handleScanClick(idx)}
                      className={`px-4 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-bold ${
                        isConfigured
                          ? 'bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30'
                          : 'bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      {isConfigured ? 'Re-scan' : 'Scan Card'}
                    </button>
                  </div>

                  {isConfigured && (
                    <div
                      className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border"
                      style={{
                        backgroundColor: `${player.color}10`,
                        borderColor: `${player.color}30`,
                        borderLeftWidth: '3px',
                        borderLeftColor: player.color,
                      }}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">Card ID</span>
                      <span className="font-mono font-bold text-xs tracking-wider" style={{ color: player.color }}>
                        {player.playerCode}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 3: Starting balance display (Editable) */}
          <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)]">
            <h3 className="font-display font-bold text-sm text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Step 3: Starting Economy (₹)
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setStartingBalance('');
                  } else {
                    const num = Number(val);
                    if (!isNaN(num)) {
                      setStartingBalance(Math.max(0, num));
                    }
                  }
                }}
                placeholder="Starting cash..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-custom)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)] text-sm font-semibold"
              />
              <button
                onClick={() => setStartingBalance(10000)}
                className="px-4 rounded-xl border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 text-xs font-bold transition-all"
              >
                Reset Default
              </button>
            </div>
            <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mt-2.5 px-0.5">
              Credited automatically to all player bank accounts at launch
            </p>
          </div>

        </div>
      </div>

      {/* ── FIXED FOOTER ── */}
      <div className="flex-none px-6 pt-4 pb-8 border-t border-[var(--border-custom)] bg-[var(--bg-primary)]/95 backdrop-blur-md" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
        <button
          onClick={handleStartGame}
          className="flex items-center justify-center gap-2 w-full max-w-md mx-auto py-4 rounded-2xl font-display font-extrabold text-base bg-[var(--accent-mint)] text-[var(--bg-primary)] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
        >
          Start Game
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


