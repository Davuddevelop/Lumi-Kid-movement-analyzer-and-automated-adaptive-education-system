import React, { useState, useEffect, useRef, useCallback } from 'react';
import LumiAvatar from './LumiAvatar';

/**
 * FocusMode — Pomodoro-style focus timer overlay.
 * Props: { onClose }
 */

const PRESETS = [
  { label: '5 min', minutes: 5, emoji: '🌱' },
  { label: '10 min', minutes: 10, emoji: '🔥' },
  { label: '15 min', minutes: 15, emoji: '⭐' },
];

const CIRCLE_R = 80;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

const styles = `
  .fm-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: linear-gradient(160deg, #0d0a1e 0%, #1a0f3d 50%, #0a1628 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Nunito', sans-serif;
    color: #f0eeff;
    overflow: hidden;
  }

  .fm-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: #c4b5fd;
    font-size: 1.4rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fm-close-btn:hover { background: rgba(255,255,255,0.16); }

  .fm-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    max-width: 380px;
    width: 100%;
    padding: 0 24px;
  }

  .fm-title {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.6rem;
    color: #c4b5fd;
    margin: 0 0 20px;
    letter-spacing: 0.04em;
  }

  /* Preset buttons */
  .fm-presets {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
  }
  .fm-preset-btn {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.06);
    color: #e8e0ff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.2s;
    font-family: 'Nunito', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  .fm-preset-btn.active {
    border-color: #7c5cfc;
    background: rgba(124,92,252,0.25);
    box-shadow: 0 0 20px rgba(124,92,252,0.4);
    transform: scale(1.08);
  }
  .fm-preset-btn:hover:not(.active) { background: rgba(255,255,255,0.1); }
  .fm-preset-emoji { font-size: 1.5rem; }
  .fm-preset-label { font-size: 0.78rem; font-weight: 700; color: #c4b5fd; }

  /* Timer ring */
  .fm-timer-wrap {
    position: relative;
    width: 200px;
    height: 200px;
    margin-bottom: 20px;
  }
  .fm-timer-svg {
    transform: rotate(-90deg);
    display: block;
  }
  .fm-timer-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Fredoka One', sans-serif;
    font-size: 2.6rem;
    color: #f0eeff;
  }

  .fm-sub-text {
    font-size: 1rem;
    color: #9b8fc2;
    font-weight: 700;
    text-align: center;
    margin-bottom: 16px;
  }

  .fm-avatar-wrap {
    margin-bottom: 20px;
  }

  /* Controls */
  .fm-controls {
    display: flex;
    gap: 12px;
    width: 100%;
  }
  .fm-ctrl-btn {
    flex: 1;
    min-height: 64px;
    border-radius: 20px;
    border: none;
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.15rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .fm-ctrl-btn:active { transform: scale(0.96); }
  .fm-start-btn {
    background: linear-gradient(135deg, #7c5cfc, #5b3fe0);
    color: #fff;
    box-shadow: 0 6px 24px rgba(124,92,252,0.5);
  }
  .fm-start-btn:hover { box-shadow: 0 8px 32px rgba(124,92,252,0.7); transform: translateY(-2px); }
  .fm-reset-btn {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.14);
    color: #c4b5fd;
  }
  .fm-reset-btn:hover { background: rgba(255,255,255,0.12); }

  /* Confetti */
  .fm-confetti-particle {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    pointer-events: none;
    animation: fm-confetti-fall linear forwards;
  }
  @keyframes fm-confetti-fall {
    0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
  }

  /* Completion state */
  .fm-done-msg {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.5rem;
    color: #44e5a0;
    text-align: center;
    margin-bottom: 12px;
    animation: fm-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
  }
  @keyframes fm-pop {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }
`;

const CONFETTI_COLORS = ['#7c5cfc', '#ffd166', '#4ecdc4', '#ff6b6b', '#44e5a0', '#ff9f43'];

function generateConfetti() {
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: `${1.5 + Math.random() * 1.5}s`,
    delay: `${Math.random() * 0.8}s`,
    size: Math.floor(Math.random() * 8) + 6,
  }));
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.9;
  utt.pitch = 1.2;
  window.speechSynthesis.speak(utt);
}

