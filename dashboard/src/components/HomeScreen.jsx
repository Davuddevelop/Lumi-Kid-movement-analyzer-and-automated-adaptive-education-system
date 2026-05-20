import React, { useState, useEffect } from 'react';
import LumiAvatar from './LumiAvatar';

/* ─── Data ─────────────────────────────────────────────── */

const NAV_LINKS = ['Home', 'About Lumi', 'Features', 'How It Works', 'For Parents', 'Contact'];

const STEPS = [
  { n: 1, icon: '👶', color: '#ff6b9d', title: 'Child plays',    desc: 'Your child builds, draws or talks freely with Lumi — no scripts.' },
  { n: 2, icon: '👁️',  color: '#00b4d8', title: 'Lumi observes', desc: 'Eight friendly sensors notice creativity, focus and joy in real time.' },
  { n: 3, icon: '📖', color: '#4caf82', title: 'Stories react',  desc: 'The fable comes alive with stories, puzzles and quests built for them.' },
  { n: 4, icon: '🌱', color: '#ffd166', title: 'Skills grow',    desc: 'Lumi turns play into a measurable map of cognitive and creative growth.' },
  { n: 5, icon: '📊', color: '#7c5cfc', title: 'You see it all', desc: 'Parents and teachers get gentle, weekly insights — never grades.' },
];

const SENSES = [
  { icon: '😊', color: '#ff6b9d', title: 'Emotion analysis',    desc: 'Reads micro expressions and tone to track joy, focus and flow.' },
  { icon: '🎯', color: '#00b4d8', title: 'Focus tracking',      desc: 'Measures attentional vividness across a session — gently.' },
  { icon: '✨', color: '#ffd166', title: 'Creativity analysis', desc: 'Spots originality, divergence and clever combinations.' },
  { icon: '🧠', color: '#7c5cfc', title: 'Personality profile', desc: 'A gentle picture of how your child thinks and collaborates.' },
  { icon: '⭐', color: '#ffd166', title: 'AI recommendations',  desc: "Suggests next sessions tuned to your child's growth edge." },
  { icon: '🧍', color: '#4caf82', title: 'Posture detection',   desc: 'Subtle reminders when slouching or leaning too close.' },
  { icon: '👀', color: '#00b4d8', title: 'Eye-strain care',     desc: 'Tracks blink rate, dims lights — never overworks little eyes.' },
  { icon: '📚', color: '#ff8c42', title: 'AI storytelling',     desc: 'Branching tales that respond to what they just built.' },
  { icon: '🔄', color: '#7c5cfc', title: 'Adaptive learning',   desc: 'Curriculum re-plans itself — never the same lesson twice.' },
  { icon: '🎤', color: '#ff6b9d', title: 'Voice assistant',     desc: 'Talks to Lumi like a friend. Six warm voices, multilingual.' },
  { icon: '💬', color: '#4caf82', title: 'Chat companion',      desc: "Conversations about today's build, in their language." },
  { icon: '🖐️',  color: '#ffd166', title: 'Gesture control',    desc: 'Wave to flip pages, snap to confirm — no controllers.' },
];

const MODES = [
  { bg: '#dbeafe', icon: '🤖', title: 'Robot Mode',    sub: 'Co-op with Lumi' },
  { bg: '#ede9fe', icon: '🧩', title: 'Puzzle Mode',   sub: 'Solo · Logic' },
  { bg: '#fce7f3', icon: '📖', title: 'Story Mode',    sub: '3-6 players' },
  { bg: '#fee2e2', icon: '⚔️',  title: 'Team Battle',  sub: '2 vs 2 friends' },
  { bg: '#fef3c7', icon: '🎨', title: 'Creativity',    sub: 'Open · No score' },
  { bg: '#fef9c3', icon: '🔐', title: 'Escape Room',   sub: 'Co-op · 45 min' },
  { bg: '#e0f2fe', icon: '💻', title: 'Coding Games',  sub: 'STEM · 7+' },
  { bg: '#dcfce7', icon: '🔵', title: 'Decisions',     sub: '1 vs Lumi' },
];

