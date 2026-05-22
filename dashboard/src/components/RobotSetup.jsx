import React, { useState, useEffect, useCallback } from 'react';

const C = {
  cream: '#faf6ef', white: '#fff', dark: '#1a1a2e',
  gray: '#6b7280',  muted: '#9ca3af', border: '#e8e4de',
  blue: '#1a6cf0',  green: '#4caf82', red: '#ff4757',
  orange: '#ff8c42', yellow: '#ffd166', purple: '#7c5cfc',
};

const API = () => localStorage.getItem('lumi_api_url') || 'http://localhost:8000';

/* ─── tiny helpers ─────────────────────────────────── */
const Badge = ({ ok, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 20,
    background: ok ? '#dcfce7' : '#fee2e2',
    color: ok ? '#15803d' : '#b91c1c',
    fontFamily: 'Fredoka One', fontSize: '0.78rem',
  }}>{children}</span>
);

const Pill = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontFamily: 'Fredoka One', fontSize: '1rem', color }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: C.muted }}>{label}</div>
  </div>
);

/* ─── Direct-control joystick ──────────────────────── */
function ControlPad({ robotId, apiBase, disabled }) {
  const [busy, setBusy] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const send = async (cmd) => {
    if (busy) return;
    setBusy(cmd);
    setLastResult(null);
    try {
      const res = await fetch(`${apiBase}/api/robots/${encodeURIComponent(robotId)}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      setLastResult(data.ok ? { ok: true, msg: `✓ ${cmd} sent` } : { ok: false, msg: data.error || 'Error' });
    } catch {
      setLastResult({ ok: false, msg: 'Connection failed' });
    }
    setBusy(null);
  };

  const Btn = ({ cmd, label, color = C.blue, size = 52 }) => (
    <button
      onClick={() => send(cmd)}
      disabled={disabled || !!busy}
      title={cmd}
      style={{
        width: size, height: size, borderRadius: 12,
        background: busy === cmd ? `${color}cc` : color,
        color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Fredoka One', fontSize: '1.1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        transform: busy === cmd ? 'scale(0.94)' : 'scale(1)',
      }}
    >{label}</button>
  );

  return (
    <div>
      <p style={{ fontFamily: 'Fredoka One', fontSize: '0.82rem', color: C.muted, margin: '0 0 12px', textAlign: 'center' }}>
        DIRECT CONTROL {disabled && '— connect a robot first'}
      </p>

      {/* D-pad layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '52px 52px 52px', gridTemplateRows: '52px 52px 52px', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
        {/* Row 1 */}
        <div />
        <Btn cmd="forward"    label="▲" />
        <div />
        {/* Row 2 */}
        <Btn cmd="turn_left"  label="↺" color={C.orange} />
        <Btn cmd="stop"       label="■" color={C.red} />
        <Btn cmd="turn_right" label="↻" color={C.orange} />
        {/* Row 3 */}
        <div />
        <Btn cmd="celebrate"  label="🎉" color={C.purple} />
        <div />
      </div>

      {lastResult && (
        <p style={{
          textAlign: 'center', fontFamily: 'Fredoka One', fontSize: '0.8rem',
          color: lastResult.ok ? C.green : C.red, margin: '4px 0 0',
        }}>{lastResult.msg}</p>
      )}
    </div>
  );
}

/* ─── Single robot card ────────────────────────────── */
function RobotCard({ robotId, telemetry, apiBase }) {
  const battV  = telemetry?.battery_v;
  const obstCm = telemetry?.obstacle_cm;
  const isExec = telemetry?.executing;

  const battPct = battV ? Math.round(Math.min(100, Math.max(0, (battV - 6.5) / (8.4 - 6.5) * 100))) : null;
  const battColor = battPct == null ? C.muted : battPct > 50 ? C.green : battPct > 20 ? C.orange : C.red;

  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '1.2rem', marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.4rem' }}>🤖</span>
          <span style={{ fontFamily: 'Fredoka One', fontSize: '0.95rem', color: C.dark }}>{robotId}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isExec && <Badge ok>▶ Running</Badge>}
          <Badge ok>● Online</Badge>
        </div>
      </div>

      {/* Telemetry row */}
      {telemetry && Object.keys(telemetry).length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#faf6ef', borderRadius: 12, padding: '10px 8px', marginBottom: 16 }}>
          <Pill label="Battery" value={battPct != null ? `${battPct}%` : '--'} color={battColor} />
          <Pill label="Voltage" value={battV ? `${battV.toFixed(1)}V` : '--'} color={C.blue} />
          <Pill label="Obstacle" value={obstCm ? (obstCm > 80 ? 'Clear' : `${Math.round(obstCm)}cm`) : '--'} color={obstCm && obstCm < 10 ? C.red : C.green} />
        </div>
      )}

      {/* Control pad */}
      <ControlPad robotId={robotId} apiBase={apiBase} disabled={false} />
    </div>
  );
}

/* ─── Firmware snippet panel ───────────────────────── */
function FirmwareGuide({ serverIp, serverPort }) {
  const [copied, setCopied] = useState(false);
  const snippet = `const char* WIFI_SSID     = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPass";
const char* SERVER_HOST   = "${serverIp}";
const int   SERVER_PORT   = ${serverPort};
const char* SERVER_PATH   = "/ws/robot";
const char* ROBOT_ID      = "lumi-bot-1";`;

  const copy = () => {
    navigator.clipboard?.writeText(snippet).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ background: '#f8f9fa', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '1rem', marginTop: 16 }}>
      <p style={{ fontFamily: 'Fredoka One', fontSize: '0.85rem', color: C.dark, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
        📋 Paste into <code style={{ background: '#e8e4de', borderRadius: 4, padding: '1px 6px', fontSize: '0.78rem' }}>lumi_robot.ino</code>
      </p>
      <pre style={{ background: '#1a1a2e', color: '#4ade80', borderRadius: 10, padding: '0.8rem', fontSize: '0.72rem', overflowX: 'auto', margin: '0 0 8px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {snippet}
      </pre>
      <button onClick={copy} style={{ fontFamily: 'Fredoka One', fontSize: '0.8rem', background: copied ? C.green : C.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '6px 14px', cursor: 'pointer' }}>
        {copied ? '✓ Copied!' : '📋 Copy snippet'}
      </button>
    </div>
  );
}

/* ─── Main component ────────────────────────────────── */
export default function RobotSetup({ onSave, onSkip, currentIP = '', robotStatus = null }) {
  const [ip,       setIp]       = useState(() => localStorage.getItem('lumi_robot_ip') || '192.168.1.100');
  const [port,     setPort]     = useState('8000');
  const [scanning, setScanning] = useState(false);
  const [robots,   setRobots]   = useState(robotStatus?.robots || []);
  const [telemetry,setTelemetry]= useState(robotStatus?.telemetry || {});
  const [scanErr,  setScanErr]  = useState(null);
  const [tab,      setTab]      = useState('control'); // 'control' | 'setup'

  const apiBase = `http://${ip}:${port}`;

  const scan = useCallback(async () => {
    setScanning(true);
    setScanErr(null);
    try {
      const res = await fetch(`${apiBase}/api/robots`, { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      setRobots(data.robots || []);
      setTelemetry(data.telemetry || {});
    } catch {
      setScanErr('Cannot reach server — check IP and port.');
    }
    setScanning(false);
  }, [apiBase]);

  // Auto-scan on mount
  useEffect(() => { scan(); }, []);

  // Refresh every 5s if panel is open
  useEffect(() => {
    const t = setInterval(scan, 5000);
    return () => clearInterval(t);
  }, [scan]);

  const handleSave = () => {
    localStorage.setItem('lumi_robot_ip',  ip);
    localStorage.setItem('lumi_api_url',   apiBase);
    onSave(apiBase);
  };

  const isConnected = robots.length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: C.white, border: `2px solid ${C.border}`,
        borderRadius: 24, width: '100%', maxWidth: 520,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        fontFamily: "'Nunito', sans-serif",
      }}>
        {/* ── Header ── */}
        <div style={{ background: isConnected ? '#dcfce7' : '#faf6ef', borderRadius: '22px 22px 0 0', padding: '1.4rem 1.6rem', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'Fredoka One', fontSize: '1.3rem', color: C.dark, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                🤖 ESP32 Robot Connection
              </div>
              <div style={{ fontSize: '0.83rem', color: C.gray }}>
                {isConnected
                  ? `${robots.length} robot${robots.length > 1 ? 's' : ''} online — ready to roll!`
                  : 'Configure the Lumi server and flash your ESP32'}
              </div>
            </div>
            <Badge ok={isConnected}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? '#15803d' : '#b91c1c', display: 'inline-block' }} />
              {isConnected ? 'Connected' : 'No robot'}
            </Badge>
          </div>
        </div>

        <div style={{ padding: '1.4rem 1.6rem' }}>

          {/* ── Server URL ── */}
          <div style={{ background: '#faf6ef', borderRadius: 14, padding: '0.9rem 1rem', marginBottom: 16 }}>
            <p style={{ fontFamily: 'Fredoka One', fontSize: '0.82rem', color: C.muted, margin: '0 0 8px' }}>LUMI SERVER</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: C.gray }}>http://</span>
              <input
                value={ip} onChange={e => setIp(e.target.value)}
                style={{ flex: '1 1 120px', minWidth: 120, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontFamily: 'Fredoka One', fontSize: '0.88rem', color: C.dark, background: C.white }}
                placeholder="192.168.1.100"
              />
              <span style={{ fontSize: '0.85rem', color: C.gray }}>:</span>
              <input
                value={port} onChange={e => setPort(e.target.value)}
                style={{ width: 68, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontFamily: 'Fredoka One', fontSize: '0.88rem', color: C.dark, background: C.white }}
                placeholder="8000"
              />
              <button onClick={scan} disabled={scanning} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '6px 14px', fontFamily: 'Fredoka One', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {scanning ? '⏳' : '🔍 Scan'}
              </button>
            </div>
            {scanErr && <p style={{ color: C.red, fontSize: '0.78rem', margin: '6px 0 0', fontFamily: 'Fredoka One' }}>⚠ {scanErr}</p>}
          </div>

          {/* ── Tab bar ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['control', 'setup'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px', borderRadius: 12,
                fontFamily: 'Fredoka One', fontSize: '0.85rem',
                border: `2px solid ${tab === t ? C.blue : C.border}`,
                background: tab === t ? C.blue : 'transparent',
                color: tab === t ? '#fff' : C.gray,
                cursor: 'pointer',
              }}>
                {t === 'control' ? '🕹️ Control' : '📋 Setup Guide'}
              </button>
            ))}
          </div>

          {/* ── CONTROL TAB ── */}
          {tab === 'control' && (
            <>
              {robots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: C.muted }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>📡</div>
                  <p style={{ fontFamily: 'Fredoka One', fontSize: '0.95rem', color: C.gray, marginBottom: 6 }}>No robots detected yet</p>
                  <p style={{ fontSize: '0.82rem', color: C.muted, margin: 0 }}>Flash your ESP32 firmware and power it on.<br />It will auto-connect within seconds.</p>
                </div>
              ) : (
                robots.map(rid => (
                  <RobotCard key={rid} robotId={rid} telemetry={telemetry[rid] || {}} apiBase={apiBase} />
                ))
              )}
            </>
          )}

          {/* ── SETUP TAB ── */}
          {tab === 'setup' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
                {[
                  { n: 1, color: C.blue,   icon: '📦', title: 'Install Arduino libraries',    desc: 'ArduinoWebsockets (gilmaimon) · ArduinoJson (bblanchon) · FastLED' },
                  { n: 2, color: C.orange, icon: '🔌', title: 'Wire the hardware',             desc: 'L298N motor driver + encoders (pins 25-27, 14, 12-13, 34-35) + HC-SR04 (5, 18) + WS2812B ring (pin 4)' },
                  { n: 3, color: C.green,  icon: '✏️',  title: 'Edit firmware config',          desc: 'Copy the snippet below into lumi_robot.ino — set your WiFi name, password, and server IP.' },
                  { n: 4, color: C.purple, icon: '⚡', title: 'Flash & power on',              desc: 'Upload to ESP32-WROOM-32. Open Serial Monitor (115200 baud). Watch for "Registered with server!"' },
                  { n: 5, color: C.blue,   icon: '🎮', title: 'Control from the dashboard',    desc: 'Click the WiFi icon in the top strip to open this panel. Hit the D-pad to test movement.' },
                ].map(({ n, color, icon, title, desc }) => (
                  <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#faf6ef', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka One', fontSize: '0.88rem', flexShrink: 0, marginTop: 1 }}>{n}</div>
                    <div>
                      <p style={{ fontFamily: 'Fredoka One', fontSize: '0.9rem', color: C.dark, margin: '0 0 2px' }}>{icon} {title}</p>
                      <p style={{ fontSize: '0.78rem', color: C.gray, margin: 0, lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* LED legend */}
              <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '0.9rem 1rem', marginTop: 12 }}>
                <p style={{ fontFamily: 'Fredoka One', fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 8px' }}>LED STATUS MEANINGS</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  {[
                    ['🟣', 'Boot / Ready'],   ['🔵', 'Moving forward'],
                    ['🔵', 'Turning'],        ['🟡', 'Turn left'],
                    ['🟢', 'Connected / OK'], ['🔴', 'Error / Offline'],
                    ['🟠', 'Emergency stop'], ['🌈', 'Celebration!'],
                  ].map(([dot, label]) => (
                    <span key={label} style={{ fontSize: '0.76rem', color: '#d1d5db', fontFamily: 'Fredoka One' }}>
                      {dot} {label}
                    </span>
                  ))}
                </div>
              </div>

              <FirmwareGuide serverIp={ip} serverPort={port} />
            </div>
          )}

          {/* ── Footer buttons ── */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <button onClick={handleSave} style={{ flex: 1, background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '11px', fontFamily: 'Fredoka One', fontSize: '0.92rem', cursor: 'pointer' }}>
              ✓ Save & Connect
            </button>
            <button onClick={onSkip} style={{ background: 'transparent', color: C.gray, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '11px 18px', fontFamily: 'Fredoka One', fontSize: '0.92rem', cursor: 'pointer' }}>
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
