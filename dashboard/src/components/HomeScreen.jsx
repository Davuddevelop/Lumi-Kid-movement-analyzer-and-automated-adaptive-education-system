import React, { useState, useEffect, useRef } from 'react';
import LumiAvatar from './LumiAvatar';

/* ─── Palette ───────────────────────────────────────────── */
const C = {
  cream: '#faf6ef', white: '#ffffff', dark: '#1a1a2e',
  gray: '#6b7280', muted: '#9ca3af', border: '#e8e4de',
  blue: '#1a6cf0', purple: '#7c5cfc', green: '#4caf82',
  yellow: '#ffd166', orange: '#ff8c42', pink: '#ff6b9d',
  teal: '#00b4d8', red: '#ff4757', gold: '#f0a500',
};

/* ─── Data ──────────────────────────────────────────────── */
const NAV_LINKS = ['Home', 'About Lumi', 'Features', 'How It Works', 'For Parents', 'Contact'];

const STEPS = [
  { n: 1, icon: '👶', color: C.pink,   title: 'Child plays',    desc: 'Your child builds, draws or talks freely with Lumi — no scripts.' },
  { n: 2, icon: '👁️',  color: C.teal,  title: 'Lumi observes',  desc: 'Eight friendly sensors notice creativity, focus and joy in real time.' },
  { n: 3, icon: '📖', color: C.green,  title: 'Stories react',  desc: 'The fable comes alive with stories, puzzles and quests built for them.' },
  { n: 4, icon: '🌱', color: C.yellow, title: 'Skills grow',    desc: 'Lumi turns play into a measurable map of cognitive and creative growth.' },
  { n: 5, icon: '📊', color: C.purple, title: 'You see it all', desc: 'Parents and teachers get gentle, weekly insights — never grades.' },
];

const SENSES = [
  { icon: '😊', color: C.pink,   title: 'Emotion analysis',    desc: 'Reads micro expressions and tone to track joy, focus and flow.' },
  { icon: '🎯', color: C.teal,   title: 'Focus tracking',      desc: 'Measures attentional vividness across a session — gently.' },
  { icon: '✨', color: C.yellow, title: 'Creativity analysis',  desc: 'Spots originality, divergence and clever combinations.' },
  { icon: '🧠', color: C.purple, title: 'Personality profile',  desc: 'A gentle picture of how your child thinks and collaborates.' },
  { icon: '⭐', color: C.yellow, title: 'AI recommendations',   desc: "Suggests next sessions tuned to your child's growth edge." },
  { icon: '🧍', color: C.green,  title: 'Posture detection',    desc: 'Subtle reminders when slouching or leaning too close.' },
  { icon: '👀', color: C.teal,   title: 'Eye-strain care',      desc: 'Tracks blink rate, dims lights — never overworks little eyes.' },
  { icon: '📚', color: C.orange, title: 'AI storytelling',      desc: 'Branching tales that respond to what they just built.' },
  { icon: '🔄', color: C.purple, title: 'Adaptive learning',    desc: 'Curriculum re-plans itself — never the same lesson twice.' },
  { icon: '🎤', color: C.pink,   title: 'Voice assistant',      desc: 'Talks to Lumi like a friend. Six warm voices, multilingual.' },
  { icon: '💬', color: C.green,  title: 'Chat companion',       desc: "Conversations about today's build, in their language." },
  { icon: '🖐️',  color: C.yellow, title: 'Gesture control',     desc: 'Wave to flip pages, snap to confirm — no controllers.' },
];

const MODES = [
  { bg: '#dbeafe', icon: '🤖', title: 'Robot Mode',   sub: 'Co-op with Lumi' },
  { bg: '#ede9fe', icon: '🧩', title: 'Puzzle Mode',  sub: 'Solo · Logic' },
  { bg: '#fce7f3', icon: '📖', title: 'Story Mode',   sub: '3-6 players' },
  { bg: '#fee2e2', icon: '⚔️',  title: 'Team Battle', sub: '2 vs 2 friends' },
  { bg: '#fef3c7', icon: '🎨', title: 'Creativity',   sub: 'Open · No score' },
  { bg: '#fef9c3', icon: '🔐', title: 'Escape Room',  sub: 'Co-op · 45 min' },
  { bg: '#e0f2fe', icon: '💻', title: 'Coding Games', sub: 'STEM · 7+' },
  { bg: '#dcfce7', icon: '🔵', title: 'Decisions',    sub: '1 vs Lumi' },
];

