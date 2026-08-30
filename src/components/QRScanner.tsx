'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { localGetSetting } from '@/lib/db';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

// Synthesize a scan sound using browser Web Audio API
function playBeepSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitched beep
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15); // Short duration

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (err) {
    console.error('Audio beep failed:', err);
  }
}

export default function QRScanner({ onScan, onClose, title = 'Scan QR Code' }: QRScannerProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const activeScannerId = 'qr-reader-element';

  useEffect(() => {
    // Load audio preferences
    localGetSetting<boolean>('audioEnabled', true).then((enabled) => {
      setAudioEnabled(enabled);
    });

    const startScanner = async () => {
      try {
        const html5Qrcode = new Html5Qrcode(activeScannerId);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.75;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Success callback
            if (audioEnabled) playBeepSound();
            if ('vibrate' in navigator) {
              navigator.vibrate(100); // 100ms vibration feedback
            }
            onScan(decodedText);
          },
          () => {
            // Keep scan silent for errors/searching frames
          }
        );
      } catch (err: any) {
        console.error('Failed to start camera:', err);
        setCameraError(err.message || 'Unable to access rear camera. Check permissions.');
      }
    };

    // Delay initialization slightly to let the modal animate in
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.error('Error stopping scanner:', e));
      }
    };
  }, [audioEnabled, onScan]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 safe-padding-top bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-[var(--accent-mint)]" />
          <h2 className="font-display font-bold text-lg">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 active:bg-white/10 text-white transition-all"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Camera Feed Container */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <div id={activeScannerId} className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

        {/* Custom Bounding Overlay */}
        {(!cameraError) && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Top mask */}
            <div className="w-full bg-black/50 flex-1" />
            <div className="flex w-full h-[280px]">
              {/* Left mask */}
              <div className="bg-black/50 flex-1" />
              {/* Transparent Box with corner lines */}
              <div className="relative w-[280px] h-[280px] border border-white/20">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[var(--accent-mint)] -mt-[2px] -ml-[2px] rounded-tl-md" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[var(--accent-mint)] -mt-[2px] -mr-[2px] rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[var(--accent-mint)] -mb-[2px] -ml-[2px] rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[var(--accent-mint)] -mb-[2px] -mr-[2px] rounded-br-md" />
                {/* Laser scanning line */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-mint)] to-transparent animate-[bounce_2s_infinite]" />
              </div>
              {/* Right mask */}
              <div className="bg-black/50 flex-1" />
            </div>
            {/* Bottom mask */}
            <div className="w-full bg-black/50 flex-1 flex flex-col items-center justify-start pt-6 px-12 text-center">
              <p className="text-sm text-[var(--text-secondary)] font-medium">
                Align the QR code inside the frame to scan.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/90 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">Camera Access Blocked</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-6">
              {cameraError}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-all"
            >
              Close Camera
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
