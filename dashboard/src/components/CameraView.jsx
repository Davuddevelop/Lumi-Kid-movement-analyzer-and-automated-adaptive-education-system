import React, { useRef, useEffect, useState, useCallback } from 'react';

const CMD_COLORS = {
  forward:    { bg: '#222222', label: '⬆ Forward' },
  backward:   { bg: '#e05c5c', label: '⬇ Back' },
  turn_right: { bg: '#1a6cf0', label: '↻ Right' },
  turn_left:  { bg: '#f5c842', label: '↺ Left', color: '#333' },
  loop:       { bg: '#9b59b6', label: '↩ Loop' },
};

export default function CameraView({ onClose, onApplied, apiBase = 'http://localhost:8000' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('requesting');
  const [videoReady, setVideoReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // cam-feed-container is always rendered (display:none until granted) so
  // videoRef.current is non-null when getUserMedia resolves.
  // srcObject is set BEFORE setStatus('granted') — stream attached first, UI updates second.
  useEffect(() => {
    let stream = null;
    let mounted = true;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (!video || !mounted) return Promise.resolve();
        video.srcObject = s;
        // iOS requires explicit .play() after srcObject; resolve even on autoplay rejection
        return video.play().catch(() => {});
      })
      .then(() => {
        if (mounted) setStatus('granted');
      })
      .catch(() => {
        if (mounted) setStatus('denied');
      });

    return () => {
      mounted = false;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Primary readiness signal: loadedmetadata fires when width/height are known
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      video.play().catch(() => {});
      setVideoReady(true);
    }
  }, []);

  // Fallback: on some iOS builds loadedmetadata fires before videoWidth is populated;
  // canplay fires later when the first frame is truly available
  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (video && !videoReady) {
      video.play().catch(() => {});
      setVideoReady(true);
    }
  }, [videoReady]);

  // Last-resort: if both events never fire, unlock Scan after 3 s
  useEffect(() => {
    if (status !== 'granted' || videoReady) return;
    const t = setTimeout(() => {
      const video = videoRef.current;
      if (video) {
        video.play().catch(() => {});
        setVideoReady(true);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [status, videoReady]);

  const scan = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      setDetected({ commands: [], blocks: [], error: 'Camera not ready — wait a moment and try again' });
      return;
    }
    setScanning(true);
    setApplied(false);
    setDetected(null);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
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
      if (onApplied) {
        setTimeout(() => {
          onApplied(detected.commands);
          onClose();
        }, 500);
      }
    } catch {
      // ignore
    } finally {
      setApplying(false);
    }
  }, [apiBase, detected, onApplied, onClose]);

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

        {/* Always rendered (display:none when not granted) so videoRef is valid
            when getUserMedia resolves — this was the root cause of the black screen */}
        <div
          className="cam-feed-container"
          style={{ display: status === 'granted' ? 'flex' : 'none' }}
        >
          <div className="cam-feed-header">
            <span className="cam-feed-title">📷 LEGO Block Scanner</span>
            <button className="cam-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="cam-video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="cam-video"
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="cam-corner cam-corner-tl" />
            <div className="cam-corner cam-corner-tr" />
            <div className="cam-corner cam-corner-bl" />
            <div className="cam-corner cam-corner-br" />
            {scanning && <div className="cam-scan-line" />}
            {!videoReady && (
              <div className="cam-video-loading">⏳ Starting camera…</div>
            )}
          </div>

          <p className="cam-hint">
            📦 Arrange LEGO blocks in a horizontal row, then tap <strong>Scan</strong>
          </p>

          <div className="cam-actions">
            <button className="cam-btn-scan" onClick={scan} disabled={scanning || !videoReady}>
              {scanning ? '⏳ Scanning…' : !videoReady ? '⏳ Camera loading…' : '🔍 Scan Blocks'}
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
                    {applied ? '✓ Starting game…' : applying ? 'Applying…' : '🚀 Apply & Run!'}
                  </button>
                </>
              )}
            </div>
          )}

          <button className="cam-btn-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