const LUMI_FEATURES = [
  { icon: '💾', color: C.purple, title: 'Remembers everything',  desc: 'Birthday wishes, favourite stories, the cousins who visit Sundays. Lumi keeps context so play feels personal.' },
  { icon: '🌡️',  color: C.pink,   title: 'Reads the room',        desc: 'When focus dips or frustration rises, Lumi shifts tone — softer voice, easier challenge, a moment of breath.' },
  { icon: '🎙️',  color: C.green,  title: 'Voice you choose',      desc: "Six warm voices, or upload a grandparent's voice with consent. Multilingual from day one." },
  { icon: '🔒', color: C.yellow, title: 'Private by design',     desc: 'Conversations never leave the table. No ads. No third-party tracking. Ever.' },
];

const SKILL_GROUPS = [
  {
    title: 'STEM foundations', icon: '🔧', color: C.green,
    skills: [
      { label: 'Spatial reasoning', pct: 82 },
      { label: 'Geometry',          pct: 77 },
      { label: 'Pre-engineering',   pct: 69 },
    ],
  },
  {
    title: 'Creative thinking', icon: '✨', color: C.purple,
    skills: [
      { label: 'Divergence',   pct: 91 },
      { label: 'Originality',  pct: 86 },
      { label: 'Combinations', pct: 77 },
    ],
  },
  {
    title: 'Social-emotional', icon: '❤️', color: C.pink,
    skills: [
      { label: 'Self-regulation', pct: 58 },
      { label: 'Teamwork',        pct: 63 },
      { label: 'Empathy cues',    pct: 49 },
    ],
  },
];

const BADGES = [
  { icon: '🏗️',  label: 'Architect',   sub: '3 structures' },
  { icon: '📖', label: 'Storyteller', sub: '12 chapters' },
  { icon: '💙', label: 'Empath',      sub: 'Helped a friend' },
  { icon: '💻', label: 'Codebreaker', sub: '8 puzzles solved' },
  { icon: '➕', label: 'Inventor',    sub: '5 projects' },
  { icon: '🧭', label: 'Explorer',    sub: 'No map found' },
];

const FAQS = [
  { q: 'How does Lumi work with LEGO we already own?', a: 'Lumi recognises every standard LEGO brick made since 1960 — over 5,076 indexed parts. Bring any set. The table identifies pieces in real time and weaves them into stories, games and challenges automatically.' },
  { q: "Is my child's data safe?", a: 'All cognitive analysis happens on-device. Lumi never sends video, audio, or behaviour to the cloud without explicit parental consent. You can export and delete every data point at any time. GDPR, COPPA and FERPA compliant by design.' },
  { q: 'What ages is Lumi for?', a: 'Lumi adapts from age 4 (sensory play, gentle stories) to 12 (logic, coding, robotics). The same table grows with the child — no upgrades needed. Up to four child profiles per table.' },
  { q: 'Can teachers use Lumi in classrooms?', a: "Yes. A school-grade dashboard, up to 4 children per table. Integrations with Google Classroom, Canvas and Seesaw. School licences include a 24-month hardware warranty and full teacher training." },
  { q: 'How much screen time does Lumi involve?', a: "Zero traditional screens. The table's built-in projector lights up the play surface only when the game requires it. Children look at LEGO, at each other, and at Lumi's ambient lights — never at a screen." },
  { q: 'What if my child loses interest?', a: 'Lumi notices first. If engagement drops, it gently changes mode — puzzle to story, solo to invite-a-friend. Long-term, Lumi rotates novelty automatically so familiarity never becomes boredom.' },
];

