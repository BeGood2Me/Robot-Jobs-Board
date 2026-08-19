import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#000',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.7 }}>Robot Jobs Board</div>
        <div style={{ fontSize: 64, fontWeight: 600, marginTop: 16, maxWidth: 900 }}>
          Find your next robotics job
        </div>
      </div>
    ),
    size,
  );
}
