'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Copy, Check } from 'lucide-react';

const PLAYER_CARDS = [
  { id: 'CM-P001-RED',   label: 'Player 1', color: '#EF4444', emoji: '🔴', bgFrom: '#7f1d1d', bgTo: '#450a0a' },
  { id: 'CM-P002-BLUE',  label: 'Player 2', color: '#3B82F6', emoji: '🔵', bgFrom: '#1e3a8a', bgTo: '#172554' },
  { id: 'CM-P003-GREEN', label: 'Player 3', color: '#10B981', emoji: '🟢', bgFrom: '#064e3b', bgTo: '#022c22' },
  { id: 'CM-P004-GOLD',  label: 'Player 4', color: '#F59E0B', emoji: '🟡', bgFrom: '#78350f', bgTo: '#451a03' },
];

function qrUrl(code: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(code)}`;
}

export default function QRCardsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main className="h-screen flex flex-col bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">

      {/* ── FIXED HEADER ── */}
      <div className="flex-none flex items-center justify-between px-6 pt-10 pb-4 border-b border-[var(--border-custom)] bg-[var(--bg-primary)]/80 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-display font-extrabold text-xl text-[var(--text-primary)]">Player QR Cards</h2>
            <p className="text-xs text-[var(--text-secondary)]">Print or screenshot to use in game</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] font-bold text-sm active:scale-95 transition-all">
          <Printer className="w-4 h-4" />
          Print All
        </button>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto print:p-0">

      <div className="mx-6 mt-6 p-4 rounded-2xl bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 print:hidden">
        <p className="text-xs text-[var(--accent-gold)] font-semibold leading-relaxed">
          📋 <strong>How to use:</strong> Print this page or screenshot each card. During game setup, each player scans their card using the Scan Card button.
        </p>
      </div>

      <div className="px-6 py-6 grid grid-cols-1 gap-6 max-w-md mx-auto print:grid-cols-2 print:gap-6 print:max-w-none print:p-0 print-card-grid">
        {PLAYER_CARDS.map((card) => (
          <div key={card.id} className="rounded-3xl border border-white/10 overflow-hidden shadow-2xl print:shadow-none print-card" style={{ background: `linear-gradient(135deg, ${card.bgFrom}, ${card.bgTo})` }}>
            <div className="px-6 pt-6 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{card.emoji}</span>
                <div>
                  <p className="font-display font-extrabold text-lg text-white">{card.label}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: card.color }}>CityMint Banker Card</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: card.color }} />
            </div>

            <div className="flex flex-col items-center py-4">
              <div className="w-44 h-44 rounded-2xl bg-white p-2 shadow-xl">
                <img src={qrUrl(card.id)} alt={`QR code for ${card.label}`} className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Card ID</p>
                <p className="font-mono font-bold text-sm text-white tracking-wider">{card.id}</p>
              </div>
              <button onClick={() => handleCopy(card.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold active:scale-95 transition-all print:hidden">
                {copied === card.id ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-6 mb-10 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] print:hidden">
        <p className="text-xs text-[var(--text-secondary)] font-medium text-center">
          💡 <strong className="text-[var(--text-primary)]">No printer?</strong> Scan a screenshot of the QR from another phone screen, or manually type the Card ID during setup.
        </p>
      </div>
      </div>{/* end scrollable */}
    </main>
  );
}
