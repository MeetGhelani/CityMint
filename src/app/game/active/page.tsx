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
  GameState, Player, Property, GameTransaction, ACTION_CARDS, PROPERTY_GROUPS, RENT_MULTIPLIERS,
  getRentAmount, getPropertyValue, calculateNetWorth,
  endTurn, purchaseProperty, payRent, passStart, activateTeleport,
  sendToJail, releaseFromJail, sellProperty, resolveDebt,
  declareBankruptcy, undoLastAction, manualCorrectState, executeActionCard,
  endGame, saveGameStateToStorage, loadGameStateFromStorage,
  executeTargetedPoliceRaid, executeTargetedPropertyUpgrade, executePropertySwap,
  computeMatchAnalytics, executeAuctionWin, upgradePropertyLevel, landOnOwnPropertyUpgrade,
  transferPropertyAsDebtPayment
} from '@/lib/gameEngine';
import { localGetSetting, localGetGame, localSaveGame, localSaveHistory, localSaveSetting } from '@/lib/db';
import { syncGameStateToSupabase, flushSyncQueue } from '@/lib/syncEngine';
import QRCodeImage from '@/components/QRCodeImage';
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
  const [scanContext, setScanContext] = useState<'BUY' | 'RENT' | 'TELEPORT' | 'JAIL' | 'ACTION' | 'INFO' | 'SELF_LAND' | null>(null);
  const [scannedProperty, setScannedProperty] = useState<Property | null>(null);
  const [scannedPlayer, setScannedPlayer] = useState<Player | null>(null);
  const [auctionProperty, setAuctionProperty] = useState<Property | null>(null);
  const [inspectPlayerId, setInspectPlayerId] = useState<string | null>(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState<GameTransaction | null>(null);
  const [showQRCardsModal, setShowQRCardsModal] = useState(false);
  const [qrSearchQuery, setQrSearchQuery] = useState('');
  const [qrActiveTab, setQrActiveTab] = useState<'properties' | 'specials' | 'players'>('properties');
  
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
  const [adminNewName, setAdminNewName] = useState<string>('');
  const [adminBalanceChange, setAdminBalanceChange] = useState<number>(0);
  const [adminSetJail, setAdminSetJail] = useState<'ACTIVE' | 'IN_JAIL' | ''>('');
  const [adminSelectedProp, setAdminSelectedProp] = useState<string>('');
  const [adminPropOwner, setAdminPropOwner] = useState<string>('');
  const [adminPropLevel, setAdminPropLevel] = useState<number>(1);

  // Timer/Duration Tracker
  const [gameDuration, setGameDuration] = useState<number>(0);

  // Custom App Notification / Confirm Dialog States
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activePlayerCardRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll current turn player's card into view when turn changes
  useEffect(() => {
    if (game?.currentPlayerId && activePlayerCardRef.current) {
      activePlayerCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [game?.currentPlayerId]);

  const showToast = (message: string, type: 'error' | 'warning' | 'info' = 'error', durationMs: number = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, durationMs);
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
            
            // Set up duration tracking (uses stored elapsedSeconds if available)
            const storedSeconds = (gameState as any).elapsedSeconds;
            if (typeof storedSeconds === 'number') {
              setGameDuration(storedSeconds);
            } else {
              const elapsed = Math.floor((Date.now() - new Date(gameState.createdAt).getTime()) / 1000);
              setGameDuration(elapsed > 0 ? elapsed : 0);
            }
          } else {
            router.push('/');
          }
        });
      } else {
        router.push('/');
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  // Active Timer Interval
  useEffect(() => {
    if (!game || game.status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      setGameDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [game?.status]);

  // Helper to apply engine state modifications, persist, and trigger sync
  const updateGameState = async (nextState: GameState) => {
    const stateWithDuration = {
      ...nextState,
      elapsedSeconds: gameDuration,
    };
    setGame(stateWithDuration);
    setSyncing(true);
    
    // Save locally to IndexedDB & LocalStorage auto-save
    await localSaveGame(stateWithDuration);
    saveGameStateToStorage(stateWithDuration);

    // Audio SFX triggers
    const latestTx = nextState.transactions[0];
    if (latestTx) {
      if (latestTx.type === 'RENT' || latestTx.type === 'PURCHASE' || latestTx.type === 'START' || latestTx.type === 'SALE' || latestTx.type === 'DEBT_PAYMENT' || latestTx.type === 'BANKRUPTCY') {
        soundEffects.playCashChime();
      } else if (latestTx.type === 'JAIL_ENTER') {
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

      // 🎉 Multi-burst confetti celebration
      const winnerColor = winner?.color ?? '#F59E0B';
      const colors = [winnerColor, '#F59E0B', '#FFFFFF', '#10B981'];

      const fireSide = (origin: { x: number; y: number }, angle: number) => {
        confetti({
          particleCount: 80,
          angle,
          spread: 55,
          origin,
          colors,
          startVelocity: 45,
          gravity: 0.9,
          ticks: 200,
        });
      };

      const fireOverhead = () => {
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { x: 0.5, y: 0.3 },
          colors,
          startVelocity: 30,
          gravity: 1,
          ticks: 250,
          scalar: 1.2,
        });
      };

      // Burst sequence: left cannon, right cannon × 3 rounds + overhead shower
      fireSide({ x: 0, y: 0.65 }, 60);
      fireSide({ x: 1, y: 0.65 }, 120);

      setTimeout(() => {
        fireSide({ x: 0.1, y: 0.5 }, 55);
        fireSide({ x: 0.9, y: 0.5 }, 125);
      }, 300);

      setTimeout(() => {
        fireSide({ x: 0, y: 0.7 }, 65);
        fireSide({ x: 1, y: 0.7 }, 115);
      }, 600);

      setTimeout(fireOverhead, 800);
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
    const nextPlayer = nextState.players.find((p) => p.id === nextState.currentPlayerId);
    if (nextPlayer) {
      showToast(`👤 Turn switched to ${nextPlayer.name}!`, 'info', 2500);
    }
  };

  const handleUndo = () => {
    if (game.undoStack.length === 0) return;
    triggerConfirm(
      'Undo Last Action',
      'This will roll back the most recent transaction. Are you sure?',
      () => {
        const nextState = undoLastAction(game);
        updateGameState(nextState);
      }
    );
  };

  // QR Scanning resolution
  const handleQRScanResolved = (code: string) => {
    setShowScanner(false);
    setScannedResult(code);

    // 1. Process Special Zone: START PASS
    if (code === 'CM-SPECIAL-START') {
      if (game.currentPlayerId) {
        triggerConfirm(
          'Pass Start Bonus',
          `Credit ₹2,000 Pass Start salary to ${currentPlayer?.name}?`,
          () => {
            const nextState = passStart(game, game.currentPlayerId!);
            updateGameState(nextState);
            showToast(`⚡ ₹2,000 Pass Start salary bonus credited to ${currentPlayer?.name}!`, 'info', 2500);
          }
        );
      }
      return;
    }

    // 2. Process Special Zone: TELEPORT
    if (code.startsWith('CM-SPECIAL-TELEPORT')) {
      if (game.currentPlayerId) {
        const pObj = game.players.find((p) => p.id === game.currentPlayerId);
        if (pObj && pObj.balance < 500) {
          showToast(`⚠️ Insufficient Balance! Teleportation costs ₹500, but ${pObj.name} only has ₹${pObj.balance.toLocaleString()}.`, 'warning', 3000);
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
        showToast(`🔒 ${currentPlayer?.name} has been sent directly to Jail!`, 'info', 2500);
      }
      return;
    }

    // 4. Process Player Scan (Turn Switch shortcut)
    if (code.startsWith('CM-PLAYER-') || game.players.some((p) => p.playerCode === code)) {
      const targetP = game.players.find((p) => p.playerCode === code || p.playerCode === code.replace('CM-PLAYER-', ''));
      if (targetP) {
        if (targetP.status === 'ELIMINATED' || targetP.status === 'BANKRUPT') {
          showToast(`🚫 ${targetP.name} is eliminated and cannot take turns.`, 'warning', 3000);
          return;
        }
        // Optimistically update turns
        const nextState = {
          ...game,
          currentPlayerId: targetP.id,
        };
        updateGameState(nextState);
        showToast(`👤 Turn switched to ${targetP.name}!`, 'info', 2500);
      } else {
        showToast('Unknown player QR code card scanned.', 'error', 3000);
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
        showToast(`🃏 Action Card Drawn: ${card.name}`, 'info', 2500);
      } else {
        showToast('Unknown action card code scanned.', 'error', 3000);
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
        // Warning toast if player cash is below property purchase price
        if (currentPlayer && currentPlayer.balance < prop.purchasePrice) {
          showToast(
            `⚠️ Shortfall Warning! ${currentPlayer.name} has ₹${currentPlayer.balance.toLocaleString()}, but ${prop.cityName} costs ₹${prop.purchasePrice.toLocaleString()}.`,
            'warning',
            3000
          );
        }
        setScanContext('BUY');
      } else if (prop.ownerId === game.currentPlayerId) {
        setScanContext('SELF_LAND'); // Player landed on their own property — free upgrade available
      } else {
        // Warning toast if player cash is below rent due
        const rentAmount = getRentAmount(prop, undefined) || Math.round(prop.baseRent * RENT_MULTIPLIERS[prop.level as keyof typeof RENT_MULTIPLIERS]);
        if (currentPlayer && currentPlayer.balance < rentAmount) {
          showToast(
            `⚠️ Rent Shortfall! ${currentPlayer.name} owes ₹${rentAmount.toLocaleString()} rent for ${prop.cityName}, but only has ₹${currentPlayer.balance.toLocaleString()}. Paying will enter Debt Settlement!`,
            'warning',
            3500
          );
        }
        setScanContext('RENT');
      }
    } else {
      showToast(`Scanned code "${code}" not recognized as a valid CityMint board space.`, 'error', 3000);
    }
  };

  // Property operations
  const handleBuyProperty = () => {
    if (!scannedProperty || !game.currentPlayerId) return;
    if (currentPlayer && currentPlayer.balance < scannedProperty.purchasePrice) {
      showToast(
        `⚠️ Insufficient Balance! ${currentPlayer.name} needs ₹${scannedProperty.purchasePrice.toLocaleString()} to buy ${scannedProperty.cityName}, but only has ₹${currentPlayer.balance.toLocaleString()}.`,
        'warning',
        3000
      );
      return;
    }
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
    if (!activeDebtor || !game.activeDebt) return;

    if (game.activeDebt.creditorId !== 'BANK') {
      // Player-to-player debt: transfer property directly to creditor (no cash)
      const nextState = transferPropertyAsDebtPayment(game, activeDebtor.id, propId);
      updateGameState(nextState);
    } else {
      // Bank debt: sell property to bank (property → unowned, debtor gets cash)
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

    const trimmedName = adminNewName.trim();
    if (trimmedName && game.players.some((p) => p.id !== adminSelectedPlayer && p.name.toLowerCase() === trimmedName.toLowerCase())) {
      showToast('Another player already has that name. Please choose a unique name.');
      return;
    }

    const nextState = manualCorrectState(game, {
      playerId: adminSelectedPlayer,
      nameChange: trimmedName || undefined,
      propertyId: adminSelectedProp || undefined,
      balanceChange: adminBalanceChange !== 0 ? adminBalanceChange : undefined,
      jailStatusChange: adminSetJail !== '' ? (adminSetJail as any) : undefined,
      ownerIdChange: adminPropOwner !== '' ? (adminPropOwner === 'UNOWNED' ? 'UNOWNED' : adminPropOwner) : undefined,
      levelChange: adminSelectedProp ? adminPropLevel : undefined,
    });

    updateGameState(nextState);
    
    // Reset admin form
    setAdminNewName('');
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
      <header className="px-5 sm:px-6 pt-4 sm:pt-5 pb-3.5 border-b border-[var(--border-custom)] bg-[var(--bg-secondary)] flex items-center justify-between safe-padding-top select-none shrink-0">
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
            <span className="font-mono text-[var(--accent-mint)]">⏱️ {formatDuration(gameDuration)}</span>
          </div>
        </div>

        {/* Header Actions & Sync Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQRCardsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30 hover:bg-[var(--accent-mint)]/20 active:scale-95 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            title="Open Scannable QR Cards Directory"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Cards</span>
          </button>

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
          <div className="h-full flex flex-col gap-3 p-3.5 sm:p-5 overflow-y-auto no-scrollbar">
            
            {/* 1. 🏆 Live Multi-Player Scoreboard Strip */}
            <div className="overflow-x-auto no-scrollbar pb-0.5">
              <div className={`grid gap-1.5 ${
                game.players.length === 2 ? 'grid-cols-2' :
                game.players.length === 3 ? 'grid-cols-3' :
                game.players.length === 4 ? 'grid-cols-4' :
                'flex items-center min-w-max gap-2'
              }`}>
                {game.players.map((player) => {
                  const isCurrent = player.id === game.currentPlayerId;
                  const isBankrupt = player.status === 'BANKRUPT' || player.status === 'ELIMINATED';
                  const propsCount = game.properties.filter((p) => p.ownerId === player.id).length;

                  return (
                    <div
                      key={player.id}
                      ref={isCurrent ? activePlayerCardRef : null}
                      onClick={() => {
                        setInspectPlayerId(player.id);
                      }}
                      className={`px-2 py-1.5 sm:px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 min-w-0 ${
                        isBankrupt
                          ? 'bg-red-950/30 border-red-500/30 opacity-70 hover:opacity-100'
                          : isCurrent
                          ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)] shadow-sm ring-1 ring-[var(--accent-mint)]/50'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-custom)] opacity-75 hover:opacity-100'
                      }`}
                      title={`Click to view ${player.name}'s properties & details`}
                    >
                      {/* Properly aligned avatar dot with pulse ring when current */}
                      <div className="relative shrink-0 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-white/20" style={{ backgroundColor: isBankrupt ? '#ef4444' : player.color }} />
                        {isCurrent && !isBankrupt && (
                          <span className="absolute -inset-1 rounded-full border border-[var(--accent-mint)] animate-pulse pointer-events-none" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className={`font-display font-extrabold text-[10px] sm:text-[11px] truncate ${isBankrupt ? 'text-red-300 line-through' : 'text-[var(--text-primary)]'}`}>{player.name}</span>
                          {player.status === 'IN_JAIL' && <span className="text-[8px] shrink-0">🔒</span>}
                          {isBankrupt && <span className="text-[8px] shrink-0">🚫</span>}
                        </div>
                        <p className="text-[8.5px] sm:text-[9px] font-mono truncate">
                          {isBankrupt ? (
                            <span className="text-red-400 font-bold uppercase">BANKRUPT</span>
                          ) : (
                            <span className="text-[var(--text-secondary)]">
                              ₹{player.balance >= 1000 ? `${(player.balance / 1000).toFixed(1)}k` : player.balance} · 🏢{propsCount}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. 💎 Visually Stunning Unified Current Turn & Banker Balance Hero Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-elevated)] to-[var(--bg-secondary)] border border-[var(--border-custom)] relative overflow-hidden shadow-lg flex items-center justify-between gap-4">
              {/* Subtle Radial Color Glow */}
              <div 
                className="absolute -left-8 -top-8 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30" 
                style={{ backgroundColor: currentPlayer?.color || 'var(--accent-mint)' }}
              />

              {/* Left: Current Player & Turn Badge */}
              <div className="flex items-center gap-3.5 min-w-0 z-10">
                <div className="relative shrink-0">
                  <span 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 shadow-md"
                    style={{ backgroundColor: currentPlayer?.color || 'var(--accent-mint)' }}
                  >
                    <Landmark className="w-6 h-6 text-white stroke-[2.2]" />
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--accent-mint)] border-2 border-[var(--bg-secondary)] animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] uppercase font-extrabold tracking-widest text-[var(--accent-mint)] bg-[var(--accent-mint)]/10 px-2 py-0.5 rounded border border-[var(--accent-mint)]/20">
                      Current Turn
                    </span>
                    {currentPlayer?.status === 'IN_JAIL' && (
                      <span className="text-[8.5px] font-extrabold uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        🔒 In Jail ({currentPlayer.jailTurns}/3)
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-extrabold text-lg sm:text-xl text-[var(--text-primary)] truncate mt-1">
                    {currentPlayer?.name}
                  </h2>
                </div>
              </div>

              {/* Right: Active Banker Balance Display */}
              <div className="text-right shrink-0 z-10">
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)] block">
                  Active Balance
                </span>
                <div className="font-display font-black text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight leading-none mt-1">
                  ₹{currentPlayer?.balance.toLocaleString()}
                </div>
                {currentPlayer && (
                  <span className="text-[9px] font-bold text-[var(--accent-gold)] mt-1.5 inline-block bg-[var(--accent-gold)]/10 px-2 py-0.5 rounded border border-[var(--accent-gold)]/20">
                    NW: ₹{calculateNetWorth(currentPlayer, game.properties).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* 3. 🔒 Jail Alert Quick Panel (shown only when current player is in jail) */}
            {currentPlayer?.status === 'IN_JAIL' && (
              <div className="p-3.5 rounded-2xl bg-red-500/8 border border-red-500/25 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-red-400">🔒 Jail Penalty Active</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((t) => (
                      <span key={t} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${t <= currentPlayer.jailTurns ? 'bg-red-500 border-red-400 text-white' : 'bg-[var(--bg-primary)] border-[var(--border-custom)] text-[var(--text-secondary)]'}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (!game.currentPlayerId) return;
                      soundEffects.playCashChime();
                      soundEffects.triggerHapticVibration([40, 60]);
                      const nextState = releaseFromJail(game, game.currentPlayerId, 'PAY');
                      updateGameState(nextState);
                    }}
                    disabled={currentPlayer.balance < 500}
                    className="py-1.5 rounded-xl text-[11px] font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Pay Bail ₹500
                  </button>
                  <button
                    onClick={() => {
                      if (!game.currentPlayerId) return;
                      const nextState = releaseFromJail(game, game.currentPlayerId, 'CARD');
                      updateGameState(nextState);
                    }}
                    className="py-1.5 rounded-xl text-[11px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all"
                  >
                    🃏 Use Pardon Card
                  </button>
                </div>
              </div>
            )}

            {/* 4. 🏢 Active Player Portfolio Preview Bar */}
            {currentPlayer && (() => {
              const ownedProps = game.properties.filter((p) => p.ownerId === currentPlayer.id);
              return (
                <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-left shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
                      {currentPlayer.name}'s Portfolio ({ownedProps.length})
                    </span>
                    <button
                      onClick={() => setInspectPlayerId(currentPlayer.id)}
                      className="text-[9.5px] font-bold text-[var(--accent-mint)] hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  {ownedProps.length === 0 ? (
                    <div className="py-2 px-3 rounded-xl bg-[var(--bg-primary)]/60 border border-dashed border-[var(--border-custom)] flex items-center justify-between gap-2">
                      <p className="text-[10.5px] text-[var(--text-secondary)] font-medium">
                        No properties owned yet. Scan property QR to buy!
                      </p>
                      <span className="text-[9px] uppercase font-bold text-[var(--accent-gold)] bg-[var(--accent-gold)]/10 px-2 py-0.5 rounded border border-[var(--accent-gold)]/20 shrink-0">
                        Unowned
                      </span>
                    </div>
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
                            className="px-2.5 py-1 rounded-xl text-[9.5px] font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                            style={{ backgroundColor: group?.color || '#333' }}
                          >
                            <span>{prop.cityName}</span>
                            <span className="bg-black/30 px-1 py-0.1 rounded text-[7.5px] font-mono">Lv{prop.level}</span>
                            {isSetComplete && <span title="Monopoly Set Bonus Active (+1 Level)">✨</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 5. ⚡ Live Activity Ticker Bar */}
            <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] flex items-center gap-2 text-left shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-mint)] animate-pulse shrink-0" />
              <div className="min-w-0 flex-1 flex items-center gap-1.5">
                <span className="text-[8.5px] uppercase font-extrabold text-[var(--text-muted)] tracking-wider shrink-0">Latest:</span>
                <p className="text-[10px] font-semibold text-[var(--text-primary)] truncate">
                  {game.transactions[0] ? game.transactions[0].description : 'Match started. Scan any card to play!'}
                </p>
              </div>
            </div>

            {/* 6. 📷 Centered Scan QR Action Card (Enlarged Hero Card) */}
            <div className="py-7 sm:py-9 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] flex flex-col items-center justify-center text-center shadow-xl my-1 relative overflow-hidden group">
              {/* Radial glow background */}
              <div className="absolute inset-0 bg-radial from-[var(--accent-mint)]/10 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                {/* Subtle pulse ring behind button */}
                <span className="absolute -inset-2 rounded-full border border-[var(--accent-mint)]/30 animate-ping opacity-40 pointer-events-none" />

                <button
                  onClick={() => setShowScanner(true)}
                  className="w-22 h-22 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center bg-gradient-to-tr from-[var(--accent-mint)] via-emerald-400 to-[var(--accent-mint)] text-[var(--bg-primary)] shadow-2xl shadow-[var(--accent-mint)]/30 border-2 border-white/20 active:scale-95 hover:scale-105 transition-all font-display font-black text-xs uppercase gap-1 cursor-pointer"
                >
                  <Camera className="w-7 h-7 stroke-[2.4]" />
                  <span>Scan QR</span>
                </button>
              </div>

              <p className="text-[10.5px] sm:text-xs text-[var(--text-secondary)] font-semibold mt-3.5 tracking-wide">
                Scan Player, Property, Start, Teleport, or Action QR
              </p>
            </div>

            {/* 7. ⚡ Banker Quick Shortcut Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  if (!game.currentPlayerId) return;
                  triggerConfirm(
                    'Pass Start Bonus',
                    `Credit ₹2,000 Pass Start salary to ${currentPlayer?.name}?`,
                    () => {
                      const nextState = passStart(game, game.currentPlayerId!);
                      updateGameState(nextState);
                      showToast(`⚡ ₹2,000 Pass Start salary bonus credited to ${currentPlayer?.name}!`, 'info', 2500);
                    }
                  );
                }}
                disabled={currentPlayer?.status !== 'ACTIVE'}
                className="py-3 px-3 rounded-xl text-xs font-bold bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
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
                  setConfirmModal({
                    title: 'Send to Jail?',
                    message: `Are you sure you want to send ${currentPlayer?.name} directly to Jail?`,
                    onConfirm: () => {
                      if (!game.currentPlayerId) return;
                      const nextState = sendToJail(game, game.currentPlayerId);
                      updateGameState(nextState);
                    },
                  });
                }}
                disabled={currentPlayer?.status !== 'ACTIVE'}
                className="py-3 px-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
              >
                🔒 Send to Jail
              </button>
            </div>

            {/* 8. 🎛️ Turn Navigation Controls */}
            <div className="grid grid-cols-3 gap-2.5 border-t border-[var(--border-custom)] pt-3">
              <button
                onClick={handleUndo}
                disabled={game.undoStack.length === 0}
                className="py-2.5 rounded-xl border border-[var(--border-custom)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo
              </button>

              <button
                onClick={() => setShowAdminPanel(true)}
                className="py-2.5 rounded-xl border border-[var(--border-custom)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
              >
                Adjust
              </button>

              <button
                onClick={handleEndTurn}
                className="py-2.5 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] active:scale-95 transition-all text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-[var(--accent-mint)]/20"
              >
                End Turn
                <ArrowRight className="w-3.5 h-3.5" />
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
                    onClick={() => setInspectPlayerId(player.id)}
                    className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] hover:border-[var(--accent-mint)]/50 transition-all cursor-pointer space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Indicator */}
                        <span className="font-display font-black text-xl text-[var(--accent-gold)] w-6 text-center">
                          #{index + 1}
                        </span>
                        <span 
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: player.color }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-base text-[var(--text-primary)] truncate">
                            {player.name}
                          </h4>
                          <div className="flex gap-2 text-[10px] text-[var(--text-secondary)] mt-0.5">
                            <span>Cash: ₹{player.balance.toLocaleString()}</span>
                            <span>•</span>
                            <span>Properties: {propsCount}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Net Worth</p>
                        <p className="font-display font-extrabold text-base text-[var(--accent-gold)] mt-0.5">
                          ₹{worth.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Property badges preview */}
                    {(() => {
                      const owned = game.properties.filter((p) => p.ownerId === player.id);
                      if (owned.length === 0) return null;

                      return (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--border-custom)]/50">
                          {owned.map((prop) => {
                            const group = PROPERTY_GROUPS[prop.groupId];
                            return (
                              <span
                                key={prop.id}
                                className="px-2 py-0.5 rounded-lg text-[9px] font-bold text-white shadow-xs"
                                style={{ backgroundColor: group?.color || '#333' }}
                              >
                                {prop.cityName}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
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

        {/* TABS 3: Transaction Logs (Fixed Header & Scrollable List) */}
        {activeTab === 'transactions' && (
          <div className="h-full flex flex-col">
            {/* FIXED TOP HEADER: Title & Export CSV */}
            <div className="flex-none p-5 sm:p-6 border-b border-[var(--border-custom)] bg-[var(--bg-primary)] flex justify-between items-center z-10">
              <div>
                <h3 className="font-display font-extrabold text-lg text-[var(--text-primary)]">Activity Feed</h3>
                <p className="text-xs text-[var(--text-secondary)]">Recorded game events ({game.transactions.length} events)</p>
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
                  className="px-3.5 py-2 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  Export CSV
                </button>
              )}
            </div>

            {/* SCROLLABLE MIDDLE: Transaction Items */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 no-scrollbar">
              {game.transactions.length > 0 ? (
                game.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTxDetail(tx)}
                    className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] hover:border-[var(--accent-mint)]/40 active:scale-[0.99] transition-all cursor-pointer text-xs space-y-2 shadow-sm group"
                  >
                    <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)]">
                      <span className="font-semibold uppercase tracking-wider text-[var(--accent-mint)] group-hover:underline">
                        {tx.type}
                      </span>
                      <span>Turn {tx.turnNumber} · Click for details →</span>
                    </div>
                    <p className="text-[var(--text-primary)] font-medium leading-relaxed">
                      {tx.description}
                    </p>
                    <span className="block text-[9px] text-[var(--text-secondary)] text-right font-mono">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                  <Landmark className="w-12 h-12 mb-3" />
                  <p className="text-sm">No transaction events recorded yet.</p>
                </div>
              )}
            </div>
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
          <div className="absolute inset-0 z-40 bg-[var(--bg-primary)] flex flex-col">

            {/* ── FIXED TOP: Alert Header + Stats ── */}
            <div className="flex-none px-5 pt-6 pb-4 space-y-4 border-b border-[var(--border-custom)] bg-[var(--bg-primary)]">
              {/* Alert Header */}
              <div className="text-center">
                <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2 animate-bounce" />
                <h2 className="font-display font-extrabold text-xl text-[var(--text-primary)]">Debt Settlement</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
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

              {/* Section label — context sensitive */}
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] px-0.5">
                {game.activeDebt.creditorId !== 'BANK'
                  ? `Transfer to ${game.players.find((p) => p.id === game.activeDebt!.creditorId)?.name ?? 'creditor'} to reduce debt`
                  : 'Sell to Bank to get cash and reduce shortfall'}
              </p>
            </div>

            {/* ── SCROLLABLE MIDDLE: Properties List ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 no-scrollbar">
              {game.properties.filter((p) => p.ownerId === activeDebtor.id).length > 0 ? (
                game.properties
                  .filter((p) => p.ownerId === activeDebtor.id)
                  .map((prop) => {
                    const isPlayerCreditor = game.activeDebt!.creditorId !== 'BANK';
                    const creditorName = isPlayerCreditor
                      ? game.players.find((p) => p.id === game.activeDebt!.creditorId)?.name ?? 'Player'
                      : 'Bank';
                    return (
                      <div
                        key={prop.id}
                        className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">{prop.cityName}</h4>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            Level {prop.level} · ₹{prop.purchasePrice}
                            {isPlayerCreditor && (
                              <span className="ml-1 text-blue-400">→ {creditorName}</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDebtorSellProp(prop.id)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all shrink-0 active:scale-95 ${
                            isPlayerCreditor
                              ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25'
                              : 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {isPlayerCreditor
                            ? `Transfer → ${creditorName}`
                            : `Sell +₹${prop.purchasePrice}`}
                        </button>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center p-6 bg-[var(--bg-secondary)]/50 rounded-xl border border-dashed border-[var(--border-custom)] text-xs text-[var(--text-secondary)]">
                  No properties owned to liquidate.
                </div>
              )}
            </div>

            {/* ── FIXED BOTTOM: Action Buttons ── */}
            <div className="flex-none px-5 pt-4 pb-8 border-t border-[var(--border-custom)] bg-[var(--bg-primary)]" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
              {game.activeDebt.shortfall <= 0 ? (
                <button
                  onClick={handlePayDebt}
                  className="w-full py-4 rounded-xl font-display font-bold bg-[var(--accent-mint)] text-[var(--bg-primary)] active:scale-[0.98] transition-all text-center shadow-lg animate-pulse"
                >
                  ✓ Confirm Payment (₹{game.activeDebt.amountDue})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDeclareBankruptcy('ELIMINATE')}
                    className="py-4 rounded-xl font-display font-bold border border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25 active:scale-95 text-sm text-center transition-all"
                  >
                    Eliminate Player
                  </button>
                  <button
                    onClick={() => handleDeclareBankruptcy('END_GAME')}
                    className="py-4 rounded-xl font-display font-bold bg-[var(--accent-gold)] text-[var(--bg-primary)] hover:opacity-90 active:scale-95 text-sm text-center transition-all"
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
            { id: 'transactions', label: 'Activity', icon: History },
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
              const upgradeCost = scannedProperty.baseRent * 5;
              if (currentPlayer && currentPlayer.balance < upgradeCost) {
                showToast(
                  `⚠️ Insufficient Balance! Upgrading ${scannedProperty.cityName} costs ₹${upgradeCost.toLocaleString()}, but ${currentPlayer.name} only has ₹${currentPlayer.balance.toLocaleString()}.`,
                  'warning',
                  3000
                );
                return;
              }
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

      {/* Landed on Own Property — Free +1 Level Upgrade */}
      {scanContext === 'SELF_LAND' && scannedProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200">
          <CityCard
            property={scannedProperty}
            ownerName={currentPlayer?.name}
            onClose={() => setScanContext(null)}
            onFreeUpgrade={
              scannedProperty.level < 5 && game.currentPlayerId
                ? () => {
                    const nextState = landOnOwnPropertyUpgrade(game, game.currentPlayerId!, scannedProperty.id);
                    updateGameState(nextState);
                    setScanContext(null);
                  }
                : undefined
            }
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
                  onChange={(e) => { setAdminSelectedPlayer(e.target.value); setAdminNewName(''); }}
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

                {/* Rename Player */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Rename Player</label>
                  <input
                    type="text"
                    value={adminNewName}
                    onChange={(e) => setAdminNewName(e.target.value)}
                    placeholder={`Current: ${game.players.find((p) => p.id === adminSelectedPlayer)?.name ?? '—'}`}
                    maxLength={24}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-2.5 px-3 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)] placeholder-[var(--text-muted)]"
                  />
                  <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Leave blank to keep the current name</p>
                </div>

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
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[150] w-[92%] max-w-md p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 ${
          toast.type === 'warning'
            ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
            : toast.type === 'info'
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            : 'bg-red-950/90 border-red-500/40 text-red-200'
        }`}>
          <span className="text-xl shrink-0">
            {toast.type === 'warning' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '⛔'}
          </span>
          <p className="text-xs font-semibold leading-relaxed">
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

      {/* ── PLAYER PORTFOLIO INSPECTOR DRAWER ── */}
      {inspectPlayerId && !scanContext && (() => {
        const targetPlayer = game.players.find((p) => p.id === inspectPlayerId);
        if (!targetPlayer) return null;
        const ownedProps = game.properties.filter((p) => p.ownerId === targetPlayer.id);

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[85vh] space-y-4 animate-in slide-in-from-bottom-5 duration-200 text-left relative">
              
              {/* Close button */}
              <button
                onClick={() => setInspectPlayerId(null)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-custom)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                ✕
              </button>

              {/* Player Header */}
              <div className="flex items-center gap-3 pr-8">
                <span 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 shadow-md shrink-0"
                  style={{ backgroundColor: targetPlayer.color }}
                >
                  <Landmark className="w-6 h-6 text-white stroke-[2.2]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-xl text-[var(--text-primary)]">
                      {targetPlayer.name}
                    </h3>
                    {targetPlayer.status === 'IN_JAIL' && (
                      <span className="text-[9px] font-extrabold uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        🔒 In Jail
                      </span>
                    )}
                    {(targetPlayer.status === 'BANKRUPT' || targetPlayer.status === 'ELIMINATED') && (
                      <span className="text-[9px] font-extrabold uppercase text-red-400 bg-red-500/15 px-2 py-0.5 rounded border border-red-500/30">
                        🚫 Bankrupt
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2.5 text-xs text-[var(--text-secondary)] mt-1 font-semibold">
                    <span>Cash: <strong className="text-[var(--text-primary)]">₹{targetPlayer.balance.toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>Net Worth: <strong className="text-[var(--accent-gold)]">₹{calculateNetWorth(targetPlayer, game.properties).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* Bankrupt & Eliminated Notice Banner */}
              {(targetPlayer.status === 'BANKRUPT' || targetPlayer.status === 'ELIMINATED') && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-center gap-2 text-red-400">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-display font-extrabold text-sm uppercase tracking-wider">Player Bankrupt & Eliminated</span>
                  </div>
                  <p className="text-xs text-red-300/80 leading-relaxed">
                    {targetPlayer.name} has declared bankruptcy and been eliminated from the match. This player cannot take turns, buy properties, or collect rent.
                  </p>
                </div>
              )}

              {/* Title Bar */}
              <div className="flex items-center justify-between border-t border-[var(--border-custom)] pt-3">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[var(--accent-mint)]" />
                  Owned Properties ({ownedProps.length})
                </span>
                <button
                  onClick={() => {
                    setAdminSelectedPlayer(targetPlayer.id);
                    setShowAdminPanel(true);
                    setInspectPlayerId(null);
                  }}
                  className="text-[10px] font-bold text-[var(--accent-mint)] hover:underline cursor-pointer"
                >
                  Banker Adjust →
                </button>
              </div>

              {/* Property Cards List */}
              {ownedProps.length === 0 ? (
                targetPlayer.status === 'BANKRUPT' || targetPlayer.status === 'ELIMINATED' ? (
                  <div className="p-6 text-center rounded-2xl bg-red-500/5 border border-dashed border-red-500/20 space-y-1">
                    <Building className="w-8 h-8 text-red-400 mx-auto mb-1 opacity-50" />
                    <p className="font-display font-bold text-sm text-red-400">{targetPlayer.name} is Bankrupt</p>
                    <p className="text-xs text-[var(--text-secondary)]">All properties were liquidated or transferred to creditors upon bankruptcy.</p>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl bg-[var(--bg-primary)]/60 border border-dashed border-[var(--border-custom)] space-y-1">
                    <Building className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-1 opacity-50" />
                    <p className="font-display font-bold text-sm text-[var(--text-primary)]">{targetPlayer.name} owns 0 properties</p>
                    <p className="text-xs text-[var(--text-secondary)]">Properties bought during the game will appear here.</p>
                  </div>
                )
              ) : (
                <div className="space-y-2.5">
                  {ownedProps.map((prop) => {
                    const group = PROPERTY_GROUPS[prop.groupId];
                    const isSetComplete = game.completedGroups.includes(prop.groupId);
                    const rent = getRentAmount(prop, targetPlayer);

                    return (
                      <div
                        key={prop.id}
                        className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-custom)] flex items-center justify-between gap-3 shadow-sm hover:border-[var(--border-bright)] transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Color strip accent */}
                          <span 
                            className="w-3.5 h-10 rounded-lg shrink-0" 
                            style={{ backgroundColor: group?.color || '#333' }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-display font-extrabold text-sm text-[var(--text-primary)] truncate">
                                {prop.cityName}
                              </h4>
                              {isSetComplete && <span title="Monopoly Set Bonus Active (+1 Level)">✨</span>}
                            </div>
                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                              Level {prop.level} · Rent: <strong className="text-[var(--accent-mint)]">₹{rent.toLocaleString()}</strong>
                            </p>
                          </div>
                        </div>

                        {/* View Card Button */}
                        <button
                          onClick={() => {
                            setScannedProperty(prop);
                            setScanContext('INFO');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-95 text-xs font-bold shrink-0 transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* ── TRANSACTION DETAIL EXPLANATION DRAWER ── */}
      {selectedTxDetail && (() => {
        const tx = selectedTxDetail;
        const sourcePlayer = game.players.find((p) => p.id === tx.sourcePlayerId);
        const targetPlayer = game.players.find((p) => p.id === tx.targetPlayerId);
        const property = game.properties.find((p) => p.id === tx.propertyId);
        const propGroup = property ? PROPERTY_GROUPS[property.groupId] : null;

        const getTxTypeBadge = (type: string) => {
          switch (type) {
            case 'PURCHASE':
              return { label: 'Property Purchase', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', icon: '🏠' };
            case 'RENT':
              return { label: 'Rent Paid', color: 'bg-amber-500/15 border-amber-500/30 text-amber-400', icon: '💰' };
            case 'START':
              return { label: 'Pass Start Salary', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', icon: '⚡' };
            case 'TELEPORT':
              return { label: 'Teleportation Fee', color: 'bg-sky-500/15 border-sky-500/30 text-sky-300', icon: '⚡' };
            case 'JAIL_ENTER':
              return { label: 'Sent to Jail', color: 'bg-rose-500/15 border-rose-500/30 text-rose-400', icon: '🔒' };
            case 'JAIL_RELEASE':
              return { label: 'Released from Jail', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', icon: '🔓' };
            case 'ACTION_CARD':
              return { label: 'Action Card Event', color: 'bg-purple-500/15 border-purple-500/30 text-purple-300', icon: '🃏' };
            case 'SALE':
              return { label: 'Property Sale / Liquidation', color: 'bg-orange-500/15 border-orange-500/30 text-orange-300', icon: '🏷️' };
            case 'DEBT_PAYMENT':
              return { label: 'Debt Settlement', color: 'bg-rose-500/15 border-rose-500/30 text-rose-300', icon: '⚖️' };
            case 'BANKRUPTCY':
              return { label: 'Bankruptcy Declaration', color: 'bg-red-500/20 border-red-500/40 text-red-400', icon: '🚫' };
            default:
              return { label: 'Banker Adjustment', color: 'bg-blue-500/15 border-blue-500/30 text-blue-300', icon: '⚙️' };
          }
        };

        const badge = getTxTypeBadge(tx.type);

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[85vh] space-y-4 animate-in slide-in-from-bottom-5 duration-200 text-left relative">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-custom)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                ✕
              </button>

              {/* Header Badge & Meta */}
              <div className="pr-8 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badge.color}`}>
                    {badge.icon} {badge.label}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">Turn {tx.turnNumber}</span>
                </div>
                <h3 className="font-display font-black text-lg text-[var(--text-primary)] leading-snug">
                  Event Breakdown
                </h3>
              </div>

              {/* Amount & Description Card */}
              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-custom)] space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-custom)] pb-3">
                  <span className="text-xs text-[var(--text-secondary)] font-semibold">Amount Transferred</span>
                  <span className="font-display font-black text-xl text-[var(--accent-mint)]">
                    {tx.amount > 0 ? `₹${tx.amount.toLocaleString()}` : 'Free / N/A'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-[var(--text-muted)] block">Summary</span>
                  <p className="text-[var(--text-primary)] text-xs leading-relaxed font-medium">
                    {tx.description}
                  </p>
                </div>
              </div>

              {/* Participant Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-primary)]/70 border border-[var(--border-custom)]">
                  <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider block mb-1">Source / Payer</span>
                  <p className="font-display font-bold text-[var(--text-primary)] truncate">
                    {sourcePlayer ? sourcePlayer.name : 'Bank / Game System'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-primary)]/70 border border-[var(--border-custom)]">
                  <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider block mb-1">Recipient / Target</span>
                  <p className="font-display font-bold text-[var(--text-primary)] truncate">
                    {targetPlayer ? targetPlayer.name : 'Bank / Market'}
                  </p>
                </div>
              </div>

              {/* Property Details (If Applicable) */}
              {property && propGroup && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-custom)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: propGroup.color }} />
                    <div>
                      <h4 className="font-display font-bold text-xs text-[var(--text-primary)]">{property.cityName}</h4>
                      <p className="text-[9px] text-[var(--text-secondary)]">Group: {propGroup.name} · Level {property.level}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">₹{property.purchasePrice}</span>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-[10px] text-[var(--text-muted)] text-right font-mono pt-1">
                Recorded: {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' })}
              </div>

              <button
                onClick={() => setSelectedTxDetail(null)}
                className="w-full py-3 rounded-xl font-display font-bold bg-[var(--bg-elevated)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-all text-xs cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── IN-APP SCANNABLE QR CARDS DIRECTORY MODAL ── */}
      {showQRCardsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] text-left relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4 pr-8">
              <div>
                <h3 className="font-display font-black text-xl text-[var(--text-primary)] flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-[var(--accent-mint)]" />
                  QR Cards Directory
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Scan cards directly from screen or print for physical play.
                </p>
              </div>
              <button
                onClick={() => setShowQRCardsModal(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-custom)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search & Tabs */}
            <div className="space-y-3 mb-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search city, group, or card..."
                  value={qrSearchQuery}
                  onChange={(e) => setQrSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-custom)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-mint)]"
                />
              </div>

              {/* Tab Selector */}
              <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-custom)] text-xs font-semibold">
                {[
                  { id: 'properties', label: 'Properties 🏢' },
                  { id: 'specials',   label: 'Special Zones ⚡' },
                  { id: 'players',    label: 'Player Tokens 🔴' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setQrActiveTab(t.id as any)}
                    className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                      qrActiveTab === t.id
                        ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)] font-bold shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable QR Cards Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 space-y-3">
              {qrActiveTab === 'properties' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {game.properties
                    .filter((p) =>
                      p.cityName.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
                      p.groupId.toLowerCase().includes(qrSearchQuery.toLowerCase())
                    )
                    .map((prop) => {
                      const group = PROPERTY_GROUPS[prop.groupId];
                      return (
                        <div
                          key={prop.id}
                          className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-custom)] flex flex-col items-center text-center space-y-2 relative shadow-md"
                        >
                          <span
                            className="w-full py-1 rounded-lg text-[10px] font-extrabold uppercase text-white tracking-wider truncate"
                            style={{ backgroundColor: group?.color || '#333' }}
                          >
                            {prop.cityName}
                          </span>
                          <QRCodeImage
                            value={`CM-PROP-${prop.id}`}
                            size={120}
                            fgColor="#FFFFFF"
                            bgColor="#0A0B10"
                            className="rounded-xl border border-[var(--border-custom)] p-1"
                          />
                          <div className="text-[9px] font-mono text-[var(--text-secondary)] space-y-0.5">
                            <p className="font-bold text-[var(--text-primary)]">Buy: ₹{prop.purchasePrice}</p>
                            <p>Base Rent: ₹{prop.baseRent}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {qrActiveTab === 'specials' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'CM-SPECIAL-START', name: 'START / PASS GO', desc: 'Collect ₹2,000 when passing Start', icon: '🏁', color: '#10B981' },
                    { id: 'CM-SPECIAL-TELEPORT', name: 'TELEPORT HUB', desc: 'Pay ₹500 to teleport anywhere', icon: '⚡', color: '#3B82F6' },
                    { id: 'CM-SPECIAL-JAIL', name: 'GO TO JAIL', desc: 'Go directly to Jail, do not pass Start', icon: '⛓️', color: '#EF4444' },
                  ]
                    .filter((s) => s.name.toLowerCase().includes(qrSearchQuery.toLowerCase()))
                    .map((spec) => (
                      <div
                        key={spec.id}
                        className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-custom)] flex flex-col items-center text-center space-y-2 shadow-md"
                      >
                        <span
                          className="w-full py-1 rounded-lg text-[10px] font-extrabold uppercase text-white tracking-wider flex items-center justify-center gap-1"
                          style={{ backgroundColor: spec.color }}
                        >
                          <span>{spec.icon}</span>
                          <span>{spec.name}</span>
                        </span>
                        <QRCodeImage
                          value={spec.id}
                          size={130}
                          fgColor="#FFFFFF"
                          bgColor="#0A0B10"
                          className="rounded-xl border border-[var(--border-custom)] p-1"
                        />
                        <p className="text-[9px] text-[var(--text-secondary)]">{spec.desc}</p>
                      </div>
                    ))}
                </div>
              )}

              {qrActiveTab === 'players' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {game.players.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-custom)] flex flex-col items-center text-center space-y-2 shadow-md"
                    >
                      <span
                        className="w-full py-1 rounded-lg text-[10px] font-extrabold uppercase text-white tracking-wider truncate"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.name}
                      </span>
                      <QRCodeImage
                        value={p.playerCode || `CM-PLAYER-${p.id}`}
                        size={120}
                        fgColor="#FFFFFF"
                        bgColor="#0A0B10"
                        className="rounded-xl border border-[var(--border-custom)] p-1"
                      />
                      <p className="text-[9px] font-mono text-[var(--text-secondary)] truncate">
                        Code: {p.playerCode || p.id}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="pt-3 border-t border-[var(--border-custom)] mt-3 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-[var(--text-muted)] font-mono">CityMint Local QR Engine</span>
              <button
                onClick={() => setShowQRCardsModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold text-xs hover:bg-[var(--bg-primary)] active:scale-95 transition-all cursor-pointer"
              >
                Close Directory
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
