import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #d946ef 0%, #a855f7 50%, #6366f1 100%)',
          fontSize: 120,
          fontWeight: 800,
          color: 'white',
          fontFamily: 'serif',
          letterSpacing: '-0.05em',
          textShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}
      >
        I
      </div>
    ),
    { ...size },
  );
}
