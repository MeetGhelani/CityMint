'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gavel, Clock, ChevronRight, X, AlertCircle } from 'lucide-react';
import { Property, Player, PROPERTY_GROUPS } from '@/lib/gameEngine';
import { soundEffects } from '@/lib/soundEffects';

interface AuctionModalProps {
  property: Property;
  players: Player[];
  onClose: () => void;
  onConcludeAuction: (winningPlayerId: string, winningBidAmount: number) => void;
}

export default function AuctionModal({
  property,
  players,
  onClose,
  onConcludeAuction,
}: AuctionModalProps) {
  const group = PROPERTY_GROUPS[property.groupId] || { name: 'City', color: '#10B981', gradientFrom: '#047857', gradientTo: '#022C22' };
  
  // Initial bid starts at 50% of base valuation (min ₹100)
  const initialBid = Math.max(100, Math.floor(property.purchasePrice / 2));
  const [currentBid, setCurrentBid] = useState<number>(initialBid);
  const [leadingPlayerId, setLeadingPlayerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [customBidAmount, setCustomBidAmount] = useState<string>('');

  const activePlayers = players.filter((p) => p.status === 'ACTIVE' || p.status === 'IN_JAIL');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 15-second Countdown Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePlaceBid = (playerId: string, increment: number) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const newBid = currentBid + increment;
    if (newBid > player.balance) return; // Disallow bids exceeding cash balance

    // Sound effect
    soundEffects.playScanBeep();
    soundEffects.triggerHapticVibration([30, 40]);

    setCurrentBid(newBid);
    setLeadingPlayerId(playerId);

    // Anti-sniping: If bid placed within last 3s, extend timer to 5s
    if (timeLeft < 3) {
      setTimeLeft(5);
    }
  };

  const handleCustomBid = (playerId: string) => {
    const amt = parseInt(customBidAmount, 10);
    if (isNaN(amt) || amt <= currentBid) return;

    const player = players.find((p) => p.id === playerId);
    if (!player || amt > player.balance) return;

    soundEffects.playScanBeep();
    soundEffects.triggerHapticVibration([30, 40]);

    setCurrentBid(amt);
    setLeadingPlayerId(playerId);
    setCustomBidAmount('');

    if (timeLeft < 3) {
      setTimeLeft(5);
    }
  };

  const handleFinalize = () => {
    if (!leadingPlayerId) return;
    soundEffects.playCashChime();
    onConcludeAuction(leadingPlayerId, currentBid);
  };

  const leadingPlayer = players.find((p) => p.id === leadingPlayerId);

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-5 shadow-2xl overflow-hidden relative text-left my-auto space-y-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-custom)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Property Header Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md" style={{ backgroundColor: group.color }}>
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase font-extrabold tracking-widest text-amber-400">Live Auction 🔨</span>
              <span className="text-[9px] text-[var(--text-secondary)]">• Base: ₹{property.purchasePrice}</span>
            </div>
            <h2 className="font-display font-extrabold text-xl text-[var(--text-primary)] truncate">{property.cityName}</h2>
          </div>
        </div>

        {/* Live Timer & High Bid Display */}
        <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-custom)] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time Remaining
            </span>
            <span className={`font-mono font-black text-lg px-2.5 py-0.5 rounded-full border ${timeLeft <= 3 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="pt-2 border-t border-[var(--border-custom)] flex justify-between items-end">
            <div>
              <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Current High Bid</span>
              <p className="font-display font-black text-3xl text-[var(--accent-mint)]">
                ₹{currentBid.toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">High Bidder</span>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                {leadingPlayer ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leadingPlayer.color }} />
                    <span className="font-display font-bold text-xs text-[var(--text-primary)]">{leadingPlayer.name}</span>
                  </>
                ) : (
                  <span className="text-xs text-[var(--text-muted)] italic">No bids yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player Quick Bidding Grid */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">
            Tap Player to Raise Bid:
          </label>

          <div className="space-y-2">
            {activePlayers.map((player) => {
              const isLeading = player.id === leadingPlayerId;
              const canBid100 = player.balance >= currentBid + 100;
              const canBid500 = player.balance >= currentBid + 500;

              return (
                <div
                  key={player.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isLeading
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-[var(--bg-primary)]/50 border-[var(--border-custom)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
                    <div className="min-w-0">
                      <p className="font-display font-bold text-xs text-[var(--text-primary)] truncate flex items-center gap-1">
                        {player.name}
                        {isLeading && <span className="text-[8px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.2 rounded-full">High</span>}
                      </p>
                      <p className="text-[9px] text-[var(--text-secondary)]">Cash: ₹{player.balance}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      disabled={!canBid100 || timeLeft === 0}
                      onClick={() => handlePlaceBid(player.id, 100)}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-mint)]/15 border border-[var(--accent-mint)]/30 text-[var(--accent-mint)] font-extrabold text-[10px] hover:bg-[var(--accent-mint)]/25 active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none"
                    >
                      +₹100
                    </button>
                    <button
                      disabled={!canBid500 || timeLeft === 0}
                      onClick={() => handlePlaceBid(player.id, 500)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] hover:bg-amber-500/25 active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none"
                    >
                      +₹500
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conclude Auction Button */}
        <button
          disabled={!leadingPlayerId}
          onClick={handleFinalize}
          className="w-full py-3.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider bg-[var(--accent-mint)] text-[var(--bg-primary)] disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Gavel className="w-4 h-4" />
          <span>Award Property to {leadingPlayer?.name || 'Winner'}</span>
        </button>

      </div>
    </div>
  );
}
