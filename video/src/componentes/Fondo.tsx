import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { C } from '../tema';

// Dark background with soft colored "lights" that drift slowly + a fine grid.
export function Fondo({ color = C.verde, intensidad = 0.35 }: { color?: string; intensidad?: number }) {
  const f = useCurrentFrame();
  const x1 = 25 + Math.sin(f / 70) * 12;
  const y1 = 30 + Math.cos(f / 90) * 10;
  const x2 = 75 + Math.cos(f / 80) * 10;
  const y2 = 70 + Math.sin(f / 60) * 12;
  const hex = Math.round(intensidad * 255)
    .toString(16)
    .padStart(2, '0');
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${x1}% ${y1}%, ${color}${hex} 0%, transparent 38%),
                       radial-gradient(circle at ${x2}% ${y2}%, ${C.fuegoOscuro}33 0%, transparent 35%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: `translateY(${interpolate(f, [0, 900], [0, 80])}px)`,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
    </AbsoluteFill>
  );
}