/* ─── Reusable pieces ───────────────────────────────────── */
const W = { maxWidth: 1160, margin: '0 auto', padding: '0 32px' };

const Label = ({ children }) => (
  <p style={{ fontFamily: 'Fredoka One', fontSize: '0.9rem', color: C.blue, margin: '0 0 8px', letterSpacing: 0.4 }}>
    {children}
  </p>
);

const Heading = ({ bold, italic, italicColor = C.orange, after = '' }) => (
  <h2 style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', color: C.dark, margin: '0 0 14px', lineHeight: 1.2 }}>
    {bold}<em style={{ color: italicColor, fontStyle: 'italic' }}>{italic}</em>{after}
  </h2>
);

const Sub = ({ children, maxW = 520 }) => (
  <p style={{ color: C.gray, fontSize: '1rem', lineHeight: 1.7, margin: '0 0 48px', maxWidth: maxW }}>
    {children}
  </p>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '1.4rem', ...style }}>
    {children}
  </div>
);

const Btn = ({ children, primary, onClick, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      background: primary ? C.blue : 'transparent',
      color: primary ? '#fff' : C.dark,
      border: primary ? 'none' : `2px solid ${C.dark}`,
      borderRadius: 28, padding: '11px 26px',
      fontFamily: 'Fredoka One', fontSize: '1rem',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
      ...style,
    }}
  >
    {children}
  </button>
);

const SkillBar = ({ label, pct, color }) => (
  <div style={{ marginBottom: 11 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: '0.82rem', color: '#374151', fontFamily: 'Fredoka One' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color, fontFamily: 'Fredoka One' }}>{pct}%</span>
    </div>
    <div style={{ height: 8, background: '#f0ece6', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 8 }} />
    </div>
  </div>
);

