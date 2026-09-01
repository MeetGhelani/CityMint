import React, { useState } from 'react';
import { Property, PROPERTY_GROUPS, RENT_MULTIPLIERS, getRentAmount, getPropertyValue } from '@/lib/gameEngine';
import { QrCode, Building } from 'lucide-react';
import QRCodeImage from '@/components/QRCodeImage';

interface CityCardProps {
  property: Property;
  ownerName?: string;
  onClose: () => void;
  onBuy?: () => void;
  onPayRent?: () => void;
  onSell?: () => void;
  onAuction?: () => void;
  onUpgrade?: () => void;
  onFreeUpgrade?: () => void;
  currentPlayerId?: string | null;
  currentPlayerName?: string;
}


export default function CityCard({
  property,
  ownerName,
  onClose,
  onBuy,
  onSell,
  onPayRent,
  onAuction,
  onUpgrade,
  onFreeUpgrade,
  currentPlayerId,
  currentPlayerName,
}: CityCardProps) {
  const [showQR, setShowQR] = useState(false);

  const group = PROPERTY_GROUPS[property.groupId as keyof typeof PROPERTY_GROUPS] || {
    name: 'Special',
    color: '#CCCCCC',
  };

  const isOwned = property.ownerId !== null;
  const isOwnerCurrent = currentPlayerId && property.ownerId === currentPlayerId;
  const qrPayload = `CM-PROP-${property.id}`;
  const upgradeCost = property.baseRent * 5;

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Group Color Header */}
      <div 
        className="h-14 flex items-center justify-between px-6 border-b border-[var(--border-custom)]"
        style={{
          background: group.gradientFrom && group.gradientTo 
            ? `linear-gradient(90deg, ${group.gradientFrom} 0%, ${group.gradientTo} 100%)`
            : `${group.color}33`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <span 
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
            style={{ backgroundColor: group.color }}
          />
          <span className="font-display font-extrabold text-xs tracking-widest text-white uppercase drop-shadow-sm">
            {group.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
              showQR 
                ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)]' 
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-custom)]'
            }`}
          >
            {showQR ? <Building className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
            {showQR ? 'Details' : 'QR Code'}
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Property Details or QR Code View */}
      <div className="p-6">
        <h2 className="font-display font-extrabold text-3xl text-[var(--text-primary)] tracking-tight mb-1">
          {property.cityName}
        </h2>

        {/* Ownership Tag */}
        <div className="flex items-center gap-2 mb-6">
          {isOwned ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-custom)] text-[var(--text-primary)]">
              Owned by <strong className="ml-1 text-[var(--accent-mint)]">{ownerName}</strong>
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              ● Unowned
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-custom)] text-[var(--text-primary)] ml-auto">
            Value: ₹{getPropertyValue(property)}
          </span>
        </div>

        {showQR ? (
          /* Scannable QR view */
          <div
            className="flex flex-col items-center justify-center py-6 rounded-2xl mb-6"
            style={{
              background: `radial-gradient(ellipse at center, ${group.color}28 0%, ${group.color}0a 60%, transparent 100%)`,
              border: `1.5px solid ${group.color}44`,
            }}
          >
            <div
              className="rounded-2xl p-2.5 shadow-2xl mb-3"
              style={{
                background: `linear-gradient(135deg, ${group.color}22 0%, white 45%, ${group.color}15 100%)`,
                boxShadow: `0 0 32px ${group.color}40, 0 4px 20px rgba(0,0,0,0.3)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <QRCodeImage value={qrPayload} size={176} className="rounded-xl" />
            </div>
            <p className="text-[10px] uppercase tracking-widest font-extrabold mb-0.5" style={{ color: group.color }}>
              {group.name} · Scan to Register
            </p>
            <p className="font-mono font-bold text-sm tracking-wider" style={{ color: group.color + 'cc' }}>{qrPayload}</p>
          </div>
        ) : (
          /* Normal Stats & Rent Progression view */
          <>
            <div className="space-y-3 mb-6 bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-custom)]">
              <div className="flex justify-between items-center text-sm border-b border-[var(--border-custom)] pb-2">
                <span className="text-[var(--text-secondary)]">Purchase Price</span>
                <span className="font-display font-bold text-[var(--text-primary)] text-base">₹{property.purchasePrice}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Base Rent (L1)</span>
                <span className="font-display font-semibold text-[var(--text-primary)]">₹{property.baseRent}</span>
              </div>
            </div>

            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Rent Progression
            </h3>
            <div className="space-y-2 mb-8">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const mult = RENT_MULTIPLIERS[lvl as keyof typeof RENT_MULTIPLIERS];
                const rent = Math.round(property.baseRent * mult);
                const isCurrent = property.level === lvl;

                return (
                  <div 
                    key={lvl}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all border ${
                      isCurrent 
                        ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]/40 text-[var(--text-primary)] font-semibold' 
                        : 'bg-transparent border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[var(--accent-mint)]' : 'bg-[var(--border-custom)]'}`} />
                      <span>Level {lvl} {lvl === 5 && '(MAX)'}</span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-[var(--accent-mint)]/20 text-[var(--accent-mint)] px-1.5 py-0.5 rounded ml-2">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="font-display font-bold text-[var(--text-primary)]">
                      ₹{rent}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isOwned && (
            <div className="space-y-2">
              {onBuy && (
                <button
                  onClick={onBuy}
                  className="w-full py-3.5 rounded-xl font-display font-bold bg-[var(--accent-mint)] text-[var(--bg-primary)] hover:bg-[var(--accent-mint)]/90 active:scale-[0.98] transition-all text-center shadow-lg text-sm"
                >
                  Buy Property (₹{property.purchasePrice})
                </button>
              )}
              {onAuction && (
                <button
                  onClick={onAuction}
                  className="w-full py-3 rounded-xl font-display font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 active:scale-[0.98] transition-all text-center text-xs flex items-center justify-center gap-1.5"
                >
                  Auction Property 🔨
                </button>
              )}
            </div>
          )}

          {isOwned && !isOwnerCurrent && onPayRent && (
            <button
              onClick={onPayRent}
              className="w-full py-4 rounded-xl font-display font-bold bg-[var(--accent-gold)] text-[var(--bg-primary)] hover:bg-[var(--accent-gold)]/90 active:scale-[0.98] transition-all text-center shadow-lg"
            >
              Pay Rent (₹{getRentAmount(property, undefined) || Math.round(property.baseRent * RENT_MULTIPLIERS[property.level as keyof typeof RENT_MULTIPLIERS])})
            </button>
          )}

          {isOwned && isOwnerCurrent && (
            <div className="space-y-2">
              {/* Free land-bonus upgrade (no cost) — shown when player lands on own property */}
              {onFreeUpgrade && property.level < 5 && (
                <button
                  onClick={onFreeUpgrade}
                  className="w-full py-3.5 rounded-xl font-display font-bold bg-amber-500 text-[var(--bg-primary)] hover:bg-amber-400 active:scale-[0.98] transition-all text-center shadow-lg text-sm flex flex-col items-center gap-0.5 leading-tight"
                >
                  <span>🎁 Land Bonus — Free +1 Level!</span>
                  <span className="text-amber-900 text-[11px] font-semibold tracking-wide">Upgrade to Level {property.level + 1} at no cost</span>
                </button>
              )}
              {/* Paid upgrade — shown from portfolio / manual view */}
              {onUpgrade && !onFreeUpgrade && property.level < 5 && (
                <button
                  onClick={onUpgrade}
                  className="w-full py-3.5 rounded-xl font-display font-bold bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] transition-all text-center shadow-lg text-sm flex flex-col items-center gap-0.5 leading-tight"
                >
                  <span>⬆ Upgrade to Level {property.level + 1}</span>
                  <span className="text-emerald-200 text-[11px] font-semibold tracking-wide">Cost: ₹{upgradeCost}</span>
                </button>
              )}
              {onSell && (
                <button
                  onClick={onSell}
                  className="w-full py-3 rounded-xl font-display font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all text-center"
                >
                  Sell Property (Get ₹{property.purchasePrice})
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
