import React from 'react';

/**
 * LumiAvatar — inline SVG robot character, no external URLs.
 * Props:
 *   emotion: 'happy' | 'excited' | 'sad' | 'thinking' | 'surprised'
 *   size: number (default 80)
 *   speaking: bool
 */
const LumiAvatar = ({ emotion = 'happy', size = 80, speaking = false }) => {
  // Body colour per emotion
  const bodyColor = {
    happy:     '#7c5cfc',
    excited:   '#ff9f43',
    sad:       '#74b9ff',
    thinking:  '#44e5a0',
    surprised: '#ff6b6b',
  }[emotion] || '#7c5cfc';

  const glowColor = {
    happy:     'rgba(124,92,252,0.5)',
    excited:   'rgba(255,159,67,0.5)',
    sad:       'rgba(116,185,255,0.4)',
    thinking:  'rgba(68,229,160,0.5)',
    surprised: 'rgba(255,107,107,0.5)',
  }[emotion] || 'rgba(124,92,252,0.5)';

  const svgSize = size;
  const cx = svgSize / 2;
  const headR = svgSize * 0.35;

  // Eye expressions
  const renderEyes = () => {
    const eyeLY = cx - headR * 0.1;
    const eyeRY = cx - headR * 0.1;
    const eyeLX = cx - headR * 0.3;
    const eyeRX = cx + headR * 0.3;

    if (emotion === 'happy') {
      // curved happy eyes  ◡ ◡
      return (
        <>
          <path
            d={`M ${eyeLX - 8} ${eyeLY - 2} Q ${eyeLX} ${eyeLY + 7} ${eyeLX + 8} ${eyeLY - 2}`}
            stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"
          />
          <path
            d={`M ${eyeRX - 8} ${eyeRY - 2} Q ${eyeRX} ${eyeRY + 7} ${eyeRX + 8} ${eyeRY - 2}`}
            stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"
          />
        </>
      );
    }

    if (emotion === 'excited') {
      // star eyes ✦
      const starPoints = (cx, cy, r) => {
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 - Math.PI / 8;
          const radius = i % 2 === 0 ? r : r * 0.45;
          pts.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
        }
        return pts.join(' ');
      };
      return (
        <>
          <polygon points={starPoints(eyeLX, eyeLY, 9)} fill="white" />
          <polygon points={starPoints(eyeRX, eyeRY, 9)} fill="white" />
        </>
      );
    }

    if (emotion === 'sad') {
      // droopy eyes + tear
      return (
        <>
          <ellipse cx={eyeLX} cy={eyeLY} rx="6" ry="5" fill="white" opacity="0.9" />
          <ellipse cx={eyeRX} cy={eyeRY} rx="6" ry="5" fill="white" opacity="0.9" />
          {/* droopy lids */}
          <path
            d={`M ${eyeLX - 8} ${eyeLY + 2} Q ${eyeLX} ${eyeLY - 5} ${eyeLX + 8} ${eyeLY + 2}`}
            stroke={bodyColor} strokeWidth="4" fill={bodyColor}
          />
          <path
            d={`M ${eyeRX - 8} ${eyeRY + 2} Q ${eyeRX} ${eyeRY - 5} ${eyeRX + 8} ${eyeRY + 2}`}
            stroke={bodyColor} strokeWidth="4" fill={bodyColor}
          />
          {/* single tear */}
          <ellipse
            cx={eyeRX + 2} cy={eyeRY + 12}
            rx="3" ry="5"
            fill="#74b9ff" opacity="0.8"
          />
        </>
      );
    }

    if (emotion === 'thinking') {
      // one squinted eye, one normal + gear
      return (
        <>
          {/* normal left eye */}
          <ellipse cx={eyeLX} cy={eyeLY} rx="7" ry="7" fill="white" />
          <ellipse cx={eyeLX + 2} cy={eyeLY + 1} rx="3" ry="3" fill={bodyColor} />
          {/* squinted right eye */}
          <path
            d={`M ${eyeRX - 8} ${eyeRY} Q ${eyeRX} ${eyeRY + 8} ${eyeRX + 8} ${eyeRY}`}
            stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"
          />
          {/* mini gear top-right of head */}
          <circle cx={cx + headR * 0.7} cy={cx - headR * 0.7} r="6" fill="none" stroke="white" strokeWidth="2" />
          <circle cx={cx + headR * 0.7} cy={cx - headR * 0.7} r="3" fill="white" />
        </>
      );
    }

    if (emotion === 'surprised') {
      // wide O eyes
      return (
        <>
          <ellipse cx={eyeLX} cy={eyeLY} rx="9" ry="9" fill="white" />
          <ellipse cx={eyeLX + 2} cy={eyeLY + 1} rx="4" ry="4" fill={bodyColor} />
          <ellipse cx={eyeRX} cy={eyeRY} rx="9" ry="9" fill="white" />
          <ellipse cx={eyeRX + 2} cy={eyeRY + 1} rx="4" ry="4" fill={bodyColor} />
        </>
      );
    }

    // fallback normal
    return (
      <>
        <ellipse cx={eyeLX} cy={eyeLY} rx="6" ry="6" fill="white" />
        <ellipse cx={eyeRX} cy={eyeRY} rx="6" ry="6" fill="white" />
      </>
    );
  };

  // Mouth per emotion
  const renderMouth = () => {
    const mouthY = cx + headR * 0.38;
    const mouthX = cx;

    if (emotion === 'happy' || emotion === 'excited') {
      return (
        <path
          d={`M ${mouthX - 10} ${mouthY - 2} Q ${mouthX} ${mouthY + 9} ${mouthX + 10} ${mouthY - 2}`}
          stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"
        />
      );
    }

    if (emotion === 'sad') {
      return (
        <path
          d={`M ${mouthX - 10} ${mouthY + 4} Q ${mouthX} ${mouthY - 5} ${mouthX + 10} ${mouthY + 4}`}
          stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"
        />
      );
    }

    if (emotion === 'thinking') {
      return (
        <path
          d={`M ${mouthX - 8} ${mouthY} L ${mouthX + 8} ${mouthY}`}
          stroke="white" strokeWidth="3" strokeLinecap="round"
        />
      );
    }

    if (emotion === 'surprised') {
      return (
        <ellipse cx={mouthX} cy={mouthY + 2} rx="7" ry="8" fill="white" opacity="0.9" />
      );
    }

    // default flat
    return (
      <path
        d={`M ${mouthX - 9} ${mouthY} Q ${mouthX} ${mouthY + 4} ${mouthX + 9} ${mouthY}`}
        stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"
      />
    );
  };

  const isExcited = emotion === 'excited';

  return (
    <div
      className={`lumi-avatar-wrapper${speaking ? ' speaking' : ''}`}
      style={{ width: svgSize, height: svgSize, flexShrink: 0 }}
    >
      {/* Sonar rings when speaking */}
      {speaking && (
        <>
          <div className="speak-ring speak-ring-1" />
          <div className="speak-ring speak-ring-2" />
          <div className="speak-ring speak-ring-3" />
        </>
      )}

      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{
          animation: isExcited ? 'bounce 0.6s infinite' : emotion === 'happy' ? 'float 2s infinite alternate' : 'none',
          filter: `drop-shadow(0 0 ${size * 0.15}px ${glowColor})`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <defs>
          <radialGradient id={`lumiGrad-${emotion}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor={bodyColor} stopOpacity="1" />
            <stop offset="100%" stopColor={bodyColor} stopOpacity="0.7" />
          </radialGradient>
        </defs>

        {/* Antenna */}
        <line
          x1={cx} y1={cx - headR - 2}
          x2={cx} y2={cx - headR - svgSize * 0.12}
          stroke={bodyColor} strokeWidth="3" strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cx - headR - svgSize * 0.14}
          r={svgSize * 0.045}
          fill={emotion === 'excited' ? '#ffd166' : 'white'}
          style={{ animation: 'float 1.4s infinite alternate' }}
        />

        {/* Head circle */}
        <circle
          cx={cx}
          cy={cx}
          r={headR}
          fill={`url(#lumiGrad-${emotion})`}
        />

        {/* Sheen highlight */}
        <ellipse
          cx={cx - headR * 0.2}
          cy={cx - headR * 0.35}
          rx={headR * 0.3}
          ry={headR * 0.18}
          fill="rgba(255,255,255,0.2)"
          transform={`rotate(-30 ${cx} ${cx})`}
        />

        {/* Eyes */}
        {renderEyes()}

        {/* Mouth */}
        {renderMouth()}

        {/* Small cheek blushes */}
        {(emotion === 'happy' || emotion === 'excited') && (
          <>
            <ellipse cx={cx - headR * 0.55} cy={cx + headR * 0.25} rx="7" ry="5" fill="rgba(255,100,100,0.3)" />
            <ellipse cx={cx + headR * 0.55} cy={cx + headR * 0.25} rx="7" ry="5" fill="rgba(255,100,100,0.3)" />
          </>
        )}
      </svg>
    </div>
  );
};

export default LumiAvatar;