function getTimerColor(fraction) {
  // mint → yellow → coral
  if (fraction > 0.5) {
    // mint (#44e5a0) → yellow (#ffd166)
    const t = (1 - fraction) * 2;
    const r = Math.round(0x44 + t * (0xff - 0x44));
    const g = Math.round(0xe5 + t * (0xd1 - 0xe5));
    const b = Math.round(0xa0 + t * (0x66 - 0xa0));
    return `rgb(${r},${g},${b})`;
  } else {
    // yellow (#ffd166) → coral (#ff6b6b)
    const t = (0.5 - fraction) * 2;
    const r = Math.round(0xff + t * (0xff - 0xff));
    const g = Math.round(0xd1 + t * (0x6b - 0xd1));
    const b = Math.round(0x66 + t * (0x6b - 0x66));
    return `rgb(${r},${g},${b})`;
  }
}

export default function FocusMode({ onClose }) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[0].minutes * 60);
  const [remaining, setRemaining] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const intervalRef = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      window.speechSynthesis && window.speechSynthesis.cancel();
    };
  }, []);

  function selectPreset(index) {
    if (running) return;
    setSelectedPreset(index);
    const secs = PRESETS[index].minutes * 60;
    setTotalSeconds(secs);
    setRemaining(secs);
    setCompleted(false);
    setConfetti([]);
  }

  function handleStartPause() {
    if (completed) return;
    if (running) {
      clearTimer();
      setRunning(false);
    } else {
      if (remaining <= 0) return;
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearTimer();
            setRunning(false);
            setCompleted(true);
            setConfetti(generateConfetti());
            speak("Amazing focus! You did it!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }

  function handleReset() {
    clearTimer();
    setRunning(false);
    setCompleted(false);
    setConfetti([]);
    setRemaining(totalSeconds);
    window.speechSynthesis && window.speechSynthesis.cancel();
  }

  const fraction = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);
  const strokeColor = getTimerColor(fraction);

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');

  const lumiEmotion = completed ? 'excited' : running ? 'happy' : 'thinking';

  return (
    <>
      <style>{styles}</style>
      <div className="fm-overlay">
        {/* Confetti */}
        {confetti.map(p => (
          <div
            key={p.id}
            className="fm-confetti-particle"
            style={{
              left: p.left,
              top: '-10px',
              width: p.size,
              height: p.size,
              background: p.color,
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}

        <button className="fm-close-btn" onClick={onClose} aria-label="Close focus mode">✕</button>

        <div className="fm-inner">
          <h2 className="fm-title">🧘 Focus Time</h2>

          {/* Preset selection */}
          <div className="fm-presets">
            {PRESETS.map((p, i) => (
              <button
                key={p.minutes}
                className={`fm-preset-btn${selectedPreset === i ? ' active' : ''}`}
                onClick={() => selectPreset(i)}
                aria-label={`Set timer to ${p.label}`}
              >
                <span className="fm-preset-emoji">{p.emoji}</span>
                <span className="fm-preset-label">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <div className="fm-timer-wrap">
            <svg
              className="fm-timer-svg"
              width={200}
              height={200}
              viewBox="0 0 200 200"
            >
              {/* Background ring */}
              <circle
                cx={100} cy={100} r={CIRCLE_R}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={8}
              />
              {/* Progress ring */}
              <circle
                cx={100} cy={100} r={CIRCLE_R}
                fill="none"
                stroke={strokeColor}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{ transition: running ? 'stroke-dashoffset 1s linear, stroke 1s linear' : 'none' }}
              />
            </svg>
            <div className="fm-timer-text">{mins}:{secs}</div>
          </div>

          {completed ? (
            <div className="fm-done-msg">🎉 Amazing focus! You did it!</div>
          ) : (
            <p className="fm-sub-text">Stay focused! Lumi is with you 🤖</p>
          )}

          <div className="fm-avatar-wrap">
            <LumiAvatar size={80} emotion={lumiEmotion} speaking={completed} />
          </div>

          {/* Controls */}
          <div className="fm-controls">
            <button
              className="fm-ctrl-btn fm-start-btn"
              onClick={handleStartPause}
              disabled={completed || remaining <= 0}
            >
              {running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button className="fm-ctrl-btn fm-reset-btn" onClick={handleReset}>
              ↺ Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
