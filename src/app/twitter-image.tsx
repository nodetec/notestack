import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'NoteStack - Nostr Long-form Editor';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          backgroundImage: 'radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #16213e 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-2px',
              }}
            >
              NoteStack
            </span>
          </div>
          <span
            style={{
              fontSize: '32px',
              color: '#a1a1aa',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            Write, publish, and share your ideas on the decentralized web
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                color: '#71717a',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid #27272a',
                backgroundColor: '#18181b',
              }}
            >
              Nostr Long-form Editor
            </span>
            <span
              style={{
                fontSize: '20px',
                color: '#71717a',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid #27272a',
                backgroundColor: '#18181b',
              }}
            >
              NIP-23
            </span>
            <span
              style={{
                fontSize: '20px',
                color: '#71717a',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid #27272a',
                backgroundColor: '#18181b',
              }}
            >
              Decentralized
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
