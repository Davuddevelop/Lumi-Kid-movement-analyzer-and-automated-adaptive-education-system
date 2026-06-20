import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, Mic, MicOff, RefreshCw, Camera, Wifi } from 'lucide-react';
import GridBoard        from './components/GridBoard';
import LevelSelect      from './components/LevelSelect';
import LumiAvatar       from './components/LumiAvatar';
import AchievementBlast from './components/AchievementBlast';
import QuestionPanel    from './components/QuestionPanel';
import WorldMap         from './components/WorldMap';
import ParentDashboard  from './components/ParentDashboard';
import StoryMode        from './components/StoryMode';
import FocusMode        from './components/FocusMode';
import DailyChallenge   from './components/DailyChallenge';
import Onboarding       from './components/Onboarding';
import ThemeSelector    from './components/ThemeSelector';
import HomeScreen       from './components/HomeScreen';
import CameraView       from './components/CameraView';
import RobotSetup       from './components/RobotSetup';
import AIRobotPanel     from './components/AIRobotPanel';
import LumiChat         from './components/LumiChat';

// ─── API config ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE  = API_BASE.replace(/^http/, 'ws');
// Seed localStorage so child components (LumiChat, AIRobotPanel, RobotSetup)
// all pick up the same server URL without the user having to open RobotSetup first.
if (API_BASE !== 'http://localhost:8000' || !localStorage.getItem('lumi_api_url')) {
  localStorage.setItem('lumi_api_url', API_BASE);
}

// ─── Command display map ───────────────────────────────────────────────────────
const CMD_CONFIG = {
  forward:    { emoji: '⬆️', label: 'GO' },
  turn_right: { emoji: '↩️', label: 'RIGHT' },
  turn_left:  { emoji: '↪️', label: 'LEFT' },
  loop:       { emoji: '🔁', label: 'LOOP' },
};

// ─── Client-side BFS (mirrors server lumi_ai.py) ─────────────────────────────
const _DX = [0, 1, 0, -1];
const _DY = [-1, 0, 1, 0];

function clientBfsPlan(gs) {
  const W = gs.grid_size.width, H = gs.grid_size.height;
  const obs = new Set((gs.obstacles || []).map(o => `${o.x},${o.y}`));
  const [gx, gy] = [gs.goal.x, gs.goal.y];
  let x = gs.robot_pos.x, y = gs.robot_pos.y, d = gs.robot_direction ?? 1;
  const queue = [[[x, y, d], []]];
  const seen = new Set([`${x},${y},${d}`]);
  while (queue.length) {
    const [[cx, cy, cd], path] = queue.shift();
    if (cx === gx && cy === gy) return path;
    const moves = [
      [cx, cy, ((cd - 1) + 4) % 4, 'turn_left'],
      [cx, cy, (cd + 1) % 4,       'turn_right'],
      [cx + _DX[cd], cy + _DY[cd], cd, 'forward'],
    ];
    for (const [nx, ny, nd, cmd] of moves) {
      if (cmd === 'forward' && (nx < 0 || nx >= W || ny < 0 || ny >= H || obs.has(`${nx},${ny}`))) continue;
      const k = `${nx},${ny},${nd}`;
      if (!seen.has(k)) { seen.add(k); queue.push([[nx, ny, nd], [...path, cmd]]); }
    }
  }
  return null;
}

// ─── Emotion map ───────────────────────────────────────────────────────────────
function getLumiEmotion(status, sentiment, hasQuestion) {
  if (hasQuestion)                              return 'surprised';
  if (status === 'success')                     return 'excited';
  if (status === 'error' || status === 'fail')  return 'sad';
  if (status === 'executing')                   return 'thinking';
  if (sentiment === 'joy')                      return 'happy';
  return 'happy';
}

