'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Copy, Check, Search, Building, User, Sparkles } from 'lucide-react';
import { INITIAL_PROPERTIES, PROPERTY_GROUPS, RENT_MULTIPLIERS, ACTION_CARDS } from '@/lib/gameEngine';
import QRCodeImage from '@/components/QRCodeImage';

const PLAYER_CARDS = [
  { id: 'CM-4XQ9R2-RED',   label: 'Player (Red)',   color: '#EF4444', emoji: '🔴', bgFrom: '#7f1d1d', bgTo: '#450a0a' },
  { id: 'CM-7MK3WB-BLUE',  label: 'Player (Blue)',  color: '#3B82F6', emoji: '🔵', bgFrom: '#1e3a8a', bgTo: '#172554' },
  { id: 'CM-2NF8TP-GREEN',  label: 'Player (Green)', color: '#10B981', emoji: '🟢', bgFrom: '#064e3b', bgTo: '#022c22' },
  { id: 'CM-5JH6LV-GOLD',  label: 'Player (Gold)',  color: '#F59E0B', emoji: '🟡', bgFrom: '#78350f', bgTo: '#451a03' },
];

const SPECIAL_CARDS = [
  { id: 'CM-SPECIAL-START', name: 'START / PASS GO', desc: 'Collect ₹2,000 when passing Start', icon: '🏁', color: '#10B981' },
  { id: 'CM-SPECIAL-TELEPORT', name: 'TELEPORT HUB', desc: 'Pay ₹500 to teleport anywhere', icon: '⚡', color: '#3B82F6' },
  { id: 'CM-SPECIAL-JAIL', name: 'GO TO JAIL', desc: 'Go directly to Jail, do not pass Start', icon: '⛓️', color: '#EF4444' },
];


