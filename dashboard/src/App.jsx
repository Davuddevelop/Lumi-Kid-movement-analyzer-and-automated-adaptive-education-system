import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, Mic, MicOff, RefreshCw } from 'lucide-react';
import GridBoard from './components/GridBoard';
import LevelSelect from './components/LevelSelect';
import LumiAvatar from './components/LumiAvatar';
import AchievementBlast from './components/AchievementBlast';
import QuestionPanel from './components/QuestionPanel';

// ─── API config ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE  = API_BASE.replace(/^http/, 'ws');

// ─── Command display map ───────────────────────────────────────────────────────
const CMD_CONFIG = {
  forward:    { emoji: '🟢', label: '▲' },
  turn_right: { emoji: '🔵', label: '↻' },
  turn_left:  { emoji: '🟡', label: '↺' },
  loop:       { emoji: '🔴', label: '↩' },
};

// ─── Emotion map ───────────────────────────────────────────────────────────────
function getLumiEmotion(status, sentiment, hasQuestion) {
  if (hasQuestion)            return 'surprised';
  if (status === 'success')   return 'excited';
  if (status === 'error' || status === 'fail') return 'sad';
  if (status === 'executing') return 'thinking';
  if (sentiment === 'joy')    return 'happy';
  return 'happy';
}

// ─── Initial game state ────────────────────────────────────────────────────────
const INITIAL_STATE = {
  commands: [],
  status: 'idle',
  feedback: 'Hi! Let\'s play! 🚀',
  suggestion: null,
  grid_size: { width: 8, height: 8 },
  start_pos: { x: 1, y: 4 },
  robot_pos: { x: 1, y: 4 },
  robot_direction: 1,
  goal: { x: 6, y: 4 },
  obstacles: [],
  path: [],
  vitals: { joy: 85, focus: 70 },
  sentiment: 'joy',
  current_level_id: 1,
  level_name: 'First Steps',
  xp: 0,
  stars_total: 0,
  question: null,
  achievement: null,
};

