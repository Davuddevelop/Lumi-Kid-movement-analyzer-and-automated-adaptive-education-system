import { useState, useEffect, useCallback } from 'react';
import {
  ArrowUp, RotateCw, RotateCcw, Repeat,
  Zap, Map, PlayCircle, Mic, MicOff,
  Star, Settings, RefreshCw, Lightbulb, SkipForward
} from 'lucide-react';
import GridBoard from './components/GridBoard';
import LevelSelect from './components/LevelSelect';

function App() {
  const [view, setView] = useState('game');
  const [currentLevel, setCurrentLevel] = useState(null);
  const [personality, setPersonality] = useState('coach');
  const [isListening, setIsListening] = useState(false);
  const [gameState, setGameState] = useState({
    commands: [],
    status: 'idle',
    feedback: 'Hi! Let\'s play! 🚀',
    grid_size: { width: 8, height: 8 },
    robot_pos: { x: 1, y: 4 },
    start_pos: { x: 1, y: 4 },
    goal: { x: 6, y: 4 },
    obstacles: [],
    path: [],
    vitals: { joy: 85, focus: 40 }
  });
  const [isLoading, setIsLoading] = useState(false);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.4;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSelectLevel = async (level) => {
    setCurrentLevel(level);
    try {
      await fetch('http://127.0.0.1:8000/api/levels/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level_id: level.level_id })
      });
    } catch (e) { console.error(e); }
    setView('game');
  };

  const handleRun = async () => {
    if (gameState.commands.length === 0 || gameState.status === 'executing') return;
    setIsLoading(true);
    try {
      await fetch('http://127.0.0.1:8000/api/execute', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/reset', { method: 'POST' });
    } catch (e) { console.error(e); }
  };

  const handleLoadDemo = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/demo', { method: 'POST' });
    } catch (e) { console.error(e); }
  };

  const handleHint = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/hint', { method: 'POST' });
    } catch (e) { console.error(e); }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      try {
        const response = await fetch('http://127.0.0.1:8000/api/voice/interact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript })
        });
        const data = await response.json();
        if (data.speech) speak(data.speech);
      } catch (e) { console.error(e); }
    };
    recognition.start();
  };

  useEffect(() => {
    const connectWs = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws');
      ws.onmessage = (event) => {
        try {
          const newState = JSON.parse(event.data);
          setGameState(prev => ({...prev, ...newState}));
          if (newState.feedback && newState.status !== 'executing') {
            speak(newState.feedback);
          }
        } catch (e) { console.error(e); }
      };
      ws.onclose = () => setTimeout(connectWs, 2000);
    };
    connectWs();
  }, [speak]);

  const changePersonality = async (p) => {
    setPersonality(p);
    try {
      await fetch('http://127.0.0.1:8000/api/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: p })
      });
    } catch (e) { console.error(e); }
  };

  const getCommandIcon = (cmd) => {
    switch(cmd) {
      case 'forward': return <ArrowUp size={22} strokeWidth={3} />;
      case 'turn_right': return <RotateCw size={22} strokeWidth={3} />;
      case 'turn_left': return <RotateCcw size={22} strokeWidth={3} />;
      case 'loop': return <Repeat size={22} strokeWidth={3} />;
      default: return null;
    }
  };

  const getStatusBadge = () => {
    switch(gameState.status) {
      case 'success':
        return <span className="status-badge status-success">SUCCESS!</span>;
      case 'error':
      case 'fail':
        return <span className="status-badge status-error">TRY AGAIN</span>;
      case 'executing':
        return <span className="status-badge status-executing">RUNNING...</span>;
      default:
        return null;
    }
  };

  if (view === 'levels') {
    return <LevelSelect onSelectLevel={handleSelectLevel} onBack={() => setView('game')} />;
  }

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="dashboard-header">
        <div className="header-left">
          <div className="logo-icon"><Zap size={22} color="white" fill="white" /></div>
          <h1>Lumi <span>Junior</span> Command Center</h1>
        </div>

        <div className="personality-tabs">
          <button
            className={`personality-tab ${personality === 'coach' ? 'active' : ''}`}
            onClick={() => changePersonality('coach')}
          >
            🥇 COACH
          </button>
          <button
            className={`personality-tab ${personality === 'challenger' ? 'active' : ''}`}
            onClick={() => changePersonality('challenger')}
          >
            🔥 CHALLENGER
          </button>
          <button
            className={`personality-tab ${personality === 'friendly' ? 'active' : ''}`}
            onClick={() => changePersonality('friendly')}
          >
            😊 BUDDY
          </button>
        </div>

        <div className="user-profile">
          <div className="avatar-circle">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" />
          </div>
          <Settings size={20} color="var(--text-muted)" className="settings-icon" />
        </div>
      </nav>

      {/* Main 3-Column Layout */}
      <main className="main-layout">

        {/* Column 1: AI Hub & Status */}
        <div className="layout-col-1">
          <div className="glass-panel lumi-hub">
            <div className="hub-avatar-sphere">
              <img
                src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${gameState.sentiment || 'Lumi'}&backgroundColor=transparent`}
                alt="lumi"
              />
              {gameState.feedback && (
                <div className="speech-bubble">
                  {gameState.feedback.length > 40
                    ? gameState.feedback.substring(0, 40) + '...'
                    : gameState.feedback}
                </div>
              )}
            </div>
            <div className="hub-label">
              <h3>Lumi AI Hub</h3>
              <p className="emotion-label">
                {gameState.sentiment
                  ? gameState.sentiment.charAt(0).toUpperCase() + gameState.sentiment.slice(1)
                  : 'Curiosity'}
                {gameState.sentiment === 'joy' ? ' 😊' :
                 gameState.sentiment === 'frustration' ? ' 😟' :
                 gameState.sentiment === 'curiosity' ? ' 🤔' : ' 😶'}
              </p>
            </div>

            <div className="condensed-block-list">
              {['forward', 'turn_right', 'turn_left', 'loop'].map((cmd) => (
                <div key={cmd} className={`condensed-block ${gameState.commands.includes(cmd) ? 'active' : ''}`}>
                  {getCommandIcon(cmd)}
                  <span>{cmd.replace('_', ' ').charAt(0).toUpperCase() + cmd.replace('_', ' ').slice(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel magic-mic-panel" onClick={startListening}>
            <div className="mic-icon-wrapper">
              <div className="mic-wave-ring"></div>
              {isListening && <div className="mic-wave-ring" style={{animationDelay: '0.8s'}}></div>}
              <Mic size={48} color={isListening ? "var(--error)" : "var(--primary)"} strokeWidth={1.5} />
            </div>
            <h3>Magic Microphone</h3>
            <p className="mic-hint">Tap to speak commands</p>
          </div>
        </div>

        {/* Column 2: Mission Board */}
        <div className="layout-col-2 mission-hub">
          <div className="mission-header-info">
            <h2>Mission: {currentLevel?.name || 'Nebula Dash'}</h2>
            <p>Guide Lumi to the Golden Star while avoiding space rocks!</p>
            {getStatusBadge()}
          </div>

          <div className="mission-grid-viewport">
             <div className="stat-pills-container">
                <div className="stat-pill">
                  <Star size={16} fill="currentColor" />
                  Level {gameState.current_level_id || 1}
                </div>
                <button className="stat-pill" onClick={() => setView('levels')}>
                  <Map size={16} /> MAP
                </button>
             </div>

             <div className="grid-board-content">
                <GridBoard {...gameState} />
             </div>

             <button
              className={`floating-mic-btn ${isListening ? 'listening' : ''}`}
              onClick={startListening}
             >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
             </button>
          </div>
        </div>

        {/* Column 3: Feed & Vitals */}
        <div className="layout-col-3">
          <div className="glass-panel scanner-feed-panel">
            <div className="panel-header">
              <h4 className="panel-title">Scanner Feed</h4>
              <div className="panel-actions">
                <button className="action-btn" onClick={handleLoadDemo} title="Load Demo">
                  <SkipForward size={18} />
                </button>
                <button className="action-btn" onClick={handleHint} title="Get Hint">
                  <Lightbulb size={18} />
                </button>
                <button className="action-btn" onClick={handleReset} title="Reset">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            <div className="tactile-feed">
              {gameState.commands.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <span>Searching for LEGO blocks...</span>
                  <button className="demo-btn" onClick={handleLoadDemo}>
                    Load Demo Program
                  </button>
                </div>
              ) : (
                gameState.commands.map((cmd, idx) => (
                  <div
                    key={idx}
                    className={`tactile-block block-${cmd} ${gameState.status === 'executing' && idx === 0 ? 'executing' : ''}`}
                  >
                    {getCommandIcon(cmd)}
                    <span className="block-label">{cmd.replace('_', ' ').toUpperCase()}</span>
                    {idx === 0 && gameState.status === 'executing' && <span className="exec-sticker">EXEC</span>}
                  </div>
                ))
              )}
            </div>

            <div className="button-row">
              <button
                className="run-button run-button-full"
                onClick={handleRun}
                disabled={isLoading || gameState.commands.length === 0 || gameState.status === 'executing'}
              >
                {isLoading || gameState.status === 'executing'
                  ? <><RefreshCw className="animate-spin" size={22} /> EXECUTING...</>
                  : <><PlayCircle size={22} fill="currentColor" /> RUN PROGRAM</>
                }
              </button>
            </div>
          </div>

          <div className="glass-panel vitals-panel">
            <h4 className="panel-title">Learning Vitals</h4>
            <div className="vitals-stats">
              <div className="vital-row">
                <div className="vital-icon-box">❤️</div>
                <div className="vital-bar-container">
                  <span className="vital-label">JOY</span>
                  <div className="gauge-track">
                    <div className="gauge-fill gauge-joy" style={{width: `${gameState.vitals?.joy || 85}%`}}></div>
                  </div>
                </div>
                <span className="vital-value">{gameState.vitals?.joy || 85}%</span>
              </div>
              <div className="vital-row">
                <div className="vital-icon-box">🔥</div>
                <div className="vital-bar-container">
                  <span className="vital-label">FOCUS</span>
                  <div className="gauge-track">
                    <div className="gauge-fill gauge-focus" style={{width: `${gameState.vitals?.focus || 40}%`}}></div>
                  </div>
                </div>
                <span className="vital-value">{gameState.vitals?.focus || 40}%</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
