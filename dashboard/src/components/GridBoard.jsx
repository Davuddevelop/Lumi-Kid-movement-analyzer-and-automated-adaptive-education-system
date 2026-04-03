import React from 'react';

const GridBoard = ({ grid_size, robot_pos, obstacles = [], goal, path = [], status, start_pos }) => {
  if (!grid_size) return null;

  const { width, height } = grid_size;
  const cells = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isGoal = goal?.x === x && goal?.y === y;
      const isObstacle = obstacles?.some(o => o.x === x && o.y === y);
      const isPath = path?.some(p => p.x === x && p.y === y);

      cells.push(
        <div
          key={`${x}-${y}`}
          className="grid-cell"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {isGoal && (
            <div style={{
              fontSize: '2.2rem',
              animation: 'float 2s infinite alternate',
              filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'
            }}>
              ⭐
            </div>
          )}
          {isObstacle && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '1.8rem',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
              }}>
                🪨
              </div>
              <div style={{
                position: 'absolute',
                top: '-4px',
                display: 'flex',
                gap: '2px'
              }}>
                <div style={{
                  width: '4px',
                  height: '8px',
                  background: '#4ade80',
                  borderRadius: '2px',
                  boxShadow: '0 0 6px #4ade80'
                }}></div>
                <div style={{
                  width: '4px',
                  height: '6px',
                  background: '#4ade80',
                  borderRadius: '2px',
                  boxShadow: '0 0 6px #4ade80',
                  marginTop: '2px'
                }}></div>
              </div>
            </div>
          )}
          {isPath && !isGoal && !isObstacle && (
            <div style={{
              width: '10px',
              height: '10px',
              background: '#4ade80',
              borderRadius: '50%',
              boxShadow: '0 0 10px #4ade80'
            }}></div>
          )}
        </div>
      );
    }
  }

  // Robot face based on status
  const getRobotFace = () => {
    switch(status) {
      case 'success': return '😊';
      case 'error':
      case 'fail': return '😵';
      case 'executing': return '😶';
      default: return '😐';
    }
  };

  const getRobotColor = () => {
    switch(status) {
      case 'success': return '#10b981';
      case 'error':
      case 'fail': return '#ef4444';
      case 'executing': return '#6366f1';
      default: return '#a78bfa';
    }
  };

  return (
    <div style={{
      width: '100%',
      aspectRatio: '1',
      position: 'relative',
      padding: '12px',
      background: 'transparent',
      borderRadius: '30px',
    }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
          gap: '6px',
          height: '100%',
          position: 'relative'
        }}
      >
        {cells}

        {robot_pos && (
          <div
            style={{
              position: 'absolute',
              width: `calc(${100 / width}% - 6px)`,
              height: `calc(${100 / height}% - 6px)`,
              left: `calc(${robot_pos.x * (100 / width)}% + 3px)`,
              top: `calc(${robot_pos.y * (100 / height)}% + 3px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 20,
            }}
          >
            <div style={{
              width: '85%',
              height: '85%',
              background: getRobotColor(),
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              color: 'white',
              border: '3px solid white',
              boxShadow: `0 8px 20px ${getRobotColor()}66`,
              animation: status === 'executing' ? 'pulse 1s infinite' : 'none'
            }}>
              {getRobotFace()}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-6px) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default GridBoard;
