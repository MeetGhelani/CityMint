'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Download, Share, Plus, ChevronUp } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(true);
  const [installed, setInstalled] = useState(true);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const [installing, setInstalling] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }

    // Read early captured event if it exists
    if ((window as any).deferredPrompt) {
      deferredPrompt.current = (window as any).deferredPrompt;
      setInstallReady(true);
    }

    // Set callback in case it fires later
    (window as any).onBeforeInstallPromptReady = (e: BeforeInstallPromptEvent) => {
      deferredPrompt.current = e;
      setInstallReady(true);
    };

    const handleBefore = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setInstallReady(true);
    };
    const handleInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', handleBefore);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBefore);
      window.removeEventListener('appinstalled', handleInstalled);
      (window as any).onBeforeInstallPromptReady = null;
    };
  }, []);

  if (installed) return <>{children}</>;

  const handleInstallClick = async () => {
    if (isIOS()) { setShowIOSSheet(true); return; }
    if (deferredPrompt.current) {
      setInstalling(true);
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setInstalling(false);
      deferredPrompt.current = null;
    } else {
      setShowIOSSheet(true);
    }
  };

  return (
    <main className="fixed inset-0 flex flex-col bg-gradient-to-b from-[#0A0B10] via-[#0D1018] to-[#12151F] overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#00E5A0]/6 blur-[80px]" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-[#F5A623]/6 blur-[80px]" />
      </div>

      <div className="flex flex-col items-center text-center px-6 pt-20 pb-10 z-10 flex-1">
        <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-[#00E5A0] to-[#F5A623] p-[3px] shadow-2xl shadow-[#00E5A0]/20 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="CityMint Logo" className="w-full h-full rounded-[25px] object-cover" />
        </div>

        <h1 className="text-6xl uppercase mb-3 select-none flex items-center justify-center">
          <span className="brand-title-gold-solid">City</span>
          <span className="brand-title-gold-outline ml-1">Mint</span>
        </h1>
        <p className="text-[#94A3B8] font-semibold tracking-[0.25em] uppercase text-xs mb-2">Own. Build. Prosper.</p>
        <p className="text-[#475569] text-xs font-medium mb-10">The smart digital banker for your board game</p>

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-12">
          {[
            { icon: '🏦', label: 'Smart Banker', sub: 'Auto transactions' },
            { icon: '📱', label: 'QR Scanning',  sub: 'Instant detection' },
            { icon: '⚡', label: 'Offline First', sub: 'No internet' },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center text-center p-3 rounded-2xl border border-white/10 bg-white/4">
              <span className="text-xl mb-1.5">{f.icon}</span>
              <p className="text-[10px] font-bold text-white leading-tight">{f.label}</p>
              <p className="text-[9px] text-[#475569] mt-0.5 leading-tight">{f.sub}</p>
            </div>
          ))}
        </div>

        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={handleInstallClick}
            disabled={installing}
            className="w-full py-4 rounded-2xl font-display font-extrabold text-base bg-[#00E5A0] text-[#0A0B10] shadow-xl shadow-[#00E5A0]/25 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {installing ? (
              <><span className="w-4 h-4 border-2 border-[#0A0B10]/30 border-t-[#0A0B10] rounded-full animate-spin" />Installing…</>
            ) : (
              <><Download className="w-5 h-5" />{isIOS() ? 'How to Install' : 'Install App'}</>
            )}
          </button>
          <p className="text-[11px] text-[#475569] font-medium">Free · No account needed · Works offline</p>
        </div>
      </div>

      {showIOSSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setShowIOSSheet(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-[#12151F] border-t border-x border-white/10 p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
            <h3 className="font-display font-extrabold text-xl text-white text-center mb-2">Add to Home Screen</h3>
            <p className="text-xs text-[#475569] text-center mb-8">Follow these steps to install CityMint on your device</p>
            <div className="space-y-5">
              {[
                { icon: <Share className="w-5 h-5 text-[#00E5A0]" />, title: 'Tap the Share button', desc: 'Tap the Share icon (□↑) at the bottom of your browser' },
                { icon: <Plus className="w-5 h-5 text-[#00E5A0]" />, title: 'Add to Home Screen', desc: 'Scroll down and tap "Add to Home Screen"' },
                { icon: <ChevronUp className="w-5 h-5 text-[#00E5A0]" />, title: 'Tap Add', desc: 'Confirm by tapping "Add" in the top right corner' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-[#00E5A0]/10 border border-[#00E5A0]/20 flex items-center justify-center flex-none">{item.icon}</div>
                  <div><p className="text-sm font-bold text-white">{item.title}</p><p className="text-xs text-[#475569] mt-0.5">{item.desc}</p></div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowIOSSheet(false)} className="w-full mt-8 py-3 rounded-xl bg-white/6 border border-white/10 text-[#94A3B8] text-sm font-semibold active:bg-white/10 transition-all">Got it</button>
          </div>
        </div>
      )}
    </main>
  );
}
