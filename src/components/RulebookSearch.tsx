'use client';

import React, { useState } from 'react';
import { Search, BookOpen, ChevronRight, X, Smartphone, Layers, Lightbulb, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { 
  searchRulebook, 
  RuleSection, 
  APP_GUIDE_STEPS, 
  ACTION_CARDS_GUIDE, 
  STRATEGY_TIPS,
  ActionCardRule
} from '@/lib/rulebook';

interface RulebookSearchProps {
  onClose?: () => void;
}

export default function RulebookSearch({ onClose }: RulebookSearchProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'app_guide' | 'action_cards' | 'strategy'>('rules');
  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<RuleSection | null>(null);

  const rulesResults = searchRulebook(query);

  const filteredGuideSteps = APP_GUIDE_STEPS.filter((step) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      step.title.toLowerCase().includes(q) ||
      step.subtitle.toLowerCase().includes(q) ||
      step.description.toLowerCase().includes(q) ||
      step.keyActions.some((act) => act.toLowerCase().includes(q))
    );
  });

  const filteredActionCards = ACTION_CARDS_GUIDE.filter((card) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      card.name.toLowerCase().includes(q) ||
      card.code.toLowerCase().includes(q) ||
      card.category.toLowerCase().includes(q) ||
      card.effect.toLowerCase().includes(q) ||
      card.summary.toLowerCase().includes(q)
    );
  });

  const filteredTips = STRATEGY_TIPS.filter((tip) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return tip.title.toLowerCase().includes(q) || tip.tip.toLowerCase().includes(q);
  });

  const categoryMeta: Record<string, { bg: string; text: string; border: string }> = {
    Money:    { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Property: { bg: 'bg-sky-500/15',     text: 'text-sky-400',     border: 'border-sky-500/30' },
    Jail:     { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30' },
    Movement: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
    Special:  { bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/30' },
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--border-custom)] bg-[var(--bg-secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-mint)]/15 border border-[var(--accent-mint)]/30 flex items-center justify-center text-[var(--accent-mint)]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base text-[var(--text-primary)] leading-tight">
              CityMint Rulebook &amp; Guide
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)]">Complete game rules, app usage &amp; action cards</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--border-custom)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-3.5 border-b border-[var(--border-custom)] bg-[var(--bg-primary)]">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search rules, app steps, or cards (e.g., rent info, auction, jail)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-mint)] transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-2.5 text-[10px] font-bold bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded-md border border-[var(--border-custom)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tab Navigation Strip */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[
            { id: 'rules', label: '📖 Rules', count: rulesResults.length },
            { id: 'app_guide', label: '📱 How to Use', count: filteredGuideSteps.length },
            { id: 'action_cards', label: '🃏 Action Cards', count: filteredActionCards.length },
            { id: 'strategy', label: '💡 Strategy', count: filteredTips.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  setSelectedSection(null);
                }}
                className={`py-2 px-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isActive
                    ? 'bg-[var(--accent-mint)] text-[var(--bg-primary)] shadow-md'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* ── TAB 1: GAME RULES ── */}
        {activeTab === 'rules' && (
          <>
            {selectedSection ? (
              /* Detailed Rule View */
              <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-5 animate-in fade-in slide-in-from-right-4 duration-200 space-y-4">
                <button
                  onClick={() => setSelectedSection(null)}
                  className="text-xs font-bold text-[var(--accent-mint)] flex items-center gap-1 hover:underline"
                >
                  ← Back to rules index
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    {selectedSection.category}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-xl text-[var(--text-primary)]">
                  {selectedSection.title}
                </h3>

                <div className="space-y-3 pt-2 border-t border-[var(--border-custom)]">
                  {selectedSection.content.map((paragraph, index) => (
                    <div key={index} className="p-3 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--border-custom)] flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[var(--accent-mint)]/15 text-[var(--accent-mint)] font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{paragraph}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Rules Search Index */
              <div className="space-y-2.5">
                {rulesResults.length > 0 ? (
                  rulesResults.map((section) => (
                    <div
                      key={section.id}
                      onClick={() => setSelectedSection(section)}
                      className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] hover:border-[var(--accent-mint)]/50 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                    >
                      <div className="pr-3">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--accent-mint)]">
                          {section.category}
                        </span>
                        <h4 className="font-display font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-mint)] transition-colors mt-0.5">
                          {section.title}
                        </h4>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-snug">
                          {section.summary}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-mint)] transition-colors shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-[var(--text-secondary)] text-xs">No rules match your search query.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: HOW TO USE THE APP (BANKER GUIDE) ── */}
        {activeTab === 'app_guide' && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-[var(--accent-mint)] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-extrabold text-xs text-[var(--text-primary)] uppercase tracking-wide">Single Device Banker Guide</h4>
                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mt-0.5">
                  Follow these step-by-step instructions to run your match smoothly using one phone or tablet as the Banker terminal.
                </p>
              </div>
            </div>

            {filteredGuideSteps.map((step) => (
              <div
                key={step.id}
                className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-[var(--accent-mint)]/15 border border-[var(--accent-mint)]/30 font-display font-black text-xs text-[var(--accent-mint)] flex items-center justify-center shrink-0">
                      {step.stepNumber}
                    </span>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>{step.icon}</span>
                        <span>{step.title}</span>
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)]">{step.subtitle}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.description}</p>

                <div className="space-y-1.5 pt-2 border-t border-[var(--border-custom)]">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Key Banker Actions:</span>
                  <div className="space-y-1">
                    {step.keyActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-[var(--text-primary)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-mint)] shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-[10px] text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Banker Tip:</strong> {step.bankerTip}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 3: ACTION CARDS DIRECTORY (1-30) ── */}
        {activeTab === 'action_cards' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Showing <strong>{filteredActionCards.length}</strong> of 30 Action Cards</span>
              <span className="text-[10px] font-mono text-[var(--accent-mint)]">CM-ACTION-1 to 30</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredActionCards.map((card) => {
                const meta = categoryMeta[card.category] || { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
                return (
                  <div
                    key={card.id}
                    className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${meta.bg} ${meta.text} ${meta.border} border`}>
                          {card.category}
                        </span>
                        <h4 className="font-display font-black text-sm text-[var(--text-primary)] truncate">{card.name}</h4>
                      </div>
                      <span className="font-mono text-[9px] font-extrabold text-[var(--text-secondary)] px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-custom)] shrink-0">
                        {card.code}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-primary)] font-medium leading-snug">{card.effect}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] italic">Summary: {card.summary}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 4: GAMEPLAY STRATEGY ── */}
        {activeTab === 'strategy' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-extrabold text-xs uppercase tracking-wide">CityMint Tactical Playbook</h4>
                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mt-0.5">
                  Pro strategies for controlling rent multipliers, winning 20s auctions, and maximizing net worth.
                </p>
              </div>
            </div>

            {filteredTips.map((t, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] space-y-1.5 shadow-sm">
                <h4 className="font-display font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <span className="text-[var(--accent-mint)]">💡</span>
                  <span>{t.title}</span>
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-6">{t.tip}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
