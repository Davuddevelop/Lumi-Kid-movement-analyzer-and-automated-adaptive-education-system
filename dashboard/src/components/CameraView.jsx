import React, { useRef, useEffect, useState, useCallback } from 'react';

const CMD_COLORS = {
  forward:    { bg: '#4caf82', label: '▲ Forward' },
  turn_right: { bg: '#1a6cf0', label: '↻ Right' },
  turn_left:  { bg: '#f5c842', label: '↺ Left', color: '#333' },
  loop:       { bg: '#e05c5c', label: '↩ Loop' },
  loop_start: { bg: '#f5982e', label: '▶ Start' },
  loop_end:   { bg: '#9b59b6', label: '■ End' },
};

export default function CameraView({ onClose, apiBase = 'http://localhost:8000' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('requesting');
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((s) => {
        stream = s;
        setStatus('granted');
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setStatus('denied'));
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);

  const scan = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    setScanning(true);
    setApplied(false);
    setDetected(null);

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await fetch(`${apiBase}/api/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
      });
      const data = await res.json();
      setDetected(data);
    } catch {
      setDetected({ commands: [], blocks: [], error: 'Could not reach server' });
    } finally {
      setScanning(false);
    }
  }, [apiBase]);

  const applyToGame = useCallback(async () => {
    if (!detected?.commands?.length) return;
    setApplying(true);
    try {
      await fetch(`${apiBase}/api/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: detected.commands }),
      });
      setApplied(true);
    } catch {
      // ignore — server unreachable
    } finally {
      setApplying(false);
    }
  }, [apiBase, detected]);

  return (
    <div className="cam-overlay" onClick={status !== 'granted' ? onClose : undefined}>
      <div className="cam-card" onClick={e => e.stopPropagation()}>

        {status === 'requesting' && (
          <div className="cam-permission">
            <div className="cam-icon-big">📷</div>
            <h2 className="cam-title">Allow Camera</h2>
            <p className="cam-desc">
              Lumi needs your camera to see the LEGO blocks you build and detect your commands!
            </p>
            <div className="cam-spinner" />
          </div>
        )}

        {status === 'denied' && (
          <div className="cam-permission">
            <div className="cam-icon-big">🚫</div>
            <h2 className="cam-title">Camera Blocked</h2>
            <p className="cam-desc">
              Please allow camera access in your browser settings, then refresh the page.
            </p>
            <button className="cam-btn-secondary" onClick={onClose}>
              Continue Without Camera
            </button>
          </div>
        )}

        {status === 'granted' && (
          <div className="cam-feed-container">
            <div className="cam-feed-header">
              <span className="cam-feed-title">📷 LEGO Block Scanner</span>
              <button className="cam-close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="cam-video-wrapper">
              <video ref={videoRef} autoPlay playsInline muted className="cam-video" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="cam-corner cam-corner-tl" />
              <div className="cam-corner cam-corner-tr" />
              <div className="cam-corner cam-corner-bl" />
              <div className="cam-corner cam-corner-br" />
              {scanning && <div className="cam-scan-line" />}
            </div>

            <p className="cam-hint">
              📦 Arrange LEGO blocks in a horizontal row, then tap <strong>Scan</strong>
            </p>

            <div className="cam-actions">
              <button className="cam-btn-scan" onClick={scan} disabled={scanning}>
                {scanning ? '⏳ Scanning…' : '🔍 Scan Blocks'}
              </button>
            </div>

            {detected && (
              <div className="cam-results">
                {detected.error ? (
                  <p className="cam-results-error">⚠️ {detected.error}</p>
                ) : detected.commands.length === 0 ? (
                  <p className="cam-results-empty">
                    No blocks detected — try better lighting or move blocks closer
                  </p>
                ) : (
                  <>
                    <p className="cam-results-title">
                      Found {detected.commands.length} block{detected.commands.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="cam-cmd-row">
                      {detected.commands.map((cmd, i) => {
                        const cfg = CMD_COLORS[cmd] || { bg: '#888', label: cmd };
                        return (
                          <span
                            key={i}
                            className="cam-cmd-badge"
                            style={{ background: cfg.bg, color: cfg.color || '#fff' }}
                          >
                            {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                    <button
                      className={`cam-btn-apply${applied ? ' cam-btn-applied' : ''}`}
                      onClick={applyToGame}
                      disabled={applying || applied}
                    >
                      {applied ? '✓ Applied to Game!' : applying ? 'Applying…' : '✓ Apply to Game'}
                    </button>
                  </>
                )}
              </div>
            )}

            <button className="cam-btn-done" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
