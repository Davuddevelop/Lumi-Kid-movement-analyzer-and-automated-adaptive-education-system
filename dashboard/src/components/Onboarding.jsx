import React, { useState, useEffect } from 'react';
import LumiAvatar from './LumiAvatar';

/**
 * Onboarding — 3-screen first-run tutorial overlay.
 * Props: { onComplete }
 * Stores 'lumi_onboarded' in localStorage.
 */

const BLOCK_TILES = [
  { emoji: '🟢', label: 'Go',     arrow: '↑', color: '#44e5a0', bg: 'rgba(68,229,160,0.15)' },
  { emoji: '🔵', label: 'Right',  arrow: '→', color: '#4ecdc4', bg: 'rgba(78,205,196,0.15)' },
  { emoji: '🟡', label: 'Left',   arrow: '←', color: '#ffd166', bg: 'rgba(255,209,102,0.15)' },
  { emoji: '🔴', label: 'Repeat', arrow: '↺', color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
];

const SCREEN_TTS = [
  "Hi! I'm Lumi! I'll be your robot friend and teacher!",
  "Place LEGO blocks to program the robot! Green means go, blue means right, yellow means left, and red means repeat!",
  "Ready for your first mission? Let's build something amazing together!",
];

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.88;
  utt.pitch = 1.2;
  window.speechSynthesis.speak(utt);
}

const styles = `
  .ob-overlay {
    position: fixed;
    inset: 0;
    z-index: 3000;
    background: linear-gradient(160deg, #0d0a1e 0%, #1a0f3d 60%, #0a1628 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    font-family: 'Nunito', sans-serif;
    color: #f0eeff;
    overflow: hidden;
    padding: 40px 24px 36px;
  }

  .ob-top { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; width: 100%; }

  /* Screen transition */
  .ob-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 420px;
    animation: ob-fadein 0.35s ease both;
  }
  @keyframes ob-fadein {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ob-big-heading {
    font-family: 'Fredoka One', sans-serif;
    font-size: 2.5rem;
    color: #f0eeff;
    text-align: center;
    margin: 0;
    line-height: 1.15;
  }
  .ob-sub {
    font-size: 1.1rem;
    color: #c4b5fd;
    font-weight: 700;
    text-align: center;
    margin: 0;
    line-height: 1.5;
  }
  .ob-sub2 {
    font-size: 1rem;
    color: #9b8fc2;
    font-weight: 600;
    text-align: center;
    margin: 6px 0 0;
  }

  /* Block tiles */
  .ob-tiles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin: 10px 0;
    width: 100%;
    max-width: 320px;
  }
  .ob-tile {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 20px;
    border: 2px solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: transform 0.2s;
  }
  .ob-tile:hover { transform: scale(1.05); }
  .ob-tile-emoji { font-size: 2.2rem; }
  .ob-tile-arrow { font-size: 1.4rem; font-weight: 900; }
  .ob-tile-label {
    font-family: 'Fredoka One', sans-serif;
    font-size: 0.9rem;
  }

  /* Dots */
  .ob-dots {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 12px;
  }
  .ob-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    cursor: pointer;
    transition: all 0.25s;
    border: none;
    padding: 0;
  }
  .ob-dot.active {
    width: 28px;
    border-radius: 6px;
    background: #7c5cfc;
  }

  /* Buttons */
  .ob-btn-row {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 420px;
  }
  .ob-next-btn {
    flex: 1;
    min-height: 64px;
    border-radius: 20px;
    border: none;
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.3rem;
    cursor: pointer;
    background: linear-gradient(135deg, #7c5cfc, #5b3fe0);
    color: #fff;
    box-shadow: 0 6px 28px rgba(124,92,252,0.5);
    transition: transform 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .ob-next-btn:hover { box-shadow: 0 8px 36px rgba(124,92,252,0.7); transform: translateY(-2px); }
  .ob-next-btn:active { transform: scale(0.96); }
  .ob-start-btn {
    background: linear-gradient(135deg, #44e5a0, #4ecdc4);
    box-shadow: 0 6px 28px rgba(68,229,160,0.4);
    font-size: 1.2rem;
  }

  /* Stars bg */
  .ob-bg-star {
    position: absolute;
    border-radius: 50%;
    background: white;
    pointer-events: none;
    animation: ob-twinkle ease-in-out infinite alternate;
  }
  @keyframes ob-twinkle {
    from { opacity: 0.1; }
    to   { opacity: 0.5; }
  }

  .ob-avatar-wrap {
    animation: ob-float 2s ease-in-out infinite alternate;
  }
  @keyframes ob-float {
    from { transform: translateY(0); }
    to   { transform: translateY(-10px); }
  }
`;

