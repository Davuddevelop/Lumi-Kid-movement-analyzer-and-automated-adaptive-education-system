import React, { useRef, useEffect, useState, useCallback } from 'react';

const CMD_COLORS = {
  forward:  { bg: '#222222', label: '⬆ Forward' },
  backward: { bg: '#e05c5c', label: '⬇ Back' },
};

// ── Client-side LEGO block detector ────────────────────────────────────────
// Runs entirely on the iPad — no server round-trip for detection.
// The server is only called when Apply & Run sends commands to the robot.

function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d > 0) {
    if (max === rn)      h = (((gn - bn) / d) % 6) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else                 h = ((rn - gn) / d + 4) / 6;
    if (h < 0) h += 1;
  }
  // Return H in 0-360, S and V in 0-255 (matches OpenCV scale)
  return [h * 360, s * 255, v * 255];
}

function classifyPixel(r, g, b) {
  const [h, s, v] = rgbToHsv(r, g, b);
  // Black LEGO block: very dark, low saturation
  if (v < 55 && s < 80) return 'forward';
  // Red LEGO block: red hue (wraps at 0/360), saturated, not too dark
  if (s > 100 && v > 60 && (h < 15 || h > 160)) return 'backward';
  return null;
}

function detectBlocksLocal(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  // Only scan the central 70% of the image height — avoids table edges and top noise
  const y0 = Math.floor(height * 0.15);
  const y1 = Math.floor(height * 0.85);
  const YSTEP = 4;  // vertical sample stride (pixels)
  const XCOL  = 3;  // horizontal stride — one "column" per 3px

  // Build a left-to-right color profile: what command does each x-column contain?
  const colProfile = [];
  for (let x = 0; x < width; x += XCOL) {
    let fwd = 0, bwd = 0, tot = 0;
    for (let y = y0; y < y1; y += YSTEP) {
      const i = (y * width + x) * 4;
      const cls = classifyPixel(data[i], data[i + 1], data[i + 2]);
      if (cls === 'forward')  fwd++;
      else if (cls === 'backward') bwd++;
      tot++;
    }
    // A column "belongs" to a color if ≥25% of sampled pixels match
    if      (bwd / tot > 0.25) colProfile.push('backward');
    else if (fwd / tot > 0.25) colProfile.push('forward');
    else                        colProfile.push(null);
  }

  // Group consecutive same-color columns → each group is one physical block.
  // MIN_COLS prevents stud shadows and tiny noise from registering as blocks.
  // ~6% of image width gives a good lower-bound for a real LEGO block.
  const MIN_COLS = Math.max(10, Math.floor(width * 0.06 / XCOL));
  const blocks = [];
  let run = null;

  colProfile.forEach((color, i) => {
    if (color && color === run?.color) {
      run.end = i;
      run.count++;
    } else {
      if (run && run.count >= MIN_COLS) blocks.push(run);
      run = color ? { color, start: i, end: i, count: 1 } : null;
    }
  });
  if (run && run.count >= MIN_COLS) blocks.push(run);

  // Convert column indices back to pixel x-coordinates for sorting
  return blocks.map(b => ({
    command: b.color,
    color:   b.color === 'forward' ? 'black' : 'red',
    x:       ((b.start + b.end) / 2) * XCOL,
  }));
}
// ───────────────────────────────────────────────────────────────────────────

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

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      video.play().catch(() => {});
      setVideoReady(true);
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (video && !videoReady) {
      video.play().catch(() => {});
      setVideoReady(true);
    }
  }, [videoReady]);

  useEffect(() => {
    if (status !== 'granted' || videoReady) return;
    const t = setTimeout(() => {
      const video = videoRef.current;
      if (video) { video.play().catch(() => {}); setVideoReady(true); }
    }, 3000);
    return () => clearTimeout(t);
  }, [status, videoReady]);

  // Detection runs locally on the iPad — instant, no server needed
  const scan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      setDetected({ commands: [], blocks: [], error: 'Camera not ready — wait a moment and try again' });
      return;
    }
    setScanning(true);
    setApplied(false);
    setDetected(null);

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const blocks   = detectBlocksLocal(canvas);
    const commands = blocks.map(b => b.command);
    setDetected({ commands, blocks });
    setScanning(false);
  }, []);

  const applyToGame = useCallback(async () => {
    if (!detected?.commands?.length) return;
    setApplying(true);
    try {
      // Sync commands to server so the robot and grid know what to execute
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
      // Server offline — still hand commands to the app so the grid animates
      setApplied(true);
      if (onApplied) {
        setTimeout(() => {
          onApplied(detected.commands);
          onClose();
        }, 500);
      }
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

        {/* Always rendered so videoRef is valid when stream arrives */}
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
            📦 Place blocks on <strong>white paper</strong>, then tap <strong>Scan</strong>
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
                  No blocks detected — place on white paper, ensure good lighting
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
                          style={{ background: cfg.bg, color: '#fff' }}
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
