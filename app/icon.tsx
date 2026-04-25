import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '40px',
          fontSize: 128,
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
