import { useEffect } from 'react';

const THEMES = [
  {
    id: 'kids',
    name: 'Kids',
    emoji: '🌈',
    bg: '#faf6ef',
    preview: 'linear-gradient(135deg, #faf6ef 0%, #fff0cc 50%, #dbeafe 100%)',
    dark: false,
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    bg: '#0d0a1e',
    preview: 'linear-gradient(135deg, #0d0a1e 0%, #1a1040 50%, #7c5cfc 100%)',
    dark: true,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    bg: '#0a1628',
    preview: 'linear-gradient(135deg, #0a1628 0%, #023e8a 50%, #00b4d8 100%)',
    dark: true,
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌿',
    bg: '#0a1f0a',
    preview: 'linear-gradient(135deg, #0a1f0a 0%, #1b4332 50%, #52b788 100%)',
    dark: true,
  },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '⚡',
    bg: '#0a0a0a',
    preview: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #ff00ff 100%)',
    dark: true,
  },
  {
    id: 'candy',
    name: 'Candy',
    emoji: '🍭',
    bg: '#1a0a2e',
    preview: 'linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #ffd93d 100%)',
    dark: true,
  },
];

export default function ThemeSelector({ currentTheme, onSelect, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface, #fff)',
          border: '2px solid var(--border-color, #ede8df)',
          borderRadius: 24,
          padding: '2rem',
          maxWidth: 440,
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ textAlign: 'center', fontFamily: 'Fredoka One', fontSize: '1.8rem', color: 'var(--text-main, #1a1a2e)', margin: '0 0 1.5rem' }}>
          🎨 Pick Your Theme
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {THEMES.map((t) => {
            const active = currentTheme === t.id;
            const labelColor = t.dark ? '#fff' : '#1a1a2e';
            return (
              <button
                key={t.id}
                onClick={() => { onSelect(t.id); onClose(); }}
                style={{
                  border: active ? '3px solid #1a6cf0' : '3px solid transparent',
                  borderRadius: 14,
                  padding: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transform: active ? 'scale(1.06)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 0 20px rgba(26,108,240,0.35)' : '0 4px 12px rgba(0,0,0,0.1)',
                  background: 'transparent',
                }}
              >
                <div style={{ background: t.preview, height: 64 }} />
                <div style={{
                  background: t.bg,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{t.emoji}</span>
                  <span style={{ fontFamily: 'Fredoka One', fontSize: '0.85rem', color: labelColor }}>{t.name}</span>
                  {active && <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#1a6cf0' }}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '1.5rem',
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: '2px solid var(--border-color, #ede8df)',
            background: 'transparent',
            color: 'var(--text-muted, #6b7280)',
            fontFamily: 'Fredoka One',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
