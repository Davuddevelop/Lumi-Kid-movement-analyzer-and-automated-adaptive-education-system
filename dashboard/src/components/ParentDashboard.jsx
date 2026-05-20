import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SKILLS = ['Logic', 'Creativity', 'Persistence', 'Spatial', 'Speed', 'Teamwork'];
const DEMO_SKILLS = { Logic: 72, Creativity: 85, Persistence: 60, Spatial: 78, Speed: 65, Teamwork: 55 };
const DEMO_WEEKLY = [3, 5, 2, 8, 4, 6, 3];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEMO_MISSIONS = [
  { name: 'Space Launch', result: true, stars: 3, date: '2026-05-19' },
  { name: 'Crystal Path', result: true, stars: 2, date: '2026-05-18' },
  { name: 'Robot March', result: false, stars: 0, date: '2026-05-17' },
  { name: 'Loop Master', result: true, stars: 3, date: '2026-05-16' },
  { name: 'Star Climb', result: true, stars: 1, date: '2026-05-15' },
];

const styles = `
  .pd-wrap {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg-space);
    -webkit-overflow-scrolling: touch;
    font-family: 'Nunito', sans-serif;
    color: var(--text-main);
  }
  .pd-inner {
    max-width: 720px;
    margin: 0 auto;
    padding: 20px 16px 60px;
  }

  /* Header */
  .pd-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .pd-back-btn {
    min-width: 60px;
    min-height: 60px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    color: var(--text-main);
    font-size: 1.4rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    flex-shrink: 0;
  }
  .pd-back-btn:hover { background: rgba(124,92,252,0.2); }
  .pd-title {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.9rem;
    color: var(--text-main);
    margin: 0;
    flex: 1;
  }
  .pd-child-badge {
    background: linear-gradient(135deg, rgba(124,92,252,0.3), rgba(78,205,196,0.2));
    border: 1px solid rgba(124,92,252,0.4);
    border-radius: 20px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
  }
  .pd-level-badge {
    background: var(--primary);
    color: #fff;
    border-radius: 10px;
    padding: 2px 8px;
    font-family: 'Fredoka One', sans-serif;
    font-size: 0.85rem;
  }

  /* Section heading */
  .pd-section-title {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.3rem;
    color: var(--text-main);
    margin: 28px 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Stats row */
  .pd-stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (min-width: 540px) {
    .pd-stats-row { grid-template-columns: repeat(4, 1fr); }
  }
  .pd-stat-card {
    background: linear-gradient(135deg, rgba(26,21,53,0.7) 0%, rgba(19,15,42,0.6) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 18px 12px;
    text-align: center;
    box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  }
  .pd-stat-emoji { font-size: 1.6rem; margin-bottom: 6px; }
  .pd-stat-num {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.9rem;
    color: var(--text-main);
    line-height: 1;
  }
  .pd-stat-label {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: 4px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Charts container */
  .pd-charts-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 600px) {
    .pd-charts-row { grid-template-columns: 1fr 1fr; }
  }
  .pd-chart-card {
    background: linear-gradient(135deg, rgba(26,21,53,0.7) 0%, rgba(19,15,42,0.6) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 18px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  }
  .pd-chart-title {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1rem;
    color: var(--text-muted);
    margin: 0 0 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.85rem;
  }

  /* AI Report */
  .pd-report-card {
    background: linear-gradient(135deg, rgba(124,92,252,0.15) 0%, rgba(19,15,42,0.6) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(124,92,252,0.3);
    border-radius: 20px;
    padding: 22px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  }
  .pd-report-text {
    font-size: 0.97rem;
    line-height: 1.7;
    color: var(--text-main);
    font-weight: 600;
  }
  .pd-skeleton-line {
    background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.06) 75%);
    background-size: 200% 100%;
    animation: pd-shimmer 1.4s infinite;
    border-radius: 8px;
    height: 16px;
    margin-bottom: 10px;
  }
  @keyframes pd-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Missions list */
  .pd-missions-card {
    background: linear-gradient(135deg, rgba(26,21,53,0.7) 0%, rgba(19,15,42,0.6) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 18px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  }
  .pd-mission-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-size: 0.92rem;
  }
  .pd-mission-row:last-child { border-bottom: none; }
  .pd-mission-name { flex: 1; font-weight: 700; }
  .pd-mission-date { color: var(--text-muted); font-size: 0.8rem; }
  .pd-mission-stars { letter-spacing: 1px; font-size: 0.85rem; }

  /* Recommendations */
  .pd-recs-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .pd-rec-card {
    background: linear-gradient(135deg, rgba(26,21,53,0.65) 0%, rgba(19,15,42,0.5) 100%);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 16px 18px;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pd-rec-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
`;

