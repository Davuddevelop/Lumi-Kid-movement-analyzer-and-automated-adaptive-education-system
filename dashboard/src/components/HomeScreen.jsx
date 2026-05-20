import React, { useState, useEffect } from 'react';
import LumiAvatar from './LumiAvatar';

const SPEECH_BUBBLES = [
  { text: 'Think',   emoji: '🧠', cls: 'hs-bubble-think'   },
  { text: 'Create',  emoji: '🎨', cls: 'hs-bubble-create'  },
  { text: 'Build',   emoji: '🏗️',  cls: 'hs-bubble-build'   },
  { text: 'Learn',   emoji: '📚', cls: 'hs-bubble-learn'   },
  { text: 'Explore', emoji: '🚀', cls: 'hs-bubble-explore'  },
];

const FEATURES = [
  { emoji: '😊', title: 'Understands Your Child',       color: '#4da6ff' },
  { emoji: '⭐', title: 'Discovers Potential',           color: '#ffd166' },
  { emoji: '🎯', title: 'Personalized Learning Path',   color: '#4caf82' },
  { emoji: '💙', title: 'Supports Growth & Confidence', color: '#ff6eb4' },
];

const NAV_LINKS = ['Home', 'About Lumi', 'Features', 'How It Works', 'For Parents', 'Contact'];

export default function HomeScreen({ onStart }) {
  const [robotEmotion, setRobotEmotion] = useState('happy');

  useEffect(() => {
    const seq = ['happy', 'excited', 'happy', 'thinking', 'happy', 'excited'];
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % seq.length;
      setRobotEmotion(seq[i]);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hs-screen">

      {/* ── NAV ── */}
      <nav className="hs-nav">
        <div className="hs-nav-logo">
          <span className="hs-l1">L</span>
          <span className="hs-l2">U</span>
          <span className="hs-l3">M</span>
          <span className="hs-l4">i</span>
          <span className="hs-lai"> AI</span>
          <span className="hs-nav-star">✦</span>
        </div>
        <div className="hs-nav-links">
          {NAV_LINKS.map((l, i) => (
            <a key={l} className={`hs-nav-link${i === 0 ? ' hs-nav-link-active' : ''}`}>{l}</a>
          ))}
        </div>
        <button className="hs-nav-cta" onClick={onStart}>✦ Get Started</button>
      </nav>

      {/* ── HERO ── */}
      <div className="hs-hero">

        {/* Left — text content */}
        <div className="hs-hero-left">
          <h1 className="hs-title">
            <span className="hs-t1">L</span>
            <span className="hs-t2">U</span>
            <span className="hs-t3">M</span>
            <span className="hs-t4">i</span>
            <span className="hs-tai"> AI</span>
          </h1>

          <div className="hs-tagline-block">
            <p className="hs-tagline">Some Robots Follow Commands.</p>
            <p className="hs-tagline-blue">Lumi Understands Minds.</p>
            <div className="hs-underline" />
          </div>

          <p className="hs-desc">
            Lumi AI is an intelligent robot that understands how your child thinks,
            discovers their unique potential, and creates a personalized learning path
            in STEAM, creativity and technology.
          </p>

          <div className="hs-cta-row">
            <button className="hs-cta-primary" onClick={onStart}>
              🚀 Explore Lumi AI
            </button>
            <button className="hs-cta-secondary" onClick={onStart}>
              ▶ Watch Video
            </button>
          </div>

          {/* Children silhouette area */}
          <div className="hs-children-area">
            <span className="hs-child-emoji">🧒</span>
            <span className="hs-child-emoji hs-child2">👧</span>
          </div>
        </div>

        {/* Right — robot + bubbles */}
        <div className="hs-hero-right">
          {/* Blue sketch cloud */}
          <div className="hs-sketch-cloud" />

          {/* Decorative floating elements */}
          <span className="hs-deco hs-deco-star1">⭐</span>
          <span className="hs-deco hs-deco-star2">💫</span>
          <span className="hs-deco hs-deco-star3">✨</span>
          <span className="hs-deco hs-deco-bulb">💡</span>
          <span className="hs-deco hs-deco-cloud1">☁️</span>
          <span className="hs-deco hs-deco-cloud2">☁️</span>
          <span className="hs-deco hs-deco-music">🎵</span>

          {/* Speech bubbles */}
          {SPEECH_BUBBLES.map(({ text, emoji, cls }) => (
            <div className={`hs-bubble ${cls}`} key={text}>
              <span className="hs-bubble-emoji">{emoji}</span>
              <span className="hs-bubble-text">{text}</span>
            </div>
          ))}

          {/* Robot */}
          <div className="hs-robot-center">
            <LumiAvatar emotion={robotEmotion} size={210} speaking={false} />
          </div>

          {/* Castle */}
          <div className="hs-castle">🏰🌲🌳</div>
        </div>
      </div>

      {/* ── GREEN GROUND STRIP ── */}
      <div className="hs-ground">
        <div className="hs-ground-path" />
        <span className="hs-ground-trees">🌳🌲🌸🌳🌲🌷🌳</span>
        <span className="hs-ground-flowers">🌸🌼🌺🌸</span>
      </div>

      {/* ── FEATURE BAR ── */}
      <div className="hs-features">
        {FEATURES.map(({ emoji, title, color }) => (
          <div className="hs-feature" key={title}>
            <div className="hs-feature-icon" style={{ borderColor: color, color }}>
              {emoji}
            </div>
            <span className="hs-feature-text">{title}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
