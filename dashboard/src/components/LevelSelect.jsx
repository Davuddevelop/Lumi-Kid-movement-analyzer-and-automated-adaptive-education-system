import { useState, useEffect } from 'react';
import { Lock, Star, Trophy, ChevronRight, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Chapter emoji thumbnails — no text name needed for young children
const CHAPTERS = [
  { id: 1, levels: [1, 2, 3, 4, 5],   color: '#22c55e', icon: '🚀', num: 1 },
  { id: 2, levels: [6, 7, 8, 9, 10],  color: '#f59e0b', icon: '🪨', num: 2 },
  { id: 3, levels: [11,12,13,14,15],  color: '#8b5cf6', icon: '🔄', num: 3 },
  { id: 4, levels: [16,17,18,19,20],  color: '#ef4444', icon: '👑', num: 4 },
];

// Emoji preview grids per chapter (shown in level info instead of text)
const CHAPTER_EMOJI_GRID = {
  1: ['🚀','⭐','🌙','🛸','💫'],
  2: ['🪨','🌋','🏔','🗿','🌑'],
  3: ['🔄','♾','🌀','🔁','🔃'],
  4: ['👑','🏆','🎯','💎','🌈'],
};

function LevelSelect({ onSelectLevel, onBack }) {
  const [levels, setLevels]               = useState([]);
  const [progress, setProgress]           = useState({ completed: [], stars: {} });
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [hoveredLevel, setHoveredLevel]   = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => { fetchLevels(); }, []);

  const fetchLevels = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/levels`);
      const data = await res.json();
      setLevels(data.levels || []);
      setProgress({
        completed: data.progress?.completed_levels || [],
        stars:     data.progress?.stars_earned     || {},
      });
    } catch {
      setLevels(generateDemoLevels());
    }
    setLoading(false);
  };

  const generateDemoLevels = () =>
    Array.from({ length: 20 }, (_, i) => ({
      level_id:  i + 1,
      name:      `Level ${i + 1}`,
      difficulty: i < 5 ? 'easy' : i < 10 ? 'medium' : i < 15 ? 'hard' : 'expert',
      description: `Challenge ${i + 1}`,
      learning_goal: 'Learn programming concepts',
      grid_size: [5 + Math.floor(i / 5), 5 + Math.floor(i / 5)],
      obstacles: Array(Math.floor(i / 3)).fill([0, 0]),
      unlocked: i === 0,
    }));

  const isLevelUnlocked = (levelId) => {
    const lvl = levels.find(l => l.level_id === levelId);
    return lvl?.unlocked ?? (levelId === 1);
  };

  const getStarsForLevel = (levelId) => {
    const lvl = levels.find(l => l.level_id === levelId);
    return lvl?.stars || progress.stars[levelId] || 0;
  };

  const isLevelCompleted = (levelId) => {
    const lvl = levels.find(l => l.level_id === levelId);
    return lvl?.completed ?? progress.completed.includes(levelId);
  };

  const getDifficultyColor = (difficulty) => ({
    easy:   '#22c55e',
    medium: '#f59e0b',
    hard:   '#ef4444',
    expert: '#8b5cf6',
  }[difficulty] ?? '#64748b');

  const currentChapter = CHAPTERS.find(c => c.id === selectedChapter);
  const chapterLevels  = levels.filter(l => currentChapter?.levels.includes(l.level_id));

  const getChapterProgress = (chapter) => ({
    completed: chapter.levels.filter(id => isLevelCompleted(id)).length,
    total:     chapter.levels.length,
  });

  const getTotalStars = () =>
    levels.reduce((sum, l) => sum + (l.stars || 0), 0);

  if (loading) {
    return (
      <div className="level-select-container">
        <div className="loading-spinner">
          <Sparkles className="spin" size={56} />
          <p>Loading Adventures…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="level-select-container">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="level-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to game">
          <ChevronRight size={28} style={{ transform: 'rotate(180deg)' }} />
          Back
        </button>

        <div className="level-title">
          <span style={{ fontSize: '2.2rem' }}>🗺️</span>
          <h1>Adventure Map</h1>
        </div>

        <div className="total-stars" aria-label={`${getTotalStars()} total stars`}>
          <Star size={26} fill="#ffd166" color="#ffd166" />
          <span>{getTotalStars()}</span>
          <span className="star-max">/ {levels.length * 3}</span>
        </div>
      </div>

      {/* ── CHAPTER TABS — emoji + number, no text name ─────────────────── */}
      <div className="chapter-tabs" role="tablist" aria-label="Chapters">
        {CHAPTERS.map((chapter) => {
          const prog        = getChapterProgress(chapter);
          const isUnlocked  = isLevelUnlocked(chapter.levels[0]);
          const isActive    = selectedChapter === chapter.id;

          return (
            <button
              key={chapter.id}
              role="tab"
              aria-selected={isActive}
              className={`chapter-tab${isActive ? ' active' : ''}${!isUnlocked ? ' locked' : ''}`}
              onClick={() => isUnlocked && setSelectedChapter(chapter.id)}
              style={{ '--chapter-color': chapter.color }}
              aria-label={`Chapter ${chapter.num}${!isUnlocked ? ', locked' : ''}`}
            >
              {!isUnlocked && (
                <Lock size={14} style={{ position: 'absolute', top: 6, right: 8, opacity: 0.8 }} />
              )}
              <span className="chapter-icon">{chapter.icon}</span>
              <span className="chapter-num">Ch.{chapter.num}</span>
              <span className="chapter-progress">{prog.completed}/{prog.total}</span>
            </button>
          );
        })}
      </div>

      {/* ── CHAPTER HEADER — big emoji + chapter number ─────────────────── */}
      <div className="chapter-header" style={{ '--chapter-color': currentChapter?.color }}>
        <span className="chapter-big-icon">{currentChapter?.icon}</span>
        <div>
          <h2>Chapter {selectedChapter}</h2>
          <p>Complete all levels to unlock the next chapter!</p>
        </div>
      </div>

      {/* ── LEVEL PATH ──────────────────────────────────────────────────── */}
      <div className="level-path">
        {/* Wavy SVG path */}
        <svg className="path-lines" viewBox="0 0 600 200" preserveAspectRatio="none">
          <path
            d="M 60 100 Q 150 50, 180 100 Q 210 150, 300 100 Q 390 50, 420 100 Q 450 150, 540 100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 60 100 Q 150 50, 180 100 Q 210 150, 300 100 Q 390 50, 420 100 Q 450 150, 540 100"
            fill="none"
            stroke={currentChapter?.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset={
              1000 - (getChapterProgress(currentChapter).completed / 5) * 1000
            }
            className="progress-path"
          />
        </svg>

        <div className="level-nodes">
          {chapterLevels.map((level, index) => {
            const unlocked  = isLevelUnlocked(level.level_id);
            const completed = isLevelCompleted(level.level_id);
            const stars     = getStarsForLevel(level.level_id);

            // 5 nodes on wavy path
            const positions = [
              { left: '10%', top: '50%' },
              { left: '27%', top: '27%' },
              { left: '48%', top: '50%' },
              { left: '68%', top: '73%' },
              { left: '87%', top: '50%' },
            ];

            return (
              <div
                key={level.level_id}
                className={`level-node ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}`}
                style={{
                  left: positions[index]?.left,
                  top:  positions[index]?.top,
                  '--node-color': currentChapter?.color,
                }}
                onMouseEnter={() => setHoveredLevel(level.level_id)}
                onMouseLeave={() => setHoveredLevel(null)}
                onFocus={() => setHoveredLevel(level.level_id)}
                onClick={() => unlocked && onSelectLevel(level)}
                role="button"
                tabIndex={unlocked ? 0 : -1}
                aria-label={`Level ${level.level_id}${completed ? ', completed' : ''}${!unlocked ? ', locked' : ''}, ${stars} stars`}
                aria-disabled={!unlocked}
              >
                {!unlocked && (
                  <div className="lock-overlay">
                    <Lock size={26} />
                  </div>
                )}

                {/* Circle: level number large, star count small below */}
                <div className="node-inner">
                  <span className="node-number">
                    {completed ? <Trophy size={22} /> : level.level_id}
                  </span>
                  {unlocked && (
                    <div className="node-star-row">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          size={10}
                          fill={s <= stars ? '#ffd166' : 'transparent'}
                          color={s <= stars ? '#ffd166' : 'rgba(255,255,255,0.3)'}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Stars badge below node */}
                {unlocked && (
                  <div className="node-stars">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= stars ? '#ffd166' : 'transparent'}
                        color={s <= stars ? '#ffd166' : 'rgba(255,255,255,0.3)'}
                      />
                    ))}
                  </div>
                )}

                {/* Current level sparkle */}
                {unlocked && !completed && (
                  <div className="current-indicator" aria-hidden="true">✨</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LEVEL DETAIL PANEL (tap to show) ─────────────────────────── */}
      {hoveredLevel && (() => {
        const level    = levels.find(l => l.level_id === hoveredLevel);
        if (!level) return null;
        const unlocked = isLevelUnlocked(level.level_id);
        const chIdx    = CHAPTERS.findIndex(c => c.levels.includes(level.level_id));
        const emojiGrid = CHAPTER_EMOJI_GRID[chIdx + 1] || [];

        return (
          <div className="level-info-panel" role="dialog" aria-label={`Level ${level.level_id} details`}>
            <div className="info-header">
              <span
                className="level-badge"
                style={{ background: getDifficultyColor(level.difficulty) }}
              >
                {level.difficulty?.toUpperCase()}
              </span>
              <h3>Level {level.level_id}</h3>
            </div>

            {/* Emoji grid preview instead of text description */}
            <div className="level-emoji-preview">
              {emojiGrid.slice(0, 5).join('  ')}
            </div>

            {unlocked ? (
              <button
                className="play-btn"
                onClick={() => onSelectLevel(level)}
                aria-label={`Play level ${level.level_id}`}
              >
                <span style={{ fontSize: '1.4rem' }}>▶</span>
                {isLevelCompleted(level.level_id) ? 'Play Again!' : "Let's Go!"}
              </button>
            ) : (
              <div className="locked-msg">
                <Lock size={18} />
                Complete level {level.level_id - 1} first!
              </div>
            )}
          </div>
        );
      })()}

      {/* ── QUICK STATS ──────────────────────────────────────────────── */}
      <div className="quick-stats">
        <div className="stat-card">
          <Trophy size={28} color="#ffd166" />
          <div>
            <span className="stat-value">{levels.filter(l => l.completed).length}</span>
            <span className="stat-label">Done!</span>
          </div>
        </div>
        <div className="stat-card">
          <Star size={28} color="#ffd166" fill="#ffd166" />
          <div>
            <span className="stat-value">{getTotalStars()}</span>
            <span className="stat-label">Stars</span>
          </div>
        </div>
        <div className="stat-card">
          <span style={{ fontSize: '1.8rem' }}>🏅</span>
          <div>
            <span className="stat-value">
              {levels.length > 0
                ? Math.round((levels.filter(l => l.completed).length / levels.length) * 100)
                : 0}%
            </span>
            <span className="stat-label">Progress</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default LevelSelect;