// ─── Initial game state ────────────────────────────────────────────────────────
// ─── Presentation demo — fixed state shown every time ─────────────────────────
const DEMO_COMMANDS = ['forward', 'forward', 'turn_right', 'forward', 'turn_left', 'forward', 'forward'];
const DEMO_STATE = {
  commands: DEMO_COMMANDS,
  status: 'idle',
  feedback: 'Watch Lumi go! 🚀',
  suggestion: null,
  grid_size: { width: 6, height: 5 },
  start_pos: { x: 0, y: 2 },
  robot_pos: { x: 0, y: 2 },
  robot_direction: 1,
  goal: { x: 5, y: 2 },
  obstacles: [{ x: 2, y: 1 }, { x: 2, y: 3 }],
  path: [],
  vitals: { joy: 95, focus: 90 },
  sentiment: 'joy',
  current_level_id: 1,
  level_name: 'Demo Run',
  xp: 120,
  stars_total: 3,
  question: null,
  achievement: null,
};

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
  // ── Core view & game state ─────────────────────────────────────────────────
  const [view, setView]           = useState('home');
  // ── Camera ─────────────────────────────────────────────────────────────────
  const [showCamera, setShowCamera]     = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  // ── Robot / ESP32 setup ───────────────────────────────────────────────────
  const [showRobotSetup, setShowRobotSetup] = useState(false);
  const [showAIPanel, setShowAIPanel]       = useState(false);
  const [robotIP, setRobotIP] = useState(localStorage.getItem('lumi_robot_ip') || '');
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [isListening, setIsListening]   = useState(false);
  const [isRunning, setIsRunning]       = useState(false);
  const [isAutoSolving, setIsAutoSolving] = useState(false);
  const [showBubble, setShowBubble]   = useState(false);
  const bubbleTimerRef  = useRef(null);
  const prevFeedbackRef = useRef('');

  // ── Onboarding ─────────────────────────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem('lumi_onboarded')
  );

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme]           = useState(localStorage.getItem('lumi_theme') || 'kids');
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lumi_theme', theme);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
    setShowThemes(false);
  }, []);

  // ── Story / level staging ──────────────────────────────────────────────────
  const [pendingLevel, setPendingLevel] = useState(null);

  // ── Levels list ────────────────────────────────────────────────────────────
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/levels`)
      .then(r => r.json())
      .then(data => setLevels(Array.isArray(data) ? data : data.levels ?? []))
      .catch(e => console.warn('[Levels] fetch failed', e));
  }, []);

  // ── Daily challenge ────────────────────────────────────────────────────────
  const [dailyChallenge, setDailyChallenge] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/daily-challenge`)
      .then(r => r.json())
      .then(data => setDailyChallenge(data))
      .catch(e => console.warn('[DailyChallenge] fetch failed', e));
  }, []);

  // ── Focus mode ─────────────────────────────────────────────────────────────
  const [showFocus, setShowFocus] = useState(false);
  const [showLumiChat, setShowLumiChat] = useState(false);
  const [showDailyChallenge, setShowDailyChallenge] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const activateDemo = useCallback(async () => {
    // Push fixed demo state to server so all clients + robot see same thing
    await apiPost('/api/update', { commands: DEMO_COMMANDS });
    setGameState(prev => ({ ...prev, ...DEMO_STATE }));
    setDemoMode(true);
  }, [apiPost]);

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
  // ── Robot WebSocket status (live from server) ─────────────────────────────
  const [liveRobotStatus, setLiveRobotStatus] = useState({ connected: false, robots: [], telemetry: {} });

  const handleWsMessage = useCallback((newState) => {
    if (newState.robot_status) setLiveRobotStatus(newState.robot_status);
    setGameState(prev => ({
      ...prev,
      ...newState,
      // If server omits the question key (old server / partial broadcast),
      // treat it as null so the overlay never gets stuck on screen.
      question: Object.prototype.hasOwnProperty.call(newState, 'question')
        ? newState.question
        : null,
    }));

    if (
      newState.feedback &&
      newState.feedback !== prevFeedbackRef.current &&
      newState.status !== 'executing'
    ) {
      prevFeedbackRef.current = newState.feedback;
      speak(newState.feedback);
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

  // ── Client-side execution fallback (works without a server) ──────────────
  const runClientExecution = useCallback(async (commands, snap) => {
    let x = snap.start_pos.x, y = snap.start_pos.y, d = snap.robot_direction ?? 1;
    const unrolled = [];
    for (const cmd of commands) {
      if (cmd === 'loop' && unrolled.length > 0) {
        unrolled.push(unrolled[unrolled.length - 1], unrolled[unrolled.length - 1]);
      } else {
        unrolled.push(cmd);
      }
    }
    setGameState(prev => ({
      ...prev, status: 'executing', commands,
      robot_pos: snap.start_pos, robot_direction: d,
      path: [snap.start_pos], feedback: 'Robot starting…',
    }));
    for (const cmd of unrolled) {
      await new Promise(r => setTimeout(r, 520));
      if (cmd === 'turn_right') d = (d + 1) % 4;
      else if (cmd === 'turn_left') d = ((d - 1) + 4) % 4;
      else if (cmd === 'forward') { x += _DX[d]; y += _DY[d]; }
      const pos = { x, y };
      setGameState(prev => ({
        ...prev, robot_pos: pos, robot_direction: d,
        path: [...prev.path, pos], feedback: `Executing: ${cmd}`,
      }));
    }
    const won = x === snap.goal.x && y === snap.goal.y;
    setGameState(prev => ({
      ...prev,
      status: won ? 'success' : 'error',
      feedback: won ? '🎉 Goal reached! Amazing!' : 'Not quite — try again!',
    }));
    setIsRunning(false);
    setIsAutoSolving(false);
  }, []);

  // ── Game actions ───────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (gameState.status === 'executing' || isRunning) return;

    // In demo mode: always reset to the exact same state before running
    if (demoMode) {
      setGameState(prev => ({ ...prev, ...DEMO_STATE }));
      await apiPost('/api/update', { commands: DEMO_COMMANDS });
      // Small delay so the grid resets visually before executing
      await new Promise(r => setTimeout(r, 300));
    }

    setIsRunning(true);
    const snap = demoMode ? { ...DEMO_STATE } : gameState;

    // Try server first (1.5 s timeout); fall back to client-side BFS + animation.
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1500);
      const endpoint = snap.commands.length === 0
        ? ['/api/ai/auto-solve', { robot_id: 'lumi-bot-1' }]
        : ['/api/execute', null];
      const [path, body] = endpoint;
      const opts = { method: 'POST', signal: ctrl.signal };
      if (body) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
      await fetch(`${API_BASE}${path}`, opts);
      clearTimeout(tid);
      setTimeout(() => setIsRunning(false), 800);
    } catch {
      // Server unreachable — solve and animate purely on the client
      const cmds = snap.commands.length > 0 ? snap.commands : clientBfsPlan(snap);
      if (cmds && cmds.length > 0) {
        await runClientExecution(cmds, snap);
      } else {
        setIsRunning(false);
      }
    }
  };

  const handleAutoSolve = async () => {
    if (isAutoSolving || gameState.status === 'executing') return;
    setIsAutoSolving(true);
    const snap = gameState;
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1500);
      await fetch(`${API_BASE}/api/levels/load`, { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level_id: 1 }) });
      clearTimeout(tid);
      const ctrl2 = new AbortController();
      const tid2 = setTimeout(() => ctrl2.abort(), 1500);
      await fetch(`${API_BASE}/api/ai/auto-solve`, { method: 'POST', signal: ctrl2.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ robot_id: 'lumi-bot-1' }) });
      clearTimeout(tid2);
      setTimeout(() => setIsAutoSolving(false), 1200);
    } catch {
      // Server offline — solve client-side with BFS
      const cmds = clientBfsPlan(snap);
      if (cmds && cmds.length > 0) {
        await runClientExecution(cmds, snap);
      } else {
        setIsAutoSolving(false);
      }
    }
  };

  const handleReset = () => apiPost('/api/reset');

  const handleHint = () => apiPost('/api/hint');

  const handleAnswer = (answerId) => {
    apiPost('/api/question/answer', { answer_id: answerId });
    setGameState(prev => ({ ...prev, question: null }));
  };

  const handleAchievementDone = () => {
    setGameState(prev => ({ ...prev, achievement: null }));
  };

  // ── Level loading ──────────────────────────────────────────────────────────
  const loadLevel = useCallback(async (level) => {
    await apiPost('/api/levels/load', { level_id: level.level_id });
    setView('game');
  }, [apiPost]);

  // handleSelectLevel — used by LevelSelect (legacy fallback)
  const handleSelectLevel = useCallback(async (level) => {
    await loadLevel(level);
  }, [loadLevel]);

  // WorldMap → Story → Game flow
  const handleWorldMapSelectLevel = useCallback((level) => {
    setPendingLevel(level);
    setView('story');
  }, []);

  const handleStoryStart = useCallback(async () => {
    if (pendingLevel) {
      await loadLevel(pendingLevel);
      setPendingLevel(null);
    }
  }, [pendingLevel, loadLevel]);

  // Daily challenge play
  const handleDailyPlay = useCallback(async () => {
    if (!dailyChallenge) return;
    const level = levels.find(l => l.level_id === dailyChallenge.level_id) ||
                  (levels.length > 0 ? levels[0] : null);
    if (level) {
      setPendingLevel(level);
      setView('story');
    }
  }, [dailyChallenge, levels]);

  // ── Parent access ──────────────────────────────────────────────────────────
  const handleParentAccess = useCallback(() => {
    const pin = window.prompt('Parent PIN (default: 1234)');
    if (pin === '1234') {
      setView('parent');
    }
  }, []);

  // ── Voice input ────────────────────────────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      speak('Sorry, voice is not available on this device.');
      return;
    }
    const rec = new SR();
    rec.lang     = 'en-US';
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

  // ── Home screen ───────────────────────────────────────────────────────────
  if (view === 'home') {
    return <HomeScreen onStart={() => setView('game')} />;
  }

  // ── Full-screen view renders ───────────────────────────────────────────────
  if (view === 'world_map') {
    return (
      <>
        {showOnboarding && (
          <Onboarding
            onComplete={() => {
              localStorage.setItem('lumi_onboarded', '1');
              setShowOnboarding(false);
            }}
          />
        )}
        <WorldMap
          levels={levels}
          onSelectLevel={handleWorldMapSelectLevel}
          onBack={() => setView('game')}
          currentLevelId={gameState.current_level_id}
        />
      </>
    );
  }

  if (view === 'parent') {
    return <ParentDashboard onBack={() => setView('game')} />;
  }

  if (view === 'story') {
    return (
      <StoryMode
        level={pendingLevel}
        onStart={handleStoryStart}
        onBack={() => setView('world_map')}
      />
    );
  }

  if (view === 'levels') {
    return (
      <LevelSelect
        onSelectLevel={handleSelectLevel}
        onBack={() => setView('game')}
      />
    );
  }

  // ── Game view (default) ────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ── ONBOARDING OVERLAY ─────────────────────────────────────────── */}
      {showOnboarding && (
        <Onboarding
          onComplete={() => {
            localStorage.setItem('lumi_onboarded', '1');
            setShowOnboarding(false);
          }}
        />
      )}

      {/* ── THEME SELECTOR OVERLAY ─────────────────────────────────────── */}
      {showThemes && (
        <ThemeSelector
          currentTheme={theme}
          onSelect={handleThemeChange}
          onClose={() => setShowThemes(false)}
        />
      )}

      {/* ── FOCUS MODE OVERLAY ─────────────────────────────────────────── */}
      {showFocus && (
        <FocusMode onClose={() => setShowFocus(false)} />
      )}

      {/* ── CAMERA OVERLAY ─────────────────────────────────────────────── */}
      {showCamera && (
        <CameraView
          onClose={() => setShowCamera(false)}
          apiBase={API_BASE}
        />
      )}

      {/* ── ROBOT SETUP OVERLAY ────────────────────────────────────────── */}
      {showRobotSetup && (
        <RobotSetup
          currentIP={robotIP}
          robotStatus={liveRobotStatus}
          onSave={(url) => { setRobotIP(url); setShowRobotSetup(false); }}
          onSkip={() => setShowRobotSetup(false)}
        />
      )}

      {/* ── AI ROBOT PANEL OVERLAY ─────────────────────────────────────── */}
      {showAIPanel && (
        <AIRobotPanel
          onClose={() => setShowAIPanel(false)}
          robotStatus={liveRobotStatus}
          gameState={gameState}
        />
      )}

      {/* ── TOP STRIP ──────────────────────────────────────────────────── */}
      <div className="top-strip">
        {/* Rainbow LUMI logo — click to go home */}
        <div className="lumi-logo" aria-label="Lumi AI" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
          <span className="l1">L</span>
          <span className="l2">U</span>
          <span className="l3">M</span>
          <span className="l4">I</span>
          <span className="logo-ai">AI</span>
        </div>

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

        {/* Camera button */}
        <button
          className={`cam-top-btn${cameraGranted ? ' cam-active' : ''}`}
          onClick={() => setShowCamera(true)}
          aria-label="Open camera scanner"
          title="Camera Scanner"
        >
          <Camera size={18} />
        </button>

        {/* Robot / ESP32 button */}
        <button
          className={`robot-top-btn${liveRobotStatus.connected ? ' robot-connected' : ''}`}
          onClick={() => setShowRobotSetup(true)}
          aria-label="Robot setup"
          title={liveRobotStatus.connected ? `${liveRobotStatus.robots.length} robot(s) connected` : 'Connect Robot'}
        >
          <Wifi size={18} />
          {liveRobotStatus.connected
            ? <span className="robot-dot" style={{ background: '#4caf82' }} />
            : robotIP && <span className="robot-dot" style={{ background: '#ffd166' }} />
          }
        </button>

        {/* AI Robot Control button */}
        <button
          className={`ai-panel-btn${liveRobotStatus.connected ? ' ai-panel-btn--active' : ''}`}
          onClick={() => setShowAIPanel(true)}
          aria-label="AI Robot Control"
          title="AI Robot Control"
        >
          🧠
        </button>

        {/* Lumi Chat button */}
        <button
          className={`cam-top-btn chat-top-btn${showLumiChat ? ' chat-top-btn--active' : ''}`}
          onClick={() => setShowLumiChat(o => !o)}
          aria-label={showLumiChat ? 'Close Lumi chat' : 'Chat with Lumi'}
          title="Chat with Lumi"
        >
          💬
        </button>

        {/* Focus button */}
        <button
          className="focus-btn"
          onClick={() => setShowFocus(true)}
          aria-label="Open focus mode"
          title="Focus Mode"
        >
          🎯
        </button>

        {/* Presentation demo mode */}
        <button
          className={`map-btn demo-btn${demoMode ? ' demo-btn--active' : ''}`}
          onClick={activateDemo}
          aria-label="Presentation demo mode"
          title="Presentation Mode — same every time"
        >
          🎬
          <span>{demoMode ? 'DEMO ON' : 'DEMO'}</span>
        </button>

        {/* Map nav — opens WorldMap */}
        <button
          className="map-btn"
          onClick={() => setView('world_map')}
          aria-label="Open adventure map"
        >
          <Map size={22} />
          <span>MAP</span>
        </button>

        {/* Parent access */}
        <button
          className="parent-btn"
          onClick={handleParentAccess}
          aria-label="Parent dashboard"
          title="Parent Dashboard"
        >
          👨‍👩‍👧
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

      {/* ── CONTENT AREA (2-col on desktop) ───────────────────────────── */}
      <div className="content-area">

        {/* ── GAME AREA ──────────────────────────────────────────────────── */}
        <div className="game-area">
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

        {/* ── SIDEBAR (blocks + actions) ─────────────────────────────────── */}
        <div className="sidebar">

          {/* Daily challenge banner — dismissible */}
          {dailyChallenge && showDailyChallenge && (
            <div className="dc-wrapper">
              <button className="dc-dismiss" onClick={() => setShowDailyChallenge(false)} aria-label="Dismiss">✕</button>
              <DailyChallenge onPlay={handleDailyPlay} />
            </div>
          )}

          {/* ── BLOCK STRIP ──────────────────────────────────────────────── */}
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
                  const cfg    = CMD_CONFIG[cmd] ?? { emoji: '❓', label: '?' };
                  const isExec = isExecutingOrRunning && idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`block-tile block-tile-${cmd}${isExec ? ' executing-tile' : ''}`}
                      role="listitem"
                      aria-label={cmd.replace('_', ' ')}
                    >
                      <span className="block-tile-emoji" aria-hidden="true">{cfg.emoji}</span>
                      <span className="block-tile-label">{cfg.label}</span>
                      <span className="block-tile-idx">{idx + 1}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── ACTION BAR ───────────────────────────────────────────────── */}
          <div className="action-bar">
            {/* Top row: secondary controls */}
            <div className="action-secondary-row">
              <button className="hint-btn" onClick={handleHint} aria-label="Hint" title="Hint">💡</button>
              {gameState.current_level_id === 1 && (
                <button
                  className={`auto-solve-btn${isAutoSolving ? ' auto-solve-btn--solving' : ''}`}
                  onClick={handleAutoSolve}
                  disabled={isAutoSolving || gameState.status === 'executing'}
                >
                  {isAutoSolving ? <><RefreshCw className="animate-spin" size={16} /> Solving…</> : <>⚡ SOLVE IT!</>}
                </button>
              )}
              <button className={`mic-btn${isListening ? ' listening' : ''}`} onClick={startListening} aria-label="Voice">
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button className="reset-btn" onClick={handleReset} aria-label="Reset">🔄</button>
            </div>
            {/* Bottom row: main run button — always full width */}
            <button
              className="run-button"
              onClick={handleRun}
              disabled={isExecutingOrRunning}
              aria-label="Run the program"
            >
              {isExecutingOrRunning
                ? <><RefreshCw className="animate-spin" size={24} /> Running…</>
                : <>▶ LET'S GO!</>}
            </button>
          </div>

        </div>{/* /sidebar */}
      </div>{/* /content-area */}

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

      {/* ── LUMI CHATBOT ───────────────────────────────────────────── */}
      <LumiChat
        open={showLumiChat}
        onClose={() => setShowLumiChat(false)}
        gameState={gameState}
      />
    </div>
  );
}

export default App;
