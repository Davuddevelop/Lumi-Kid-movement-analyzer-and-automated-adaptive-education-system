import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const API_URL = () =>
  localStorage.getItem('lumi_api_url') ||
  (import.meta.env.VITE_API_URL || 'http://localhost:8000');

// ─── Lumi face ────────────────────────────────────────────────────────────────
const FACES = {
  happy:    { eyes: '◕ ◕', mouth: '⌣',  bg: '#FFD93D', shadow: '#FFD93D' },
  excited:  { eyes: '★ ★', mouth: '⌣',  bg: '#FF6B6B', shadow: '#FF6B6B' },
  thinking: { eyes: '◔ ◔', mouth: '–',  bg: '#4ECDC4', shadow: '#4ECDC4' },
  sad:      { eyes: '◕ ◕', mouth: '⌢',  bg: '#A8B8C8', shadow: '#A8B8C8' },
};

function LumiFace({ emotion = 'happy', size = 44, pulse = false }) {
  const f = FACES[emotion] || FACES.happy;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: f.bg, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.27, lineHeight: 1.1,
      boxShadow: `0 2px 10px ${f.shadow}55`,
      transition: 'background 0.35s, box-shadow 0.35s',
      userSelect: 'none',
      animation: pulse ? 'lumiPulse 2s infinite' : 'none',
    }}>
      <div style={{ letterSpacing: size * 0.06 }}>{f.eyes}</div>
      <div style={{ fontSize: size * 0.21, marginTop: 1 }}>{f.mouth}</div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '11px 15px', alignItems: 'center' }}>
      {[0, 150, 300].map((delay, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          animation: `lumiDot 1.1s ${delay}ms infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ role, content, emotion, isLast }) {
  const isLumi = role === 'assistant';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 7,
      flexDirection: isLumi ? 'row' : 'row-reverse',
      marginBottom: 10,
      animation: isLast ? 'lumiFadeIn 0.2s ease' : 'none',
    }}>
      {isLumi && <LumiFace emotion={isLast ? emotion : 'happy'} size={30} />}
      <div style={{
        maxWidth: '78%',
        background: isLumi
          ? 'linear-gradient(135deg, #667eea, #764ba2)'
          : 'var(--surface-alt, #f0f4ff)',
        color: isLumi ? '#fff' : 'var(--text, #1a1a2e)',
        borderRadius: isLumi ? '16px 16px 16px 3px' : '16px 16px 3px 16px',
        padding: '9px 13px',
        fontSize: '0.9rem',
        lineHeight: 1.5,
        boxShadow: isLumi
          ? '0 2px 14px rgba(102,126,234,0.28)'
          : '0 1px 5px rgba(0,0,0,0.07)',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {content}
      </div>
    </div>
  );
}

// ─── Context-aware chips ──────────────────────────────────────────────────────
function getChips(gameState) {
  const st = gameState?.status;
  if (st === 'success') return [
    { label: '⭐ What did I learn?',   text: 'What skill did I just practice?' },
    { label: '🚀 What comes next?',    text: 'What will the next level be like?' },
    { label: '🤖 How do robots think?', text: 'How does a real robot think?' },
    { label: '🎉 Tell me a robot joke', text: 'Tell me a funny robot joke!' },
  ];
  if (st === 'error' || st === 'fail') return [
    { label: '💡 Give me a hint',       text: 'Can you give me a hint for this level?' },
    { label: '🤔 What am I doing wrong?', text: 'What might I be doing wrong?' },
    { label: '🔄 Explain the blocks',   text: 'Can you explain what each block does?' },
    { label: '💪 Cheer me up!',         text: "Can you cheer me up? I keep getting stuck." },
  ];
  return [
    { label: '💡 Give me a hint',        text: 'Can you give me a hint?' },
    { label: '🟢 What does forward do?', text: 'What does the forward block do?' },
    { label: '🔵 What does turning do?', text: 'What does turning the robot do?' },
    { label: '⭐ How do I win?',         text: 'How do I reach the star and win?' },
    { label: '🎉 Tell me a robot joke',  text: 'Tell me a funny robot joke!' },
  ];
}

function getGreeting(gameState) {
  if (!gameState) return "Hi! I'm Lumi! 🤖 Ask me anything — I'm here to help! ✨";
  const { status, current_level_id: lvl } = gameState;
  if (status === 'success')
    return `WOW! You finished level ${lvl}! ⭐ You're a robot wizard! What would you like to know?`;
  if (status === 'error' || status === 'fail')
    return "Don't worry — you're SO close! 💪 Want a hint? Just ask me! 🤖";
  if (status === 'executing')
    return "Watch the robot move! 🤖✨ Ask me anything while we wait!";
  if (lvl > 1)
    return `Level ${lvl} already! You're amazing! 🌟 How can I help you today?`;
  return "Hi! I'm Lumi! 🤖 Ask me anything — I'm here to help! ✨";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LumiChat({ gameState, open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState('happy');
  const [listening, setListening] = useState(false);
  const [unread, setUnread]   = useState(0);

  // Refs for stable closures — voice handler must never go stale
  const messagesRef = useRef([]);
  const loadingRef  = useRef(false);
  const openRef     = useRef(false);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const greetingSet = useRef(false);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current  = loading; },  [loading]);
  useEffect(() => { openRef.current     = open;    },  [open]);

  // Set greeting once when the panel first opens
  useEffect(() => {
    if (open && !greetingSet.current) {
      greetingSet.current = true;
      setMessages([{ role: 'assistant', content: getGreeting(gameState) }]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on open; reset unread
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // Core send — reads from refs, never stale
  const send = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loadingRef.current) return;

    const userMsg = { role: 'user', content: trimmed };
    const next = [...messagesRef.current, userMsg];

    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const ctx = gameState ? {
        level_id:   gameState.current_level_id,
        level_name: gameState.level_name,
        status:     gameState.status,
        sentiment:  gameState.sentiment,
        stars:      gameState.stars_total,
      } : null;

      // On Vercel (non-localhost) use the co-deployed serverless function at /api/chat.
      // On localhost use the Python FastAPI backend stored in localStorage.
      const isLocal = /localhost|127\.0\.0\.1/.test(window.location.hostname);
      const chatUrl = isLocal ? `${API_URL()}/api/chat` : '/api/chat';
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, game_context: ctx }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const reply = data.reply || "I'm here! Ask me anything! 🤖";
      setEmotion(data.emotion || 'happy');
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      // Speak the reply
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(reply);
        u.pitch = 1.4; u.rate = 1.0;
        window.speechSynthesis.speak(u);
      }

      if (!openRef.current) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "My circuits buzzed! Try again! ⚡",
      }]);
      setEmotion('sad');
    } finally {
      setLoading(false);
    }
  }, [gameState]); // gameState is the only real dep; messages/loading read from refs

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { send("Can you help me understand how to play?"); return; }
    const rec = new SR();
    rec.lang     = 'en-US';
    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = () => setListening(false);
    rec.onresult = (evt) => send(evt.results[0][0].transcript);
    rec.start();
  }, [send]);

  const clearChat = () => {
    greetingSet.current = false;
    setMessages([{ role: 'assistant', content: getGreeting(gameState) }]);
    setEmotion('happy');
  };

  const chips = useMemo(() => getChips(gameState), [gameState?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  const showChips = messages.length <= 2 && !loading;

  return (
    <>
      <style>{`
        @keyframes lumiDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes lumiSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes lumiFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes lumiPulse {
          0%, 100% { box-shadow: 0 2px 10px #FFD93D55; }
          50%      { box-shadow: 0 2px 22px #FFD93Daa; }
        }
        @keyframes lumiBadgePop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .lumi-chip { transition: all 0.15s ease; }
        .lumi-chip:hover { background: #667eea !important; color: #fff !important; transform: translateY(-1px); }
        .lumi-input:focus { outline: 2px solid #667eea; border-color: transparent; }
        .lumi-send:hover:not(:disabled) { background: linear-gradient(135deg,#5a6fd6,#6a42a0) !important; transform: scale(1.06); }
        .lumi-msg-list { scrollbar-width: thin; scrollbar-color: #e0d8f0 transparent; }
        .lumi-msg-list::-webkit-scrollbar { width: 4px; }
        .lumi-msg-list::-webkit-scrollbar-thumb { background: #c4b5f0; border-radius: 4px; }
      `}</style>

      {/* ── Chat panel — rendered as fixed overlay, triggered by top-strip button ── */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 90,   /* sits above the action bar */
          right: 16,
          zIndex: 1290,
          width: 'min(348px, calc(100vw - 28px))',
          height: 'min(500px, calc(100vh - 140px))',
          background: 'var(--surface, #ffffff)',
          borderRadius: 22,
          boxShadow: '0 10px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'lumiSlideUp 0.22s ease',
          border: '1px solid rgba(102,126,234,0.12)',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <LumiFace emotion={emotion} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.97rem' }}>Lumi</div>
              <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                {loading ? '✦ thinking…' : 'Your robot friend ✨'}
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Start over"
              style={{
                background: 'rgba(255,255,255,0.14)', border: 'none',
                color: '#fff', borderRadius: 8, padding: '4px 9px',
                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                flexShrink: 0,
              }}
            >🗑️ Clear</button>
            <button
              onClick={onClose}
              title="Close chat"
              style={{
                background: 'rgba(255,255,255,0.14)', border: 'none',
                color: '#fff', borderRadius: 8, padding: '4px 9px',
                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                flexShrink: 0,
              }}
            >✕</button>
          </div>

          {/* Messages */}
          <div
            className="lumi-msg-list"
            style={{
              flex: 1, overflowY: 'auto', padding: '12px 12px 6px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {messages.map((m, i) => (
              <Bubble
                key={i}
                role={m.role}
                content={m.content}
                emotion={emotion}
                isLast={i === messages.length - 1}
              />
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, marginBottom: 8 }}>
                <LumiFace emotion="thinking" size={30} />
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '16px 16px 16px 3px',
                  boxShadow: '0 2px 14px rgba(102,126,234,0.28)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} style={{ height: 2 }} />
          </div>

          {/* Quick chips */}
          {showChips && (
            <div style={{
              padding: '4px 10px 8px',
              display: 'flex', flexWrap: 'wrap', gap: 5,
              borderTop: '1px solid var(--border-color, #ede8e0)',
            }}>
              {chips.map(c => (
                <button
                  key={c.text}
                  className="lumi-chip"
                  onClick={() => send(c.text)}
                  style={{
                    background: 'rgba(102,126,234,0.07)',
                    color: '#667eea',
                    border: '1px solid rgba(102,126,234,0.22)',
                    borderRadius: 20, padding: '4px 10px',
                    fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600,
                  }}
                >{c.label}</button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            padding: '8px 10px 10px',
            borderTop: '1px solid var(--border-color, #ede8e0)',
            display: 'flex', gap: 7, alignItems: 'center',
            background: 'var(--surface, #fff)',
            flexShrink: 0,
          }}>
            <button
              onClick={startVoice}
              disabled={loading}
              title="Speak to Lumi"
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', fontSize: 17,
                background: listening
                  ? 'linear-gradient(135deg, #ff4757, #ff6b81)'
                  : 'rgba(102,126,234,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.2s',
                animation: listening ? 'lumiDot 1s infinite' : 'none',
              }}
            >{listening ? '🔴' : '🎤'}</button>

            <input
              ref={inputRef}
              className="lumi-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Lumi anything…"
              disabled={loading}
              maxLength={200}
              style={{
                flex: 1, borderRadius: 18,
                border: '1.5px solid var(--border-color, #e0daf5)',
                padding: '7px 13px', fontSize: '0.86rem',
                background: 'var(--surface-alt, #f8f5ff)',
                color: 'var(--text, #1a1a2e)',
                outline: 'none', transition: 'border-color 0.2s',
              }}
            />

            <button
              className="lumi-send"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : 'var(--border-color, #e0daf5)',
                color: input.trim() && !loading ? '#fff' : '#bbb',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                fontSize: 16, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, transform 0.15s',
              }}
            >▶</button>
          </div>
        </div>
      )}
    </>
  );
}