export default function QRCardsPage() {
  const [activeTab, setActiveTab] = useState<'players' | 'properties' | 'specials'>('properties');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  // Filter Properties
  const filteredProperties = INITIAL_PROPERTIES.filter((prop) => {
    const matchesGroup = selectedGroup === 'ALL' || prop.groupId === selectedGroup;
    const matchesSearch = prop.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prop.groupId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prop.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <main className="h-screen flex flex-col bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] overflow-hidden print:h-auto print:overflow-visible print:bg-[#0b0c10] print:text-white">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-grid-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
            zoom: 0.82;
          }
          .print\\:break-after-page {
            break-after: page !important;
            page-break-after: always !important;
          }
        }
      `}</style>

      {/* ── FIXED HEADER ── */}
      <div className="flex-none flex items-center justify-between px-6 pt-10 pb-4 border-b border-[var(--border-custom)] bg-[var(--bg-primary)]/90 backdrop-blur-md print:hidden z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-display font-extrabold text-xl text-[var(--text-primary)]">CityMint QR Cards</h2>
            <p className="text-xs text-[var(--text-secondary)]">Printable Title Deeds, Banker Cards &amp; Action Codes</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-mint)] text-[var(--bg-primary)] font-bold text-sm active:scale-95 transition-all shadow-md">
          <Printer className="w-4 h-4" />
          Print View
        </button>
      </div>

      {/* ── NAVIGATION TABS & FILTER BAR (Screen only) ── */}
      <div className="flex-none px-6 pt-4 pb-2 border-b border-[var(--border-custom)]/50 bg-[var(--bg-secondary)]/50 print:hidden z-10 space-y-4">
        
        {/* Tabs */}
        <div className="flex items-center gap-2 max-w-xl mx-auto p-1 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-custom)]">
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'properties'
                ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Building className="w-4 h-4" />
            Properties ({INITIAL_PROPERTIES.length})
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'players'
                ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <User className="w-4 h-4" />
            Player Cards ({PLAYER_CARDS.length})
          </button>

          <button
            onClick={() => setActiveTab('specials')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'specials'
                ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Special &amp; Actions ({SPECIAL_CARDS.length + ACTION_CARDS.length})
          </button>
        </div>

        {/* Filter / Search Bar (Properties Tab) */}
        {activeTab === 'properties' && (
          <div className="max-w-xl mx-auto space-y-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search property by city name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-custom)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mint)] placeholder-[var(--text-muted)]"
              />
            </div>

            {/* Color Group Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setSelectedGroup('ALL')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all ${
                  selectedGroup === 'ALL'
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-custom)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                All Groups
              </button>
              {Object.entries(PROPERTY_GROUPS).map(([key, group]) => (
                <button
                  key={key}
                  onClick={() => setSelectedGroup(key)}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                    selectedGroup === key
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-custom)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: group.color }} />
                  {group.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SCROLLABLE CARDS GRID ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 print:p-0 print:overflow-visible">
        
        {/* Banner guide */}
        <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 print:hidden">
          <p className="text-xs text-[var(--accent-gold)] font-semibold leading-relaxed">
            📋 <strong>Banker Printing Guide:</strong> Print or screenshot these QR cards. The banker uses the app camera to scan these codes for properties bought, rents paid, and player turns.
          </p>
        </div>

        {/* ── TAB 1: PROPERTIES ── */}
        {activeTab === 'properties' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-grid-container print:grid-cols-2 print:gap-4 print:max-w-none">
            {filteredProperties.map((prop, idx) => {
              const group = PROPERTY_GROUPS[prop.groupId] || { name: 'Special', color: '#888888', gradientFrom: '#333333', gradientTo: '#111111' };
              const qrPayload = `CM-PROP-${prop.id}`;
              const c = group.color;
              const isPageBreak = (idx + 1) % 4 === 0 && idx !== filteredProperties.length - 1;

              return (
                <div
                  key={prop.id}
                  className={`rounded-3xl overflow-hidden flex flex-col print:break-inside-avoid print:shadow-none transition-transform hover:-translate-y-1 ${
                    isPageBreak ? 'print:break-after-page' : ''
                  }`}
                  style={{
                    background: `linear-gradient(160deg, #121319 0%, #1a1c24 60%, #0e0f14 100%)`,
                    border: `1.5px solid ${c}55`,
                    boxShadow: `0 0 0 1px ${c}22, 0 10px 40px ${c}25, 0 4px 12px rgba(0,0,0,0.5)`,
                  }}
                >
                  {/* ── High-Contrast Header Banner ── */}
                  <div
                    className="relative overflow-hidden px-5 py-3.5 flex items-center justify-between"
                    style={{
                      background: `linear-gradient(90deg, ${group.gradientFrom} 0%, ${group.gradientTo} 100%)`,
                      borderBottom: `1px solid ${c}44`,
                    }}
                  >
                    {/* Shimmer accent */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-30"
                      style={{
                        background: `linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%)`,
                      }}
                    />
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: c }} />
                      <span className="font-display font-black text-xs uppercase tracking-[0.18em] text-white drop-shadow-md">
                        {group.name}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-black/40 text-white/95 backdrop-blur-sm border border-white/20 relative z-10 shadow-sm">
                      Title Deed
                    </span>
                  </div>

                  {/* ── City name ── */}
                  <div
                    className="pt-5 pb-3 px-5 text-center relative"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, ${c}20 0%, transparent 70%)`,
                    }}
                  >
                    <h3
                      className="font-display font-black text-3xl uppercase tracking-tight text-white"
                      style={{
                        textShadow: `0 0 20px ${c}aa, 0 2px 6px rgba(0,0,0,0.9)`,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {prop.cityName}
                    </h3>
                    <p className="text-[11px] font-bold mt-1 tracking-wide" style={{ color: c }}>
                      Purchase Price: ₹{prop.purchasePrice.toLocaleString()}
                    </p>
                  </div>

                  {/* ── Rent Table — Glass Panel ── */}
                  <div
                    className="mx-4 mb-4 rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${c}33`, background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div
                      className="flex justify-between px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white/90"
                      style={{ background: `linear-gradient(90deg, ${group.gradientFrom}88 0%, ${group.gradientTo}88 100%)`, borderBottom: `1px solid ${c}33` }}
                    >
                      <span>Development Level</span>
                      <span>Rent Rate</span>
                    </div>
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const mult = RENT_MULTIPLIERS[lvl as keyof typeof RENT_MULTIPLIERS];
                      const rent = Math.round(prop.baseRent * mult);
                      const isMax = lvl === 5;
                      return (
                        <div
                          key={lvl}
                          className="flex justify-between px-3.5 py-1.5 text-[11px] font-mono"
                          style={{
                            background: isMax ? `${c}20` : 'transparent',
                            borderBottom: lvl < 5 ? `1px solid rgba(255,255,255,0.05)` : 'none',
                            color: isMax ? '#ffffff' : 'rgba(255,255,255,0.8)',
                          }}
                        >
                          <span>Level {lvl}{isMax ? ' (Max) ★' : ''}</span>
                          <span className="font-bold" style={{ color: isMax ? c : '#ffffff' }}>
                            ₹{rent.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── QR Code — Solid White Box ── */}
                  <div
                    className="mx-4 mb-4 rounded-2xl p-3 flex items-center justify-center bg-white shadow-xl"
                    style={{
                      border: `2px solid ${c}44`,
                      boxShadow: `0 0 24px ${c}35, inset 0 1px 0 rgba(255,255,255,0.9)`,
                    }}
                  >
                    <QRCodeImage value={qrPayload} size={144} fgColor="#000000" bgColor="#ffffff" className="rounded-xl" />
                  </div>

                  {/* ── Footer ── */}
                  <div
                    className="px-5 py-3 flex items-center justify-between"
                    style={{ borderTop: `1px solid ${c}25`, background: 'rgba(0,0,0,0.2)' }}
                  >
                    <div>
                      <p className="text-[8px] uppercase tracking-widest font-extrabold text-white/50">QR Payload</p>
                      <p className="font-mono text-[11px] font-bold text-white/80">{qrPayload}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(qrPayload)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold active:scale-95 transition-all print:hidden"
                      style={{ background: `${c}22`, color: c, border: `1px solid ${c}44` }}
                    >
                      {copied === qrPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB 2: PLAYER CARDS ── */}
        {activeTab === 'players' && (
          <div className="max-w-md mx-auto grid grid-cols-1 gap-6 print:grid-cols-2 print:gap-4 print:max-w-none">
            {PLAYER_CARDS.map((card) => (
              <div
                key={card.id}
                className="rounded-3xl border border-white/10 overflow-hidden shadow-2xl print:shadow-none print:break-inside-avoid print:border-2 print:border-black"
                style={{ background: `linear-gradient(135deg, ${card.bgFrom}, ${card.bgTo})` }}
              >
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
                    <QRCodeImage value={card.id} size={160} className="w-full h-full" />
                  </div>
                </div>

                <div className="px-6 pb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Card ID</p>
                    <p className="font-mono font-bold text-sm text-white tracking-wider">{card.id}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(card.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold active:scale-95 transition-all print:hidden"
                  >
                    {copied === card.id ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 3: SPECIAL & ACTION CARDS ── */}
        {activeTab === 'specials' && (
          <div className="max-w-5xl mx-auto space-y-8 print:space-y-4">
            
            {/* Special Spaces */}
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-secondary)] print:text-black uppercase tracking-wider mb-4">
                Board Special Spaces
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:grid-cols-3">
                {SPECIAL_CARDS.map((sp) => (
                  <div key={sp.id} className="rounded-3xl border border-[var(--border-custom)] bg-[var(--bg-secondary)] overflow-hidden p-5 shadow-xl print:bg-white print:border-2 print:border-black flex flex-col justify-between">
                    <div className="text-center mb-4">
                      <span className="text-4xl mb-2 block">{sp.icon}</span>
                      <h4 className="font-display font-extrabold text-lg text-[var(--text-primary)] print:text-black">{sp.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)] print:text-gray-700 mt-1">{sp.desc}</p>
                    </div>
                    <div className="w-36 h-36 rounded-2xl bg-white p-2 mx-auto border border-[var(--border-custom)] mb-4 flex items-center justify-center"
                         style={{ boxShadow: `0 0 16px ${sp.color}40` }}>
                      <QRCodeImage value={sp.id} size={128} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-secondary)] print:text-black">{sp.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Cards */}
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-secondary)] print:text-black uppercase tracking-wider mb-4">
                Action Cards (1–{ACTION_CARDS.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 print:grid-cols-2">
                {ACTION_CARDS.map((act) => {
                  const payload = `CM-ACTION-${act.id.replace('act-', '')}`;
                  
                  const categoryMeta: Record<string, { accent: string; badgeBg: string }> = {
                    Money:    { accent: '#10B981', badgeBg: '#059669' },
                    Property: { accent: '#38BDF8', badgeBg: '#0284C7' },
                    Jail:     { accent: '#F43F5E', badgeBg: '#E11D48' },
                    Movement: { accent: '#FACC15', badgeBg: '#D97706' },
                    Special:  { accent: '#C084FC', badgeBg: '#7E22CE' },
                  };
                  const meta = categoryMeta[act.category] ?? { accent: '#9CA3AF', badgeBg: '#4B5563' };

                  return (
                    <div
                      key={act.id}
                      className="rounded-2xl border overflow-hidden shadow-lg print:shadow-none print:break-inside-avoid flex transition-transform hover:-translate-y-0.5"
                      style={{
                        borderColor: `${meta.accent}44`,
                        background: `linear-gradient(135deg, #13151c 0%, #1a1d26 100%)`,
                        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 15px ${meta.accent}15`,
                      }}
                    >
                      {/* QR Column */}
                      <div
                        className="w-28 shrink-0 flex items-center justify-center p-3"
                        style={{
                          background: `linear-gradient(180deg, ${meta.badgeBg}33 0%, rgba(0,0,0,0.4) 100%)`,
                          borderRight: `1px solid ${meta.accent}33`,
                        }}
                      >
                        <div className="bg-white rounded-xl p-1 shadow-md">
                          <QRCodeImage value={payload} size={80} />
                        </div>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                        <div>
                          {/* High Visibility Solid Badge Pill */}
                          <span
                            className="inline-block text-[10px] uppercase font-extrabold tracking-wider text-white px-2.5 py-0.5 rounded-full shadow-sm"
                            style={{ backgroundColor: meta.badgeBg }}
                          >
                            {act.category}
                          </span>
                          <h4 className="font-display font-extrabold text-sm text-white mt-2 leading-snug tracking-tight">
                            {act.name}
                          </h4>
                          <p className="text-[11px] text-white/70 leading-relaxed mt-1">
                            {act.description}
                          </p>
                        </div>
                        <p className="text-[9px] font-mono font-bold mt-2 tracking-wider" style={{ color: meta.accent }}>
                          {payload}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
