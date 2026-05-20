import React, { useRef, useEffect, useState } from 'react';

export default function CameraView({ onClose }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('requesting');

  useEffect(() => {
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } })
      .then((s) => {
        stream = s;
        setStatus('granted');
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setStatus('denied'));
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);

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
              <span className="cam-feed-title">📷 LEGO Scanner</span>
              <button className="cam-close-btn" onClick={onClose}>✕</button>
            </div>
            <div className="cam-video-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="cam-video"
              />
              {/* Scanning corners */}
              <div className="cam-corner cam-corner-tl" />
              <div className="cam-corner cam-corner-tr" />
              <div className="cam-corner cam-corner-bl" />
              <div className="cam-corner cam-corner-br" />
              <div className="cam-scan-line" />
            </div>
            <p className="cam-hint">
              📦 Point camera at your LEGO block arrangement
            </p>
            <button className="cam-btn-done" onClick={onClose}>
              ✓ Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
