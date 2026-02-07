import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Notestack';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0b0b',
        color: '#f5f5f5',
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: '-1px',
        }}
      >
        Notestack
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 36,
          color: '#a1a1aa',
        }}
      >
        Decentralize your ideas and publish freely.
      </div>
    </div>,
    size
  );
}