/* ─── Main ──────────────────────────────────────────────── */
export default function HomeScreen({ onStart }) {
  const [robotEmotion, setRobotEmotion] = useState('happy');
  const [openFaq, setOpenFaq] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const seq = ['happy', 'excited', 'happy', 'thinking', 'happy', 'excited'];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % seq.length; setRobotEmotion(seq[i]); }, 3000);
    return () => clearInterval(t);
  }, []);

  const BUBBLES = [
    { text: 'Think',   emoji: '🧠', top: '8%',  left: '0%',   delay: '0s' },
    { text: 'Create',  emoji: '🎨', top: '8%',  right: '0%',  delay: '0.4s' },
    { text: 'Learn',   emoji: '📚', top: '40%', left: '-2%',  delay: '0.8s' },
    { text: 'Build',   emoji: '🏗️',  bottom: '22%', right: '0%', delay: '0.2s' },
    { text: 'Explore', emoji: '🚀', bottom: '22%', left: '0%', delay: '0.6s' },
  ];

  return (
    /* position:fixed + overflowY:auto escapes the #root overflow:hidden */
    <div
      ref={scrollRef}
      style={{
        position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden',
        background: C.cream, fontFamily: "'Nunito', 'Fredoka One', sans-serif",
        zIndex: 1000,
      }}
    >

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(250,246,239,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', height: 60, gap: 32 }}>
          {/* Logo */}
          <div style={{ fontFamily: 'Fredoka One', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <span style={{ color: C.blue }}>L</span>
            <span style={{ color: C.yellow }}>U</span>
            <span style={{ color: C.orange }}>M</span>
            <em style={{ color: C.teal, fontStyle: 'italic' }}>i</em>
            <span style={{ color: C.purple, marginLeft: 5 }}>A</span>
            <span style={{ color: C.orange }}>I</span>
            <span style={{ color: C.yellow, marginLeft: 4, fontSize: '0.85rem' }}>✦</span>
          </div>
          {/* Links */}
          <div style={{ display: 'flex', gap: 28, flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map((l, i) => (
              <a key={l} href="#" style={{
                fontSize: '0.88rem', color: i === 0 ? C.blue : '#374151',
                fontFamily: 'Fredoka One', textDecoration: 'none',
                borderBottom: i === 0 ? `2px solid ${C.blue}` : 'none', paddingBottom: 2,
              }}>{l}</a>
            ))}
          </div>
          <Btn primary onClick={onStart}>✦ Get Started</Btn>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section style={{ ...W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', paddingTop: 64, paddingBottom: 20 }}>

        {/* Left */}
        <div>
          {/* Big rainbow title */}
          <h1 style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(5rem, 9vw, 7rem)', lineHeight: 1, margin: '0 0 24px', display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
            <span style={{ color: C.blue }}>L</span>
            <span style={{ color: C.yellow }}>U</span>
            <span style={{ color: C.orange }}>M</span>
            <em style={{ color: C.teal, fontStyle: 'italic', fontSize: '0.82em', marginBottom: 8 }}>i</em>
            <span style={{ flex: '0 0 16px' }} />
            <span style={{ color: C.purple }}>A</span>
            <span style={{ color: C.orange }}>I</span>
          </h1>

          {/* Tagline */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: C.dark, margin: '0 0 4px', fontWeight: 700 }}>
              Some Robots Follow Commands.
            </p>
            <p style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: C.gold, fontStyle: 'italic', margin: 0 }}>
              Lumi Understands Minds.
            </p>
            <div style={{ width: 110, height: 3, background: C.gold, borderRadius: 4, marginTop: 8 }} />
          </div>

          <p style={{ color: C.gray, fontSize: '0.97rem', lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
            Lumi AI is an intelligent robot that understands how your child thinks,
            discovers their unique potential, and creates a personalised learning
            path in STEAM, creativity and technology.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
            <Btn primary onClick={onStart}>🚀 Explore Lumi AI</Btn>
            <Btn onClick={onStart}>▶ Watch Video</Btn>
          </div>

          <div style={{ display: 'flex', gap: 8, fontSize: '3.2rem', lineHeight: 1 }}>
            <span>🧒</span><span style={{ marginTop: 4 }}>👧</span>
          </div>
        </div>

        {/* Right — robot + cloud + bubbles */}
        <div style={{ position: 'relative', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Dashed blue cloud circle */}
          <div style={{
            position: 'absolute', width: 320, height: 320, borderRadius: '50%',
            border: '2.5px dashed #93c5fd', background: 'rgba(219,234,254,0.3)',
          }} />

          {/* Decorative dots */}
          {[
            { s: '⭐', t: '10%', r: '18%', fs: '1.4rem' },
            { s: '💡', t: '12%', l: '22%', fs: '1.2rem' },
            { s: '💫', t: '28%', l: '10%', fs: '1rem' },
            { s: '✨', b: '30%', l: '12%', fs: '0.9rem' },
            { s: '☁️', t: '2%',  r: '28%', fs: '1.6rem', op: 0.55 },
            { s: '☁️', t: '4%',  l: '6%',  fs: '1.2rem', op: 0.45 },
          ].map(({ s, t, r, l, b, fs, op = 1 }, i) => (
            <span key={i} style={{
              position: 'absolute', top: t, right: r, left: l, bottom: b,
              fontSize: fs, opacity: op, pointerEvents: 'none',
              animation: `lumiFloat ${1.8 + i * 0.3}s ease-in-out infinite alternate`,
            }}>{s}</span>
          ))}

          {/* Speech bubbles */}
          {BUBBLES.map(({ text, emoji, delay, ...pos }) => (
            <div key={text} style={{
              position: 'absolute', ...pos,
              background: C.white, border: `1.5px solid ${C.border}`,
              borderRadius: 20, padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Fredoka One', fontSize: '0.82rem', color: C.dark,
              boxShadow: '0 4px 14px rgba(0,0,0,0.09)', zIndex: 2,
              animation: `lumiFloat 3s ease-in-out infinite alternate`,
              animationDelay: delay,
            }}>
              <span>{emoji}</span>{text}
            </div>
          ))}

          {/* Robot */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <LumiAvatar emotion={robotEmotion} size={210} speaking={false} />
          </div>

          {/* Castle + trees */}
          <div style={{ position: 'absolute', bottom: 0, right: '4%', display: 'flex', gap: 6, alignItems: 'flex-end', fontSize: '2.2rem', lineHeight: 1 }}>
            <span>🌲</span><span style={{ fontSize: '2.8rem' }}>🏰</span>
          </div>
        </div>
      </section>

      {/* ── GROUND STRIP ──────────────────────────────── */}
      <div style={{
        background: '#4caf82', height: 88,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', overflow: 'hidden', position: 'relative', marginTop: 16,
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 90, height: '100%', background: 'rgba(255,255,255,0.15)', borderRadius: '6px 6px 0 0' }} />
        <span style={{ fontSize: '2.4rem', zIndex: 1 }}>🌳🌲🌸</span>
        <span style={{ fontSize: '2rem',   zIndex: 1 }}>🌷🌳</span>
        <span style={{ fontSize: '2.4rem', zIndex: 1 }}>🌲🌸🌳</span>
      </div>

      {/* ── FEATURE BAR ──────────────────────────────── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { emoji: '😊', color: C.teal,   title: 'Understands Your Child' },
            { emoji: '⭐', color: C.yellow,  title: 'Discovers Potential' },
            { emoji: '🎯', color: C.green,   title: 'Personalized Learning Path' },
            { emoji: '💙', color: C.pink,    title: 'Supports Growth & Confidence' },
          ].map(({ emoji, color, title }, i) => (
            <div key={title} style={{
              padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{emoji}</div>
              <span style={{ fontFamily: 'Fredoka One', fontSize: '0.85rem', color: '#374151', lineHeight: 1.35 }}>{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section style={{ padding: '88px 32px' }}>
        <div style={{ ...W }}>
          <Label>How it works ✨</Label>
          <Heading bold="Five steps. " italic="No tests." after=" Just play." />
          <Sub>Lumi is invisible from a child's point of view — they build and laugh, and Lumi quietly turns that into a growth map.</Sub>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {STEPS.map(({ n, icon, color, title, desc }) => (
              <Card key={n} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka One', fontSize: '1rem', flexShrink: 0 }}>{n}</div>
                <span style={{ fontSize: '2rem' }}>{icon}</span>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '0.98rem', color: C.dark, margin: 0 }}>{title}</p>
                <p style={{ fontSize: '0.8rem', color: C.gray, margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWELVE SENSES ────────────────────────────── */}
      <section style={{ padding: '88px 32px', background: C.white }}>
        <div style={{ ...W }}>
          <Label>What Lumi can do /</Label>
          <Heading bold="Twelve senses, one " italic="kind" after=" conversation." />
          <Sub>Lumi sees, hears, listens and learns — privately, on the table — to understand how your child grows.</Sub>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {SENSES.map(({ icon, color, title, desc }) => (
              <Card key={title}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 12 }}>{icon}</div>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '0.94rem', color: C.dark, margin: '0 0 6px' }}>{title}</p>
                <p style={{ fontSize: '0.79rem', color: C.gray, margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAGIC TABLE ──────────────────────────────── */}
      <section style={{ padding: '88px 32px' }}>
        <div style={{ ...W }}>
          <Label>The magic table 🍭</Label>
          <Heading bold="A table that " italic="sees" after=" what your child builds." />
          <Sub>Hand-built from sustainable wood and tempered glass. Quiet enough for a bedroom, sturdy enough for a school. 1.20 m × 0.80 m.</Sub>
          <Card style={{ padding: '2rem' }}>
            <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto 28px' }}>
              <div style={{ background: '#fef9c3', border: '2.5px dashed #fbbf24', borderRadius: 18, padding: '44px 80px', textAlign: 'center', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div>
                  <p style={{ fontFamily: 'Fredoka One', color: '#92400e', fontSize: '1.1rem', margin: '0 0 6px' }}>Story unfolds here</p>
                  <p style={{ fontSize: '0.82rem', color: '#b45309', margin: 0 }}>created in real time</p>
                </div>
                <span style={{ position: 'absolute', bottom: 18, left: '25%', fontSize: '2rem' }}>🧱</span>
                <span style={{ position: 'absolute', bottom: 18, right: '25%', fontSize: '2rem' }}>🧱</span>
              </div>
              {[
                { text: '🔵 Projector · visible', style: { top: '12%', left: -2 } },
                { text: '🤖 Robotic plinth',     style: { bottom: '16%', left: -2 } },
                { text: '📸 8 friendly cameras', style: { top: '12%', right: -2 } },
                { text: '🌈 Rainbow LEDs (76 zones)', style: { bottom: '16%', right: -2 } },
              ].map(({ text, style }) => (
                <div key={text} style={{ position: 'absolute', ...style, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '4px 12px', fontSize: '0.74rem', fontFamily: 'Fredoka One', color: '#374151', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                  {text}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: `1px solid ${C.border}`, paddingTop: 20, gap: 8 }}>
              {[['1200mm', 'long'], ['800mm', 'wide'], ['940mm', 'tall'], ['18kg', 'light'], ['< 35dB', 'quiet']].map(([v, u]) => (
                <div key={v} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Fredoka One', fontSize: '1.35rem', color: C.dark }}>{v}</div>
                  <div style={{ fontSize: '0.74rem', color: C.muted }}>{u}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ── EIGHT WAYS TO PLAY ───────────────────────── */}
      <section style={{ padding: '88px 32px', background: C.white }}>
        <div style={{ ...W }}>
          <Label>Let's play 🎮</Label>
          <Heading bold="Eight ways to play. " italic="None feel like school." italicColor={C.orange} />
          <Sub>Modes adapt to age and ability. Lumi mixes them so it's never the same afternoon twice.</Sub>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {MODES.map(({ bg, icon, title, sub }, i) => (
              <div key={title} style={{ borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${C.border}`, cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } }} onClick={onStart}>
                <div style={{ background: bg, padding: '30px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minHeight: 100 }}>
                  <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 14, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{icon}</div>
                </div>
                <div style={{ background: C.white, padding: '14px 16px' }}>
                  <p style={{ fontFamily: 'Fredoka One', fontSize: '0.98rem', color: C.dark, margin: '0 0 3px' }}>{title}</p>
                  <p style={{ fontSize: '0.78rem', color: C.muted, margin: 0, fontFamily: 'Fredoka One' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEET LUMI ────────────────────────────────── */}
      <section style={{ padding: '88px 32px' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Robot illustration */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 380 }}>
            <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(219,234,254,0.4)', border: '2px dashed #93c5fd' }} />
            <LumiAvatar emotion={robotEmotion} size={200} speaking />
            {[
              { text: "That tower is taller than last week! 🎉", top: '5%', left: '-8%' },
              { text: "New badge: Architect! 🏗️",               top: '55%', right: '-6%' },
              { text: "I noticed you got frustrated. Let's breathe! 🌬️", bottom: '5%', left: '-4%' },
            ].map(({ text, ...pos }) => (
              <div key={text} style={{ position: 'absolute', ...pos, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '8px 14px', maxWidth: 170, fontSize: '0.77rem', color: '#374151', lineHeight: 1.45, boxShadow: '0 4px 14px rgba(0,0,0,0.09)', zIndex: 2 }}>{text}</div>
            ))}
          </div>

          {/* Feature list */}
          <div>
            <Label>Meet your new friend 🧡</Label>
            <Heading bold="Lumi is a friend who " italic="notices." italicColor={C.blue} />
            <Sub maxW={480}>A warm companion that remembers what your child loves, gently steps in when they're stuck, and celebrates every small win.</Sub>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {LUMI_FEATURES.map(({ icon, color, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <p style={{ fontFamily: 'Fredoka One', fontSize: '0.96rem', color: C.dark, margin: '0 0 4px' }}>{title}</p>
                    <p style={{ fontSize: '0.82rem', color: C.gray, margin: 0, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GROWTH MAP ──────────────────────────────── */}
      <section style={{ padding: '88px 32px', background: C.white }}>
        <div style={{ ...W }}>
          <Label>A growth map 🗺️</Label>
          <Heading bold="Watch your child " italic="actually" after=" grow." />
          <Sub maxW={560}>Lumi tracks development across 96 domains, mapped to the OECD Future of Education framework. No grades, no rankings — only growth.</Sub>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
            {SKILL_GROUPS.map(({ title, color, skills }) => (
              <Card key={title}>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '0.98rem', color: C.dark, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, border: `1.5px solid ${color}50`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>+</span>
                  {title}
                </p>
                {skills.map(s => <SkillBar key={s.label} {...s} color={color} />)}
                <p style={{ fontSize: '0.75rem', color: C.muted, margin: '10px 0 0', fontFamily: 'Fredoka One' }}>↑ Trending up · +11 this week</p>
              </Card>
            ))}
          </div>

          <p style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem', color: C.dark, margin: '0 0 20px' }}>Badges your child unlocks ✨</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {BADGES.map(({ icon, label, sub }) => (
              <Card key={label} style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 110, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>{icon}</div>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '0.87rem', color: C.dark, margin: 0 }}>{label}</p>
                <p style={{ fontSize: '0.73rem', color: C.muted, margin: 0 }}>{sub}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROBOTS TEACH BACK ────────────────────────── */}
      <section style={{ padding: '88px 32px' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <Card style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', minHeight: 260 }}>
            <span style={{ fontSize: '4.5rem', display: 'block' }}>🦾</span>
            <div style={{ display: 'flex', gap: 18, fontSize: '2.4rem' }}>🧱🧱🧱</div>
            <div style={{ position: 'absolute', top: 14, left: 14, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '4px 12px', fontSize: '0.74rem', fontFamily: 'Fredoka One', color: '#374151' }}>🤖 Lumi Arm · 4 joints</div>
            <div style={{ position: 'absolute', bottom: 14, right: 14, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '4px 12px', fontSize: '0.74rem', fontFamily: 'Fredoka One', color: '#374151' }}>🔊 Quiet &amp; safe</div>
          </Card>
          <div>
            <Label>When the table builds back 🤖</Label>
            <Heading bold="Robots that your child " italic="teaches." italicColor={C.blue} />
            <p style={{ color: C.gray, marginBottom: 28, fontSize: '0.97rem', lineHeight: 1.7 }}>
              Lumi includes a magnetic robotic plinth and modular arms. Children program them with gestures, voice or LEGO — and the table responds in real space.
            </p>
            {[
              { n: 1, color: C.orange, title: 'Teach by showing',   desc: "Wave your hands or move a brick. Lumi watches, replays, then asks if your child can do it backwards." },
              { n: 2, color: C.green,  title: 'Magnetic mounts',    desc: 'Compatible with every standard LEGO brick. Magnetised base plates keep builds stable as the table moves.' },
              { n: 3, color: C.blue,   title: 'Safe by design',     desc: 'Force-limited joints. Capacitive shutdown if a child gets too close. Quiet under 30 decibels.' },
              { n: 4, color: C.purple, title: 'Three ways to code', desc: 'Drag-and-drop blocks, voice commands, or LEGO sequence cards. All three can mix in one session.' },
            ].map(({ n, color, title, desc }) => (
              <div key={n} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka One', fontSize: '0.9rem', flexShrink: 0 }}>{n}</div>
                <div>
                  <p style={{ fontFamily: 'Fredoka One', fontSize: '0.95rem', color: C.dark, margin: '0 0 3px' }}>{title}</p>
                  <p style={{ fontSize: '0.81rem', color: C.gray, margin: 0, lineHeight: 1.55 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section style={{ padding: '88px 32px', background: C.white }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 32px' }}>
          <Label>Questions parents ask 🐙</Label>
          <Heading bold="The things " italic="parents ask first." italicColor={C.orange} />
          <Sub>Not here? Write hello@lumi.school — a human replies within a day.</Sub>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map(({ q, a }, i) => (
              <div key={i} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '1.1rem 1.4rem', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <p style={{ fontFamily: 'Fredoka One', fontSize: '0.94rem', color: C.dark, margin: 0 }}>{q}</p>
                  <span style={{ color: C.muted, flexShrink: 0, transition: 'transform 0.2s', display: 'inline-block', transform: openFaq === i ? 'rotate(180deg)' : 'none', fontSize: '0.85rem' }}>▼</span>
                </div>
                {openFaq === i && (
                  <p style={{ fontSize: '0.87rem', color: C.gray, margin: '12px 0 0', lineHeight: 1.7 }}>{a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS CTA ─────────────────────────── */}
      <section style={{ padding: '88px 32px' }}>
        <div style={{ ...W }}>
          <Card style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', padding: '2.8rem' }}>
            <div>
              <Label>Early access · spring 2026 🚀</Label>
              <h2 style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', color: C.dark, margin: '0 0 12px', lineHeight: 1.2 }}>
                Be on the <em style={{ color: C.orange, fontStyle: 'italic' }}>first</em> table.
              </h2>
              <p style={{ color: C.gray, marginBottom: 28, fontSize: '0.97rem', lineHeight: 1.7 }}>
                We're shipping 1,000 Lumi tables in spring 2026. Early adopters get 30% off and a year of premium curriculum.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Btn primary onClick={onStart}>🤖 Reserve a Lumi</Btn>
                <Btn onClick={onStart}>Book a school pilot</Btn>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['3,247', 'families on the waitlist'], ['86', 'partner schools signed'], ['24', 'countries reached']].map(([num, label]) => (
                <div key={num} style={{ background: C.cream, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Fredoka One', fontSize: '1.9rem', color: C.blue }}>{num}</span>
                  <span style={{ fontSize: '0.84rem', color: C.gray }}>{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: '52px 32px 28px' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'Fredoka One', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 1, marginBottom: 14 }}>
              <span style={{ color: C.blue }}>L</span><span style={{ color: C.yellow }}>U</span>
              <span style={{ color: C.orange }}>M</span><em style={{ color: C.teal, fontStyle: 'italic' }}>i</em>
              <span style={{ color: C.purple, marginLeft: 5 }}>A</span><span style={{ color: C.orange }}>I</span>
              <span style={{ color: C.yellow, marginLeft: 4, fontSize: '1rem' }}>✦</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: C.gray, lineHeight: 1.65, maxWidth: 200, margin: '0 0 12px' }}>
              A new kind of classroom — where children build with their hands and the table listens. Made with love in Lisbon and Berlin.
            </p>
            <a href="mailto:hello@lumi.school" style={{ fontSize: '0.8rem', color: C.blue, textDecoration: 'none', fontFamily: 'Fredoka One' }}>hello@lumi.school</a>
          </div>
          {[
            { title: 'Product',  links: ['The Table', 'AI Companion', 'Game Modes', 'Robotics', 'Curriculum'] },
            { title: 'For',      links: ['Parents', 'Schools', 'Therapists', 'Researchers'] },
            { title: 'Company',  links: ['About us', 'Research', 'Press', 'Careers', 'Contact'] },
            { title: 'Legal',    links: ['Privacy', 'Data ethics', 'Terms', 'GDPR / COPPA'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p style={{ fontFamily: 'Fredoka One', fontSize: '0.9rem', color: C.dark, margin: '0 0 12px' }}>{title}</p>
              {links.map(l => <a key={l} href="#" style={{ display: 'block', fontSize: '0.81rem', color: C.gray, textDecoration: 'none', marginBottom: 8 }}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: '0.77rem', color: C.muted }}>© 2026 Lumi Labs · Made with crayons.</span>
          <span style={{ fontSize: '0.77rem', color: C.muted }}>✦ built with care in 2 cities ✦</span>
          <span style={{ fontSize: '0.77rem', color: C.muted }}>v3.2 · builds &amp; happy</span>
        </div>
      </footer>

      <style>{`
        @keyframes lumiFloat {
          from { transform: translateY(0px); }
          to   { transform: translateY(-10px); }
        }
        @media (max-width: 900px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          section > div[style*="repeat(5, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          section > div[style*="repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
