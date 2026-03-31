import { useState, useEffect } from 'react';
import { ArrowUp, CornerDownRight, CornerDownLeft, Repeat, Bot, CheckCircle, Zap, Map, AlertTriangle } from 'lucide-react';
import GridBoard from './components/GridBoard';

function App() {
  const [gameState, setGameState] = useState({
    commands: [],
    status: 'idle',
    feedback: 'Connecting to robot...',
    grid_size: { width: 8, height: 8 },
    robot_pos: { x: 1, y: 4 },
    start_pos: { x: 1, y: 4 },
    goal: { x: 6, y: 4 },
    obstacles: [],
    path: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    if (gameState.commands.length === 0 || gameState.status === 'executing') return;
    setIsLoading(true);
    try {
      await fetch('http://127.0.0.1:8000/api/execute', { method: 'POST' });
    } catch (e) {
      console.error("Failed to trigger execution:", e);
    } finally {
      // Keep loading for a moment to feel the click
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  useEffect(() => {
    const connectWs = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws');
      ws.onopen = () => setGameState(prev => ({...prev, feedback: 'Connected! Place some blocks.'}));
      ws.onmessage = (event) => {
        try { setGameState(JSON.parse(event.data)); } 
        catch (e) { console.error(e); }
      };
      ws.onclose = () => {
        setGameState(prev => ({...prev, feedback: 'Disconnected. Reconnecting...'}));
        setTimeout(connectWs, 2000);
      };
    };
    connectWs();
  }, []);

  const getCommandIcon = (cmd) => {
    switch(cmd) {
      case 'forward': return <ArrowUp size={20} strokeWidth={3} />;
      case 'turn_right': return <CornerDownRight size={20} strokeWidth={3} />;
      case 'turn_left': return <CornerDownLeft size={20} strokeWidth={3} />;
      case 'loop': return <Repeat size={20} strokeWidth={3} />;
      default: return null;
    }
  };


  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="robot-avatar">
          <Bot size={54} className={`animate-${gameState.status}`} />
        </div>
        <h1>Lumi Robot Missions</h1>
      </header>
      
      <div className={`status-badge status-${gameState.status}`}>
        <div className="status-dot"></div>
        <span className="status-text animate-fade">
          {gameState.status === 'idle' ? 'System Idle' 
            : gameState.status === 'executing' ? 'Robot Executing...' 
            : (gameState.status === 'error' || gameState.status === 'fail') ? 'CRASH DETECTED!'
            : 'Goal Success!'}
        </span>
      </div>

      <div className="main-content">
        <div className="panel flex-col" style={{overflowX: 'hidden'}}>
          <h2><Zap size={24} color="#f59e0b" /> Scanner Feed</h2>
          
          <div className="commands-container">
            {gameState.commands.length === 0 ? (
              <div className="empty-state">No blocks detected yet 🕵️‍♀️</div>
            ) : (
              gameState.commands.map((cmd, index) => (
                <div key={index} className={`command-block cmd-${cmd}`} >
                  <div className="cmd-icon-wrapper">{getCommandIcon(cmd)}</div>
                  <span>{cmd === 'turn_right' ? 'Right' : cmd === 'turn_left' ? 'Left' : cmd.charAt(0).toUpperCase() + cmd.slice(1)}</span>
                </div>
              ))
            )}
          </div>

          <hr style={{width: '100%', margin: '20px 0', borderColor: '#e2e8f0'}}/>
          
          <div className={`feedback-panel panel state-${gameState.status}`} style={{padding: '20px'}}>
            <h2>
              {gameState.status === 'error' || gameState.status === 'fail' ? <AlertTriangle size={24} color="#dc2626" /> : <CheckCircle size={24} color="#16a34a" />} 
              Let's Go!
            </h2>
            <div className="feedback-content" key={gameState.feedback}>
              {gameState.feedback}
            </div>
          </div>

          <button 
            className={`run-button ${isLoading ? 'loading' : ''}`}
            disabled={gameState.commands.length === 0 || gameState.status === 'executing'}
            onClick={handleRun}
          >
            {isLoading ? <div className="spinner"></div> : <Zap size={24} fill="currentColor" />}
            <span>{isLoading ? 'Starting...' : 'Run Program'}</span>
          </button>
        </div>

        <div className="panel">
          <h2><Map size={24} color="#6366f1" /> Live Mission Map</h2>
          <GridBoard {...gameState} />
        </div>
      </div>
    </div>
  );
}

export default App;