const SKILLS = [
  { label: 'Spatial reasoning', pct: 82, color: '#4caf82' },
  { label: 'Geometry',          pct: 77, color: '#4caf82' },
  { label: 'Pre-engineering',   pct: 69, color: '#ff6b6b' },
];
const SKILLS2 = [
  { label: 'Divergence',   pct: 91, color: '#7c5cfc' },
  { label: 'Originality',  pct: 86, color: '#7c5cfc' },
  { label: 'Combinations', pct: 77, color: '#7c5cfc' },
];
const SKILLS3 = [
  { label: 'Self-regulation', pct: 58, color: '#ff6b9d' },
  { label: 'Teamwork',        pct: 63, color: '#ff6b9d' },
  { label: 'Empathy cues',    pct: 49, color: '#ff6b9d' },
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

const LUMI_FEATURES = [
  { icon: '💾', color: '#7c5cfc', title: 'Remembers everything',  desc: 'Birthday wishes, favourite stories, the cousins who visit Sundays. Lumi keeps context so play feels personal.' },
  { icon: '🌡️',  color: '#ff6b9d', title: 'Reads the room',        desc: 'When focus dips or frustration rises, Lumi shifts tone — softer voice, easier challenge, a moment of breath.' },
  { icon: '🎙️',  color: '#4caf82', title: 'Voice you choose',      desc: 'Six warm voices, or upload a grandparent\'s voice with consent. Multilingual from day one.' },
  { icon: '🔒', color: '#ffd166', title: 'Private by design',      desc: 'Conversations never leave the table. No ads. No third-party tracking. Ever.' },
];

/* ─── Sub-components ────────────────────────────────────── */

const SectionLabel = ({ children }) => (
  <p style={{ fontFamily: 'Fredoka One', fontSize: '0.95rem', color: '#1a6cf0', marginBottom: 8, letterSpacing: 0.5 }}>
    {children}
  </p>
);

const SectionTitle = ({ children, italic, color = '#ff8c42' }) => (
  <h2 style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', color: '#1a1a2e', margin: '0 0 12px', lineHeight: 1.2 }}>
    {children[0]}{italic && <em style={{ color, fontStyle: 'italic' }}>{italic}</em>}{children[1] ?? ''}
  </h2>
);

const SkillBar = ({ label, pct, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: '0.82rem', color: '#374151', fontFamily: 'Fredoka One' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color, fontFamily: 'Fredoka One' }}>{pct}%</span>
    </div>
    <div style={{ height: 8, background: '#f0ece6', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 1s ease' }} />
    </div>
  </div>
);

/* ─── Main Component ────────────────────────────────────── */

export default function HomeScreen({ onStart }) {
  const [robotEmotion, setRobotEmotion] = useState('happy');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const seq = ['happy', 'excited', 'happy', 'thinking', 'happy', 'excited'];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % seq.length; setRobotEmotion(seq[i]); }, 3000);
    return () => clearInterval(t);
  }, []);

  const W = { maxWidth: 1180, margin: '0 auto', padding: '0 24px' };
  const card = { background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 18, padding: '1.4rem' };

  return (
    <div style={{ background: '#faf6ef', minHeight: '100vh', fontFamily: 'Nunito, Fredoka One, sans-serif', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,246,239,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e8e4de', padding: '0 24px' }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ fontFamily: 'Fredoka One', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ color: '#1a6cf0' }}>L</span>
            <span style={{ color: '#ffd166' }}>U</span>
            <span style={{ color: '#ff8c42' }}>M</span>
            <span style={{ color: '#00b4d8', fontSize: '1.1rem' }}>i</span>
            <span style={{ color: '#7c5cfc', marginLeft: 4 }}>A</span>
            <span style={{ color: '#ff8c42' }}>I</span>
            <span style={{ color: '#ffd166', marginLeft: 4, fontSize: '0.9rem' }}>✦</span>
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {NAV_LINKS.map((l, i) => (
              <a key={l} href="#" style={{ fontSize: '0.88rem', color: i === 0 ? '#1a6cf0' : '#374151', fontFamily: 'Fredoka One', textDecoration: 'none', borderBottom: i === 0 ? '2px solid #1a6cf0' : 'none', paddingBottom: 2 }}>
                {l}
              </a>
            ))}
          </div>
          <button onClick={onStart} style={{ background: '#1a6cf0', color: '#fff', border: 'none', borderRadius: 24, padding: '8px 20px', fontFamily: 'Fredoka One', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✦ Get Started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ ...W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', paddingTop: 60, paddingBottom: 0 }}>

        {/* Left */}
        <div>
          <h1 style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(4rem, 8vw, 6rem)', lineHeight: 1, margin: '0 0 20px', display: 'flex', alignItems: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ color: '#1a6cf0' }}>L</span>
            <span style={{ color: '#ffd166' }}>U</span>
            <span style={{ color: '#ff8c42' }}>M</span>
            <em style={{ color: '#00b4d8', fontStyle: 'italic', fontSize: '0.8em', marginBottom: 6 }}>i</em>
            <span style={{ marginLeft: 12, color: '#7c5cfc' }}>A</span>
            <span style={{ color: '#ff8c42' }}>I</span>
          </h1>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)', color: '#1a1a2e', margin: '0 0 4px' }}>
              Some Robots Follow Commands.
            </p>
            <p style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)', color: '#f0a500', fontStyle: 'italic', margin: 0 }}>
              Lumi Understands Minds.
            </p>
            <div style={{ width: 120, height: 3, background: '#f0a500', borderRadius: 4, marginTop: 8 }} />
          </div>

          <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.65, marginBottom: 28, maxWidth: 420 }}>
            Lumi AI is an intelligent robot that understands how your child thinks,
            discovers their unique potential, and creates a personalised learning path
            in STEAM, creativity and technology.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
            <button onClick={onStart} style={{ background: '#1a6cf0', color: '#fff', border: 'none', borderRadius: 28, padding: '12px 26px', fontFamily: 'Fredoka One', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              🚀 Explore Lumi AI
            </button>
            <button onClick={onStart} style={{ background: 'transparent', color: '#1a1a2e', border: '2px solid #1a1a2e', borderRadius: 28, padding: '12px 26px', fontFamily: 'Fredoka One', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              ▶ Watch Video
            </button>
          </div>

          {/* Children silhouettes */}
          <div style={{ display: 'flex', gap: 8, fontSize: '3.5rem', alignItems: 'flex-end' }}>
            <span title="Child">🧒</span>
            <span title="Child" style={{ marginBottom: 6 }}>👧</span>
          </div>
        </div>

        {/* Right — robot cloud */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          {/* Blue dashed cloud circle */}
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '2.5px dashed #93c5fd', background: 'rgba(219,234,254,0.35)', top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }} />

          {/* Speech bubbles */}
          {[
            { text: 'Think',   emoji: '🧠', top: '6%',  left: '2%'  },
            { text: 'Create',  emoji: '🎨', top: '6%',  right: '0%' },
            { text: 'Learn',   emoji: '📚', top: '38%', left: '0%'  },
            { text: 'Build',   emoji: '🏗️',  top: '70%', right: '4%' },
            { text: 'Explore', emoji: '🚀', top: '70%', left: '4%'  },
          ].map(({ text, emoji, ...pos }) => (
            <div key={text} style={{
              position: 'absolute', ...pos,
              background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 20,
              padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Fredoka One', fontSize: '0.82rem', color: '#1a1a2e',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              animation: 'float 3s ease-in-out infinite',
              animationDelay: `${Math.random() * 1.5}s`,
              zIndex: 2,
            }}>
              <span>{emoji}</span>{text}
            </div>
          ))}

          {/* Decorations */}
          <span style={{ position: 'absolute', top: '12%', right: '18%', fontSize: '1.4rem', animation: 'float 2s infinite alternate' }}>⭐</span>
          <span style={{ position: 'absolute', top: '24%', left: '14%', fontSize: '1rem', animation: 'float 2.5s infinite alternate' }}>💫</span>
          <span style={{ position: 'absolute', bottom: '28%', left: '10%', fontSize: '0.9rem', animation: 'float 1.8s infinite alternate' }}>✨</span>
          <span style={{ position: 'absolute', top: '8%', left: '28%', fontSize: '1.2rem', animation: 'float 2.2s infinite alternate' }}>💡</span>
          <span style={{ position: 'absolute', top: '4%', right: '30%', fontSize: '1.6rem', opacity: 0.6 }}>☁️</span>
          <span style={{ position: 'absolute', top: '2%', left: '8%', fontSize: '1.2rem', opacity: 0.5 }}>☁️</span>

          {/* Robot */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <LumiAvatar emotion={robotEmotion} size={200} speaking={false} />
          </div>

          {/* Castle */}
          <div style={{ position: 'absolute', bottom: 0, right: '2%', fontSize: '2.5rem', lineHeight: 1 }}>🏰</div>
          <div style={{ position: 'absolute', bottom: 10, right: '16%', fontSize: '1.8rem' }}>🌲</div>
        </div>
      </div>

      {/* ── GREEN GROUND STRIP ── */}
      <div style={{ background: '#4caf82', position: 'relative', marginTop: 20, overflow: 'hidden', height: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: '100%', background: 'rgba(255,255,255,0.15)', borderRadius: '4px 4px 0 0' }} />
        <span style={{ fontSize: '2.5rem', zIndex: 1 }}>🌳🌲🌸</span>
        <span style={{ fontSize: '2rem', zIndex: 1 }}>🌷🌳</span>
        <span style={{ fontSize: '2.5rem', zIndex: 1 }}>🌲🌸🌳</span>
      </div>

      {/* ── FEATURE BAR ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { emoji: '😊', color: '#4da6ff', title: 'Understands Your Child' },
            { emoji: '⭐', color: '#ffd166', title: 'Discovers Potential' },
            { emoji: '🎯', color: '#4caf82', title: 'Personalized Learning Path' },
            { emoji: '💙', color: '#ff6eb4', title: 'Supports Growth & Confidence' },
          ].map(({ emoji, color, title }, i) => (
            <div key={title} style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRight: i < 3 ? '1px solid #e8e4de' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{emoji}</div>
              <span style={{ fontFamily: 'Fredoka One', fontSize: '0.85rem', color: '#374151', lineHeight: 1.3 }}>{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ ...W }}>
          <SectionLabel>How it works ✨</SectionLabel>
          <SectionTitle italic="No tests.">{['Five steps. ', ' Just play.']}</SectionTitle>
          <p style={{ color: '#6b7280', marginBottom: 48, maxWidth: 520, fontSize: '1rem', lineHeight: 1.65 }}>
            Lumi is invisible from a child's point of view — they build and laugh, and Lumi quietly turns that into a growth map.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {STEPS.map(({ n, icon, color, title, desc }) => (
              <div key={n} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka One', fontSize: '1rem', flexShrink: 0 }}>{n}</div>
                <div style={{ fontSize: '2rem' }}>{icon}</div>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '1rem', color: '#1a1a2e', margin: 0 }}>{title}</p>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, lineHeight: 1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWELVE SENSES ── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ ...W }}>
          <SectionLabel>What Lumi can do /</SectionLabel>
          <SectionTitle italic="kind">{['Twelve senses, one ', ' conversation.']}</SectionTitle>
          <p style={{ color: '#6b7280', marginBottom: 48, maxWidth: 520, fontSize: '1rem', lineHeight: 1.65 }}>
            Lumi sees, hears, listens and learns — privately, on the table — to understand how your child grows.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {SENSES.map(({ icon, color, title, desc }) => (
              <div key={title} style={{ ...card }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 12 }}>{icon}</div>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '0.95rem', color: '#1a1a2e', margin: '0 0 6px' }}>{title}</p>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAGIC TABLE ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ ...W }}>
          <SectionLabel>The magic table 🍭</SectionLabel>
          <SectionTitle italic="sees">{['A table that ', ' what your child builds.']}</SectionTitle>
          <p style={{ color: '#6b7280', marginBottom: 40, maxWidth: 520, fontSize: '1rem', lineHeight: 1.65 }}>
            Hand-built from sustainable wood and tempered glass. Quiet enough for a bedroom, sturdy enough for a school. 1.20 m × 0.80 m.
          </p>
          <div style={{ ...card, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 700 }}>
                {/* Table illustration */}
                <div style={{ background: '#fef9c3', border: '2px dashed #fbbf24', borderRadius: 16, padding: '40px 60px', textAlign: 'center', position: 'relative', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'Fredoka One', color: '#92400e', fontSize: '1.1rem', margin: 0 }}>Story unfolds here<br /><span style={{ fontSize: '0.85rem', opacity: 0.7 }}>created in real time</span></p>
                  <span style={{ position: 'absolute', bottom: 20, left: '28%', fontSize: '2rem' }}>🧱</span>
                  <span style={{ position: 'absolute', bottom: 20, right: '28%', fontSize: '2rem' }}>🧱</span>
                </div>
                {/* Labels */}
                {[
                  { text: '🔵 Projector  visible', top: '10%', left: '-2%' },
                  { text: '🤖 Robotic plinth',     bottom: '15%', left: '-2%' },
                  { text: '📸 8 friendly cameras', top: '10%', right: '-2%' },
                  { text: '🌈 Rainbow LEDs (76 zones)', bottom: '15%', right: '-2%' },
                ].map(({ text, ...pos }) => (
                  <div key={text} style={{ position: 'absolute', ...pos, background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 10, padding: '4px 10px', fontSize: '0.75rem', fontFamily: 'Fredoka One', color: '#374151', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>{text}</div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, borderTop: '1px solid #e8e4de', paddingTop: 20 }}>
              {[['1200mm', 'long'], ['800mm', 'wide'], ['940mm', 'tall'], ['18kg', 'light'], ['< 35dB', 'quiet']].map(([val, unit]) => (
                <div key={val} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Fredoka One', fontSize: '1.3rem', color: '#1a1a2e' }}>{val}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EIGHT WAYS TO PLAY ── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ ...W }}>
          <SectionLabel>Let's play 🎮</SectionLabel>
          <SectionTitle italic="None feel like school.">{['Eight ways to play.\n', '']}</SectionTitle>
          <p style={{ color: '#6b7280', marginBottom: 48, maxWidth: 520, fontSize: '1rem', lineHeight: 1.65 }}>
            Modes adapt to age and ability. Lumi mixes them so it's never the same afternoon twice.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {MODES.map(({ bg, icon, title, sub }, i) => (
              <div key={title} style={{ borderRadius: 18, overflow: 'hidden', border: '1.5px solid #e8e4de', cursor: 'pointer' }} onClick={onStart}>
                <div style={{ background: bg, padding: '28px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.8rem', minHeight: 100 }}>{icon}</div>
                <div style={{ background: '#fff', padding: '14px 16px' }}>
                  <p style={{ fontFamily: 'Fredoka One', fontSize: '1rem', color: '#1a1a2e', margin: '0 0 3px' }}>{title}</p>
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0, fontFamily: 'Fredoka One' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEET LUMI ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          {/* Robot illustration area */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(219,234,254,0.4)', border: '2px dashed #93c5fd' }} />
            <LumiAvatar emotion={robotEmotion} size={190} speaking={true} />
            {/* Quote bubbles */}
            {[
              { text: "That tower is taller than last week! 🎉", top: '5%', left: '-10%' },
              { text: "New badge: Architect! 🏗️", top: '55%', right: '-8%' },
              { text: "I noticed you got frustrated. Let's breathe! 🌬️", bottom: '5%', left: '-4%' },
            ].map(({ text, ...pos }) => (
              <div key={text} style={{ position: 'absolute', ...pos, background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: '8px 14px', maxWidth: 160, fontSize: '0.78rem', color: '#374151', lineHeight: 1.4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 2 }}>{text}</div>
            ))}
          </div>

          {/* Feature list */}
          <div>
            <SectionLabel>Meet your new friend 🧡</SectionLabel>
            <SectionTitle italic="notices.">{['Lumi is a friend who ', '']}</SectionTitle>
            <p style={{ color: '#6b7280', marginBottom: 32, fontSize: '1rem', lineHeight: 1.65 }}>
              A warm companion that remembers what your child loves, gently steps in when they're stuck, and celebrates every small win.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {LUMI_FEATURES.map(({ icon, color, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}22`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <p style={{ fontFamily: 'Fredoka One', fontSize: '1rem', color: '#1a1a2e', margin: '0 0 4px' }}>{title}</p>
                    <p style={{ fontSize: '0.83rem', color: '#6b7280', margin: 0, lineHeight: 1.55 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GROWTH MAP ── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ ...W }}>
          <SectionLabel>A growth map 🗺️</SectionLabel>
          <SectionTitle italic="actually">{['Watch your child ', ' grow.']}</SectionTitle>
          <p style={{ color: '#6b7280', marginBottom: 48, maxWidth: 560, fontSize: '1rem', lineHeight: 1.65 }}>
            Lumi tracks development across 96 domains, mapped to the OECD Future of Education framework. No grades, no rankings — only growth.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
            {[
              { title: '🔧 STEM foundations',   skills: SKILLS,  icon: '🔧', color: '#4caf82' },
              { title: '✨ Creative thinking',   skills: SKILLS2, icon: '✨', color: '#7c5cfc' },
              { title: '❤️ Social-emotional',   skills: SKILLS3, icon: '❤️',  color: '#ff6b9d' },
            ].map(({ title, skills, color }) => (
              <div key={title} style={{ ...card }}>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '1rem', color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: `${color}22`, border: `1.5px solid ${color}55`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>+</span>
                  {title.slice(3)}
                </p>
                {skills.map(s => <SkillBar key={s.label} {...s} />)}
                <p style={{ fontSize: '0.76rem', color: '#9ca3af', margin: '10px 0 0', fontFamily: 'Fredoka One' }}>↑ Trending up · +11 this week</p>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem', color: '#1a1a2e', marginBottom: 20 }}>Badges your child unlocks ✨</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {BADGES.map(({ icon, label, sub }) => (
              <div key={label} style={{ ...card, padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 110, textAlign: 'center' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid #e8e4de', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>{icon}</div>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '0.88rem', color: '#1a1a2e', margin: 0 }}>{label}</p>
                <p style={{ fontSize: '0.74rem', color: '#9ca3af', margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROBOTS TEACH BACK ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          {/* Illustration */}
          <div style={{ ...card, padding: '2rem', position: 'relative', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: 12 }}>🦾</span>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', fontSize: '2.2rem' }}>
                <span>🧱</span><span>🧱</span><span>🧱</span>
              </div>
            </div>
            <div style={{ position: 'absolute', top: 16, left: 16, background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 10, padding: '4px 12px', fontSize: '0.75rem', fontFamily: 'Fredoka One', color: '#374151' }}>🤖 Lumi Arm · 4 joints</div>
            <div style={{ position: 'absolute', bottom: 16, right: 16, background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 10, padding: '4px 12px', fontSize: '0.75rem', fontFamily: 'Fredoka One', color: '#374151' }}>🔊 Quiet & safe</div>
          </div>

          {/* Steps */}
          <div>
            <SectionLabel>When the table builds back 🤖</SectionLabel>
            <SectionTitle italic="teaches.">{['Robots that your child ', '']}</SectionTitle>
            <p style={{ color: '#6b7280', marginBottom: 28, fontSize: '1rem', lineHeight: 1.65 }}>
              Lumi includes a magnetic robotic plinth and modular arms. Children program them with gestures, voice or LEGO — and the table responds in real space.
            </p>
            {[
              { n: 1, color: '#ff8c42', title: 'Teach by showing',   desc: "Wave your hands or move a brick. Lumi watches, replays, then asks if your child can do it backwards." },
              { n: 2, color: '#4caf82', title: 'Magnetic mounts',    desc: 'Compatible with every standard LEGO brick. Magnetised base plates keep builds stable as the table moves.' },
              { n: 3, color: '#1a6cf0', title: 'Safe by design',     desc: 'Force-limited joints. Capacitive shutdown if a child gets too close. Quiet under 30 decibels.' },
              { n: 4, color: '#7c5cfc', title: 'Three ways to code', desc: 'Drag-and-drop blocks, voice commands, or LEGO sequence cards. All three can mix in one session.' },
            ].map(({ n, color, title, desc }) => (
              <div key={n} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka One', fontSize: '0.9rem', flexShrink: 0 }}>{n}</div>
                <div>
                  <p style={{ fontFamily: 'Fredoka One', fontSize: '0.95rem', color: '#1a1a2e', margin: '0 0 3px' }}>{title}</p>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ ...W, maxWidth: 780 }}>
          <SectionLabel>Questions parents ask 🐙</SectionLabel>
          <SectionTitle italic="parents ask first.">{['The things ', '']}</SectionTitle>
          <p style={{ color: '#6b7280', marginBottom: 40, fontSize: '1rem', lineHeight: 1.65 }}>
            Not here? Write hello@lumi.school — a human replies within a day.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map(({ q, a }, i) => (
              <div key={i} style={{ ...card, padding: '1.2rem 1.4rem', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <p style={{ fontFamily: 'Fredoka One', fontSize: '0.95rem', color: '#1a1a2e', margin: 0 }}>{q}</p>
                  <span style={{ fontSize: '1.1rem', color: '#9ca3af', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>▼</span>
                </div>
                {openFaq === i && (
                  <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: '12px 0 0', lineHeight: 1.65 }}>{a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS CTA ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ ...W }}>
          <div style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', padding: '2.5rem' }}>
            <div>
              <SectionLabel>Early access · spring 2026 🚀</SectionLabel>
              <h2 style={{ fontFamily: 'Fredoka One', fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#1a1a2e', margin: '0 0 12px', lineHeight: 1.2 }}>
                Be on the <em style={{ color: '#ff8c42', fontStyle: 'italic' }}>first</em> table.
              </h2>
              <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '1rem', lineHeight: 1.65 }}>
                We're shipping 1,000 Lumi tables in spring 2026. Early adopters get 30% off and a year of premium curriculum.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={onStart} style={{ background: '#1a6cf0', color: '#fff', border: 'none', borderRadius: 28, padding: '12px 24px', fontFamily: 'Fredoka One', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🤖 Reserve a Lumi
                </button>
                <button onClick={onStart} style={{ background: 'transparent', color: '#1a1a2e', border: '2px solid #1a1a2e', borderRadius: 28, padding: '12px 24px', fontFamily: 'Fredoka One', fontSize: '1rem', cursor: 'pointer' }}>
                  Book a school pilot
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['3,247', 'families on the waitlist'], ['86', 'partner schools signed'], ['24', 'countries reached']].map(([num, label]) => (
                <div key={num} style={{ ...card, padding: '1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Fredoka One', fontSize: '1.8rem', color: '#1a6cf0' }}>{num}</span>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e8e4de', padding: '48px 24px 32px' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 32, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'Fredoka One', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12 }}>
              <span style={{ color: '#1a6cf0' }}>L</span><span style={{ color: '#ffd166' }}>U</span>
              <span style={{ color: '#ff8c42' }}>M</span><em style={{ color: '#00b4d8', fontStyle: 'italic' }}>i</em>
              <span style={{ color: '#7c5cfc', marginLeft: 4 }}>A</span><span style={{ color: '#ff8c42' }}>I</span>
              <span style={{ color: '#ffd166', marginLeft: 4 }}>✦</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6, maxWidth: 200 }}>
              A new kind of classroom — where children build with their hands and the table listens. Made with love in Lisbon and Berlin.
            </p>
            <a href="#" style={{ fontSize: '0.8rem', color: '#1a6cf0', textDecoration: 'none', fontFamily: 'Fredoka One' }}>hello@lumi.school</a>
          </div>
          {/* Link columns */}
          {[
            { title: 'Product',  links: ['The Table', 'AI Companion', 'Game Modes', 'Robotics', 'Curriculum'] },
            { title: 'For',      links: ['Parents', 'Schools', 'Therapists', 'Researchers'] },
            { title: 'Company',  links: ['About us', 'Research', 'Press', 'Careers', 'Contact'] },
            { title: 'Legal',    links: ['Privacy', 'Data ethics', 'Terms', 'GDPR / COPPA'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p style={{ fontFamily: 'Fredoka One', fontSize: '0.9rem', color: '#1a1a2e', margin: '0 0 12px' }}>{title}</p>
              {links.map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none', marginBottom: 8, lineHeight: 1.4 }}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #e8e4de', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>© 2026 Lumi Labs · Made with crayons.</span>
          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>✦ built with care in 2 cities ✦</span>
          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>v3.2 · builds &amp; happy</span>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-10px); }
        }
        @media (max-width: 900px) {
          section > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
