import { evolvePath } from '@remotion/paths';
import QRCode from 'qrcode';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import { Fondo } from '../componentes/Fondo';
import { TextoCinetico } from '../componentes/Texto';
import { C, freeman, montserrat } from '../tema';

export const URL_APP = 'https://fitfat-n0km.onrender.com';
const EQUIPO = ['Daniel Felipe Ramírez Murillo', 'Cristopher Alejandro Santana Lugo', 'Juan Pablo Prada Chavarro'];

// QR drawn as SVG squares (no image file needed).
const qr = QRCode.create(URL_APP, { errorCorrectionLevel: 'M' });
const N = qr.modules.size;

function Qr({ tam, p }: { tam: number; p: number }) {
  const celdas: { x: number; y: number }[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (qr.modules.get(x, y)) celdas.push({ x, y });
  return (
    <svg width={tam} height={tam} viewBox={`-2 -2 ${N + 4} ${N + 4}`} style={{ background: '#fff', borderRadius: 24 }}>
      {celdas.map(({ x, y }) => (
        // modules appear diagonally, like a wave
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} shapeRendering="crispEdges" fill="#0D0D0D" opacity={interpolate(p * (N * 2) - (x + y), [0, 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      ))}
    </svg>
  );
}

const CHECK = 'M 20 52 L 44 76 L 92 24';

export function EscenaVota() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const golpe = spring({ frame: f - 10, fps, config: { damping: 8, mass: 0.9 } });
  const marca = interpolate(f, [24, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const { strokeDasharray, strokeDashoffset } = evolvePath(marca, CHECK);
  const qrEntrada = spring({ frame: f - 40, fps, config: { damping: 14 } });
  const qrDibujo = interpolate(f, [44, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const brillo = 0.5 + Math.sin(f / 6) * 0.15;

  return (
    <AbsoluteFill>
      <Fondo intensidad={0.5} />
      {/* rays behind the title */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: 0.25 }}>
        <div
          style={{
            width: 2200,
            height: 2200,
            background: `repeating-conic-gradient(${C.verde}22 0deg 6deg, transparent 6deg 18deg)`,
            transform: `rotate(${f * 0.3}deg)`,
            maskImage: 'radial-gradient(circle, black 0%, transparent 55%)',
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ padding: '120px 0 0 140px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
          {/* check box being ticked */}
          <svg width={150} height={150} viewBox="0 0 112 100" style={{ transform: `scale(${golpe})` }}>
            <rect x={4} y={4} width={104} height={92} rx={22} fill={C.verdeOscuro} stroke={C.verde} strokeWidth={6} />
            <path d={CHECK} fill="none" stroke={C.verde} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} style={{ filter: `drop-shadow(0 0 8px ${C.verde})` }} />
          </svg>
          <TextoCinetico texto="¡Vota por" desde={4} tamano={120} />
        </div>
        <div
          style={{
            fontFamily: montserrat,
            fontWeight: 900,
            fontSize: 270,
            lineHeight: 0.9,
            letterSpacing: -10,
            marginTop: 10,
            color: C.verde,
            textShadow: `0 0 ${60 * brillo}px ${C.verde}`,
            transform: `scale(${interpolate(golpe, [0, 1], [1.6, 1])})`,
            transformOrigin: 'left center',
            opacity: Math.min(1, golpe * 1.5),
          }}>
          FitFat!
        </div>
        <div style={{ marginTop: 40 }}>
          <TextoCinetico texto="Tú eres tu único rival. Pruébala hoy 👉" desde={38} tamano={44} peso={700} color={C.gris} />
        </div>
      </AbsoluteFill>

      {/* QR + logo on the right */}
      <AbsoluteFill style={{ alignItems: 'flex-end', padding: '150px 150px 0 0' }}>
        <div style={{ textAlign: 'center', opacity: qrEntrada, transform: `translateY(${interpolate(qrEntrada, [0, 1], [80, 0])}px) rotate(${interpolate(qrEntrada, [0, 1], [8, 0])}deg)` }}>
          <div style={{ padding: 18, borderRadius: 36, background: '#161616', border: `3px solid ${C.verde}`, boxShadow: `0 0 70px ${C.verde}55` }}>
            <Qr tam={380} p={qrDibujo} />
          </div>
          <div style={{ fontFamily: freeman, fontSize: 34, color: C.verde, marginTop: 20 }}>fitfat-n0km.onrender.com</div>
        </div>
      </AbsoluteFill>

      {/* the team */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 140px 80px 140px' }}>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${C.verde}, transparent)`, width: `${interpolate(f, [60, 90], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`, marginBottom: 28 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Img src={staticFile('simbolo.png')} style={{ width: 96, height: 96, opacity: spring({ frame: f - 62, fps }) }} />
          {EQUIPO.map((nombre, i) => {
            const p = spring({ frame: f - 70 - i * 8, fps, config: { damping: 15 } });
            const [primero, ...resto] = nombre.split(' ');
            return (
              <div key={nombre} style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)` }}>
                <div style={{ fontFamily: montserrat, fontWeight: 800, fontSize: 34, color: '#fff' }}>{primero} {resto[0]}</div>
                <div style={{ fontFamily: montserrat, fontWeight: 500, fontSize: 26, color: C.gris }}>{resto.slice(1).join(' ')}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