const BG_STARS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 71 + 13) % 100}%`,
  top: `${(i * 53 + 9) % 100}%`,
  size: (i % 3) + 1,
  duration: `${3 + (i % 4)}s`,
}));

export default function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSpeaking(true);
    speak(SCREEN_TTS[screen]);
    const timer = setTimeout(() => setSpeaking(false), SCREEN_TTS[screen].length * 60);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis && window.speechSynthesis.cancel();
    };
  }, [screen]);

  function goNext() {
    if (screen < 2) {
      setScreen(s => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem('lumi_onboarded', '1');
    window.speechSynthesis && window.speechSynthesis.cancel();
    onComplete && onComplete();
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ob-overlay">
        {/* Background stars */}
        {BG_STARS.map(s => (
          <div
            key={s.id}
            className="ob-bg-star"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDuration: s.duration }}
          />
        ))}

        <div className="ob-top">
          {/* Screen 0: Meet Lumi */}
          {screen === 0 && (
            <div className="ob-screen" key="s0">
              <div className="ob-avatar-wrap">
                <LumiAvatar size={140} emotion="excited" speaking={speaking} />
              </div>
              <h1 className="ob-big-heading">Hi! I'm Lumi! 👋</h1>
              <p className="ob-sub">I'll be your robot friend and teacher!</p>
              <p className="ob-sub2">Together we'll learn to code and have fun!</p>
            </div>
          )}

          {/* Screen 1: How to Play */}
          {screen === 1 && (
            <div className="ob-screen" key="s1">
              <h1 className="ob-big-heading" style={{ fontSize: '2rem' }}>How to Play 🎮</h1>
              <p className="ob-sub" style={{ marginBottom: 8 }}>Place LEGO blocks to program the robot!</p>
              <div className="ob-tiles">
                {BLOCK_TILES.map(tile => (
                  <div
                    key={tile.label}
                    className="ob-tile"
                    style={{ background: tile.bg, borderColor: tile.color }}
                  >
                    <span className="ob-tile-emoji">{tile.emoji}</span>
                    <span className="ob-tile-arrow" style={{ color: tile.color }}>{tile.arrow}</span>
                    <span className="ob-tile-label" style={{ color: tile.color, fontFamily: 'Fredoka One, sans-serif' }}>
                      {tile.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screen 2: Let's Go */}
          {screen === 2 && (
            <div className="ob-screen" key="s2">
              <div className="ob-avatar-wrap">
                <LumiAvatar size={130} emotion="excited" speaking={speaking} />
              </div>
              <h1 className="ob-big-heading">Ready for your first mission? 🚀</h1>
              <p className="ob-sub">Let's build something amazing together!</p>
            </div>
          )}
        </div>

        {/* Navigation dots */}
        <div className="ob-dots">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              className={`ob-dot${screen === i ? ' active' : ''}`}
              onClick={() => setScreen(i)}
              aria-label={`Go to screen ${i + 1}`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="ob-btn-row">
          {screen < 2 ? (
            <button className="ob-next-btn" onClick={goNext}>
              Next →
            </button>
          ) : (
            <button className="ob-next-btn ob-start-btn" onClick={finish}>
              START PLAYING! ▶
            </button>
          )}
        </div>
      </div>
    </>
  );
}
