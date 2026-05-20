import { useEffect } from 'react';

const THEMES = [
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    bg: '#0d0a1e',
    preview: 'linear-gradient(135deg, #0d0a1e 0%, #1a1040 50%, #7c5cfc 100%)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    bg: '#0a1628',
    preview: 'linear-gradient(135deg, #0a1628 0%, #023e8a 50%, #00b4d8 100%)',
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌿',
    bg: '#0a1f0a',
    preview: 'linear-gradient(135deg, #0a1f0a 0%, #1b4332 50%, #52b788 100%)',
  },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '⚡',
    bg: '#0a0a0a',
    preview: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #ff00ff 100%)',
  },
  {
    id: 'candy',
    name: 'Candy',
    emoji: '🍭',
    bg: '#1a0a2e',
    preview: 'linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #ffd93d 100%)',
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
          background: 'var(--surface, #1a1040)',
          borderRadius: 24,
          padding: '2rem',
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 0 60px rgba(124,92,252,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ textAlign: 'center', fontFamily: 'Fredoka One', fontSize: '1.8rem', marginBottom: '1.5rem', color: '#fff', margin: '0 0 1.5rem' }}>
          🎨 Pick Your Theme
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {THEMES.map((t) => {
            const active = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { onSelect(t.id); onClose(); }}
                style={{
                  border: active ? '3px solid #ffd93d' : '3px solid transparent',
                  borderRadius: 16,
                  padding: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transform: active ? 'scale(1.04)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 0 20px rgba(255,217,61,0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
                  background: 'transparent',
                }}
              >
                <div style={{ background: t.preview, height: 80 }} />
                <div style={{
                  background: t.bg,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ fontSize: '1.4rem' }}>{t.emoji}</span>
                  <span style={{ fontFamily: 'Fredoka One', fontSize: '1rem', color: '#fff' }}>{t.name}</span>
                  {active && <span style={{ marginLeft: 'auto', fontSize: '1rem', color: '#ffd93d' }}>✓</span>}
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
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
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
