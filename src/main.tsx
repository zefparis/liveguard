import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n/I18nContext';
import './index.css';

// Apply saved/system theme before React mounts — avoids flash of wrong theme
// and ensures all screens (not just landing) get the correct CSS variables.
const savedTheme = localStorage.getItem('lg_theme') as 'light' | 'dark' | null;
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', savedTheme || systemTheme);

// Eruda — mobile on-screen console for debugging
(function () {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js';
  script.onload = function () {
    (window as any).eruda.init();
    console.info('[S-SCROLL] Eruda console initialized');
  };
  document.head.appendChild(script);
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
