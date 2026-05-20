import { useEffect, useRef } from 'react';

const PARTICLES = ['⭐', '✨', '💫', '🌟', '🎉', '🎊', '💥', '🌈'];

/**
 * AchievementBlast — full-screen celebration overlay.
 * Props:
 *   achievement: { id, icon, name, message }
 *   onDone: () => void
 */
const AchievementBlast = ({ achievement, onDone }) => {
  const timerRef = useRef(null);

  useEffect(() => {
    // Speak the achievement message via TTS
    if (window.speechSynthesis && achievement?.message) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${achievement.name}! ${achievement.message}`);
      u.pitch = 1.6;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }

    // Auto-dismiss after 4 seconds
    timerRef.current = setTimeout(() => {
      onDone?.();
    }, 4000);

    return () => {
      clearTimeout(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, [achievement, onDone]);

  if (!achievement) return null;

  // Generate particles at random positions
  const particles = Array.from({ length: 16 }, (_, i) => {
    const emoji = PARTICLES[i % PARTICLES.length];
    const angle = (i / 16) * 360;
    const dist  = 80 + Math.random() * 80;
    const tx = Math.cos((angle * Math.PI) / 180) * dist;
    const ty = Math.sin((angle * Math.PI) / 180) * dist;
    const delay = Math.random() * 0.4;
    return { emoji, tx, ty, delay, key: i };
  });

  return (
    <div
      className="achievement-overlay"
      onClick={onDone}
      role="dialog"
      aria-modal="true"
      aria-label={`Achievement unlocked: ${achievement.name}`}
    >
      <div className="achievement-card" onClick={(e) => e.stopPropagation()}>
        {/* Particle burst */}
        <div className="achievement-particles">
          {particles.map(({ emoji, tx, ty, delay, key }) => (
            <span
              key={key}
              className="particle"
              style={{
                top: '50%',
                left: '50%',
                '--tx': `${tx}px`,
                '--ty': `${ty}px`,
                animationDelay: `${delay}s`,
                animationDuration: '1.6s',
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="achievement-badge-icon" aria-hidden="true">
          {achievement.icon || '🏆'}
        </div>

        <p className="achievement-new-badge">NEW BADGE!</p>

        <h2 className="achievement-name">{achievement.name}</h2>

        <p className="achievement-message">{achievement.message}</p>

        <p className="achievement-dismiss-hint">Tap anywhere to continue</p>
      </div>
    </div>
  );
};

export default AchievementBlast;