// ─── Exponential backoff WebSocket ────────────────────────────────────────────
function useWebSocket(url, onMessage) {
  const wsRef    = useRef(null);
  const retryRef = useRef(0);
  const timerRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onMessage(data);
      } catch (e) {
        console.warn('[WS] parse error', e);
      }
    };

    ws.onclose = () => {
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
      retryRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [view, setView]           = useState('game');
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [isListening, setIsListening] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showBubble, setShowBubble]   = useState(false);
  const bubbleTimerRef  = useRef(null);
  const prevFeedbackRef = useRef('');

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 1.4;
    u.rate  = 1.0;
    window.speechSynthesis.speak(u);
  }, []);

  // ── WebSocket message handler ──────────────────────────────────────────────
  const handleWsMessage = useCallback((newState) => {
    setGameState(prev => ({ ...prev, ...newState }));

    // Speak feedback when it changes and not mid-execution
    if (
      newState.feedback &&
      newState.feedback !== prevFeedbackRef.current &&
      newState.status !== 'executing'
    ) {
      prevFeedbackRef.current = newState.feedback;
      speak(newState.feedback);

      // Show speech bubble
      setShowBubble(true);
      clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => setShowBubble(false), 5000);
    }
  }, [speak]);

  useWebSocket(`${WS_BASE}/ws`, handleWsMessage);

  // ── API helpers ────────────────────────────────────────────────────────────
  const apiPost = useCallback(async (path, body) => {
    try {
      const opts = { method: 'POST' };
      if (body) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(body);
      }
      await fetch(`${API_BASE}${path}`, opts);
    } catch (e) {
      console.error(`[API] ${path}`, e);
    }
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (gameState.commands.length === 0 || gameState.status === 'executing' || isRunning) return;
    setIsRunning(true);
    await apiPost('/api/execute');
    setTimeout(() => setIsRunning(false), 800);
  };

  const handleReset = () => apiPost('/api/reset');

  const handleHint = () => apiPost('/api/hint');

  const handleSelectLevel = async (level) => {
    await apiPost('/api/levels/load', { level_id: level.level_id });
    setView('game');
  };

  const handleAnswer = (answerId) => {
    apiPost('/api/question/answer', { answer_id: answerId });
    setGameState(prev => ({ ...prev, question: null }));
  };

  const handleAchievementDone = () => {
    setGameState(prev => ({ ...prev, achievement: null }));
  };

  // ── Voice input ────────────────────────────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      speak('Sorry, voice is not available on this device.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = () => setIsListening(false);
    rec.onresult = async (evt) => {
      const text = evt.results[0][0].transcript;
      try {
        const res  = await fetch(`${API_BASE}/api/voice/interact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data.speech) speak(data.speech);
      } catch (e) {
        console.error('[Voice]', e);
      }
    };
    rec.start();
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const lumiEmotion = getLumiEmotion(
    gameState.status,
    gameState.sentiment,
    !!gameState.question,
  );

  const xpPercent = Math.min(100, ((gameState.xp || 0) % 1000) / 10);

  const isExecutingOrRunning = isRunning || gameState.status === 'executing';

  // ── Level Select view ──────────────────────────────────────────────────────
  if (view === 'levels') {
    return (
      <LevelSelect
        onSelectLevel={handleSelectLevel}
        onBack={() => setView('game')}
      />
    );
  }

  // ── Game view ──────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ── TOP STRIP ──────────────────────────────────────────────────── */}
      <div className="top-strip">
        {/* Stars */}
        <div className="top-strip-stars" aria-label={`${gameState.stars_total} stars`}>
          ⭐ {gameState.stars_total ?? 0}
        </div>

        {/* Level info */}
        <div className="top-strip-level">
          <span>Lv.{gameState.current_level_id ?? 1}</span>
          <span className="level-name-badge">{gameState.level_name || 'First Steps'}</span>
        </div>

        {/* XP bar */}
        <div className="xp-bar-wrapper" aria-label={`XP: ${gameState.xp ?? 0}`}>
          <span className="xp-bar-label">XP</span>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        {/* Map nav */}
        <button
          className="map-btn"
          onClick={() => setView('levels')}
          aria-label="Open adventure map"
        >
          <Map size={22} />
          <span>MAP</span>
        </button>

        {/* Lumi avatar corner */}
        <div className="lumi-corner">
          <LumiAvatar
            emotion={lumiEmotion}
            size={52}
            speaking={showBubble}
          />
        </div>
      </div>

      {/* ── GAME AREA ──────────────────────────────────────────────────── */}
      <div className="game-area">
        {/* Speech bubble */}
        {showBubble && gameState.feedback && (
          <div
            className="lumi-speech-bubble"
            aria-live="polite"
            aria-label={gameState.feedback}
          >
            {gameState.feedback.length > 60
              ? gameState.feedback.slice(0, 58) + '…'
              : gameState.feedback}
          </div>
        )}

        <div className="grid-wrapper">
          <GridBoard
            grid_size={gameState.grid_size}
            robot_pos={gameState.robot_pos}
            robot_direction={gameState.robot_direction}
            start_pos={gameState.start_pos}
            goal={gameState.goal}
            obstacles={gameState.obstacles}
            path={gameState.path}
            status={gameState.status}
          />
        </div>
      </div>

      {/* ── BLOCK STRIP ────────────────────────────────────────────────── */}
      <div className="block-strip-wrapper">
        <div className="block-strip-label">MOVES</div>
        <div className="block-strip" role="list" aria-label="Detected commands">
          {gameState.commands.length === 0 ? (
            <div className="block-strip-empty">
              <span>🔍</span>
              <span>Show your LEGO blocks!</span>
            </div>
          ) : (
            gameState.commands.map((cmd, idx) => {
              const cfg = CMD_CONFIG[cmd] ?? { emoji: '❓', label: '?' };
              const isExec = isExecutingOrRunning && idx === 0;
              return (
                <div
                  key={idx}
                  className={`block-tile block-tile-${cmd}${isExec ? ' executing-tile' : ''}`}
                  role="listitem"
                  aria-label={cmd.replace('_', ' ')}
                >
                  <span aria-hidden="true">{cfg.emoji}</span>
                  <span className="block-tile-idx">{idx + 1}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── ACTION BAR ─────────────────────────────────────────────────── */}
      <div className="action-bar">
        {/* Hint */}
        <button
          className="hint-btn"
          onClick={handleHint}
          aria-label="Get a hint"
          title="Hint"
        >
          💡
        </button>

        {/* Run */}
        <button
          className="run-button"
          onClick={handleRun}
          disabled={
            gameState.commands.length === 0 ||
            isExecutingOrRunning
          }
          aria-label="Run the program"
        >
          {isExecutingOrRunning ? (
            <>
              <RefreshCw className="animate-spin" size={28} />
              Running…
            </>
          ) : (
            <>▶ LET'S GO!</>
          )}
        </button>

        {/* Mic */}
        <button
          className={`mic-btn${isListening ? ' listening' : ''}`}
          onClick={startListening}
          aria-label={isListening ? 'Listening…' : 'Talk to Lumi'}
          title="Voice"
        >
          {isListening ? <MicOff size={26} /> : <Mic size={26} />}
        </button>

        {/* Reset */}
        <button
          className="reset-btn"
          onClick={handleReset}
          aria-label="Reset level"
          title="Reset"
        >
          🔄
        </button>
      </div>

      {/* ── OVERLAYS ───────────────────────────────────────────────────── */}
      {gameState.achievement && (
        <AchievementBlast
          achievement={gameState.achievement}
          onDone={handleAchievementDone}
        />
      )}

      {gameState.question && (
        <QuestionPanel
          question={gameState.question}
          onAnswer={handleAnswer}
          lumiEmotion={lumiEmotion}
        />
      )}
    </div>
  );
}

export default App;
