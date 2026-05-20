import React, { useMemo, useState } from 'react';

/**
 * DailyChallenge — compact daily challenge card widget.
 * Props: { onPlay }
 */

const CHALLENGES = [
  "Complete 3 levels without hints!",
  "Finish a mission in under 60 seconds!",
  "Use only 4 blocks to reach the goal!",
  "Complete the loop challenge!",
  "Get 3 stars on any level!",
];

function getDailyChallenge() {
  const today = new Date();
  // Seed by year + day-of-year for deterministic daily pick
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  const seed = today.getFullYear() * 1000 + dayOfYear;
  return CHALLENGES[seed % CHALLENGES.length];
}

const styles = `
  @keyframes dc-sparkle {
    0%   { box-shadow: 0 0 0 0 rgba(255,209,102,0.7), 0 0 0 0 rgba(255,107,107,0.5); }
    50%  { box-shadow: 0 0 18px 6px rgba(255,209,102,0.35), 0 0 30px 10px rgba(255,107,107,0.2); }
    100% { box-shadow: 0 0 0 0 rgba(255,209,102,0.7), 0 0 0 0 rgba(255,107,107,0.5); }
  }
  @keyframes dc-spin-sparkles {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes dc-pulse-border {
    0%, 100% { border-color: rgba(255,209,102,0.55); }
    50%       { border-color: rgba(255,209,102,1); }
  }

  .dc-card {
    background: linear-gradient(135deg, #1a1010 0%, #2a1a00 60%, #1a1535 100%);
    border: 2px solid rgba(255,209,102,0.55);
    border-radius: 24px;
    padding: 18px 18px 16px;
    position: relative;
    overflow: hidden;
    animation: dc-pulse-border 2.5s ease-in-out infinite, dc-sparkle 3s ease-in-out infinite;
    min-width: 260px;
    max-width: 340px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Corner sparkles */
  .dc-sparkle-corner {
    position: absolute;
    font-size: 0.9rem;
    pointer-events: none;
    animation: dc-spin-sparkles 4s linear infinite;
    line-height: 1;
  }
  .dc-sparkle-tl { top: 8px;  left: 10px; }
  .dc-sparkle-tr { top: 8px;  right: 10px; animation-direction: reverse; }
  .dc-sparkle-bl { bottom: 8px; left: 10px; animation-direction: reverse; }
  .dc-sparkle-br { bottom: 8px; right: 10px; }

  .dc-header {
    font-family: 'Fredoka One', sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.2em;
    color: #ffd166;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dc-title {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.02rem;
    color: #fff8e1;
    line-height: 1.35;
    margin-bottom: 10px;
    min-height: 2.8em;
  }

  .dc-reward {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(255,209,102,0.18);
    border: 1px solid rgba(255,209,102,0.35);
    border-radius: 10px;
    padding: 3px 10px;
    font-family: 'Fredoka One', sans-serif;
    font-size: 0.9rem;
    color: #ffd166;
    margin-bottom: 12px;
  }

  .dc-bottom {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dc-play-btn {
    min-height: 60px;
    padding: 0 22px;
    border-radius: 16px;
    border: none;
    background: linear-gradient(135deg, #ff6b6b, #ff9f43);
    color: #fff;
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.1rem;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 18px rgba(255,107,107,0.45);
    -webkit-tap-highlight-color: transparent;
  }
  .dc-play-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(255,107,107,0.65);
  }
  .dc-play-btn:active { transform: scale(0.96); }

  .dc-progress-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .dc-progress-label {
    font-size: 0.75rem;
    color: rgba(155,143,194,0.8);
    font-weight: 700;
  }
  .dc-progress-bar-bg {
    width: 100%;
    height: 8px;
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    overflow: hidden;
  }
  .dc-progress-bar-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, #ffd166, #ff9f43);
    transition: width 0.4s ease;
  }
`;

export default function DailyChallenge({ onPlay }) {
  const challenge = useMemo(() => getDailyChallenge(), []);
  const [completed, setCompleted] = useState(0); // 0 or 1

  function handlePlay() {
    onPlay && onPlay(challenge);
  }

  const progressPct = completed * 100;

  return (
    <>
      <style>{styles}</style>
      <div className="dc-card">
        {/* Corner sparkles */}
        <span className="dc-sparkle-corner dc-sparkle-tl">✦</span>
        <span className="dc-sparkle-corner dc-sparkle-tr">✦</span>
        <span className="dc-sparkle-corner dc-sparkle-bl">✦</span>
        <span className="dc-sparkle-corner dc-sparkle-br">✦</span>

        <div className="dc-header">
          ⚡ Daily Challenge
        </div>

        <div className="dc-title">{challenge}</div>

        <div className="dc-reward">+50 XP ⭐</div>

        <div className="dc-bottom">
          <button className="dc-play-btn" onClick={handlePlay} aria-label="Play daily challenge">
            PLAY
          </button>
          <div className="dc-progress-wrap">
            <span className="dc-progress-label">{completed}/1 completed</span>
            <div className="dc-progress-bar-bg">
              <div className="dc-progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
