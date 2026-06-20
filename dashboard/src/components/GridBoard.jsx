import React, { useEffect, useRef, useState } from 'react';

const CONFETTI = ['⭐', '✨', '💫', '🎉', '🌟', '🎊'];
const CONFETTI_COUNT = 18;

// Deterministic obstacle variety so same cell always gets same emoji
const OBSTACLE_EMOJIS = ['🪨', '🌲', '🌵', '🍄', '🪵', '🌊', '🗿', '🌴'];
function obstacleEmoji(x, y) {
  return OBSTACLE_EMOJIS[(x * 7 + y * 13) % OBSTACLE_EMOJIS.length];
}

// Sparse ground decorations on ~14% of empty cells
const DECO_EMOJIS = ['🌿', '🌸', '🌼', '🍀', '🌾', '🌺', '🦋', '🌻'];
function cellDeco(x, y) {
  const h = (x * 17 + y * 31 + x * y * 3) % 100;
  if (h < 14) return DECO_EMOJIS[h % DECO_EMOJIS.length];
  return null;
}

/**
 * GridBoard — game grid with animated robot.
 * Props match the WebSocket state shape.
 */
const GridBoard = ({
  grid_size,
  robot_pos,
  robot_direction = 1,
  obstacles = [],
  goal,
  path = [],
  status,
  start_pos,
}) => {
  const prevStatus = useRef(status);
  const [shaking, setShaking]   = useState(false);
  const [confetti, setConfetti] = useState([]);

  // Trigger effects on status transitions
  useEffect(() => {
    if (prevStatus.current === status) return;
    prevStatus.current = status;

    if (status === 'error' || status === 'fail') {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }

    if (status === 'success') {
      const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        emoji: CONFETTI[i % CONFETTI.length],
        left: `${5 + Math.random() * 90}%`,
        delay: `${Math.random() * 0.8}s`,
        dur:   `${1.4 + Math.random() * 0.8}s`,
      }));
      setConfetti(pieces);
      setTimeout(() => setConfetti([]), 3500);
    }
  }, [status]);

  if (!grid_size) return null;

  const { width, height } = grid_size;

  // Robot face based on status — matches the physical 4-wheeled rover
  const robotFace = {
    success:   '🏆',
    error:     '💥',
    fail:      '💥',
    executing: '🚗',
  }[status] ?? '🚗';

  const robotColor = {
    success:   '#4caf82',
    error:     '#ff6b6b',
    fail:      '#ff6b6b',
    executing: '#1a6cf0',
  }[status] ?? '#1a6cf0';

  // Position helpers — correct % calc, no magic pixels
  const cellW = 100 / width;
  const cellH = 100 / height;

  const robotLeft = `${robot_pos ? robot_pos.x * cellW : 0}%`;
  const robotTop  = `${robot_pos ? robot_pos.y * cellH : 0}%`;
  const robotW    = `calc(${cellW}% - 5px)`;
  const robotH    = `calc(${cellH}% - 5px)`;

  return (
    <div className="grid-board-outer">
      <div
        className="grid-board-inner"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      >
        {/* Grid cells */}
        <div
          className="grid-grid"
          style={{
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows:    `repeat(${height}, 1fr)`,
          }}
        >
          {Array.from({ length: height }, (_, y) =>
            Array.from({ length: width }, (_, x) => {
              const isGoal     = goal?.x === x && goal?.y === y;
              const isStart    = start_pos?.x === x && start_pos?.y === y;
              const isObstacle = obstacles.some(o => o.x === x && o.y === y);

              // Path index for staggered animation
              const pathIdx = path.findIndex(p => p.x === x && p.y === y);
              const isPath  = pathIdx !== -1 && !isGoal && !isObstacle;

              const isEmpty    = !isGoal && !isObstacle && !isPath && !isStart;
              const deco       = isEmpty ? cellDeco(x, y) : null;

              return (
                <div key={`${x}-${y}`} className="grid-cell">
                  {isGoal && (
                    <div className="grid-cell-goal" aria-label="Goal">⭐</div>
                  )}
                  {isObstacle && (
                    <div className="grid-cell-obstacle" aria-label="Obstacle">
                      {obstacleEmoji(x, y)}
                    </div>
                  )}
                  {isPath && (
                    <div
                      className="grid-cell-path"
                      style={{ animationDelay: `${pathIdx * 0.06}s` }}
                    />
                  )}
                  {deco && (
                    <span className="grid-cell-deco" aria-hidden="true">{deco}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Robot */}
        {robot_pos && (
          <div
            className={`robot-cell${shaking ? ' error-shake' : ''}`}
            style={{
              position: 'absolute',
              left: robotLeft,
              top:  robotTop,
              width: robotW,
              height: robotH,
            }}
            aria-label={`Robot facing direction ${robot_direction}`}
          >
            <div
              className="robot-body"
              style={{
                background: status === 'error' || status === 'fail' ? '#ff6b6b' : 'white',
                boxShadow: `0 6px 20px ${robotColor}55`,
                border: `3px solid ${robotColor}`,
                animation: status === 'executing' ? 'robotPulse 1s infinite' : 'none',
              }}
            >
              <span className="robot-emoji">{robotFace}</span>

              {/* Direction arrow */}
              <div
                className={`robot-direction-arrow arrow-${robot_direction ?? 1}`}
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {/* Confetti on success */}
        {confetti.length > 0 && (
          <div className="confetti-container" aria-hidden="true">
            {confetti.map(({ id, emoji, left, delay, dur }) => (
              <span
                key={id}
                className="confetti-piece"
                style={{
                  left,
                  top: 0,
                  animationDelay: delay,
                  animationDuration: dur,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scoped keyframes */}
      <style>{`
        @keyframes robotPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default GridBoard;
