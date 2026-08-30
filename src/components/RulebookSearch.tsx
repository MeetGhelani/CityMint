'use client';

import React, { useState } from 'react';
import { Search, BookOpen, ChevronRight, X } from 'lucide-react';
import { searchRulebook, RuleSection } from '@/lib/rulebook';

interface RulebookSearchProps {
  onClose?: () => void;
}

export default function RulebookSearch({ onClose }: RulebookSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<RuleSection | null>(null);

  const results = searchRulebook(query);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-primary)] text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-custom)] bg-[var(--bg-secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--accent-mint)]" />
          <h2 className="font-display font-bold text-lg">CityMint Rulebook</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-[var(--text-secondary)] active:bg-white/10"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-[var(--border-custom)] bg-[var(--bg-primary)]">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search rules (e.g. rent, jail, bankruptcy)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-mint)] transition-all text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3.5 text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedSection ? (
          /* Detailed View */
          <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] p-6 animate-in fade-in slide-in-from-right-5 duration-200">
            <button
              onClick={() => setSelectedSection(null)}
              className="mb-4 text-xs font-semibold text-[var(--accent-mint)] flex items-center gap-1 hover:underline"
            >
              ← Back to search results
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-gold)] bg-[var(--accent-gold)]/10 px-2 py-0.5 rounded">
              {selectedSection.category}
            </span>
            <h3 className="font-display font-extrabold text-2xl text-white mt-2 mb-4">
              {selectedSection.title}
            </h3>
            <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              {selectedSection.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : (
          /* Search Results List */
          <div className="space-y-2">
            {results.length > 0 ? (
              results.map((section) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSection(section)}
                  className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-custom)] hover:border-white/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="pr-4">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-mint)]">
                      {section.category}
                    </span>
                    <h4 className="font-display font-bold text-base text-white group-hover:text-[var(--accent-mint)] transition-colors mt-0.5">
                      {section.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
                      {section.summary}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-mint)] transition-colors flex-shrink-0" />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)] text-sm">No rules match your search query.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
