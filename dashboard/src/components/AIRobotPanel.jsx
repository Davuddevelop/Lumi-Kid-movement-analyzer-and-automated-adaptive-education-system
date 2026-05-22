import React, { useState, useEffect, useRef, useCallback } from 'react';
import LumiAvatar from './LumiAvatar';

/* ─── palette ──────────────────────────────────────────── */
const C = {
  cream: '#faf6ef', white: '#fff', dark: '#1a1a2e',
  gray: '#6b7280',  muted: '#9ca3af', border: '#e8e4de',
  blue: '#1a6cf0',  green: '#4caf82', red: '#ff4757',
  orange: '#ff8c42', yellow: '#ffd166', purple: '#7c5cfc',
};

/* ─── helpers ──────────────────────────────────────────── */
const API = () => localStorage.getItem('lumi_api_url') || 'http://localhost:8000';

const StatusDot = ({ ok }) => (
  <span style={{
    width: 8, height: 8, borderRadius: '50%',
    background: ok ? C.green : C.red,
    display: 'inline-block', flexShrink: 0,
  }} />
);

function TelemetryBadge({ icon, value, color = C.blue }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 52 }}>
      <div style={{ fontSize: '0.75rem', color: C.muted }}>{icon}</div>
      <div style={{ fontFamily: 'Fredoka One', fontSize: '0.88rem', color }}>{value}</div>
    </div>
  );
}

