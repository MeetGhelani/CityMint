'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  Camera, RotateCcw, AlertTriangle, ArrowRight, ShieldAlert,
  History, Trophy, Landmark, Info, Search, HeartHandshake,
  UserCheck, Plus, Minus, Check, CheckSquare, Trash2, HelpCircle, ChevronDown, QrCode, Building
} from 'lucide-react';

import { 
  GameState, Player, Property, GameTransaction, ACTION_CARDS, PROPERTY_GROUPS,
  getRentAmount, getPropertyValue, calculateNetWorth,
  endTurn, purchaseProperty, payRent, passStart, activateTeleport,
  sendToJail, releaseFromJail, sellProperty, resolveDebt,
  declareBankruptcy, undoLastAction, manualCorrectState, executeActionCard,
  endGame, saveGameStateToStorage, loadGameStateFromStorage,
  executeTargetedPoliceRaid, executeTargetedPropertyUpgrade, executePropertySwap,
  computeMatchAnalytics, executeAuctionWin, upgradePropertyLevel
} from '@/lib/gameEngine';
import { localGetSetting, localGetGame, localSaveGame, localSaveHistory, localSaveSetting } from '@/lib/db';
import { syncGameStateToSupabase, flushSyncQueue } from '@/lib/syncEngine';
import { soundEffects } from '@/lib/soundEffects';
import QRScanner from '@/components/QRScanner';
import CityCard from '@/components/CityCard';
import RulebookSearch from '@/components/RulebookSearch';
import AuctionModal from '@/components/AuctionModal';

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
  const [auctionProperty, setAuctionProperty] = useState<Property | null>(null);
  
  // Action Card Drawing State
  const [drawnActionId, setDrawnActionId] = useState<string | null>(null);
  const [policeRaidTargetId, setPoliceRaidTargetId] = useState<string>('');
  const [devBoomPropertyId, setDevBoomPropertyId] = useState<string>('');
  const [swapTargetPlayerId, setSwapTargetPlayerId] = useState<string>('');
  const [swapPropAId, setSwapPropAId] = useState<string>('');
  const [swapPropBId, setSwapPropBId] = useState<string>('');

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
    
    // Save locally to IndexedDB & LocalStorage auto-save
    await localSaveGame(nextState);
    saveGameStateToStorage(nextState);

    // Audio SFX triggers
    const latestTx = nextState.transactions[0];
    if (latestTx) {
      if (latestTx.type === 'RENT' || latestTx.type === 'PURCHASE' || latestTx.type === 'START') {
        soundEffects.playCashChime();
      } else if (latestTx.type === 'JAIL_ENTER' || latestTx.type === 'BANKRUPTCY') {
        soundEffects.playJailSiren();
      }
    }

    if (nextState.status === 'ENDED' && nextState.winnerId) {
      soundEffects.playVictoryFanfare();
    }

    // Sync remote
    const synced = await syncGameStateToSupabase(nextState);
    setSyncing(!synced);
  };

  // Celebrate on game end
  useEffect(() => {
    if (game?.status === 'ENDED' && game.winnerId) {
      // Fire confetti sequence
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      soundEffects.playVictoryFanfare();
      
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

  const handleApplyPoliceRaid = () => {
    if (!game || !game.currentPlayerId || !policeRaidTargetId) return;
    const nextState = executeTargetedPoliceRaid(game, game.currentPlayerId, policeRaidTargetId);
    updateGameState(nextState);
    setDrawnActionId(null);
    setScanContext(null);
    setPoliceRaidTargetId('');
  };

  const handleApplyDevelopmentBoom = () => {
    if (!game || !game.currentPlayerId || !devBoomPropertyId) return;
    const nextState = executeTargetedPropertyUpgrade(game, game.currentPlayerId, devBoomPropertyId);
    updateGameState(nextState);
    setDrawnActionId(null);
    setScanContext(null);
    setDevBoomPropertyId('');
  };

  const handleApplyPropertySwap = () => {
    if (!game || !game.currentPlayerId || !swapTargetPlayerId || !swapPropAId || !swapPropBId) return;
    const nextState = executePropertySwap(game, game.currentPlayerId, swapPropAId, swapTargetPlayerId, swapPropBId);
    updateGameState(nextState);
    setDrawnActionId(null);
    setScanContext(null);
    setSwapTargetPlayerId('');
    setSwapPropAId('');
    setSwapPropBId('');
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

        {/* Header Actions & Sync Indicator */}
        <div className="flex items-center gap-2">
          <Link
            href="/qr-cards"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30 hover:bg-[var(--accent-mint)]/20 active:scale-95 transition-all text-[10px] font-bold uppercase tracking-wider"
            title="Open Scannable QR Cards Directory"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Cards</span>
          </Link>

          <div className="flex items-center gap-2 bg-[var(--bg-primary)]/80 px-3 py-1.5 rounded-full border border-[var(--border-custom)]">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[var(--accent-mint)]' : 'bg-orange-400'}`} />
            <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-primary)]">
              {isOnline ? (syncing ? 'Syncing...' : 'Synced') : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Core Active Content by Tabs */}
      <div className="flex-1 overflow-hidden relative">

        {/* TABS 1: Game Loop Dashboard */}
        {activeTab === 'game' && game.status === 'ACTIVE' && (
          <div className="h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
            
            <div>
              {/* 1. 🏆 Live Multi-Player Scoreboard Strip */}
              <div className="mb-3 overflow-x-auto no-scrollbar pb-1">
                <div className="flex items-center gap-2 min-w-max">
                  {game.players.map((player) => {
                    const isCurrent = player.id === game.currentPlayerId;
                    const propsCount = game.properties.filter((p) => p.ownerId === player.id).length;

                    return (
                      <div
                        key={player.id}
                        onClick={() => {
                          setAdminSelectedPlayer(player.id);
                          setShowAdminPanel(true);
                        }}
                        className={`px-3 py-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                          isCurrent
                            ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)] shadow-md shadow-[var(--accent-mint)]/10 ring-1 ring-[var(--accent-mint)]'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-custom)] opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: player.color }} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-extrabold text-xs text-[var(--text-primary)]">{player.name}</span>
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-mint)] animate-ping" />}
                            {player.status === 'IN_JAIL' && <span className="text-[9px]">🔒</span>}
                          </div>
                          <p className="text-[10px] font-mono text-[var(--text-secondary)]">
                            ₹{player.balance >= 1000 ? `${(player.balance / 1000).toFixed(1)}k` : player.balance} · 🏢 {propsCount}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Turn banner */}
              <div 
                className="p-4 rounded-2xl border flex items-center justify-between transition-all"
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
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 flex items-center gap-1">
                      🔒 In Jail
                    </span>
                    <span className="text-[9px] font-bold text-red-400/80">
                      Turn {currentPlayer.jailTurns}/3
                      {currentPlayer.jailTurns >= 2 && ' — Auto-bail next!'}
                    </span>
                  </div>
                )}
              </div>

              {/* ── JAIL ALERT PANEL (only shown when current player is in jail) ── */}
              {currentPlayer?.status === 'IN_JAIL' && (
                <div className="mt-3 p-4 rounded-2xl bg-red-500/8 border border-red-500/25 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold tracking-widest text-red-400">🔒 Jail Status</p>
                      <p className="font-display font-bold text-sm text-[var(--text-primary)] mt-0.5">{currentPlayer.name} is in Jail</p>
                    </div>
                    {/* Turn Progress Pills */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((t) => (
                        <div
                          key={t}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-extrabold border ${
                            t <= currentPlayer.jailTurns
                              ? 'bg-red-500 border-red-400 text-white'
                              : 'bg-[var(--bg-primary)] border-[var(--border-custom)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Auto-bail warning */}
                  {currentPlayer.jailTurns >= 2 && (
                    <div className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-[10px] text-red-400 font-semibold">
                      ⚠️ After this turn, ₹500 bail fee will be auto-debited and player released.
                    </div>
                  )}

                  {/* Quick Jail Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        if (!game.currentPlayerId) return;
                        const nextState = releaseFromJail(game, game.currentPlayerId, 'PAY');
                        updateGameState(nextState);
                      }}
                      disabled={currentPlayer.balance < 500}
                      className="py-2.5 rounded-xl text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Pay Bail ₹500
                    </button>
                    <button
                      onClick={() => {
                        if (!game.currentPlayerId) return;
                        const nextState = releaseFromJail(game, game.currentPlayerId, 'CARD');
                        updateGameState(nextState);
                      }}
                      className="py-2.5 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all"
                    >
                      🃏 Use Pardon Card
                    </button>
                  </div>
                </div>
              )}

              {/* Balance Visual Card */}
              <div className="my-3 text-center select-none bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-custom)] p-6 rounded-3xl relative overflow-hidden shadow-xl">
                <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-white/3 blur-2xl pointer-events-none" />
                <Landmark className="w-8 h-8 text-[var(--accent-gold)] mx-auto mb-2 opacity-60" />
                <p className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider uppercase">Active Banker Balance</p>
                <h3 className="font-display font-extrabold text-4xl text-[var(--text-primary)] tracking-tight mt-1 mb-0.5">
                  ₹{currentPlayer?.balance.toLocaleString()}
                </h3>
                {currentPlayer && (
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    Total Net Worth: ₹{calculateNetWorth(currentPlayer, game.properties).toLocaleString()}
                  </p>
                )}
              </div>

              {/* 2. 🏢 Active Player Portfolio Preview Bar */}
              {currentPlayer && (() => {
                const ownedProps = game.properties.filter((p) => p.ownerId === currentPlayer.id);
                return (
                  <div className="mb-3 p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)] flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
                        {currentPlayer.name}'s Portfolio ({ownedProps.length})
                      </span>
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className="text-[9px] font-bold text-[var(--accent-mint)] hover:underline"
                      >
                        View All →
                      </button>
                    </div>

                    {ownedProps.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic">No properties owned yet. Scan property QR to buy!</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {ownedProps.map((prop) => {
                          const group = PROPERTY_GROUPS[prop.groupId];
                          const isSetComplete = game.completedGroups.includes(prop.groupId);

                          return (
                            <div
                              key={prop.id}
                              onClick={() => {
                                setScannedProperty(prop);
                                setScanContext('INFO');
                              }}
                              className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                              style={{ backgroundColor: group?.color || '#333' }}
                            >
                              <span>{prop.cityName}</span>
                              <span className="bg-black/30 px-1 py-0.2 rounded text-[8px] font-mono">Lv{prop.level}</span>
                              {isSetComplete && <span title="Monopoly Set Bonus Active (+1 Level)">✨</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. ⚡ Live Activity Ticker Bar */}
              <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] flex items-center gap-2.5 text-left">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-mint)] animate-pulse shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase font-extrabold text-[var(--text-muted)] tracking-wider">Latest Activity</p>
                  <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                    {game.transactions[0] ? game.transactions[0].description : 'Match started. Scan any card to play!'}
                  </p>
                </div>
              </div>

              {/* Central Action Trigger */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-22 h-22 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-2xl active:scale-95 hover:bg-[var(--accent-mint)]/90 transition-all font-display font-extrabold text-xs uppercase gap-1"
                >
                  <Camera className="w-6 h-6 stroke-[2.5]" />
                  Scan QR
                </button>
                <p className="text-[10px] text-[var(--text-secondary)] font-medium text-center">
                  Scan Player, Property, Start, Teleport, or Action Card QR
                </p>
              </div>

              {/* 4. 🎛️ Banker Quick Action Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <button
                  onClick={() => {
                    if (!game.currentPlayerId) return;
                    const nextState = passStart(game, game.currentPlayerId);
                    updateGameState(nextState);
                  }}
                  disabled={currentPlayer?.status !== 'ACTIVE'}
                  className="py-2.5 px-2 rounded-xl text-xs font-bold bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
                >
                  ⚡ Pass Start (+₹2k)
                </button>

                <button
                  onClick={() => {
                    if (!game.currentPlayerId) return;
                    if (currentPlayer?.status === 'IN_JAIL') {
                      showToast(`${currentPlayer.name} is already in Jail.`, 'warning');
                      return;
                    }
                    const nextState = sendToJail(game, game.currentPlayerId);
                    updateGameState(nextState);
                  }}
                  disabled={currentPlayer?.status !== 'ACTIVE'}
                  className="py-2.5 px-2 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
                >
                  🔒 Send to Jail
                </button>

                <button
                  onClick={() => {
                    const unowned = game.properties.find((p) => p.ownerId === null);
                    if (unowned) {
                      setAuctionProperty(unowned);
                    } else {
                      showToast('All properties are currently owned!', 'warning');
                    }
                  }}
                  className="py-2.5 px-2 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  🔨 Live Auction
                </button>

                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="py-2.5 px-2 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  💸 Quick Adjust
                </button>
              </div>

            </div>

            {/* Turn Navigation Toolbar */}
            <div className="grid grid-cols-3 gap-3 border-t border-[var(--border-custom)] pt-4">
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
                className="py-3 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] active:scale-95 transition-all text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md"
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
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-display font-extrabold text-lg text-[var(--text-primary)]">Audit History</h3>
                <p className="text-xs text-[var(--text-secondary)]">Recorded game ledger ({game.transactions.length} events)</p>
              </div>
              {game.transactions.length > 0 && (
                <button
                  onClick={() => {
                    const headers = ['Turn', 'Type', 'Description', 'Amount', 'Timestamp'];
                    const rows = game.transactions.map((tx) => [
                      tx.turnNumber,
                      tx.type,
                      `"${tx.description.replace(/"/g, '""')}"`,
                      tx.amount || 0,
                      new Date(tx.createdAt).toLocaleString(),
                    ]);
                    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `CityMint_Game_Ledger_${game.id.slice(0, 8)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] font-bold text-xs active:scale-95 transition-all shadow-sm"
                >
                  Export CSV
                </button>
              )}
            </div>
            
            {game.transactions.length > 0 ? (
              <div className="space-y-3">
                {game.transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-xs space-y-2 shadow-sm"
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
            onAuction={() => {
              setAuctionProperty(scannedProperty);
              setScanContext(null);
            }}
            currentPlayerId={game.currentPlayerId}
            currentPlayerName={currentPlayer?.name}
          />
        </div>
      )}

      {/* Live Property Auction Modal */}
      {auctionProperty && (
        <AuctionModal
          property={auctionProperty}
          players={game.players}
          onClose={() => setAuctionProperty(null)}
          onConcludeAuction={(winningPlayerId, winningBidAmount) => {
            const nextState = executeAuctionWin(game, auctionProperty.id, winningPlayerId, winningBidAmount);
            updateGameState(nextState);
            setAuctionProperty(null);
          }}
        />
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
            onUpgrade={() => {
              if (!game.currentPlayerId) return;
              const nextState = upgradePropertyLevel(game, game.currentPlayerId, scannedProperty.id);
              updateGameState(nextState);
              setScanContext(null);
            }}
            onSell={() => handleSellProperty(scannedProperty.id, scannedProperty.ownerId!)}
            currentPlayerId={game.currentPlayerId}
            currentPlayerName={currentPlayer?.name}
          />
        </div>
      )}

      {/* Action Card Draw Confirmation Drawer */}
      {scanContext === 'ACTION' && drawnActionId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 text-left relative">
            <button
              onClick={() => { setScanContext(null); setDrawnActionId(null); }}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-custom)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
            <h3 className="font-display font-extrabold text-xs uppercase text-[var(--accent-gold)] tracking-widest mb-1">
              Action Card Drawn
            </h3>
            <h2 className="font-display font-black text-2xl text-[var(--text-primary)] mb-2">
              {ACTION_CARDS.find((c) => c.id === drawnActionId)?.name}
            </h2>
            <div className="p-3.5 bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl text-xs text-[var(--text-secondary)] leading-relaxed mb-5">
              {ACTION_CARDS.find((c) => c.id === drawnActionId)?.description}
            </div>

            {/* ── Specialized Interactive Card Controls ── */}

            {/* 1. Police Raid (act-17) */}
            {drawnActionId === 'act-17' && (
              <div className="space-y-3 mb-6">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                  Select Opponent to Send to Jail:
                </label>
                <div className="relative">
                  <select
                    value={policeRaidTargetId}
                    onChange={(e) => setPoliceRaidTargetId(e.target.value)}
                    className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-3 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                  >
                    <option value="">-- Choose Target Player --</option>
                    {game.players
                      .filter((p) => p.id !== game.currentPlayerId && (p.status === 'ACTIVE'))
                      .map((p) => (
                        <option key={p.id} value={p.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{p.name}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                </div>
                <button
                  disabled={!policeRaidTargetId}
                  onClick={handleApplyPoliceRaid}
                  className="w-full py-3.5 rounded-xl font-display font-bold bg-rose-600 text-white disabled:opacity-40 active:scale-[0.98] transition-all shadow-md"
                >
                  Send Player to Jail 🚨
                </button>
              </div>
            )}

            {/* 2. Development Boom (act-9) */}
            {drawnActionId === 'act-9' && (
              <div className="space-y-3 mb-6">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                  Select Property to Upgrade (+1 Level):
                </label>
                <div className="relative">
                  <select
                    value={devBoomPropertyId}
                    onChange={(e) => setDevBoomPropertyId(e.target.value)}
                    className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-3 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                  >
                    <option value="">-- Choose Owned Property --</option>
                    {game.properties
                      .filter((p) => p.ownerId === game.currentPlayerId && p.level < 5)
                      .map((p) => (
                        <option key={p.id} value={p.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                          {p.cityName} (Currently Lv {p.level})
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                </div>
                <button
                  disabled={!devBoomPropertyId}
                  onClick={handleApplyDevelopmentBoom}
                  className="w-full py-3.5 rounded-xl font-display font-bold bg-emerald-600 text-white disabled:opacity-40 active:scale-[0.98] transition-all shadow-md"
                >
                  Upgrade Property (+1 Level) 🏗️
                </button>
              </div>
            )}

            {/* 3. Property Swap (act-19) */}
            {drawnActionId === 'act-19' && (
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                    Your Property to Swap:
                  </label>
                  <div className="relative">
                    <select
                      value={swapPropAId}
                      onChange={(e) => setSwapPropAId(e.target.value)}
                      className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-2.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                    >
                      <option value="">-- Your Property --</option>
                      {game.properties
                        .filter((p) => p.ownerId === game.currentPlayerId)
                        .map((p) => (
                          <option key={p.id} value={p.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{p.cityName}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                    Target Opponent &amp; Their Property:
                  </label>
                  <div className="relative mb-2">
                    <select
                      value={swapTargetPlayerId}
                      onChange={(e) => { setSwapTargetPlayerId(e.target.value); setSwapPropBId(''); }}
                      className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-2.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                    >
                      <option value="">-- Select Opponent --</option>
                      {game.players
                        .filter((p) => p.id !== game.currentPlayerId && p.status === 'ACTIVE')
                        .map((p) => (
                          <option key={p.id} value={p.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                  </div>

                  {swapTargetPlayerId && (
                    <div className="relative">
                      <select
                        value={swapPropBId}
                        onChange={(e) => setSwapPropBId(e.target.value)}
                        className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-2.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                      >
                        <option value="">-- Their Property --</option>
                        {game.properties
                          .filter((p) => p.ownerId === swapTargetPlayerId)
                          .map((p) => (
                            <option key={p.id} value={p.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{p.cityName}</option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    </div>
                  )}
                </div>

                <button
                  disabled={!swapPropAId || !swapPropBId || !swapTargetPlayerId}
                  onClick={handleApplyPropertySwap}
                  className="w-full py-3.5 rounded-xl font-display font-bold bg-sky-600 text-white disabled:opacity-40 active:scale-[0.98] transition-all shadow-md mt-2"
                >
                  Execute Property Swap 🔄
                </button>
              </div>
            )}

            {/* 4. Standard Action Cards */}
            {drawnActionId !== 'act-17' && drawnActionId !== 'act-9' && drawnActionId !== 'act-19' && (
              <button
                onClick={handleApplyActionCard}
                className="w-full py-3.5 rounded-xl font-display font-bold bg-[var(--accent-mint)] text-[var(--bg-primary)] active:scale-[0.98] transition-all shadow-md"
              >
                Process Action Card
              </button>
            )}
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
              <div className="space-y-4 mb-4 p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-primary)]/60 border border-[var(--border-custom)]">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Adjust Balance (₹)</label>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button 
                      onClick={() => setAdminBalanceChange((prev) => prev - 500)}
                      className="px-2.5 py-2 shrink-0 bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] text-xs font-extrabold rounded-xl active:scale-95 hover:bg-[var(--bg-elevated)]"
                    >
                      -500
                    </button>
                    <input
                      type="number"
                      value={adminBalanceChange}
                      onChange={(e) => setAdminBalanceChange(Number(e.target.value))}
                      className="w-full min-w-0 flex-1 bg-[var(--bg-primary)] text-center border border-[var(--border-custom)] rounded-xl py-2 px-2 text-sm font-extrabold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)]"
                    />
                    <button 
                      onClick={() => setAdminBalanceChange((prev) => prev + 500)}
                      className="px-2.5 py-2 shrink-0 bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] text-xs font-extrabold rounded-xl active:scale-95 hover:bg-[var(--bg-elevated)]"
                    >
                      +500
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Jail State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAdminSetJail('ACTIVE')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold truncate transition-all ${adminSetJail === 'ACTIVE' ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-sm' : 'bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => setAdminSetJail('IN_JAIL')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold truncate transition-all ${adminSetJail === 'IN_JAIL' ? 'bg-red-500 text-white shadow-sm' : 'bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
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

      {/* ── WINNER CELEBRATION & MOBILE ANALYTICS OVERLAY ── */}
      {game.status === 'ENDED' && game.winnerId && (() => {
        const analytics = computeMatchAnalytics(game);

        // Calculate max value for SVG graph Y-scaling
        let maxGraphVal = 2000;
        analytics.progressionSeries.forEach((pt) => {
          game.players.forEach((p) => {
            if ((pt[p.id] || 0) > maxGraphVal) maxGraphVal = pt[p.id];
          });
        });

        return (
          <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col items-center p-4 sm:p-6 text-center animate-in fade-in duration-300 overflow-y-auto">
            <div className="max-w-md w-full my-auto space-y-5 pb-6">
              
              {/* Trophy Icon & Winner Header */}
              <div className="pt-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.4)] animate-bounce">
                  <Trophy className="w-10 h-10 text-amber-400" />
                </div>

                <div className="mt-3">
                  <p className="text-[10px] uppercase font-extrabold tracking-[0.25em] text-amber-400 mb-1">Game Completed</p>
                  <h1 className="font-display font-black text-3xl text-white tracking-tight">
                    {game.players.find((p) => p.id === game.winnerId)?.name} Wins!
                  </h1>
                  <p className="text-[11px] text-white/60 mt-1">
                    Duration: {formatDuration(gameDuration)} · {game.turnNumber} Turns Played
                  </p>
                </div>
              </div>

              {/* 1. Final Leaderboard Table */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-2xl overflow-hidden shadow-2xl text-left">
                <div className="px-4 py-2.5 bg-[var(--bg-primary)] border-b border-[var(--border-custom)] flex justify-between items-center">
                  <span className="font-display font-bold text-xs uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Final Leaderboard
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">Ranked by Net Worth</span>
                </div>

                <div className="divide-y divide-[var(--border-custom)]">
                  {[...game.players]
                    .sort((a, b) => calculateNetWorth(b, game.properties) - calculateNetWorth(a, game.properties))
                    .map((player, index) => {
                      const netWorth = calculateNetWorth(player, game.properties);
                      const propsOwned = game.properties.filter((p) => p.ownerId === player.id).length;
                      const isWinner = player.id === game.winnerId;

                      return (
                        <div
                          key={player.id}
                          className={`p-3.5 flex items-center justify-between transition-colors ${
                            isWinner ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-display font-extrabold text-xs w-5 text-center text-white/50">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </span>
                            <div
                              className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: player.color }}
                            />
                            <div>
                              <p className="font-display font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                                {player.name}
                                {isWinner && <span className="text-[8px] uppercase font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">Winner</span>}
                              </p>
                              <p className="text-[10px] text-[var(--text-secondary)]">
                                Balance: ₹{player.balance.toLocaleString()} · {propsOwned} Properties
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-mono font-bold text-xs text-[var(--accent-mint)]">
                              ₹{netWorth.toLocaleString()}
                            </p>
                            <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase">Net Worth</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 2. 📈 Mobile Net Worth Progression SVG Chart */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-2xl p-4 text-left shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-extrabold text-xs uppercase text-[var(--text-primary)] tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
                    Wealth Progression
                  </h4>
                  <span className="text-[9px] text-[var(--text-secondary)] font-mono">Turn-by-Turn</span>
                </div>

                {/* SVG Line Graph */}
                <div className="w-full h-32 relative bg-[var(--bg-primary)]/80 rounded-xl p-2 border border-[var(--border-custom)] flex items-center justify-center">
                  <svg viewBox="0 0 320 100" className="w-full h-full overflow-visible">
                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="20" x2="320" y2="20" stroke="var(--border-custom)" strokeDasharray="3 3" opacity="0.4" />
                    <line x1="0" y1="50" x2="320" y2="50" stroke="var(--border-custom)" strokeDasharray="3 3" opacity="0.4" />
                    <line x1="0" y1="80" x2="320" y2="80" stroke="var(--border-custom)" strokeDasharray="3 3" opacity="0.4" />

                    {/* Draw line per player */}
                    {game.players.map((player) => {
                      const points = analytics.progressionSeries.map((series, idx) => {
                        const x = (idx / Math.max(1, analytics.progressionSeries.length - 1)) * 310 + 5;
                        const val = series[player.id] || 0;
                        const y = 90 - (val / maxGraphVal) * 80;
                        return `${x.toFixed(1)},${Math.max(5, y).toFixed(1)}`;
                      }).join(' ');

                      return (
                        <g key={player.id}>
                          <polyline
                            fill="none"
                            stroke={player.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Chart Player Color Legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  {game.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: player.color }} />
                      <span className="text-[var(--text-secondary)] font-semibold">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 🏆 Match Awards & Performance Highlights (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-2.5 text-left">
                
                {/* Award 1: Most Valuable Landlord */}
                <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">MVP Landlord</span>
                    <span className="text-xs">👑</span>
                  </div>
                  <p className="font-display font-extrabold text-xs text-[var(--text-primary)] truncate">
                    {analytics.mostValuableLandlord ? analytics.mostValuableLandlord.player.name : 'N/A'}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--accent-mint)]">
                    ₹{analytics.mostValuableLandlord ? analytics.mostValuableLandlord.rentCollected.toLocaleString() : 0} collected
                  </p>
                </div>

                {/* Award 2: Top Performing Property */}
                <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-sky-400">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Top Property</span>
                    <span className="text-xs">🏢</span>
                  </div>
                  <p className="font-display font-extrabold text-xs text-[var(--text-primary)] truncate">
                    {analytics.topPerformingProperty ? analytics.topPerformingProperty.property.cityName : 'N/A'}
                  </p>
                  <p className="text-[10px] font-mono text-sky-400">
                    ₹{analytics.topPerformingProperty ? analytics.topPerformingProperty.totalRentGenerated.toLocaleString() : 0} revenue
                  </p>
                </div>

                {/* Award 3: Most Active Buyer */}
                <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Active Tycoon</span>
                    <span className="text-xs">⚡</span>
                  </div>
                  <p className="font-display font-extrabold text-xs text-[var(--text-primary)] truncate">
                    {analytics.mostActiveBuyer ? analytics.mostActiveBuyer.player.name : 'N/A'}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-400">
                    {analytics.mostActiveBuyer ? analytics.mostActiveBuyer.propertiesBought : 0} properties bought
                  </p>
                </div>

                {/* Award 4: Jailbird Award */}
                <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-custom)] rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-rose-400">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Jailbird Award</span>
                    <span className="text-xs">🔒</span>
                  </div>
                  <p className="font-display font-extrabold text-xs text-[var(--text-primary)] truncate">
                    {analytics.jailbirdAward ? analytics.jailbirdAward.player.name : 'None'}
                  </p>
                  <p className="text-[10px] font-mono text-rose-400">
                    {analytics.jailbirdAward ? analytics.jailbirdAward.jailVisits : 0} jail visits
                  </p>
                </div>

              </div>

              {/* Action Navigation Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/qr-cards"
                  className="py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-white text-xs font-bold text-center active:scale-95 transition-all"
                >
                  QR Cards Hub
                </Link>
                <Link
                  href="/game/setup"
                  className="py-3.5 px-4 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] text-xs font-bold text-center active:scale-95 transition-all shadow-lg"
                >
                  Start New Match
                </Link>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
