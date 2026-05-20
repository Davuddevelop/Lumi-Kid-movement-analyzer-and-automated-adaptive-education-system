import React, { useEffect, useRef } from 'react';

/**
 * WorldMap — SVG-based isometric world map showing level progression.
 * Props: { levels, onSelectLevel, onBack, currentLevelId }
 *
 * levels: array of { id, name, unlocked, completed, stars, zone }
 * Zone assignment: level 1-5 → zone 1, 6-10 → zone 2, etc.
 */

const ZONES = [
  {
    id: 1,
    name: 'Space Station',
    emoji: '🚀',
    color: '#7c5cfc',
    glow: 'rgba(124,92,252,0.5)',
    textColor: '#c4b5fd',
    bgColor: 'rgba(124,92,252,0.15)',
    levels: [1, 2, 3, 4, 5],
  },
  {
    id: 2,
    name: 'Crystal Caves',
    emoji: '💎',
    color: '#4ecdc4',
    glow: 'rgba(78,205,196,0.5)',
    textColor: '#99f6f0',
    bgColor: 'rgba(78,205,196,0.12)',
    levels: [6, 7, 8, 9, 10],
  },
  {
    id: 3,
    name: 'Robot City',
    emoji: '🤖',
    color: '#ff9f43',
    glow: 'rgba(255,159,67,0.5)',
    textColor: '#ffd3a0',
    bgColor: 'rgba(255,159,67,0.12)',
    levels: [11, 12, 13, 14, 15],
  },
  {
    id: 4,
    name: 'Star Temple',
    emoji: '⭐',
    color: '#ffd166',
    glow: 'rgba(255,209,102,0.5)',
    textColor: '#fff0a0',
    bgColor: 'rgba(255,209,102,0.12)',
    levels: [16, 17, 18, 19, 20],
  },
];

// Path node positions (x, y) for 5 nodes within a 400px wide zone band
// Each zone occupies a 280px tall band. Nodes wind left-right.
const NODE_OFFSETS = [
  { x: 70,  y: 60  },
  { x: 200, y: 100 },
  { x: 310, y: 150 },
  { x: 180, y: 200 },
  { x: 80,  y: 250 },
];

const ZONE_HEIGHT = 310;
const SVG_WIDTH = 400;
const ZONE_PADDING_TOP = 40;

function getNodePos(zoneIndex, nodeIndex) {
  const zoneStartY = zoneIndex * ZONE_HEIGHT + ZONE_PADDING_TOP;
  return {
    x: NODE_OFFSETS[nodeIndex].x,
    y: zoneStartY + NODE_OFFSETS[nodeIndex].y,
  };
}

function buildPathD(zoneIndex, zone) {
  const points = zone.levels.map((_, i) => getNodePos(zoneIndex, i));
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const cx = (prev.x + cur.x) / 2;
    const cy = (prev.y + cur.y) / 2;
    d += ` Q ${cx} ${prev.y} ${cur.x} ${cur.y}`;
  }
  return d;
}

const styles = `
  @keyframes wm-pulse {
    0%, 100% { r: 34; opacity: 0.6; }
    50% { r: 40; opacity: 0.2; }
  }
  @keyframes wm-node-bounce {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
  @keyframes wm-stars-twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  .wm-pulse-ring {
    animation: wm-pulse 1.4s ease-in-out infinite;
  }
  .wm-current-node {
    animation: wm-node-bounce 1.2s ease-in-out infinite;
  }
  .wm-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg-space);
    -webkit-overflow-scrolling: touch;
  }
  .wm-back-btn {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(13,10,30,0.85);
    backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    border-radius: 0 0 20px 0;
    padding: 12px 20px 12px 16px;
    color: var(--text-main);
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.2rem;
    cursor: pointer;
    min-height: 60px;
    min-width: 60px;
    width: fit-content;
    border-top: none;
    border-left: none;
  }
  .wm-back-btn:hover { background: rgba(124,92,252,0.25); }
  .wm-svg-wrap {
    display: flex;
    justify-content: center;
    padding-bottom: 40px;
    margin-top: -60px;
    padding-top: 0;
  }
`;

