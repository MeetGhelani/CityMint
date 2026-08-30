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

export default function GameSetup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(3);
  const [activeSetupSlot, setActiveSetupSlot] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTargetIndex, setScanTargetIndex] = useState<number | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Setup list initialized with placeholders
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>([
    { name: 'Player A', color: '#3B82F6', playerCode: '', isRegistered: false },
    { name: 'Player B', color: '#EF4444', playerCode: '', isRegistered: false },
    { name: 'Player C', color: '#10B981', playerCode: '', isRegistered: false },
    { name: 'Player D', color: '#8B5CF6', playerCode: '', isRegistered: false },
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

    handleUpdatePlayer(scanTargetIndex, {
      playerCode: decodedText,
      isRegistered: true,
    });
    
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

    try {
      // 1. Create a new GameState
      const gameData = activeList.map((p) => ({
        name: p.name,
        color: p.color,
        playerCode: p.playerCode,
      }));

      const gameState = createGame(gameData);

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
    <main className="flex-1 flex flex-col justify-between px-6 py-8 bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 safe-padding-top">
        <Link 
          href="/" 
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-[var(--border-custom)] text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="font-display font-extrabold text-xl text-white">Board Setup</h2>
          <p className="text-xs text-[var(--text-secondary)]">Configure banker & register cards</p>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full space-y-6 overflow-y-auto pr-1">
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
                    ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)]'
                    : 'bg-white/5 text-white border border-[var(--border-custom)]'
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
            const cColorObj = PLAYER_COLORS[idx] || PLAYER_COLORS[0];

            return (
              <div 
                key={idx}
                className={`p-5 rounded-2xl bg-[var(--bg-secondary)] border transition-all ${
                  isConfigured 
                    ? 'border-[var(--accent-mint)]/30 bg-[var(--accent-mint)]/5' 
                    : 'border-[var(--border-custom)]'
                }`}
              >
                <div className="flex items-center gap-3 justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-white/20" 
                      style={{ backgroundColor: player.color }} 
                    />
                    <span className="font-display font-bold text-sm text-white">Player {idx + 1}</span>
                  </div>
                  {isConfigured && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--accent-mint)]">
                      <CheckCircle className="w-3 h-3" /> Registered
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  {/* Name field */}
                  <div className="flex-1 relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      placeholder={`Enter name...`}
                      value={player.name}
                      onChange={(e) => handleUpdatePlayer(idx, { name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/20 border border-[var(--border-custom)] text-white focus:outline-none focus:border-[var(--accent-mint)] text-sm font-semibold"
                    />
                  </div>

                  {/* QR Scan Button */}
                  <button
                    onClick={() => handleScanClick(idx)}
                    className={`px-4 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-bold ${
                      isConfigured
                        ? 'bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30'
                        : 'bg-white/5 border border-[var(--border-custom)] text-white hover:bg-white/10'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    {isConfigured ? 'Scan Again' : 'Scan Card'}
                  </button>
                </div>
                
                {/* Code display */}
                {isConfigured && (
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-2 pl-1 bg-black/25 py-1 rounded max-w-max">
                    Card ID: {player.playerCode}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Starting balance config display */}
        <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-center">
          <p className="text-xs text-[var(--text-secondary)]">Fixed Starting Economy</p>
          <p className="font-display font-extrabold text-2xl text-[var(--accent-gold)] mt-1">₹10,000</p>
          <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mt-1">Credited automatically per player</p>
        </div>
      </div>

      {/* Footer Start Trigger */}
      <div className="w-full max-w-md mx-auto mt-6 z-10">
        <button
          onClick={handleStartGame}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-display font-extrabold text-base bg-[var(--accent-mint)] text-[var(--bg-primary)] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
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
