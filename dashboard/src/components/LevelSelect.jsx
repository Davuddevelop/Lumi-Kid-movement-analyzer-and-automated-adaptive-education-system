import { useState, useEffect } from 'react';
import { Lock, Star, Trophy, ChevronRight, Sparkles, Target, Zap, Map } from 'lucide-react';

// Chapter definitions with themes
const CHAPTERS = [
  { id: 1, name: "First Steps", levels: [1, 2, 3, 4, 5], color: "#22c55e", icon: "🌱" },
  { id: 2, name: "Obstacle Course", levels: [6, 7, 8, 9, 10], color: "#f59e0b", icon: "🪨" },
  { id: 3, name: "Loop Master", levels: [11, 12, 13, 14, 15], color: "#8b5cf6", icon: "🔄" },
  { id: 4, name: "Grand Challenge", levels: [16, 17, 18, 19, 20], color: "#ef4444", icon: "🏆" },
];

function LevelSelect({ onSelectLevel, onBack }) {
  const [levels, setLevels] = useState([]);
  const [progress, setProgress] = useState({ completed: [], stars: {} });
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/levels');
      const data = await response.json();
      setLevels(data.levels || []);
      setProgress({
        completed: data.progress?.completed_levels || [],
        stars: data.progress?.stars_earned || {}
      });
    } catch (e) {
      console.error("Failed to fetch levels:", e);
      // Fallback demo data
      setLevels(generateDemoLevels());
    }
    setLoading(false);
  };

  const generateDemoLevels = () => {
    return Array.from({ length: 20 }, (_, i) => ({
      level_id: i + 1,
      name: `Level ${i + 1}`,
      difficulty: i < 5 ? 'easy' : i < 10 ? 'medium' : i < 15 ? 'hard' : 'expert',
      description: `Challenge ${i + 1}`,
      learning_goal: "Learn programming concepts",
      grid_size: [5 + Math.floor(i / 5), 5 + Math.floor(i / 5)],
      obstacles: Array(Math.floor(i / 3)).fill([0, 0])
    }));
  };

  const isLevelUnlocked = (levelId) => {
    const level = levels.find(l => l.level_id === levelId);
    if (!level) return levelId === 1;
    return level.unlocked ?? (levelId === 1);
  };

  const getStarsForLevel = (levelId) => {
    const level = levels.find(l => l.level_id === levelId);
    return level?.stars || progress.stars[levelId] || 0;
  };

  const isLevelCompleted = (levelId) => {
    const level = levels.find(l => l.level_id === levelId);
    return level?.completed ?? progress.completed.includes(levelId);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'expert': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const currentChapter = CHAPTERS.find(c => c.id === selectedChapter);
  const chapterLevels = levels.filter(l => currentChapter?.levels.includes(l.level_id));

  // Calculate chapter progress
  const getChapterProgress = (chapter) => {
    const completed = chapter.levels.filter(id => isLevelCompleted(id)).length;
    return { completed, total: chapter.levels.length };
  };

  // Calculate total stars
  const getTotalStars = () => {
    return levels.reduce((sum, l) => sum + (l.stars || 0), 0);
  };

  if (loading) {
    return (
      <div className="level-select-container">
        <div className="loading-spinner">
          <Sparkles className="spin" size={48} />
          <p>Loading Adventures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="level-select-container">
      {/* Header */}
      <div className="level-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
          Back
        </button>
        <div className="level-title">
          <Map size={32} />
          <h1>Adventure Map</h1>
        </div>
        <div className="total-stars">
          <Star size={24} fill="#fbbf24" color="#fbbf24" />
          <span>{getTotalStars()}</span>
          <span className="star-max">/ {levels.length * 3}</span>
        </div>
      </div>

      {/* Chapter Tabs */}
      <div className="chapter-tabs">
        {CHAPTERS.map((chapter) => {
          const prog = getChapterProgress(chapter);
          // Chapter is unlocked if its first level is unlocked
          const firstLevelId = chapter.levels[0];
          const isUnlocked = isLevelUnlocked(firstLevelId);

          return (
            <button
              key={chapter.id}
              className={`chapter-tab ${selectedChapter === chapter.id ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
              onClick={() => isUnlocked && setSelectedChapter(chapter.id)}
              style={{ '--chapter-color': chapter.color }}
            >
              {!isUnlocked && <Lock size={16} className="tab-lock" />}
              <span className="chapter-icon">{chapter.icon}</span>
              <span className="chapter-name">{chapter.name}</span>
              <span className="chapter-progress">{prog.completed}/{prog.total}</span>
            </button>
          );
        })}
      </div>

      {/* Chapter Title */}
      <div className="chapter-header" style={{ '--chapter-color': currentChapter?.color }}>
        <span className="chapter-big-icon">{currentChapter?.icon}</span>
        <div>
          <h2>Chapter {selectedChapter}: {currentChapter?.name}</h2>
          <p>Complete all levels to unlock the next chapter!</p>
        </div>
      </div>

      {/* Level Path */}
      <div className="level-path">
        <svg className="path-lines" viewBox="0 0 600 200" preserveAspectRatio="none">
          <path
            d="M 60 100 Q 150 50, 180 100 Q 210 150, 300 100 Q 390 50, 420 100 Q 450 150, 540 100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 60 100 Q 150 50, 180 100 Q 210 150, 300 100 Q 390 50, 420 100 Q 450 150, 540 100"
            fill="none"
            stroke={currentChapter?.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 - (getChapterProgress(currentChapter).completed / 5) * 1000}
            className="progress-path"
          />
        </svg>

        <div className="level-nodes">
          {chapterLevels.map((level, index) => {
            const unlocked = isLevelUnlocked(level.level_id);
            const completed = isLevelCompleted(level.level_id);
            const stars = getStarsForLevel(level.level_id);
            const isHovered = hoveredLevel === level.level_id;

            // Position in a wavy pattern
            const positions = [
              { left: '10%', top: '50%' },
              { left: '25%', top: '25%' },
              { left: '45%', top: '50%' },
              { left: '65%', top: '75%' },
              { left: '85%', top: '50%' },
            ];

            return (
              <div
                key={level.level_id}
                className={`level-node ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{
                  left: positions[index]?.left,
                  top: positions[index]?.top,
                  '--node-color': currentChapter?.color,
                  '--difficulty-color': getDifficultyColor(level.difficulty)
                }}
                onMouseEnter={() => setHoveredLevel(level.level_id)}
                onMouseLeave={() => setHoveredLevel(null)}
                onClick={() => unlocked && onSelectLevel(level)}
              >
                {/* Lock overlay */}
                {!unlocked && (
                  <div className="lock-overlay">
                    <Lock size={28} />
                  </div>
                )}

                {/* Level number */}
                <div className="node-number">
                  {completed ? <Trophy size={24} /> : level.level_id}
                </div>

                {/* Stars */}
                {unlocked && (
                  <div className="node-stars">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= stars ? '#fbbf24' : 'transparent'}
                        color={s <= stars ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    ))}
                  </div>
                )}

                {/* Difficulty indicator */}
                <div className="difficulty-dot" title={level.difficulty}></div>

                {/* Current level indicator */}
                {unlocked && !completed && (
                  <div className="current-indicator">
                    <Sparkles size={16} className="sparkle" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Info Panel */}
      {hoveredLevel && (
        <div className="level-info-panel">
          {(() => {
            const level = levels.find(l => l.level_id === hoveredLevel);
            if (!level) return null;
            const unlocked = isLevelUnlocked(level.level_id);

            return (
              <>
                <div className="info-header">
                  <span className="level-badge" style={{ background: getDifficultyColor(level.difficulty) }}>
                    {level.difficulty.toUpperCase()}
                  </span>
                  <h3>{level.name}</h3>
                </div>
                <p className="level-desc">{level.description}</p>
                <div className="level-stats">
                  <div className="stat">
                    <Target size={16} />
                    <span>Grid: {level.grid_size?.[0]}x{level.grid_size?.[1]}</span>
                  </div>
                  <div className="stat">
                    <Zap size={16} />
                    <span>Obstacles: {level.obstacles?.length || 0}</span>
                  </div>
                </div>
                <p className="learning-goal">
                  <Sparkles size={14} />
                  {level.learning_goal}
                </p>
                {unlocked ? (
                  <button className="play-btn" onClick={() => onSelectLevel(level)}>
                    <Zap size={20} />
                    {isLevelCompleted(level.level_id) ? 'Play Again' : 'Start Level'}
                  </button>
                ) : (
                  <div className="locked-msg">
                    <Lock size={16} />
                    Complete Level {level.level_id - 1} to unlock
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <Trophy size={24} color="#fbbf24" />
          <div>
            <span className="stat-value">{levels.filter(l => l.completed).length}</span>
            <span className="stat-label">Levels Complete</span>
          </div>
        </div>
        <div className="stat-card">
          <Star size={24} color="#fbbf24" fill="#fbbf24" />
          <div>
            <span className="stat-value">{getTotalStars()}</span>
            <span className="stat-label">Stars Earned</span>
          </div>
        </div>
        <div className="stat-card">
          <Target size={24} color="#22c55e" />
          <div>
            <span className="stat-value">{levels.length > 0 ? Math.round((levels.filter(l => l.completed).length / levels.length) * 100) : 0}%</span>
            <span className="stat-label">Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LevelSelect;
