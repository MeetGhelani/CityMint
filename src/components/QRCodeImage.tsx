'use client';

import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  value: string;
  size?: number;
  /** Foreground color (dark modules) */
  fgColor?: string;
  /** Background color (light modules) */
  bgColor?: string;
  className?: string;
}

/**
 * Client-side QR code rendered onto a <canvas> element.
 * Uses the `qrcode` npm package — no external API calls, no rate-limiting.
 */
export default function QRCodeImage({
  value,
  size = 200,
  fgColor = '#000000',
  bgColor = '#ffffff',
  className = '',
}: QRCodeImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: 'M',
    }).catch((err) => console.error('QR generation error:', err));
  }, [value, size, fgColor, bgColor]);

  return <canvas ref={canvasRef} width={size} height={size} className={`rounded-lg overflow-hidden ${className}`} />;
}
