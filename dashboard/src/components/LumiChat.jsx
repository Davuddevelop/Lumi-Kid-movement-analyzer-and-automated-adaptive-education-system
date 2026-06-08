import { useState, useRef, useEffect, useCallback } from 'react';

const API = () => localStorage.getItem('lumi_api_url') || (import.meta.env.VITE_API_URL || 'http://localhost:8000');

// ─── Lumi face SVG ────────────────────────────────────────────────────────────
function LumiFace({ emotion = 'happy', size = 44 }) {
  const faces = {
    happy:    { eyes: '◕ ◕', mouth: '⌣',  color: '#FFD93D' },
    excited:  { eyes: '★ ★', mouth: '⌣',  color: '#FF6B6B' },
    thinking: { eyes: '◔ ◔', mouth: '–',  color: '#4ECDC4' },
    sad:      { eyes: '◕ ◕', mouth: '⌢',  color: '#95A5A6' },
  };
  const f = faces[emotion] || faces.happy;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: f.color,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.28, lineHeight: 1.1,
      boxShadow: `0 2px 8px ${f.color}66`,
      flexShrink: 0,
      transition: 'background 0.4s',
      userSelect: 'none',
    }}>
      <div style={{ letterSpacing: 2 }}>{f.eyes}</div>
      <div style={{ fontSize: size * 0.22 }}>{f.mouth}</div>
    </div>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--primary, #1a6cf0)',
          animation: `lumiBounce 1s ${i * 0.18}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, emotion }) {
  const isLumi = msg.role === 'assistant';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 8,
      flexDirection: isLumi ? 'row' : 'row-reverse',
      marginBottom: 10,
    }}>
      {isLumi && <LumiFace emotion={emotion} size={32} />}
      <div style={{
        maxWidth: '75%',
        background: isLumi
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'var(--surface-alt, #f0f4ff)',
        color: isLumi ? '#fff' : 'var(--text, #1a1a2e)',
        borderRadius: isLumi ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
        padding: '10px 14px',
        fontSize: '0.92rem',
        lineHeight: 1.45,
        boxShadow: isLumi ? '0 2px 12px rgba(102,126,234,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── Quick reply chips ────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  { label: '💡 Give me a hint', text: 'Can you give me a hint?' },
  { label: '🤖 What does forward do?', text: 'What does the forward block do?' },
  { label: '🔄 What does turn do?', text: 'What does turning do?' },
  { label: '⭐ How do I win?', text: 'How do I reach the star?' },
  { label: '🎉 Tell me a robot joke', text: 'Tell me a funny robot joke!' },
];

// ─── Main LumiChat component ──────────────────────────────────────────────────
export default function LumiChat({ gameState }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Lumi! 🤖 Ask me anything — I'm here to help! ✨" }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [emotion, setEmotion]   = useState('happy');
  const [listening, setListening] = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const next = [...messages, userMsg];
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

      const res = await fetch(`${API()}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, game_context: ctx }),
      });

      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      setEmotion(data.emotion || 'happy');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      // Speak the reply
      if (window.speechSynthesis && data.reply) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(data.reply);
        u.pitch = 1.4; u.rate = 1.0;
        window.speechSynthesis.speak(u);
      }

      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops, my brain had a hiccup! Try again! 🤖",
      }]);
      setEmotion('sad');
    } finally {
      setLoading(false);
    }
  }, [messages, loading, gameState, open]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      send("Can you help me with voice?");
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = () => setListening(false);
    rec.onresult = (evt) => {
      const text = evt.results[0][0].transcript;
      send(text);
    };
    rec.start();
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Hi again! 🤖 What would you like to know? ✨" }]);
    setEmotion('happy');
  };

  return (
    <>
      {/* ── Keyframe for bounce dots ── */}
      <style>{`
        @keyframes lumiBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes lumiSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lumiBadgePop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .lumi-chat-input:focus { outline: 2px solid #667eea; border-color: transparent; }
        .lumi-quick-chip:hover { background: #667eea !important; color: #fff !important; transform: translateY(-1px); }
        .lumi-send-btn:hover:not(:disabled) { background: #5a6fd6 !important; transform: scale(1.05); }
        .lumi-fab:hover { transform: scale(1.1) !important; }
      `}</style>

      {/* ── FAB trigger button ── */}
      <button
        className="lumi-fab"
        onClick={() => setOpen(o => !o)}
        aria-label="Chat with Lumi"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
          width: 60, height: 60, borderRadius: '50%',
          border: 'none', cursor: 'pointer', padding: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: open
            ? '0 4px 20px rgba(102,126,234,0.5)'
            : '0 4px 16px rgba(102,126,234,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {open
          ? <span style={{ color: '#fff', fontSize: 24 }}>✕</span>
          : <LumiFace emotion={emotion} size={44} />
        }
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ff4757', color: '#fff',
            borderRadius: '50%', width: 20, height: 20,
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'lumiBadgePop 0.3s ease',
          }}>{unread}</span>
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 16, zIndex: 1290,
          width: 'min(360px, calc(100vw - 32px))',
          height: 'min(520px, calc(100vh - 120px))',
          background: 'var(--surface, #ffffff)',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'lumiSlideUp 0.25s ease',
          border: '1px solid rgba(102,126,234,0.15)',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <LumiFace emotion={emotion} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Lumi</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>
                {loading ? 'thinking… 🤔' : 'Your robot friend ✨'}
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', borderRadius: 8, padding: '4px 8px',
                cursor: 'pointer', fontSize: '0.75rem',
              }}
            >🗑️ Clear</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
            display: 'flex', flexDirection: 'column',
          }}>
            {messages.map((m, i) => (
              <Bubble
                key={i}
                msg={m}
                emotion={i === messages.length - 1 && m.role === 'assistant' ? emotion : 'happy'}
              />
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <LumiFace emotion="thinking" size={32} />
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '18px 18px 18px 4px',
                  boxShadow: '0 2px 12px rgba(102,126,234,0.3)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && !loading && (
            <div style={{
              padding: '0 12px 8px',
              display: 'flex', flexWrap: 'wrap', gap: 6,
            }}>
              {QUICK_REPLIES.map(q => (
                <button
                  key={q.text}
                  className="lumi-quick-chip"
                  onClick={() => send(q.text)}
                  style={{
                    background: 'rgba(102,126,234,0.08)',
                    color: '#667eea',
                    border: '1px solid rgba(102,126,234,0.25)',
                    borderRadius: 20, padding: '5px 11px',
                    fontSize: '0.75rem', cursor: 'pointer',
                    fontWeight: 600, transition: 'all 0.15s',
                  }}
                >{q.label}</button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border-color, #e8eaf0)',
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'var(--surface, #fff)',
          }}>
            {/* Voice button */}
            <button
              onClick={startVoice}
              disabled={loading}
              title="Talk to Lumi"
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                cursor: 'pointer', fontSize: 18, flexShrink: 0,
                background: listening
                  ? 'linear-gradient(135deg, #ff4757, #ff6b81)'
                  : 'rgba(102,126,234,0.1)',
                transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: listening ? 'lumiBounce 1s infinite' : 'none',
              }}
            >
              {listening ? '🔴' : '🎤'}
            </button>

            <input
              ref={inputRef}
              className="lumi-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Lumi anything…"
              disabled={loading}
              maxLength={200}
              style={{
                flex: 1, borderRadius: 20, border: '1.5px solid var(--border-color, #e0e4f0)',
                padding: '8px 14px', fontSize: '0.88rem',
                background: 'var(--surface-alt, #f8f9ff)',
                color: 'var(--text, #1a1a2e)',
                outline: 'none', transition: 'border-color 0.2s',
              }}
            />

            <button
              className="lumi-send-btn"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'var(--border-color, #e0e4f0)',
                color: input.trim() && !loading ? '#fff' : 'var(--text-muted, #aaa)',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                fontSize: 18, flexShrink: 0,
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
