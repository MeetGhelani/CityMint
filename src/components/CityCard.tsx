import React from 'react';
import { Property, PROPERTY_GROUPS, RENT_MULTIPLIERS, getRentAmount, getPropertyValue } from '@/lib/gameEngine';

interface CityCardProps {
  property: Property;
  ownerName?: string;
  onClose?: () => void;
  onBuy?: () => void;
  onSell?: () => void;
  onPayRent?: () => void;
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
  currentPlayerId,
  currentPlayerName,
}: CityCardProps) {
  const group = PROPERTY_GROUPS[property.groupId as keyof typeof PROPERTY_GROUPS] || {
    name: 'Special',
    color: '#CCCCCC',
  };

  const isOwned = property.ownerId !== null;
  const isOwnerCurrent = currentPlayerId && property.ownerId === currentPlayerId;

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Group Color Header */}
      <div 
        className="h-14 flex items-center justify-between px-6 border-b border-[var(--border-custom)]"
        style={{ backgroundColor: group.color + '20' }} // 12% opacity background
      >
        <div className="flex items-center gap-3">
          <span 
            className="w-4 h-4 rounded-full border border-white/20"
            style={{ backgroundColor: group.color }}
          />
          <span className="font-display font-semibold text-xs tracking-wider text-[var(--text-secondary)] uppercase">
            {group.name}
          </span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-[var(--text-secondary)] active:bg-white/10 active:scale-95 transition-all"
          >
            ✕
          </button>
        )}
      </div>

      {/* Property Details */}
      <div className="p-6">
        <h2 className="font-display font-extrabold text-3xl text-white tracking-tight mb-1">
          {property.cityName}
        </h2>
        
        {/* Ownership Tag */}
        <div className="flex items-center gap-2 mb-6">
          {isOwned ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white">
              Owned by <strong className="ml-1 text-[var(--accent-mint)]">{ownerName}</strong>
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              ● Unowned
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white ml-auto">
            Value: ₹{getPropertyValue(property)}
          </span>
        </div>

        {/* Pricing List */}
        <div className="space-y-3 mb-6 bg-black/20 rounded-xl p-4 border border-[var(--border-custom)]">
          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
            <span className="text-[var(--text-secondary)]">Purchase Price</span>
            <span className="font-display font-bold text-white text-base">₹{property.purchasePrice}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-secondary)]">Base Rent (L1)</span>
            <span className="font-display font-semibold text-white">₹{property.baseRent}</span>
          </div>
        </div>

        {/* Levels Rent Progression */}
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
                    ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]/40 text-white font-semibold' 
                    : 'bg-transparent border-transparent text-[var(--text-secondary)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[var(--accent-mint)]' : 'bg-white/20'}`} />
                  <span>Level {lvl} {lvl === 5 && '(MAX)'}</span>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-[var(--accent-mint)]/20 text-[var(--accent-mint)] px-1.5 py-0.5 rounded ml-2">
                      Active
                    </span>
                  )}
                </div>
                <div className="font-display font-bold">
                  ₹{rent}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isOwned && onBuy && (
            <button
              onClick={onBuy}
              className="w-full py-4 rounded-xl font-display font-bold bg-[var(--accent-mint)] text-[var(--bg-primary)] hover:bg-[var(--accent-mint)]/90 active:scale-[0.98] transition-all text-center shadow-lg"
            >
              Buy Property (₹{property.purchasePrice})
            </button>
          )}

          {isOwned && !isOwnerCurrent && onPayRent && (
            <button
              onClick={onPayRent}
              className="w-full py-4 rounded-xl font-display font-bold bg-[var(--accent-gold)] text-[var(--bg-primary)] hover:bg-[var(--accent-gold)]/90 active:scale-[0.98] transition-all text-center shadow-lg"
            >
              Pay Rent (₹{getRentAmount(property, undefined) || Math.round(property.baseRent * RENT_MULTIPLIERS[property.level as keyof typeof RENT_MULTIPLIERS])})
            </button>
          )}

          {isOwned && isOwnerCurrent && onSell && (
            <button
              onClick={onSell}
              className="w-full py-3 rounded-xl font-display font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all text-center"
            >
              Sell Property (Get ₹{Math.floor(getPropertyValue(property) / 2)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
