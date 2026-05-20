import React, { useState } from 'react';

export default function RobotSetup({ onSave, onSkip, currentIP = '' }) {
  const [ip, setIp] = useState(currentIP || '192.168.1.100');
  const [port, setPort] = useState('8000');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [robotCount, setRobotCount] = useState(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch(`http://${ip}:${port}/api/robots`, { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : 0;
      setRobotCount(count);
      setResult({ ok: true, msg: count > 0 ? `${count} robot(s) connected!` : 'Server reached — no robots yet.' });
    } catch {
      setResult({ ok: false, msg: 'Cannot reach server. Check IP, port, and WiFi.' });
    }
    setTesting(false);
  };

  const handleSave = () => {
    localStorage.setItem('lumi_robot_ip', ip);
    localStorage.setItem('lumi_api_url', `http://${ip}:${port}`);
    onSave(`http://${ip}:${port}`);
  };

  return (
    <div className="rs-overlay">
      <div className="rs-card">
        <div className="rs-header">
          <span className="rs-icon">🤖</span>
          <h2 className="rs-title">Connect Your ESP32 Robot</h2>
          <p className="rs-subtitle">Enter the IP of the computer running <code>server.py</code></p>
        </div>

        <div className="rs-form">
          <label className="rs-label">Server IP Address</label>
          <div className="rs-ip-row">
            <span className="rs-prefix">http://</span>
            <input type="text" value={ip} onChange={e => setIp(e.target.value)}
              placeholder="192.168.1.100" className="rs-input" />
            <span className="rs-sep">:</span>
            <input type="text" value={port} onChange={e => setPort(e.target.value)}
              placeholder="8000" className="rs-port-input" />
          </div>
          <div className="rs-tip">
            💡 Find your IP: <code>ipconfig</code> (Windows) or <code>ifconfig</code> (Mac/Linux)
          </div>
        </div>

        {result && (
          <div className={`rs-result ${result.ok ? 'rs-result-ok' : 'rs-result-err'}`}>
            {result.ok ? '✅' : '❌'} {result.msg}
            {result.ok && robotCount === 0 && (
              <div className="rs-result-sub">Flash your ESP32 and wait for it to join.</div>
            )}
          </div>
        )}

        <div className="rs-esp-info">
          <div className="rs-esp-step"><span className="rs-step-num">1</span><span>Flash <code>lumi_robot.ino</code> to ESP32</span></div>
          <div className="rs-esp-step"><span className="rs-step-num">2</span><span>Set <code>SERVER_HOST</code> to this computer's IP</span></div>
          <div className="rs-esp-step"><span className="rs-step-num">3</span><span>Power on — robot auto-connects!</span></div>
        </div>

        <div className="rs-buttons">
          <button className="rs-btn-test" onClick={testConnection} disabled={testing}>
            {testing ? '⏳ Testing…' : '🔌 Test Connection'}
          </button>
          <button className="rs-btn-save" onClick={handleSave}>✓ Save & Connect</button>
          <button className="rs-btn-skip" onClick={onSkip}>Skip — Demo Mode</button>
        </div>
      </div>
    </div>
  );
}