/* ─── Radar Chart ─────────────────────────────────── */
function RadarChart({ scores }) {
  const cx = 130, cy = 130, r = 90;
  const n = SKILLS.length;

  function polarToXY(angle, radius) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function hexPoints(radius) {
    return SKILLS.map((_, i) => {
      const angle = (360 / n) * i;
      const p = polarToXY(angle, radius);
      return `${p.x},${p.y}`;
    }).join(' ');
  }

  const dataPoints = SKILLS.map((skill, i) => {
    const angle = (360 / n) * i;
    const val = (scores[skill] || 0) / 100;
    return polarToXY(angle, r * val);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={260} height={260} style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#4ecdc4" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Grid hexagons at 33%, 66%, 100% */}
      {[0.33, 0.66, 1.0].map((pct, gi) => (
        <polygon
          key={gi}
          points={hexPoints(r * pct)}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {SKILLS.map((_, i) => {
        const angle = (360 / n) * i;
        const outer = polarToXY(angle, r);
        return (
          <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        );
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="url(#radarGrad)" stroke="#7c5cfc" strokeWidth={2} />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#7c5cfc" stroke="#fff" strokeWidth={1.5} />
      ))}

      {/* Labels */}
      {SKILLS.map((skill, i) => {
        const angle = (360 / n) * i;
        const lp = polarToXY(angle, r + 22);
        const score = scores[skill] || 0;
        return (
          <g key={i}>
            <text
              x={lp.x} y={lp.y - 3}
              textAnchor="middle"
              fontSize="10"
              fill="#c4b5fd"
              fontFamily="Nunito, sans-serif"
              fontWeight="700"
            >
              {skill}
            </text>
            <text
              x={lp.x} y={lp.y + 11}
              textAnchor="middle"
              fontSize="10"
              fill="#7c5cfc"
              fontFamily="Fredoka One, sans-serif"
            >
              {score}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Bar Chart ──────────────────────────────────── */
function BarChart({ data }) {
  const W = 300, H = 150;
  const padL = 20, padR = 10, padT = 24, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(...data, 1);
  const barW = Math.floor(chartW / data.length) - 6;

  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cfc" />
          <stop offset="100%" stopColor="#4ecdc4" />
        </linearGradient>
      </defs>
      {/* Baseline */}
      <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH}
        stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

      {data.map((val, i) => {
        const barH = (val / maxVal) * chartH;
        const x = padL + i * (chartW / data.length) + 3;
        const y = padT + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH}
              fill="url(#barGrad)" rx={4} />
            {/* Count label above */}
            <text x={x + barW / 2} y={y - 5} textAnchor="middle"
              fontSize="10" fill="#c4b5fd" fontFamily="Fredoka One, sans-serif">
              {val}
            </text>
            {/* Day label below */}
            <text x={x + barW / 2} y={padT + chartH + 16} textAnchor="middle"
              fontSize="10" fill="rgba(155,143,194,0.8)" fontFamily="Nunito, sans-serif" fontWeight="700">
              {DAYS[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Main Component ─────────────────────────────── */
export default function ParentDashboard({ onBack }) {
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/parent/stats`)
      .then(r => r.json())
      .then(d => { setStats(d); setStatsLoading(false); })
      .catch(() => { setStats(null); setStatsLoading(false); });

    fetch(`${API_BASE}/api/parent/report`)
      .then(r => r.json())
      .then(d => { setReport(d); setReportLoading(false); })
      .catch(() => { setReport(null); setReportLoading(false); });
  }, []);

  const childName = stats?.child_name || 'Your Child';
  const childLevel = stats?.level || 1;
  const totalMissions = stats?.total_missions ?? 24;
  const successRate = stats?.success_rate ?? 78;
  const totalXP = stats?.total_xp ?? 1240;
  const badgesEarned = stats?.badges_earned ?? 7;
  const skillScores = stats?.skills || DEMO_SKILLS;
  const weeklyData = stats?.weekly_missions || DEMO_WEEKLY;
  const missions = stats?.recent_missions || DEMO_MISSIONS;
  const reportText = report?.text || report?.report ||
    "Your child is making great progress! They've shown strong creativity and logic skills this week. Consider encouraging more loop-based challenges to round out their learning journey.";

  return (
    <>
      <style>{styles}</style>
      <div className="pd-wrap">
        <div className="pd-inner">

          {/* A. Header */}
          <div className="pd-header">
            <button className="pd-back-btn" onClick={onBack} aria-label="Go back">←</button>
            <h1 className="pd-title">Parent View</h1>
            <div className="pd-child-badge">
              <span>👤</span>
              <span style={{ fontWeight: 700 }}>{childName}</span>
              <span className="pd-level-badge">Lvl {childLevel}</span>
            </div>
          </div>

          {/* B. Stats Row */}
          <div className="pd-stats-row">
            {[
              { emoji: '🚀', value: statsLoading ? '…' : totalMissions, label: 'Total Missions' },
              { emoji: '🎯', value: statsLoading ? '…' : `${successRate}%`, label: 'Success Rate' },
              { emoji: '⭐', value: statsLoading ? '…' : totalXP.toLocaleString(), label: 'Total XP' },
              { emoji: '🏆', value: statsLoading ? '…' : badgesEarned, label: 'Badges Earned' },
            ].map(card => (
              <div key={card.label} className="pd-stat-card">
                <div className="pd-stat-emoji">{card.emoji}</div>
                <div className="pd-stat-num">{card.value}</div>
                <div className="pd-stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* C & D. Charts */}
          <p className="pd-section-title">📊 Skills &amp; Activity</p>
          <div className="pd-charts-row">
            <div className="pd-chart-card">
              <p className="pd-chart-title">Skill Radar</p>
              <RadarChart scores={skillScores} />
            </div>
            <div className="pd-chart-card">
              <p className="pd-chart-title">Weekly Missions</p>
              <BarChart data={weeklyData} />
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>
                Total this week: {weeklyData.reduce((a, b) => a + b, 0)} missions
              </p>
            </div>
          </div>

          {/* E. AI Report */}
          <p className="pd-section-title">🤖 Lumi's Weekly Report</p>
          <div className="pd-report-card">
            {reportLoading ? (
              <>
                <div className="pd-skeleton-line" style={{ width: '90%' }} />
                <div className="pd-skeleton-line" style={{ width: '75%' }} />
                <div className="pd-skeleton-line" style={{ width: '60%' }} />
              </>
            ) : (
              <p className="pd-report-text">{reportText}</p>
            )}
          </div>

          {/* F. Recent Missions */}
          <p className="pd-section-title">📋 Recent Missions</p>
          <div className="pd-missions-card">
            {missions.slice(0, 5).map((m, i) => (
              <div key={i} className="pd-mission-row">
                <span style={{ fontSize: '1.1rem' }}>{m.result ? '✅' : '❌'}</span>
                <span className="pd-mission-name">{m.name || `Level ${i + 1}`}</span>
                <span className="pd-mission-stars">
                  {Array.from({ length: 3 }).map((_, si) =>
                    <span key={si} style={{ opacity: si < (m.stars || 0) ? 1 : 0.25 }}>⭐</span>
                  )}
                </span>
                <span className="pd-mission-date">{m.date || '—'}</span>
              </div>
            ))}
          </div>

          {/* G. Recommendations */}
          <p className="pd-section-title">💡 Recommendations</p>
          <div className="pd-recs-grid">
            {[
              { text: 'Focus on loop challenges this week 🔄', color: '#7c5cfc' },
              { text: 'Try the creativity missions for a change 🎨', color: '#4ecdc4' },
              { text: 'Great persistence! Keep the streak going 🔥', color: '#ff9f43' },
            ].map((rec, i) => (
              <div key={i} className="pd-rec-card">
                <div className="pd-rec-dot" style={{ background: rec.color }} />
                {rec.text}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