export default function WorldMap({ levels = [], onSelectLevel, onBack, currentLevelId }) {
  const scrollRef = useRef(null);

  // Build a lookup for level state
  const levelMap = {};
  levels.forEach(l => { levelMap[l.id] = l; });

  // Auto-scroll to current level node
  useEffect(() => {
    if (!currentLevelId || !scrollRef.current) return;
    let currentZoneIndex = -1;
    let currentNodeIndex = -1;
    ZONES.forEach((zone, zi) => {
      zone.levels.forEach((lvlId, ni) => {
        if (lvlId === currentLevelId) {
          currentZoneIndex = zi;
          currentNodeIndex = ni;
        }
      });
    });
    if (currentZoneIndex < 0) return;
    const pos = getNodePos(currentZoneIndex, currentNodeIndex);
    const scrollTarget = pos.y - 200;
    scrollRef.current.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
  }, [currentLevelId]);

  const totalSVGHeight = ZONES.length * ZONE_HEIGHT + ZONE_PADDING_TOP + 60;

  function handleNodeClick(levelId) {
    const l = levelMap[levelId];
    if (!l) return;
    if (l.unlocked || l.completed) {
      onSelectLevel && onSelectLevel(l);
    }
  }

  function renderStars(count, x, y, color) {
    const filled = Math.min(count || 0, 3);
    return Array.from({ length: 3 }).map((_, i) => (
      <text
        key={i}
        x={x - 14 + i * 14}
        y={y}
        fontSize="11"
        textAnchor="middle"
        opacity={i < filled ? 1 : 0.3}
      >
        ⭐
      </text>
    ));
  }

  function renderNode(zone, levelId, nodeIndex, zoneIndex) {
    const level = levelMap[levelId] || { id: levelId, unlocked: false, completed: false, stars: 0 };
    const isCurrent = level.id === currentLevelId;
    const isCompleted = level.completed;
    const isUnlocked = level.unlocked;
    const pos = getNodePos(zoneIndex, nodeIndex);
    const baseR = isCurrent ? 32 : 28;
    const isClickable = isUnlocked || isCompleted;

    let fillColor = '#2a2545';
    let strokeColor = '#4a4070';
    let textColor = '#6b5fa0';
    if (isCompleted) {
      fillColor = zone.color;
      strokeColor = zone.color;
      textColor = '#fff';
    } else if (isUnlocked && !isCompleted) {
      fillColor = 'rgba(255,255,255,0.08)';
      strokeColor = '#ffffff';
      textColor = '#ffffff';
    }
    if (isCurrent) {
      strokeColor = zone.color;
    }

    return (
      <g
        key={levelId}
        onClick={() => isClickable && handleNodeClick(levelId)}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
        className={isCurrent ? 'wm-current-node' : ''}
      >
        {/* Pulse ring for current */}
        {isCurrent && (
          <circle
            cx={pos.x}
            cy={pos.y}
            r={baseR + 8}
            fill="none"
            stroke={zone.color}
            strokeWidth="3"
            opacity="0.5"
            className="wm-pulse-ring"
          />
        )}

        {/* Node circle */}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={baseR}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isCurrent ? 3 : 2}
          style={{
            filter: isCurrent ? `drop-shadow(0 0 10px ${zone.glow})` : isCompleted ? `drop-shadow(0 0 6px ${zone.glow})` : 'none',
          }}
        />

        {/* Inner content */}
        {!isUnlocked && !isCompleted ? (
          /* Locked */
          <text x={pos.x} y={pos.y + 7} textAnchor="middle" fontSize="20">🔒</text>
        ) : isCompleted ? (
          /* Completed: level number */
          <text x={pos.x} y={pos.y + 6} textAnchor="middle" fontSize="15" fill="#fff" fontFamily="Fredoka One, sans-serif" fontWeight="bold">
            {levelId}
          </text>
        ) : (
          /* Unlocked/available: level number */
          <text x={pos.x} y={pos.y + 6} textAnchor="middle" fontSize="15" fill={textColor} fontFamily="Fredoka One, sans-serif" fontWeight="bold">
            {levelId}
          </text>
        )}

        {/* Stars below completed nodes */}
        {isCompleted && renderStars(level.stars, pos.x, pos.y + baseR + 18, zone.color)}

        {/* Level name tooltip above current */}
        {isCurrent && (
          <>
            <rect
              x={pos.x - 45}
              y={pos.y - baseR - 32}
              width={90}
              height={24}
              rx={8}
              fill={zone.color}
              opacity={0.9}
            />
            <text
              x={pos.x}
              y={pos.y - baseR - 14}
              textAnchor="middle"
              fontSize="11"
              fill="#fff"
              fontFamily="Fredoka One, sans-serif"
            >
              {level.name || `Level ${levelId}`}
            </text>
          </>
        )}
      </g>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="wm-container" ref={scrollRef}>
        {/* Back button sticky at top */}
        <button className="wm-back-btn" onClick={onBack} aria-label="Go back">
          ← World Map
        </button>

        <div className="wm-svg-wrap">
          <svg
            width={SVG_WIDTH}
            height={totalSVGHeight}
            viewBox={`0 0 ${SVG_WIDTH} ${totalSVGHeight}`}
            style={{ display: 'block', overflow: 'visible' }}
          >
            {/* Background stars */}
            {Array.from({ length: 40 }).map((_, i) => {
              const sx = (i * 97 + 13) % SVG_WIDTH;
              const sy = (i * 137 + 29) % totalSVGHeight;
              const sr = (i % 3) * 0.8 + 0.6;
              const delay = (i * 0.31) % 3;
              return (
                <circle
                  key={i}
                  cx={sx}
                  cy={sy}
                  r={sr}
                  fill="white"
                  opacity={0.3}
                  style={{ animation: `wm-stars-twinkle ${2 + (i % 3)}s ${delay}s ease-in-out infinite` }}
                />
              );
            })}

            {ZONES.map((zone, zoneIndex) => {
              const zoneStartY = zoneIndex * ZONE_HEIGHT + ZONE_PADDING_TOP;
              const pathD = buildPathD(zoneIndex, zone);

              return (
                <g key={zone.id}>
                  {/* Zone background band */}
                  <rect
                    x={0}
                    y={zoneStartY}
                    width={SVG_WIDTH}
                    height={ZONE_HEIGHT - 20}
                    fill={zone.bgColor}
                    rx={0}
                  />

                  {/* Zone divider line */}
                  {zoneIndex > 0 && (
                    <line
                      x1={0} y1={zoneStartY}
                      x2={SVG_WIDTH} y2={zoneStartY}
                      stroke={zone.color}
                      strokeWidth={1}
                      strokeDasharray="8 6"
                      opacity={0.3}
                    />
                  )}

                  {/* Zone header */}
                  <text
                    x={SVG_WIDTH / 2}
                    y={zoneStartY + 28}
                    textAnchor="middle"
                    fontSize="22"
                    fontFamily="Fredoka One, sans-serif"
                    fill={zone.textColor}
                    style={{ filter: `drop-shadow(0 0 8px ${zone.glow})` }}
                  >
                    {zone.emoji} {zone.name}
                  </text>

                  {/* Connecting dashed path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={zone.color}
                    strokeWidth={3}
                    strokeDasharray="10 7"
                    opacity={0.55}
                    strokeLinecap="round"
                  />

                  {/* Level nodes */}
                  {zone.levels.map((levelId, nodeIndex) =>
                    renderNode(zone, levelId, nodeIndex, zoneIndex)
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </>
  );
}