/* ─── D-pad ────────────────────────────────────────────── */
function DPad({ robotId, apiBase, disabled }) {
  const [busy, setBusy] = useState(null);

  const send = async (cmd) => {
    if (busy || disabled) return;
    setBusy(cmd);
    try {
      await fetch(`${apiBase}/api/robots/${encodeURIComponent(robotId)}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {/* ignore — robot not connected */ }
    setBusy(null);
  };

  const Btn = ({ cmd, label, color = C.blue, w = 52, h = 52 }) => (
    <button onClick={() => send(cmd)} disabled={disabled || !!busy} style={{
      width: w, height: h, borderRadius: 12,
      background: busy === cmd ? `${color}bb` : color,
      color: '#fff', border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'Fredoka One', fontSize: '1.1rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: disabled ? 0.35 : 1,
      transform: busy === cmd ? 'scale(0.92)' : 'scale(1)',
      transition: 'all 0.12s',
    }}>{label}</button>
  );

  return (
    <div>
      <p style={{ fontFamily: 'Fredoka One', fontSize: '0.75rem', color: C.muted, textAlign: 'center', margin: '0 0 8px' }}>
        MANUAL CONTROL
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '52px 52px 52px', gridTemplateRows: '52px 52px 52px', gap: 5, justifyContent: 'center' }}>
        <div /><Btn cmd="forward"    label="▲" /><div />
        <Btn cmd="turn_left"  label="↺" color={C.orange} />
        <Btn cmd="stop"       label="■" color={C.red} />
        <Btn cmd="turn_right" label="↻" color={C.orange} />
        <div /><Btn cmd="celebrate"  label="🎉" color={C.purple} /><div />
      </div>
    </div>
  );
}

/* ─── Chat bubble ──────────────────────────────────────── */
function Bubble({ role, text, pending }) {
  const isRobot = role === 'robot';
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-end',
      flexDirection: isRobot ? 'row' : 'row-reverse',
      marginBottom: 8,
    }}>
      {isRobot && (
        <div style={{ flexShrink: 0, marginBottom: 2 }}>
          <LumiAvatar emotion={pending ? 'thinking' : 'happy'} size={28} />
        </div>
      )}
      <div style={{
        maxWidth: '72%', padding: '8px 12px', borderRadius: isRobot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: isRobot ? C.white : C.blue,
        border: isRobot ? `1.5px solid ${C.border}` : 'none',
        color: isRobot ? C.dark : '#fff',
        fontFamily: 'Fredoka One', fontSize: '0.82rem', lineHeight: 1.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}>
        {pending ? <span style={{ letterSpacing: 3 }}>···</span> : text}
      </div>
    </div>
  );
}

/* ─── Main panel ───────────────────────────────────────── */
export default function AIRobotPanel({ onClose, robotStatus, gameState }) {
  const apiBase = API();
  const robots      = robotStatus?.robots    || [];
  const telemetry   = robotStatus?.telemetry || {};
  const isConnected = robots.length > 0;
  const activeRobot = robots[0] || 'lumi-bot-1';
  const tele        = telemetry[activeRobot] || {};

  const [input,    setInput]    = useState('');
  const [messages, setMessages] = useState([
    { role: 'robot', text: isConnected
        ? `Hi! I'm connected to ${activeRobot} 🤖 Type a command or tap Auto-Solve!`
        : "I'm in demo mode — no robot connected yet. I'll move on the grid! 🎮" },
  ]);
  const [busy,     setBusy]     = useState(false); // AI thinking
  const [autoSolving, setAutoSolving] = useState(false);
  const [listening, setListening] = useState(false);
  const chatRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 60);
  }, []);

  useEffect(scrollDown, [messages]);

  /* telemetry display */
  const battV    = tele.battery_v;
  const battPct  = battV ? Math.min(100, Math.max(0, Math.round((battV - 6.5) / (8.4 - 6.5) * 100))) : null;
  const obstCm   = tele.obstacle_cm;
  const battColor = battPct == null ? C.muted : battPct > 50 ? C.green : battPct > 20 ? C.orange : C.red;

  /* ── helpers ── */
  const push = (role, text) => setMessages(m => [...m, { role, text }]);

  const addPending = () => {
    const id = Date.now();
    setMessages(m => [...m, { role: 'robot', text: '', pending: true, id }]);
    return id;
  };
  const resolvePending = (id, text) => {
    setMessages(m => m.map(msg => msg.id === id ? { role: 'robot', text, id } : msg));
  };

  /* ── AI auto-solve ── */
  const autoSolve = async () => {
    if (autoSolving || busy) return;
    setAutoSolving(true);
    const pid = addPending();
    try {
      const res = await fetch(`${apiBase}/api/ai/auto-solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robot_id: activeRobot }),
        signal: AbortSignal.timeout(12000),
      });
      const data = await res.json();
      if (data.ok) {
        resolvePending(pid, `${data.narration} (${data.steps} moves) ✨`);
      } else {
        resolvePending(pid, `Hmm, I can't find a path! ${data.error || ''} 🤔`);
      }
    } catch {
      resolvePending(pid, "Couldn't reach the server — is it running? 🔌");
    }
    setAutoSolving(false);
  };

  /* ── NL command ── */
  const sendCommand = async (text) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput('');
    push('user', t);
    setBusy(true);
    const pid = addPending();
    try {
      const res = await fetch(`${apiBase}/api/ai/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, robot_id: activeRobot }),
        signal: AbortSignal.timeout(12000),
      });
      const data = await res.json();
      if (data.ok) {
        const cmdList = data.commands.join(' → ');
        resolvePending(pid, `${data.reply}  •  [${cmdList}]`);
      } else {
        resolvePending(pid, data.error || "I didn't get that — try again! 🤔");
      }
    } catch {
      resolvePending(pid, "Couldn't reach the server — is it running? 🔌");
    }
    setBusy(false);
  };

  /* ── Voice input ── */
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { push('robot', "Voice isn't available in this browser. Try Chrome! 🎤"); return; }
    const rec = new SR();
    rec.lang    = 'en-US';
    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => sendCommand(e.results[0][0].transcript);
    rec.start();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: C.cream, border: `2px solid ${C.border}`,
        borderRadius: 24, width: '100%', maxWidth: 680,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: isConnected ? '#dcfce7' : '#faf6ef',
          borderRadius: '22px 22px 0 0',
          borderBottom: `1px solid ${C.border}`,
          padding: '1.2rem 1.4rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LumiAvatar emotion={busy || autoSolving ? 'thinking' : isConnected ? 'excited' : 'happy'} size={44} />
            <div>
              <div style={{ fontFamily: 'Fredoka One', fontSize: '1.1rem', color: C.dark, display: 'flex', alignItems: 'center', gap: 6 }}>
                AI Robot Control
                <StatusDot ok={isConnected} />
              </div>
              <div style={{ fontSize: '0.78rem', color: C.gray }}>
                {isConnected ? `${activeRobot} · ${robots.length} robot online` : 'Demo mode — grid only'}
              </div>
            </div>
          </div>

          {/* Telemetry */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {isConnected && (
              <>
                <TelemetryBadge icon="🔋" value={battPct != null ? `${battPct}%` : '--'} color={battColor} />
                <TelemetryBadge icon="📏" value={obstCm ? (obstCm > 80 ? 'Clear' : `${Math.round(obstCm)}cm`) : '--'} color={obstCm && obstCm < 10 ? C.red : C.green} />
              </>
            )}
            <button onClick={onClose} style={{ background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

          {/* ── Auto-solve button ── */}
          <button
            onClick={autoSolve}
            disabled={autoSolving || busy}
            style={{
              width: '100%', padding: '14px',
              background: autoSolving
                ? `${C.blue}88`
                : `linear-gradient(135deg, ${C.blue} 0%, ${C.purple} 100%)`,
              color: '#fff', border: 'none', borderRadius: 16,
              fontFamily: 'Fredoka One', fontSize: '1.05rem',
              cursor: autoSolving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: autoSolving ? 'none' : '0 4px 20px rgba(26,108,240,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {autoSolving ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span> AI is thinking…</>
            ) : (
              <><span>✨</span> AI AUTO-SOLVE — Let AI plan & move the robot!</>
            )}
          </button>

          {/* ── Two-column: chat + d-pad ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>

            {/* Chat history */}
            <div>
              <div
                ref={chatRef}
                style={{
                  background: C.white, border: `1.5px solid ${C.border}`,
                  borderRadius: 16, padding: '10px 12px',
                  height: 200, overflowY: 'auto',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {messages.map((m, i) => <Bubble key={i} {...m} />)}
              </div>

              {/* Input row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCommand(input)}
                  placeholder='Try "go forward 3 steps" or "turn right twice"…'
                  disabled={busy}
                  style={{
                    flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 12,
                    padding: '9px 14px', fontFamily: 'Fredoka One', fontSize: '0.88rem',
                    color: C.dark, background: C.white, outline: 'none',
                  }}
                />
                <button
                  onClick={startVoice}
                  disabled={busy}
                  style={{
                    width: 40, borderRadius: 12, border: 'none',
                    background: listening ? C.red : C.blue,
                    color: '#fff', cursor: 'pointer', fontSize: '1.1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: listening ? 'pulse 1s infinite' : 'none',
                  }}
                  title="Voice command"
                >🎤</button>
                <button
                  onClick={() => sendCommand(input)}
                  disabled={busy || !input.trim()}
                  style={{
                    padding: '9px 16px', borderRadius: 12, border: 'none',
                    background: busy || !input.trim() ? '#e5e7eb' : C.blue,
                    color: '#fff', cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'Fredoka One', fontSize: '0.88rem',
                  }}
                >→ Send</button>
              </div>

              {/* Quick commands */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {[
                  'Go forward',
                  'Turn right',
                  'Spin around',
                  'Go to the star',
                  'Back to start',
                ].map(q => (
                  <button key={q} onClick={() => sendCommand(q)} disabled={busy} style={{
                    padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${C.border}`,
                    background: C.white, color: C.gray, fontFamily: 'Fredoka One',
                    fontSize: '0.72rem', cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.5 : 1,
                  }}>{q}</button>
                ))}
              </div>
            </div>

            {/* D-pad */}
            <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DPad robotId={activeRobot} apiBase={apiBase} disabled={!isConnected} />
            </div>
          </div>

          {/* ── How-it-works strip ── */}
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '0.9rem 1rem' }}>
            <p style={{ fontFamily: 'Fredoka One', fontSize: '0.78rem', color: C.muted, margin: '0 0 8px' }}>HOW THE AI WORKS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { icon: '🎤', label: 'Speak or type', desc: 'Natural language' },
                { icon: '🧠', label: 'Claude AI parses', desc: 'Understands meaning' },
                { icon: '🗺️', label: 'Plans the moves', desc: 'Turns + forwards' },
                { icon: '🤖', label: 'Robot moves!', desc: 'Grid + physical' },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 3 }}>{icon}</div>
                  <div style={{ fontFamily: 'Fredoka One', fontSize: '0.75rem', color: C.dark }}>{label}</div>
                  <div style={{ fontSize: '0.68rem', color: C.muted }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Robot not connected notice */}
          {!isConnected && (
            <div style={{ background: '#fef3c7', border: '1.5px solid #fbbf24', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#92400e', fontFamily: 'Fredoka One' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <span>No ESP32 connected — commands run on the grid only. Open the <strong>WiFi button</strong> to connect a robot!</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}
