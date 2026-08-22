/**
 * LiveGuard — SelectProtectionScreen
 *
 * Lists categories to protect (banking app, crypto wallet, + add custom).
 * "Démarrer la protection" button proceeds to prep → cognitive tests.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  onStart: (sessionPublicId: string, protectionCategory: string) => void;
  sessionPublicId: string;
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="20" height="20">
      <path d="M3 10 L12 4 L21 10 V11 H3 V10 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 11 V18 M9 11 V18 M15 11 V18 M19 11 V18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 19 H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CryptoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="20" height="20">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8 H13 C14.5 8 15 9 15 10.5 C15 12 14.5 13 13 13 H9 V8 Z M9 13 H13.5 C15 13 15.5 14 15.5 15.5 C15.5 17 15 18 13.5 18 H9 V13 Z M10.5 6 V19 M13.5 6 V19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="18" height="18">
      <path d="M12 5 V19 M5 12 H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SelectProtectionScreen({ onStart, sessionPublicId }: Props) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');

  const categories = [
    { id: 'banking', label: t('protection.banking'), icon: <BankIcon /> },
    { id: 'crypto', label: t('protection.crypto'), icon: <CryptoIcon /> },
  ];

  const handleStart = () => {
    const category = selected === 'custom' && customCategory.trim()
      ? customCategory.trim()
      : selected ?? 'unknown';
    onStart(sessionPublicId, category);
  };

  return (
    <div className="screen screen-center">
      <h1 className="title-lg">{t('protection.title')}</h1>
      <p className="subtitle" style={{ marginTop: 8, marginBottom: 28 }}>
        {t('protection.subtitle')}
      </p>

      <div className="protection-list" style={{ marginBottom: 24 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`card-selectable ${selected === cat.id ? 'selected' : ''}`}
            onClick={() => setSelected(cat.id)}
          >
            <div className="card-selectable-icon">{cat.icon}</div>
            <div className="card-selectable-label">{cat.label}</div>
          </div>
        ))}

        {selected === 'custom' && (
          <input
            type="text"
            className="card"
            style={{ textAlign: 'center', fontSize: 15, border: '2px solid var(--accent)', outline: 'none' }}
            placeholder={t('protection.customPlaceholder')}
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            autoFocus
          />
        )}

        <button
          className="protection-add"
          onClick={() => setSelected('custom')}
        >
          <PlusIcon />
          {t('protection.addOther')}
        </button>
      </div>

      <button
        className="btn-primary"
        onClick={handleStart}
        disabled={!selected}
      >
        {t('protection.start')}
      </button>
    </div>
  );
}
