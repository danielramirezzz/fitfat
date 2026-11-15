import { CSSProperties } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { C, montserrat } from '../tema';

// Kinetic text: each word rises from below with blur, one after another.
type Props = {
  texto: string;
  desde?: number; // start frame
  separacion?: number; // frames between words
  tamano?: number;
  color?: string;
  acentos?: string[]; // words painted green
  colorAcento?: string;
  peso?: number;
  estilo?: CSSProperties;
  alinear?: 'left' | 'center' | 'right';
};

export function TextoCinetico({
  texto,
  desde = 0,
  separacion = 3,
  tamano = 90,
  color = C.texto,
  acentos = [],
  colorAcento = C.verde,
  peso = 900,
  estilo,
  alinear = 'left',
}: Props) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palabras = texto.split(' ');
  return (
    <div
      style={{
        fontFamily: montserrat,
        fontWeight: peso,
        fontSize: tamano,
        lineHeight: 1.02,
        letterSpacing: -tamano * 0.03,
        color,
        textAlign: alinear,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: alinear === 'center' ? 'center' : alinear === 'right' ? 'flex-end' : 'flex-start',
        gap: `0 ${tamano * 0.25}px`,
        ...estilo,
      }}>
      {palabras.map((p, i) => {
        const prog = spring({ frame: f - desde - i * separacion, fps, config: { damping: 16, mass: 0.6 } });
        const limpia = p.replace(/[¡!¿?.,…]/g, '');
        return (
          <span
            key={`${p}-${i}`}
            style={{
              display: 'inline-block',
              color: acentos.includes(limpia) ? colorAcento : undefined,
              opacity: prog,
              transform: `translateY(${interpolate(prog, [0, 1], [tamano * 0.7, 0])}px)`,
              filter: `blur(${interpolate(prog, [0, 1], [12, 0])}px)`,
            }}>
            {p}
          </span>
        );
      })}
    </div>
  );
}

// Small rounded label above the big titles.
export function Etiqueta({
  texto,
  desde = 0,
  color = C.verde,
  lado = 'flex-start',
}: {
  texto: string;
  desde?: number;
  color?: string;
  lado?: 'flex-start' | 'flex-end';
}) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - desde, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        alignSelf: lado,
        padding: '10px 22px',
        borderRadius: 40,
        border: `2px solid ${color}`,
        background: `${color}1A`,
        color,
        fontFamily: montserrat,
        fontWeight: 800,
        fontSize: 26,
        letterSpacing: 4,
        textTransform: 'uppercase',
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`,
      }}>
      <span style={{ width: 10, height: 10, borderRadius: 5, background: color, boxShadow: `0 0 14px ${color}` }} />
      {texto}
    </div>
  );
}
