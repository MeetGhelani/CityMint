'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  Camera, RotateCcw, AlertTriangle, ArrowRight, ShieldAlert,
  History, Trophy, Landmark, Info, Search, HeartHandshake,
  UserCheck, Plus, Minus, Check, CheckSquare, Trash2, HelpCircle, ChevronDown
} from 'lucide-react';

import { 
  GameState, Player, Property, GameTransaction, ACTION_CARDS,
  getRentAmount, getPropertyValue, calculateNetWorth,
  endTurn, purchaseProperty, payRent, passStart, activateTeleport,
  sendToJail, releaseFromJail, sellProperty, resolveDebt,
  declareBankruptcy, undoLastAction, manualCorrectState, executeActionCard,
  endGame
} from '@/lib/gameEngine';
import { localGetSetting, localGetGame, localSaveGame, localSaveHistory, localSaveSetting } from '@/lib/db';
import { syncGameStateToSupabase, flushSyncQueue } from '@/lib/syncEngine';
import QRScanner from '@/components/QRScanner';
import CityCard from '@/components/CityCard';
import RulebookSearch from '@/components/RulebookSearch';

export default function ActiveGame() {
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'dashboard' | 'transactions' | 'rules'>('game');

  // Scanner & Modal States
  const [showScanner, setShowScanner] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [scanContext, setScanContext] = useState<'BUY' | 'RENT' | 'TELEPORT' | 'JAIL' | 'ACTION' | 'INFO' | null>(null);
  const [scannedProperty, setScannedProperty] = useState<Property | null>(null);
  const [scannedPlayer, setScannedPlayer] = useState<Player | null>(null);
  
  // Action Card Drawing State
  const [drawnActionId, setDrawnActionId] = useState<string | null>(null);

  // Manual Adjustments Admin Panel State
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminSelectedPlayer, setAdminSelectedPlayer] = useState<string>('');
  const [adminBalanceChange, setAdminBalanceChange] = useState<number>(0);
  const [adminSetJail, setAdminSetJail] = useState<'ACTIVE' | 'IN_JAIL' | ''>('');
  const [adminSelectedProp, setAdminSelectedProp] = useState<string>('');
  const [adminPropOwner, setAdminPropOwner] = useState<string>('');
  const [adminPropLevel, setAdminPropLevel] = useState<number>(1);

  // Timer/Duration Tracker
  const [gameDuration, setGameDuration] = useState(0);
  const durationTimer = useRef<NodeJS.Timeout | null>(null);

  // Custom App Notification / Confirm Dialog States
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ title, message, onConfirm });
  };

  // Load Game on mount
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      flushSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    localGetSetting<string | null>('activeGameId', null).then((id) => {
      if (id) {
        localGetGame(id).then((gameState) => {
          if (gameState) {
            setGame(gameState);
            
            // Set up duration tracking
            const elapsed = Math.floor((Date.now() - new Date(gameState.createdAt).getTime()) / 1000);
            setGameDuration(elapsed > 0 ? elapsed : 0);
          } else {
            router.push('/');
          }
        });
      } else {
        router.push('/');
      }
    });

    // Start timer incrementer
    durationTimer.current = setInterval(() => {
      setGameDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (durationTimer.current) clearInterval(durationTimer.current);
    };
  }, [router]);

  // Helper to apply engine state modifications, persist, and trigger sync
  const updateGameState = async (nextState: GameState) => {
    setGame(nextState);
    setSyncing(true);
    
    // Save locally
    await localSaveGame(nextState);

    // Sync remote
    const synced = await syncGameStateToSupabase(nextState);
    setSyncing(!synced);
  };

  // Celebrate on game end
  useEffect(() => {
    if (game?.status === 'ENDED' && game.winnerId) {
      // Fire confetti sequence
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      
      // Save game to history list
      const winner = game.players.find((p) => p.id === game.winnerId);
      const summary = {
        id: game.id,
        winnerName: winner?.name || 'Unknown',
        winnerNetWorth: winner ? calculateNetWorth(winner, game.properties) : 0,
        playerCount: game.players.length,
        turnNumber: game.turnNumber,
        date: new Date().toISOString(),
        createdAt: game.createdAt,
      };
      localSaveHistory(summary);
      localSaveSetting('activeGameId', null); // Clear active game session from settings
    }
  }, [game?.status, game?.winnerId]);

  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--accent-mint)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentPlayer = game.players.find((p) => p.id === game.currentPlayerId);
  const activeDebtor = game.activeDebt ? game.players.find((p) => p.id === game.activeDebt?.debtorId) : null;
  const activeCreditorName = game.activeDebt?.creditorId === 'BANK' ? 'Bank' : game.players.find((p) => p.id === game.activeDebt?.creditorId)?.name || 'Bank';

  // Format elapsed duration
  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  // Turn management actions
  const handleEndTurn = () => {
    const nextState = endTurn(game);
    updateGameState(nextState);
  };

  const handleUndo = () => {
    if (game.undoStack.length === 0) return;
    const nextState = undoLastAction(game);
    updateGameState(nextState);
  };

  // QR Scanning resolution
  const handleQRScanResolved = (code: string) => {
    setShowScanner(false);
    setScannedResult(code);

    // 1. Process Special Zone: START PASS
    if (code === 'CM-SPECIAL-START') {
      if (game.currentPlayerId) {
        const nextState = passStart(game, game.currentPlayerId);
        updateGameState(nextState);
      }
      return;
    }

    // 2. Process Special Zone: TELEPORT
    if (code.startsWith('CM-SPECIAL-TELEPORT')) {
      if (game.currentPlayerId) {
        const pObj = game.players.find((p) => p.id === game.currentPlayerId);
        if (pObj && pObj.balance < 500) {
          showToast(`Insufficient Balance! Teleportation costs ₹500, but ${pObj.name} only has ₹${pObj.balance}`);
          return;
        }
        const nextState = activateTeleport(game, game.currentPlayerId);
        updateGameState(nextState);
      }
      return;
    }

    // 3. Process Special Zone: GO TO JAIL
    if (code === 'CM-SPECIAL-JAIL') {
      if (game.currentPlayerId) {
        const nextState = sendToJail(game, game.currentPlayerId);
        updateGameState(nextState);
      }
      return;
    }

    // 4. Process Player Scan (Turn Switch shortcut)
    if (code.startsWith('CM-PLAYER-')) {
      const targetP = game.players.find((p) => p.playerCode === code);
      if (targetP) {
        if (targetP.status === 'ELIMINATED' || targetP.status === 'BANKRUPT') {
          showToast(`${targetP.name} is eliminated and cannot take turns.`);
          return;
        }
        // Optimistically update turns
        const nextState = {
          ...game,
          currentPlayerId: targetP.id,
        };
        updateGameState(nextState);
      } else {
        showToast('Unknown player QR code card scanned.');
      }
      return;
    }

    // 5. Process Action Card Scan
    if (code.startsWith('CM-ACTION-')) {
      const idx = code.replace('CM-ACTION-', 'act-');
      const card = ACTION_CARDS.find((c) => c.id === idx);
      if (card && game.currentPlayerId) {
        setDrawnActionId(card.id);
        setScanContext('ACTION');
      } else {
        showToast('Unknown action card code scanned.');
      }
      return;
    }

    // 6. Process Property Cards
    // Property identification (supports both raw names/slugs or prefixed CM-PROP-name codes)
    const propertyId = code.replace('CM-PROP-', '').toLowerCase();
    const prop = game.properties.find((p) => p.id === propertyId);

    if (prop) {
      setScannedProperty(prop);
      if (prop.ownerId === null) {
        setScanContext('BUY');
      } else if (prop.ownerId === game.currentPlayerId) {
        setScanContext('INFO'); // Show detail card for self-owned property (can mortgage/sell)
      } else {
        setScanContext('RENT');
      }
    } else {
      showToast(`Scanned code "${code}" not recognized as a valid CityMint board space.`);
    }
  };

  // Property operations
  const handleBuyProperty = () => {
    if (!scannedProperty || !game.currentPlayerId) return;
    const nextState = purchaseProperty(game, game.currentPlayerId, scannedProperty.id);
    updateGameState(nextState);
    setScanContext(null);
    setScannedProperty(null);
  };

  const handlePayRent = () => {
    if (!scannedProperty || !game.currentPlayerId) return;
    const nextState = payRent(game, game.currentPlayerId, scannedProperty.id);
    updateGameState(nextState);
    setScanContext(null);
    setScannedProperty(null);
  };

  const handleSellProperty = (propId: string, ownerId: string) => {
    triggerConfirm(
      'Sell Property',
      'Are you sure you want to sell/mortgage this property back to the Bank? You receive 50% of its valuation.',
      () => {
        const nextState = sellProperty(game, ownerId, propId);
        updateGameState(nextState);
        setScanContext(null);
        setScannedProperty(null);
      }
    );
  };

  const handleApplyActionCard = () => {
    if (!drawnActionId || !game.currentPlayerId) return;
    const nextState = executeActionCard(game, game.currentPlayerId, drawnActionId);
    updateGameState(nextState);
    setDrawnActionId(null);
    setScanContext(null);
  };

  // Debt settlement operations
  const handleDebtorSellProp = (propId: string) => {
    if (activeDebtor) {
      const nextState = sellProperty(game, activeDebtor.id, propId);
      updateGameState(nextState);
    }
  };

  const handlePayDebt = () => {
    const nextState = resolveDebt(game);
    updateGameState(nextState);
  };

  const handleDeclareBankruptcy = (choice: 'ELIMINATE' | 'END_GAME') => {
    const desc = choice === 'ELIMINATE' 
      ? 'Eliminate this player and continue game with remaining players?'
      : 'End game immediately and determine winner based on net worth?';
      
    triggerConfirm(
      'Declare Bankruptcy',
      desc,
      () => {
        const nextState = declareBankruptcy(game, choice);
        updateGameState(nextState);
      }
    );
  };

  // Admin panels manual adjustments
  const handleAdminApply = () => {
    if (!adminSelectedPlayer) {
      showToast('Please select a player to adjust.');
      return;
    }

    const nextState = manualCorrectState(game, {
      playerId: adminSelectedPlayer,
      propertyId: adminSelectedProp || undefined,
      balanceChange: adminBalanceChange !== 0 ? adminBalanceChange : undefined,
      jailStatusChange: adminSetJail !== '' ? (adminSetJail as any) : undefined,
      ownerIdChange: adminPropOwner !== '' ? (adminPropOwner === 'UNOWNED' ? 'UNOWNED' : adminPropOwner) : undefined,
      levelChange: adminSelectedProp ? adminPropLevel : undefined,
    });

    updateGameState(nextState);
    
    // Reset admin form
    setAdminBalanceChange(0);
    setAdminSetJail('');
    setAdminSelectedProp('');
    setAdminPropOwner('');
    setAdminPropLevel(1);
    setShowAdminPanel(false);
  };

  // Exit game manually
  const handleExitGame = () => {
    triggerConfirm(
      'Exit Active Game',
      'Force end active game? Rankings will be computed based on current asset valuations.',
      () => {
        const nextState = endGame(game);
        updateGameState(nextState);
      }
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      
      {/* 1. Header Area */}
      <header className="px-6 py-4 border-b border-[var(--border-custom)] bg-[var(--bg-secondary)] flex items-center justify-between safe-padding-top select-none">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-sm tracking-wider uppercase text-[var(--text-primary)]">CityMint</h1>
            <span className="text-[10px] font-bold bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">
              {game.id}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-semibold mt-0.5 uppercase tracking-wide">
            <span>Turn {game.turnNumber}</span>
            <span>•</span>
            <span>{formatDuration(gameDuration)}</span>
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-2 bg-[var(--bg-primary)]/80 px-3 py-1.5 rounded-full border border-[var(--border-custom)]">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[var(--accent-mint)]' : 'bg-orange-400'}`} />
          <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-primary)]">
            {isOnline ? (syncing ? 'Syncing...' : 'Synced') : 'Offline'}
          </span>
        </div>
      </header>

      {/* 2. Core Active Content by Tabs */}
      <div className="flex-1 overflow-hidden relative">

        {/* TABS 1: Game Loop Dashboard */}
        {activeTab === 'game' && game.status === 'ACTIVE' && (
          <div className="h-full flex flex-col justify-between p-6">
            
            {/* Active Turn banner */}
            <div 
              className="p-5 rounded-2xl border flex items-center justify-between transition-all"
              style={{ 
                borderColor: 'var(--border-custom)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div className="flex items-center gap-3">
                <span 
                  className="w-5 h-5 rounded-full border border-white/20 animate-pulse"
                  style={{ backgroundColor: currentPlayer?.color }}
                />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">Current Turn</p>
                  <h2 className="font-display font-extrabold text-xl text-[var(--text-primary)]">
                    {currentPlayer?.name}
                  </h2>
                </div>
              </div>
              {currentPlayer?.status === 'IN_JAIL' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                  In Jail (Turn {currentPlayer.jailTurns})
                </span>
              )}
            </div>

            {/* Balance Visual Card */}
            <div className="my-6 text-center select-none bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-custom)] p-8 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-white/3 blur-2xl pointer-events-none" />
              <Landmark className="w-10 h-10 text-[var(--accent-gold)] mx-auto mb-3 opacity-60" />
              <p className="text-xs text-[var(--text-secondary)] font-semibold tracking-wider uppercase">Active Banker Balance</p>
              <h3 className="font-display font-extrabold text-5xl text-[var(--text-primary)] tracking-tight mt-2 mb-1">
                ₹{currentPlayer?.balance.toLocaleString()}
              </h3>
              {currentPlayer && (
                <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                  Total Net Worth: ₹{calculateNetWorth(currentPlayer, game.properties).toLocaleString()}
                </p>
              )}
            </div>

            {/* Central Action Trigger */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setShowScanner(true)}
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-2xl active:scale-95 hover:bg-[var(--accent-mint)]/90 transition-all font-display font-extrabold text-xs uppercase gap-1"
              >
                <Camera className="w-6 h-6 stroke-[2.5]" />
                Scan QR
              </button>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">
                Scan Player, Property, Start, Teleport, or Action Card QR
              </p>
            </div>

            {/* Turn Navigation Toolbar */}
            <div className="grid grid-cols-3 gap-3 border-t border-[var(--border-custom)] pt-6 mt-6">
              <button
                onClick={handleUndo}
                disabled={game.undoStack.length === 0}
                className="py-3 rounded-xl border border-[var(--border-custom)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </button>

              <button
                onClick={() => setShowAdminPanel(true)}
                className="py-3 rounded-xl border border-[var(--border-custom)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
              >
                Adjust
              </button>

              <button
                onClick={handleEndTurn}
                className="py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-custom)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
              >
                End Turn
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* TABS 2: Live Leaderboard/Rankings */}
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto p-6 space-y-4">
            <h3 className="font-display font-extrabold text-lg text-[var(--text-primary)] mb-2">Live Rankings</h3>
            
            {/* Sort players by Net Worth */}
            {[...game.players]
              .sort((a, b) => calculateNetWorth(b, game.properties) - calculateNetWorth(a, game.properties))
              .map((player, index) => {
                const worth = calculateNetWorth(player, game.properties);
                const propsCount = game.properties.filter((p) => p.ownerId === player.id).length;
                
                return (
                  <div 
                    key={player.id}
                    className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Indicator */}
                      <span className="font-display font-black text-xl text-[var(--accent-gold)]">
                        {index + 1}
                      </span>
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: player.color }}
                      />
                      <div>
                        <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                          {player.name}
                        </h4>
                        <div className="flex gap-2 text-[10px] text-[var(--text-secondary)] mt-0.5">
                          <span>Cash: ₹{player.balance}</span>
                          <span>•</span>
                          <span>Properties: {propsCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Net Worth</p>
                      <p className="font-display font-extrabold text-lg text-[var(--text-primary)] mt-0.5">
                        ₹{worth.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}

            <div className="pt-6">
              <button
                onClick={handleExitGame}
                className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all text-center"
              >
                End Game Manually
              </button>
            </div>
          </div>
        )}

        {/* TABS 3: Transaction Logs */}
        {activeTab === 'transactions' && (
          <div className="h-full overflow-y-auto p-6 space-y-4">
            <h3 className="font-display font-extrabold text-lg text-[var(--text-primary)] mb-2">Audit History</h3>
            
            {game.transactions.length > 0 ? (
              <div className="space-y-3">
                {game.transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)]">
                      <span className="font-semibold uppercase tracking-wider text-[var(--accent-mint)]">
                        {tx.type}
                      </span>
                      <span>Turn {tx.turnNumber}</span>
                    </div>
                    <p className="text-[var(--text-primary)] font-medium leading-relaxed">
                      {tx.description}
                    </p>
                    <span className="block text-[9px] text-[var(--text-secondary)] text-right">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                <Landmark className="w-12 h-12 mb-3" />
                <p className="text-sm">No transaction events recorded yet.</p>
              </div>
            )}
          </div>
        )}

        {/* TABS 4: Rulebook Search */}
        {activeTab === 'rules' && (
          <div className="h-full overflow-y-auto">
            <RulebookSearch />
          </div>
        )}

        {/* DEBT SETTLEMENT / BANKRUPTCY REVIEW CONTAINER */}
        {game.status === 'BANKRUPTCY_REVIEW' && game.activeDebt && activeDebtor && (
          <div className="absolute inset-0 z-40 bg-[var(--bg-primary)] p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Alert Header */}
              <div className="text-center">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3 animate-bounce" />
                <h2 className="font-display font-extrabold text-2xl text-[var(--text-primary)]">Debt Settlement</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {activeDebtor.name} owes ₹{game.activeDebt.amountDue} to {activeCreditorName}
                </p>
              </div>

              {/* Cash Balance Status Card */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-custom)]">
                  <span className="text-[9px] text-[var(--text-secondary)] uppercase font-semibold">Cash Available</span>
                  <p className="font-display font-extrabold text-base text-[var(--text-primary)] mt-1">₹{activeDebtor.balance}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 col-span-2">
                  <span className="text-[9px] text-red-400 uppercase font-semibold">Remaining Shortfall</span>
                  <p className="font-display font-extrabold text-base text-red-400 mt-1">₹{game.activeDebt.shortfall}</p>
                </div>
              </div>

              {/* Eligible Property Assets to Sell */}
              <div className="space-y-3">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] px-1">
                  Select properties to sell (at 50% valuation)
                </h3>
                
                {game.properties.filter((p) => p.ownerId === activeDebtor.id).length > 0 ? (
                  <div className="space-y-2">
                    {game.properties
                      .filter((p) => p.ownerId === activeDebtor.id)
                      .map((prop) => {
                        const val = getPropertyValue(prop);
                        const refund = Math.floor(val / 2);
                        return (
                          <div 
                            key={prop.id}
                            className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] flex items-center justify-between"
                          >
                            <div>
                              <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">{prop.cityName}</h4>
                              <p className="text-[10px] text-[var(--text-secondary)]">Current Level: {prop.level} (Worth ₹{val})</p>
                            </div>
                            <button
                              onClick={() => handleDebtorSellProp(prop.id)}
                              className="px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/30 active:scale-95 text-xs font-bold rounded-xl transition-all"
                            >
                              Sell for +₹{refund}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-[var(--bg-secondary)]/50 rounded-xl border border-dashed border-[var(--border-custom)] text-xs text-[var(--text-secondary)]">
                    No properties owned to liquidate.
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Options */}
            <div className="space-y-3 mt-8 border-t border-[var(--border-custom)] pt-6">
              {game.activeDebt.shortfall <= 0 ? (
                <button
                  onClick={handlePayDebt}
                  className="w-full py-4 rounded-xl font-display font-bold bg-[var(--accent-mint)] text-[var(--bg-primary)] active:scale-[0.98] transition-all text-center shadow-lg animate-pulse"
                >
                  Confirm Payment (₹{game.activeDebt.amountDue})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDeclareBankruptcy('ELIMINATE')}
                    className="py-3.5 rounded-xl font-display font-bold border border-red-500/30 bg-red-500/15 text-red-400 active:scale-95 text-xs text-center"
                  >
                    Eliminate Player
                  </button>
                  <button
                    onClick={() => handleDeclareBankruptcy('END_GAME')}
                    className="py-3.5 rounded-xl font-display font-bold bg-[var(--accent-gold)] text-[var(--bg-primary)] active:scale-95 text-xs text-center"
                  >
                    End Game
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GAME OVER WINNER CHAMPION SCREEN */}
        {game.status === 'ENDED' && (
          <div className="absolute inset-0 z-50 bg-[var(--bg-primary)] p-6 flex flex-col justify-between overflow-y-auto">
            <div className="text-center mt-8">
              <Trophy className="w-16 h-16 text-[var(--accent-gold)] mx-auto mb-4 animate-[bounce_2s_infinite]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-gold)] bg-[var(--accent-gold)]/10 px-3 py-1 rounded-full border border-[var(--accent-gold)]/20">
                Champion Declared
              </span>
              <h2 className="font-display font-extrabold text-4xl text-[var(--text-primary)] tracking-tight mt-4">
                {game.players.find((p) => p.id === game.winnerId)?.name}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Wins with a total Net Worth of:
              </p>
              <p className="font-display font-extrabold text-4xl text-[var(--accent-mint)] mt-2">
                ₹{game.winnerId ? calculateNetWorth(game.players.find((p) => p.id === game.winnerId)!, game.properties).toLocaleString() : 'N/A'}
              </p>
            </div>

            {/* Rankings summary table */}
            <div className="my-8 space-y-3 bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-6 rounded-3xl">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                Final Leaderboard
              </h3>
              {[...game.players]
                .sort((a, b) => calculateNetWorth(b, game.properties) - calculateNetWorth(a, game.properties))
                .map((p, idx) => {
                  const active = p.status !== 'ELIMINATED' && p.status !== 'BANKRUPT';
                  return (
                    <div key={p.id} className="flex justify-between items-center text-sm border-b border-[var(--border-custom)] pb-2 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--accent-gold)]">#{idx+1}</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className={`font-semibold ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] line-through'}`}>
                           {p.name}
                        </span>
                      </div>
                      <span className="font-display font-bold text-[var(--text-primary)]">
                        ₹{calculateNetWorth(p, game.properties).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Winner screen footer actions */}
            <Link
              href="/"
              className="w-full py-4 rounded-xl font-display font-bold bg-[var(--accent-mint)] text-[var(--bg-primary)] active:scale-[0.98] transition-all text-center shadow-lg"
            >
              Back to Main Menu
            </Link>
          </div>
        )}

      </div>

      {/* 3. Bottom Navigation Bar — always fixed at bottom */}
      {game.status === 'ACTIVE' && (
        <nav className="flex-none border-t border-[var(--border-custom)] bg-[var(--bg-secondary)] grid grid-cols-4 select-none safe-padding-bottom">
          {[
            { id: 'game',         label: 'Play',     icon: Landmark },
            { id: 'dashboard',    label: 'Rankings', icon: Trophy },
            { id: 'transactions', label: 'Ledger',   icon: History },
            { id: 'rules',        label: 'Rules',    icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 flex flex-col items-center gap-1 transition-all relative ${
                  isSelected ? 'text-[var(--accent-mint)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-[var(--accent-mint)]" />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* 4. MODAL OVERLAYS */}

      {/* Camera QR Scanner */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScanResolved}
          onClose={() => setShowScanner(false)}
          title="Banker Scanner"
        />
      )}

      {/* Property Purchase Scan Confirmation Drawer */}
      {scanContext === 'BUY' && scannedProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200">
          <CityCard
            property={scannedProperty}
            onClose={() => setScanContext(null)}
            onBuy={handleBuyProperty}
            currentPlayerId={game.currentPlayerId}
            currentPlayerName={currentPlayer?.name}
          />
        </div>
      )}

      {/* Rent Payment Scan Confirmation Drawer */}
      {scanContext === 'RENT' && scannedProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200">
          <CityCard
            property={scannedProperty}
            ownerName={game.players.find((p) => p.id === scannedProperty.ownerId)?.name || 'Bank'}
            onClose={() => setScanContext(null)}
            onPayRent={handlePayRent}
            currentPlayerId={game.currentPlayerId}
            currentPlayerName={currentPlayer?.name}
          />
        </div>
      )}

      {/* Self-Owned Property Options Detail Drawer */}
      {scanContext === 'INFO' && scannedProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200">
          <CityCard
            property={scannedProperty}
            ownerName={currentPlayer?.name}
            onClose={() => setScanContext(null)}
            onSell={() => handleSellProperty(scannedProperty.id, scannedProperty.ownerId!)}
            currentPlayerId={game.currentPlayerId}
            currentPlayerName={currentPlayer?.name}
          />
        </div>
      )}

      {/* Action Card Draw Confirmation Drawer */}
      {scanContext === 'ACTION' && drawnActionId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 text-center">
            <h3 className="font-display font-extrabold text-sm uppercase text-[var(--accent-gold)] tracking-wider mb-2">
              Action Card Drawn
            </h3>
            <h2 className="font-display font-extrabold text-2xl text-[var(--text-primary)] mb-4">
              {ACTION_CARDS.find((c) => c.id === drawnActionId)?.name}
            </h2>
            <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              {ACTION_CARDS.find((c) => c.id === drawnActionId)?.description}
            </div>
            <button
              onClick={handleApplyActionCard}
              className="w-full py-4 rounded-xl font-display font-bold bg-[var(--accent-mint)] text-[var(--bg-primary)] active:scale-[0.98] transition-all"
            >
              Process Action Card
            </button>
          </div>
        </div>
      )}

      {/* Banker Admin Correct Panel */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-extrabold text-xl text-[var(--text-primary)]">Manual Adjustments</h3>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="text-xs font-bold bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full text-[var(--text-secondary)]"
              >
                Cancel
              </button>
            </div>

            {/* Select Target Player */}
            <div className="space-y-2 mb-4">
              <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">1. Select Player</label>
              <div className="relative">
                <select
                  value={adminSelectedPlayer}
                  onChange={(e) => setAdminSelectedPlayer(e.target.value)}
                  className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-2.5 pl-3 pr-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                >
                  <option value="">-- Choose Player --</option>
                  {game.players.map((p) => (
                    <option key={p.id} value={p.id} className="text-[var(--text-primary)] bg-[var(--bg-primary)]">{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>

            {/* Adjust Balance or Jail status */}
            {adminSelectedPlayer && (
              <div className="space-y-4 mb-4 p-4 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--border-custom)]">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Adjust Balance (₹)</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAdminBalanceChange((prev) => prev - 500)}
                      className="px-3 bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] text-xs rounded-lg active:scale-95 hover:bg-[var(--bg-elevated)]"
                    >
                      -500
                    </button>
                    <input
                      type="number"
                      value={adminBalanceChange}
                      onChange={(e) => setAdminBalanceChange(Number(e.target.value))}
                      className="flex-1 bg-[var(--bg-primary)] text-center border border-[var(--border-custom)] rounded-lg py-1.5 text-sm text-[var(--text-primary)]"
                    />
                    <button 
                      onClick={() => setAdminBalanceChange((prev) => prev + 500)}
                      className="px-3 bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] text-xs rounded-lg active:scale-95 hover:bg-[var(--bg-elevated)]"
                    >
                      +500
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Jail State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAdminSetJail('ACTIVE')}
                      className={`py-2 rounded-lg text-xs font-semibold ${adminSetJail === 'ACTIVE' ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => setAdminSetJail('IN_JAIL')}
                      className={`py-2 rounded-lg text-xs font-semibold ${adminSetJail === 'IN_JAIL' ? 'bg-red-500 text-white' : 'bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                      Send to Jail
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Select Target Property */}
            <div className="space-y-2 mb-4">
              <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">2. Adjust Property (Optional)</label>
              <div className="relative">
                <select
                  value={adminSelectedProp}
                  onChange={(e) => setAdminSelectedProp(e.target.value)}
                  className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-2.5 pl-3 pr-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                >
                  <option value="">-- Choose Property --</option>
                  {game.properties.map((p) => (
                    <option key={p.id} value={p.id} className="text-[var(--text-primary)] bg-[var(--bg-primary)]">{p.cityName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>

            {/* Adjust Property details */}
            {adminSelectedProp && (
              <div className="space-y-4 mb-4 p-4 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--border-custom)]">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Property Owner</label>
                  <div className="relative">
                    <select
                      value={adminPropOwner}
                      onChange={(e) => setAdminPropOwner(e.target.value)}
                      className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-lg py-1.5 pl-2 pr-8 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                    >
                      <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">-- No Change --</option>
                      <option value="UNOWNED" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Set Unowned</option>
                      {game.players.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Rent Level (1-5)</label>
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setAdminPropLevel(lvl)}
                        className={`w-8 h-8 rounded-full border text-xs font-semibold ${adminPropLevel === lvl ? 'bg-[var(--accent-mint)] border-[var(--accent-mint)] text-[var(--bg-primary)]' : 'bg-transparent border-[var(--border-custom)] text-[var(--text-secondary)]'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleAdminApply}
              className="w-full py-4 mt-4 rounded-xl font-display font-bold bg-[var(--accent-mint)] text-[var(--bg-primary)] active:scale-[0.98] transition-all shadow-lg"
            >
              Apply Correction Log
            </button>

          </div>
        </div>
      )}

      {/* 5. CUSTOM TOAST & CONFIRM OVERLAYS */}

      {/* Floating App-wide Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm p-4 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-md shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <span className="text-base">⚠️</span>
          <p className="text-xs font-semibold text-red-400 leading-relaxed">
            {toast.message}
          </p>
        </div>
      )}

      {/* App-wide Custom Confirm Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <h3 className="font-display font-extrabold text-lg text-[var(--text-primary)] mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-custom)] text-[var(--text-primary)] font-bold text-xs active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="py-3 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] font-bold text-xs active:scale-95 transition-all shadow-md shadow-[var(--accent-mint)]/10"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
