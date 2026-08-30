'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Volume2, VolumeX, AlertCircle, X } from 'lucide-react';
import { localGetSetting } from '@/lib/db';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

function playBeepSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (_) {}
}

const SCANNER_ELEMENT_ID = 'qr-reader-citymint';

export default function QRScanner({ onScan, onClose, title = 'Scan QR Code' }: QRScannerProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const audioEnabledRef = useRef(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  // Stable scan callback — never changes, so scanner doesn't restart
  const handleScan = useCallback((decodedText: string) => {
    if (hasScannedRef.current) return; // prevent double-fire
    hasScannedRef.current = true;
    if (audioEnabledRef.current) playBeepSound();
    if ('vibrate' in navigator) navigator.vibrate(100);
    onScan(decodedText);
  }, [onScan]);

  // Load audio pref once — stored in ref so scanner never needs to restart
  useEffect(() => {
    localGetSetting<boolean>('audioEnabled', true).then((enabled) => {
      audioEnabledRef.current = enabled;
    });
  }, []);

  // Store current scan handler in ref to protect camera lifecycle from parent re-renders
  const scanHandlerRef = useRef(handleScan);
  useEffect(() => {
    scanHandlerRef.current = handleScan;
  }, [handleScan]);

  // Start scanner exactly once
  useEffect(() => {
    let stopped = false;

    const startScanner = async () => {
      try {
        const html5Qrcode = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
          },
          (decodedText) => {
            scanHandlerRef.current(decodedText);
          },
          () => {} // ignore per-frame errors silently
        );

        if (!stopped) setIsReady(true);
      } catch (err: any) {
        if (!stopped) {
          setCameraError(err?.message || 'Could not access camera. Please allow camera permissions.');
        }
      }
    };

    const timer = setTimeout(startScanner, 250);

    return () => {
      stopped = true;
      clearTimeout(timer);
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []); // Empty dependencies array prevents camera teardowns on render cycles

  const toggleAudio = () => {
    audioEnabledRef.current = !audioEnabledRef.current;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">

      {/* ── HEADER (fixed) ── */}
      <div className="flex-none flex items-center justify-between px-5 pt-10 pb-4 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-[var(--accent-mint)]" />
          <h2 className="font-display font-bold text-base">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <AudioToggleButton audioRef={audioEnabledRef} onToggle={toggleAudio} />
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 active:bg-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── CAMERA AREA ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black relative">

        {/* Force-override html5-qrcode injected inline styles globally */}
        <style>{`
          #${SCANNER_ELEMENT_ID} {
            width: 100% !important;
            height: 100% !important;
          }
          #${SCANNER_ELEMENT_ID} div {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            padding-bottom: 0 !important;
          }
          #${SCANNER_ELEMENT_ID} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          #${SCANNER_ELEMENT_ID} img,
          #${SCANNER_ELEMENT_ID} button,
          #${SCANNER_ELEMENT_ID} select,
          #${SCANNER_ELEMENT_ID} span {
            display: none !important;
          }
        `}</style>

        {/* Glowing Camera Portal Container */}
        <div className="w-72 h-72 rounded-[28px] border-2 border-[var(--accent-mint)] relative overflow-hidden bg-[#0A0B10]/95 shadow-2xl shadow-[var(--accent-mint)]/20 flex items-center justify-center">
          
          {/* html5-qrcode target */}
          <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />

          {/* Corner overlay accents inside the portal */}
          <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[var(--accent-mint)]/80 rounded-tl-md pointer-events-none z-10" />
          <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[var(--accent-mint)]/80 rounded-tr-md pointer-events-none z-10" />
          <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[var(--accent-mint)]/80 rounded-bl-md pointer-events-none z-10" />
          <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[var(--accent-mint)]/80 rounded-br-md pointer-events-none z-10" />

          {/* Floating Laser scan line */}
          {!cameraError && isReady && (
            <div className="absolute inset-x-4 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-mint)] to-transparent animate-scan-line pointer-events-none z-10" />
          )}
        </div>

        {/* Info text below */}
        {!cameraError && (
          <div className="mt-8 text-center px-6">
            {isReady ? (
              <p className="text-sm text-white/80 font-medium">Align QR code inside the frame</p>
            ) : (
              <p className="text-sm text-white/40 font-medium">Starting camera…</p>
            )}
          </div>
        )}

        {/* Error state */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black text-center">
            <AlertCircle className="w-14 h-14 text-red-500 mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">Camera Blocked</h3>
            <p className="text-sm text-white/50 max-w-xs mb-6 leading-relaxed">{cameraError}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-all"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component so audio toggle re-renders without affecting scanner
function AudioToggleButton({ audioRef, onToggle }: { audioRef: React.MutableRefObject<boolean>; onToggle: () => void }) {
  const [on, setOn] = useState(true);
  return (
    <button
      onClick={() => { onToggle(); setOn((v) => !v); }}
      className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 active:bg-white/20 transition-all"
    >
      {on ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
    </button>
  );
}
