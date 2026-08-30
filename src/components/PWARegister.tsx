'use client';

import { useEffect } from 'react';
import { localGetSetting } from '@/lib/db';

export default function PWARegister() {
  useEffect(() => {
    // 1. Register Service Worker for PWA
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('[PWA] ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.error('[PWA] ServiceWorker registration failed: ', err);
          }
        );
      });
    }

    // 2. Load Theme from settings
    localGetSetting<string>('theme', 'theme-citymint').then((theme) => {
      // Clear existing themes
      document.body.classList.remove('theme-citymint', 'theme-light', 'theme-dark');
      // Add loaded theme
      document.body.classList.add(theme);
    });

    // 3. Disable pull-to-refresh on mobile browsers for better app feel
    document.body.style.overscrollBehaviorY = 'contain';
  }, []);

  return null;
}
