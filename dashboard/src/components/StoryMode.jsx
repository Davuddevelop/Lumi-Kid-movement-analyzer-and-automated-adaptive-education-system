import React, { useEffect, useRef, useState } from 'react';
import LumiAvatar from './LumiAvatar';

/**
 * StoryMode — cinematic full-screen story narrative shown before a mission.
 * Props: { level, onStart, onBack }
 * level: { id, name, zone, chapter }
 */

const CHAPTER_DATA = {
  1: {
    emoji: '🚀',
    zone: 'Space Station',
    story: "Lumi's rocket got lost in space! Help guide it back home by placing the right blocks.",
  },
  2: {
    emoji: '💎',
    zone: 'Crystal Caves',
    story: "Deep inside the Crystal Caves, there's a hidden treasure! Can you program the path?",
  },
  3: {
    emoji: '🤖',
    zone: 'Robot City',
    story: "Robot City needs a hero! The robots are confused — show them the right direction!",
  },
  4: {
    emoji: '⭐',
    zone: 'Star Temple',
    story: "The Star Temple awaits the greatest programmer! Only a master can solve these puzzles!",
  },
};

function getChapter(level) {
  if (!level) return 1;
  const id = level.id || 1;
  if (id <= 5) return 1;
  if (id <= 10) return 2;
  if (id <= 15) return 3;
  return 4;
}

const styles = `
  .sm-root {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: #0a0818;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-family: 'Nunito', sans-serif;
    color: #f0eeff;
  }

  /* Starfield */
  .sm-star {
    position: absolute;
    border-radius: 50%;
    background: white;
    pointer-events: none;
  }

  /* Content layer */
  .sm-content {
    position: relative;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 480px;
    padding: 0 24px;
    gap: 0;
  }

  .sm-chapter-tag {
    font-family: 'Fredoka One', sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(196,181,253,0.7);
    margin-bottom: 6px;
  }

  .sm-zone-emoji {
    font-size: 2rem;
    margin-bottom: 10px;
    filter: drop-shadow(0 0 12px rgba(255,255,255,0.4));
  }

  .sm-avatar-wrap {
    margin: 8px 0 16px;
    animation: sm-float 2.2s ease-in-out infinite alternate;
  }
  @keyframes sm-float {
    from { transform: translateY(0); }
    to { transform: translateY(-10px); }
  }

  .sm-story-box {
    background: rgba(124,92,252,0.13);
    border: 1px solid rgba(124,92,252,0.3);
    border-radius: 24px;
    padding: 22px 24px;
    text-align: center;
    margin-bottom: 14px;
    backdrop-filter: blur(12px);
    position: relative;
  }
  .sm-story-box::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    border-radius: 24px 24px 0 0;
  }
  .sm-story-text {
    font-size: 1.05rem;
    line-height: 1.75;
    font-weight: 700;
    color: #e8e0ff;
  }
  .sm-mission-name {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.15rem;
    color: #ffd166;
    text-align: center;
    margin-bottom: 20px;
    letter-spacing: 0.04em;
  }

  .sm-btn-row {
    display: flex;
    gap: 12px;
    width: 100%;
  }
  .sm-btn {
    flex: 1;
    min-height: 64px;
    border-radius: 20px;
    border: none;
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .sm-btn:active { transform: scale(0.96); }
  .sm-btn-back {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: #c4b5fd;
  }
  .sm-btn-back:hover { background: rgba(255,255,255,0.14); }
  .sm-btn-start {
    background: linear-gradient(135deg, #7c5cfc, #5b3fe0);
    color: white;
    box-shadow: 0 6px 28px rgba(124,92,252,0.55);
  }
  .sm-btn-start:hover { box-shadow: 0 8px 36px rgba(124,92,252,0.7); transform: translateY(-2px); }

  .sm-nebula {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(60px);
    z-index: 1;
  }
`;

const NUM_STARS = 20;

const STAR_CONFIG = Array.from({ length: NUM_STARS }, (_, i) => ({
  id: i,
  left: `${(i * 73 + 11) % 100}%`,
  top: `${(i * 59 + 7) % 100}%`,
  size: (i % 4) * 1.5 + 1,
  duration: 4 + (i % 5) * 2,
  delay: (i * 0.41) % 5,
  opacity: 0.3 + (i % 4) * 0.17,
}));

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.9;
  utt.pitch = 1.1;
  window.speechSynthesis.speak(utt);
}

export default function StoryMode({ level, onStart, onBack }) {
  const chapter = getChapter(level);
  const chapterInfo = CHAPTER_DATA[chapter] || CHAPTER_DATA[1];
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSpeaking(true);
    speak(chapterInfo.story);
    const timer = setTimeout(() => setSpeaking(false), chapterInfo.story.length * 55);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis && window.speechSynthesis.cancel();
      setSpeaking(false);
    };
  }, [chapter]);

  const missionName = level?.name || `Level ${level?.id || 1}`;

  return (
    <>
      <style>{styles}</style>
      <div className="sm-root">

        {/* Nebula blobs */}
        <div className="sm-nebula" style={{ width: 320, height: 320, top: '-80px', left: '-60px', background: 'rgba(124,92,252,0.18)' }} />
        <div className="sm-nebula" style={{ width: 280, height: 280, bottom: '-60px', right: '-40px', background: 'rgba(78,205,196,0.12)' }} />

        {/* Animated stars */}
        {STAR_CONFIG.map(s => (
          <div
            key={s.id}
            className="sm-star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animation: `sm-float ${s.duration}s ${s.delay}s ease-in-out infinite alternate`,
            }}
          />
        ))}

        {/* Main content */}
        <div className="sm-content">
          <div className="sm-chapter-tag">Chapter {chapter}</div>
          <div className="sm-zone-emoji">{chapterInfo.emoji}</div>

          <div className="sm-avatar-wrap">
            <LumiAvatar size={120} emotion="excited" speaking={speaking} />
          </div>

          <div className="sm-story-box">
            <p className="sm-story-text">{chapterInfo.story}</p>
          </div>

          <div className="sm-mission-name">🎮 {missionName}</div>

          <div className="sm-btn-row">
            <button className="sm-btn sm-btn-back" onClick={onBack}>← Back</button>
            <button className="sm-btn sm-btn-start" onClick={onStart}>▶ Let's Go!</button>
          </div>
        </div>
      </div>
    </>
  );
}
