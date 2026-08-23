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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
