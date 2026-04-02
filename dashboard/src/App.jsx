import { useState, useEffect, useCallback } from 'react';
import { ArrowUp, CornerDownRight, CornerDownLeft, Repeat, Bot, CheckCircle, Zap, Map, AlertTriangle, RotateCcw, PlayCircle, StopCircle, Mic, MicOff } from 'lucide-react';
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
  const [isListening, setIsListening] = useState(false);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a "girl" / female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('samantha') || 
      v.name.toLowerCase().includes('zira') || 
      v.name.toLowerCase().includes('maria') ||
      v.name.toLowerCase().includes('google us english')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.pitch = 1.4; // Higher pitch for a "girl" robot feel
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleRun = async () => {
    if (gameState.commands.length === 0 || gameState.status === 'executing') return;
    setIsLoading(true);
    try {
      await fetch('http://127.0.0.1:8000/api/execute', { method: 'POST' });
    } catch (e) {
      console.error("Failed to trigger execution:", e);
    } finally {
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  const handleNextDemo = async () => {
    if (gameState.status === 'executing') return;
    try {
      await fetch('http://127.0.0.1:8000/api/demo', { method: 'POST' });
    } catch (e) {
      console.error("Failed to load demo:", e);
    }
  };

  const handleAnswerButton = async (buttonId) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ button_id: buttonId })
      });
      const data = await response.json();
      if (data.speech) {
        speak(data.speech);
      }
    } catch (e) {
      console.error("Answer failed:", e);
    }
  };

  const handleHintRequest = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/hint', { method: 'POST' });
      const data = await response.json();
      if (data.question) {
        speak(data.question.text);
      }
    } catch (e) {
      console.error("Hint request failed:", e);
    }
  };

  const handleHintResponse = async (wantsHint) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/hint/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wants_hint: wantsHint })
      });
      const data = await response.json();
      if (data.speech) {
        speak(data.speech);
      }
    } catch (e) {
      console.error("Hint response failed:", e);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcribed:", transcript);

      try {
        const response = await fetch('http://127.0.0.1:8000/api/voice/interact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript })
        });
        const data = await response.json();
        if (data.speech) {
          speak(data.speech);
        }
      } catch (e) {
        console.error("Voice interaction failed:", e);
      }
    };

    recognition.start();
  };

  useEffect(() => {
    const connectWs = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws');
      ws.onopen = () => setGameState(prev => ({...prev, feedback: 'Connected! Place some blocks.'}));
      ws.onmessage = (event) => {
        try { 
          const newState = JSON.parse(event.data);
          setGameState(newState);
          // If Lumi has new feedback, say it!
          if (newState.feedback && newState.status !== 'executing') {
            speak(newState.feedback);
          }
        } 
        catch (e) { console.error(e); }
      };
      ws.onclose = () => {
        setGameState(prev => ({...prev, feedback: 'Disconnected. Reconnecting...'}));
        setTimeout(connectWs, 2000);
      };
    };
    connectWs();
  }, [speak]);

  const getCommandIcon = (cmd) => {
    switch(cmd) {
      case 'forward': return <ArrowUp size={20} strokeWidth={3} />;
      case 'turn_right': return <CornerDownRight size={20} strokeWidth={3} />;
      case 'turn_left': return <CornerDownLeft size={20} strokeWidth={3} />;
      case 'loop': return <Repeat size={20} strokeWidth={3} />;
      case 'loop_start': return <PlayCircle size={20} strokeWidth={3} />;
      case 'loop_end': return <StopCircle size={20} strokeWidth={3} />;
      default: return null;
    }
  };


  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className={`robot-avatar state-${gameState.status}`}>
          {gameState.status === 'success' ? <Zap size={54} fill="currentColor" /> : 
           gameState.status === 'executing' ? <Bot size={54} className="animate-spin" /> :
           (gameState.status === 'error' || gameState.status === 'fail') ? <AlertTriangle size={54} /> :
           <Bot size={54} className="animate-idle" />}
        </div>
        <h1>Lumi</h1>
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

      <div className={`assistant-bubble state-${gameState.status}`} key={gameState.suggestion || gameState.feedback}>
        <div className="assistant-avatar">
          {gameState.status === 'success' ? <CheckCircle size={28} strokeWidth={3} /> : 
           (gameState.status === 'error' || gameState.status === 'fail') ? <AlertTriangle size={28} strokeWidth={3} /> :
           <Bot size={28} strokeWidth={2.5} />}
        </div>
        <div className="speech-bubble">
          {gameState.suggestion ? (
            <div className="suggestion-text animate-pop">
              <span className="suggestion-bulb">💡</span> {gameState.suggestion}
            </div>
          ) : (
            <div className="feedback-text">{gameState.feedback}</div>
          )}

          {gameState.question && gameState.question.id === 'offer_hint' ? (
            <div className="answer-buttons hint-buttons">
              <button
                className="answer-btn hint-yes"
                onClick={() => handleHintResponse(true)}
              >
                Yes, help me!
              </button>
              <button
                className="answer-btn hint-no"
                onClick={() => handleHintResponse(false)}
              >
                No, I'll try again!
              </button>
            </div>
          ) : gameState.question ? (
            <div className="answer-buttons">
              {gameState.question.answers.map((ans) => (
                <button
                  key={ans.id}
                  className="answer-btn"
                  onClick={() => handleAnswerButton(ans.id)}
                >
                  {ans.label}
                </button>
              ))}
            </div>
          ) : (gameState.status === 'error' || gameState.status === 'fail') && (
            <div className="hint-offer">
              <button className="hint-btn" onClick={handleHintRequest}>
                Need a hint?
              </button>
            </div>
          )}

          <button
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onClick={startListening}
            title="Talk to Lumi"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>
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

          <div className="block-library">
            <h3><Bot size={20} /> Block Library</h3>
            <p className="library-hint">These are the physical blocks you can use!</p>
            <div className="library-grid">
              {gameState.available_blocks && Object.entries(gameState.available_blocks).map(([cmd, info]) => (
                <div key={cmd} className="library-item" title={info.description}>
                  <div className={`library-icon cmd-${cmd}`}>
                    {getCommandIcon(cmd)}
                  </div>
                  <div className="library-info">
                    <span className="library-name">{cmd === 'turn_right' ? 'Right' : cmd === 'turn_left' ? 'Left' : cmd.charAt(0).toUpperCase() + cmd.slice(1)}</span>
                    <span className="library-desc">{info.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr style={{width: '100%', margin: '20px 0', borderColor: '#e2e8f0'}}/>
          
          <div className="button-row">
            <button
              className={`run-button ${isLoading ? 'loading' : ''}`}
              disabled={gameState.commands.length === 0 || gameState.status === 'executing'}
              onClick={handleRun}
            >
              {isLoading ? <div className="spinner"></div> : <Zap size={24} fill="currentColor" />}
              <span>{isLoading ? 'Starting...' : 'Run Program'}</span>
            </button>
            <button
              className="demo-button"
              disabled={gameState.status === 'executing'}
              onClick={handleNextDemo}
            >
              <RotateCcw size={20} />
              <span>Next Demo</span>
            </button>
          </div>
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
