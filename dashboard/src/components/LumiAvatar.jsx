import React from 'react';

/**
 * LumiAvatar — white cute robot matching the illustrated kids UI style.
 * White body, blue headphone ears, black face screen, blue curved eyes, yellow antenna ball.
 */
const LumiAvatar = ({ emotion = 'happy', size = 80, speaking = false }) => {
  const s = size;
  const cx = s * 0.5;

  const bodyCY  = s * 0.56;
  const bodyRX  = s * 0.33;
  const bodyRY  = s * 0.36;

  const faceCY  = s * 0.41;
  const faceW   = s * 0.44;
  const faceH   = s * 0.32;
  const faceRad = s * 0.07;

  const earY  = s * 0.41;
  const earR  = s * 0.095;
  const earLX = cx - bodyRX + earR * 0.05;
  const earRX = cx + bodyRX - earR * 0.05;

  const antBallY = s * 0.055;
  const antBaseY = bodyCY - bodyRY - s * 0.01;

  const eyeLX = cx - faceW * 0.21;
  const eyeRX = cx + faceW * 0.21;
  const eyeY  = faceCY - faceH * 0.05;
  const eyeW  = faceW * 0.18;
  const sw    = s * 0.038;

  const blue  = '#4da6ff';
  const blue2 = '#1565c0';

  const getEyes = () => {
    if (emotion === 'happy' || emotion === 'excited') {
      return (
        <>
          <path d={`M ${eyeLX-eyeW} ${eyeY+s*0.005} Q ${eyeLX} ${eyeY+s*0.038} ${eyeLX+eyeW} ${eyeY+s*0.005}`}
            stroke={blue} strokeWidth={sw} fill="none" strokeLinecap="round"/>
          <path d={`M ${eyeRX-eyeW} ${eyeY+s*0.005} Q ${eyeRX} ${eyeY+s*0.038} ${eyeRX+eyeW} ${eyeY+s*0.005}`}
            stroke={blue} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        </>
      );
    }
    if (emotion === 'sad') {
      return (
        <>
          <path d={`M ${eyeLX-eyeW} ${eyeY+s*0.025} Q ${eyeLX} ${eyeY-s*0.025} ${eyeLX+eyeW} ${eyeY+s*0.025}`}
            stroke={blue} strokeWidth={sw} fill="none" strokeLinecap="round"/>
          <path d={`M ${eyeRX-eyeW} ${eyeY+s*0.025} Q ${eyeRX} ${eyeY-s*0.025} ${eyeRX+eyeW} ${eyeY+s*0.025}`}
            stroke={blue} strokeWidth={sw} fill="none" strokeLinecap="round"/>
          <ellipse cx={eyeRX+s*0.01} cy={eyeY+s*0.065} rx={s*0.025} ry={s*0.038} fill={blue} opacity="0.6"/>
        </>
      );
    }
    if (emotion === 'thinking') {
      return (
        <>
          <path d={`M ${eyeLX-eyeW} ${eyeY} L ${eyeLX+eyeW} ${eyeY}`}
            stroke={blue} strokeWidth={sw} strokeLinecap="round"/>
          <circle cx={eyeRX} cy={eyeY} r={eyeW*0.6} stroke={blue} strokeWidth={sw*0.8} fill="none"/>
          <circle cx={eyeRX+s*0.008} cy={eyeY+s*0.008} r={eyeW*0.2} fill={blue}/>
        </>
      );
    }
    if (emotion === 'surprised') {
      return (
        <>
          <circle cx={eyeLX} cy={eyeY} r={eyeW*0.7} stroke={blue} strokeWidth={sw} fill="none"/>
          <circle cx={eyeRX} cy={eyeY} r={eyeW*0.7} stroke={blue} strokeWidth={sw} fill="none"/>
        </>
      );
    }
    return (
      <>
        <path d={`M ${eyeLX-eyeW} ${eyeY+s*0.005} Q ${eyeLX} ${eyeY+s*0.038} ${eyeLX+eyeW} ${eyeY+s*0.005}`}
          stroke={blue} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <path d={`M ${eyeRX-eyeW} ${eyeY+s*0.005} Q ${eyeRX} ${eyeY+s*0.038} ${eyeRX+eyeW} ${eyeY+s*0.005}`}
          stroke={blue} strokeWidth={sw} fill="none" strokeLinecap="round"/>
      </>
    );
  };

  const getMouth = () => {
    const mouthY = faceCY + faceH * 0.3;
    const mouthW = faceW * 0.18;
    if (emotion === 'happy' || emotion === 'excited') {
      return <path d={`M ${cx-mouthW} ${mouthY} Q ${cx} ${mouthY+s*0.028} ${cx+mouthW} ${mouthY}`}
        stroke={blue} strokeWidth={sw*0.9} fill="none" strokeLinecap="round"/>;
    }
    if (emotion === 'sad') {
      return <path d={`M ${cx-mouthW} ${mouthY+s*0.018} Q ${cx} ${mouthY-s*0.018} ${cx+mouthW} ${mouthY+s*0.018}`}
        stroke={blue} strokeWidth={sw*0.9} fill="none" strokeLinecap="round"/>;
    }
    if (emotion === 'thinking') {
      return <path d={`M ${cx-mouthW*0.7} ${mouthY} L ${cx+mouthW*0.7} ${mouthY}`}
        stroke={blue} strokeWidth={sw*0.9} strokeLinecap="round"/>;
    }
    if (emotion === 'surprised') {
      return <ellipse cx={cx} cy={mouthY} rx={mouthW*0.55} ry={mouthW*0.65} stroke={blue} strokeWidth={sw*0.8} fill="none"/>;
    }
    return <path d={`M ${cx-mouthW} ${mouthY} Q ${cx} ${mouthY+s*0.02} ${cx+mouthW} ${mouthY}`}
      stroke={blue} strokeWidth={sw*0.9} fill="none" strokeLinecap="round"/>;
  };

  const isExcited = emotion === 'excited';

  return (
    <div
      className={`lumi-avatar-wrapper${speaking ? ' speaking' : ''}`}
      style={{ width: s, height: s, flexShrink: 0 }}
    >
      {speaking && (
        <>
          <div className="speak-ring speak-ring-1" />
          <div className="speak-ring speak-ring-2" />
          <div className="speak-ring speak-ring-3" />
        </>
      )}

      <svg
        width={s} height={s} viewBox={`0 0 ${s} ${s}`}
        style={{
          filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.13))',
          animation: isExcited ? 'bounce 0.6s infinite' : emotion === 'happy' ? 'float 2s infinite alternate' : 'none',
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Antenna stick */}
        <line x1={cx} y1={antBaseY} x2={cx} y2={antBallY + s*0.05}
          stroke="#d0ccc4" strokeWidth={s*0.025} strokeLinecap="round"/>
        {/* Antenna ball — yellow */}
        <circle cx={cx} cy={antBallY} r={s*0.055} fill="#ffd166"
          style={{ animation: 'float 1.4s infinite alternate' }}/>

        {/* White body oval */}
        <ellipse cx={cx} cy={bodyCY} rx={bodyRX} ry={bodyRY}
          fill="white" stroke="#e8e4de" strokeWidth={s*0.015}/>

        {/* Blue headphone ears */}
        <circle cx={earLX} cy={earY} r={earR} fill={blue}/>
        <circle cx={earRX} cy={earY} r={earR} fill={blue}/>
        <circle cx={earLX} cy={earY} r={earR*0.52} fill={blue2}/>
        <circle cx={earRX} cy={earY} r={earR*0.52} fill={blue2}/>

        {/* Black face screen — rounded rectangle */}
        <rect
          x={cx - faceW/2} y={faceCY - faceH/2}
          width={faceW} height={faceH}
          rx={faceRad} ry={faceRad}
          fill="#18181b"
        />

        {/* Eyes */}
        {getEyes()}

        {/* Mouth */}
        {getMouth()}

        {/* Blue heart on chest */}
        <text
          x={cx} y={s * 0.82}
          textAnchor="middle"
          fontSize={s * 0.17}
          fill={blue}
          style={{ userSelect: 'none' }}
        >♥</text>

        {/* Blush spots */}
        {(emotion === 'happy' || emotion === 'excited') && (
          <>
            <ellipse cx={cx - faceW/2 + s*0.02} cy={faceCY + faceH*0.4}
              rx={s*0.045} ry={s*0.028} fill="rgba(255,150,130,0.28)"/>
            <ellipse cx={cx + faceW/2 - s*0.02} cy={faceCY + faceH*0.4}
              rx={s*0.045} ry={s*0.028} fill="rgba(255,150,130,0.28)"/>
          </>
        )}

        {/* Small arms */}
        <ellipse cx={cx - bodyRX - s*0.01} cy={bodyCY + s*0.04}
          rx={s*0.07} ry={s*0.05}
          fill="white" stroke="#e8e4de" strokeWidth={s*0.012}/>
        <ellipse cx={cx + bodyRX + s*0.01} cy={bodyCY + s*0.04}
          rx={s*0.07} ry={s*0.05}
          fill="white" stroke="#e8e4de" strokeWidth={s*0.012}/>
      </svg>
    </div>
  );
};

export default LumiAvatar;
