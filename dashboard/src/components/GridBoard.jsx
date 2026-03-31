import React from 'react';
import { Bot, Target, Ban, Home } from 'lucide-react';

const GridBoard = ({ grid_size, robot_pos, obstacles = [], goal, path = [], status, start_pos }) => {
  if (!grid_size) return null;

  const { width, height } = grid_size;
  const cells = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isGoal = goal?.x === x && goal?.y === y;
      const isObstacle = obstacles?.some(o => o.x === x && o.y === y);
      const isPath = path?.some(p => p.x === x && p.y === y);
      const isStart = start_pos?.x === x && start_pos?.y === y;

      cells.push(
        <div 
          key={`${x}-${y}`} 
          className={`grid-cell ${isGoal ? 'cell-goal' : ''} ${isObstacle ? 'cell-obstacle' : ''} ${isPath ? 'cell-path' : ''} ${isStart ? 'cell-start' : ''}`}
        >
          {isGoal && <Target size={width > 5 ? 20 : 28} className="goal-icon" color="#f59e0b" />}
          {isObstacle && <Ban size={width > 5 ? 20 : 28} className="obstacle-icon" color="#94a3b8" />}
          {isStart && !isPath && <Home size={width > 5 ? 16 : 24} color="#6366f1" opacity={0.4} />}
          {isPath && !isGoal && !isObstacle && <div className="path-dot"></div>}
        </div>
      );
    }
  }

  return (
    <div className="mission-grid-wrapper">
      <div 
        className="mission-grid" 
        style={{ 
          gridTemplateColumns: `repeat(${width}, 1fr)`,
        }}
      >
        {cells}
        {robot_pos && (
          <div 
            className={`robot-glider ${status === 'error' || status === 'fail' ? 'robot-error' : ''}`}
            style={{
              width: `${100 / width}%`,
              height: `${100 / height}%`,
              left: `${robot_pos.x * (100 / width)}%`,
              top: `${robot_pos.y * (100 / height)}%`,
            }}
          >
            <div className="robot-body">
              <Bot size={width > 5 ? 24 : 36} color="white" strokeWidth={2.5} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GridBoard;
