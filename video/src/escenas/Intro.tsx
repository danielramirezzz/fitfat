import { evolvePath } from '@remotion/paths';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import { Fondo } from '../componentes/Fondo';
import { TextoCinetico } from '../componentes/Texto';
import { C, montserrat } from '../tema';

// --- 1. The problem: "I'll start tomorrow…" on a loop, and the fire goes out ---------------

const EXCUSAS = ['Mañana empiezo.', 'El lunes, sin falta.', 'Ahora sí… el otro lunes.'];
const POR_EXCUSA = 30;

export function EscenaExcusas() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const finExcusas = EXCUSAS.length * POR_EXCUSA;
  const gris = interpolate(f, [0, finExcusas], [0, 1], { extrapolateRight: 'clamp' });
  const fuego = spring({ frame: f - finExcusas + 10, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ filter: `saturate(${1 - gris * 0.8})` }}>
      <Fondo color="#555555" intensidad={0.25} />
      {EXCUSAS.map((texto, i) => {
        const inicio = i * POR_EXCUSA;
        const local = f - inicio;
        if (local < 0) return null;
        const tachado = interpolate(local, [14, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        // each older excuse goes up, gets smaller and fades (they pile up)
        const edad = Math.max(0, (f - inicio - POR_EXCUSA) / POR_EXCUSA);
        const subir = interpolate(f - inicio, [POR_EXCUSA - 4, POR_EXCUSA + 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const y = -subir * (130 + edad * 40);
        const escala = 1 - subir * 0.35 - edad * 0.1;
        const opacidad = 1 - subir * 0.55 - edad * 0.25;
        const temblor = local > 14 && local < 26 ? Math.sin(local * 3) * 4 : 0;
        return (
          <AbsoluteFill
            key={texto}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              transform: `translate(${temblor}px, ${y - 60}px) scale(${escala})`,
              opacity: Math.max(0, opacidad) * interpolate(f, [finExcusas - 6, finExcusas + 6], [1, 0.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}>
            <div style={{ position: 'relative' }}>
              <TextoCinetico texto={texto} desde={inicio} tamano={120} separacion={2} alinear="center" />
              <div
                style={{
                  position: 'absolute',
                  left: -10,
                  top: '52%',
                  height: 12,
                  width: `${tachado * 104}%`,
                  background: C.rojo,
                  borderRadius: 6,
                  boxShadow: `0 0 20px ${C.rojo}`,
                }}
              />
            </div>
          </AbsoluteFill>
        );
      })}

      {/* the fire goes out */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 260 }}>
        <div
          style={{
            opacity: fuego,
            transform: `translateY(${interpolate(fuego, [0, 1], [-120, 0])}px) scale(${interpolate(fuego, [0, 1], [0.6, 1])})`,
            textAlign: 'center',
          }}>
          <Img src={staticFile('fueguito-triste.svg')} style={{ width: 120, height: 233, filter: 'drop-shadow(0 0 30px #00000088)' }} />
          <div style={{ fontFamily: montserrat, fontWeight: 800, fontSize: 54, color: C.gris, marginTop: 18 }}>
            …y la motivación se apaga.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// --- 2. Lightning strike: the bolt of the FitFat "F" relights the fire and becomes the logo ----

const RAYO = 'M 120 0 L 40 150 L 100 150 L 60 300 L 180 110 L 115 110 L 160 0 Z';

export function EscenaRayo() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dibujo = interpolate(f, [0, 12], [0, 1], { extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) });
  const { strokeDasharray, strokeDashoffset } = evolvePath(dibujo, RAYO);
  const destello = interpolate(f, [11, 14, 26], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rayoVisible = interpolate(f, [12, 22], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fuego = spring({ frame: f - 13, fps, config: { damping: 9, mass: 0.7 } });
  const aLogo = spring({ frame: f - 42, fps, config: { damping: 14 } });
  const marca = spring({ frame: f - 56, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill>
      <Fondo intensidad={interpolate(f, [12, 40], [0, 0.45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />

      {/* sparks */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        {Array.from({ length: 22 }, (_, i) => {
          const ang = (i / 22) * Math.PI * 2 + i;
          const viaje = interpolate(f, [13, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
          const d = viaje * (240 + (i % 5) * 70);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 10 + (i % 3) * 6,
                height: 10 + (i % 3) * 6,
                borderRadius: 20,
                background: i % 3 === 0 ? C.verde : i % 3 === 1 ? C.fuegoClaro : C.fuegoOscuro,
                boxShadow: `0 0 16px ${C.fuegoClaro}`,
                transform: `translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d}px)`,
                opacity: interpolate(viaje, [0, 0.1, 1], [0, 1, 0]),
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* the bolt falling from the top */}
      <AbsoluteFill style={{ alignItems: 'center' }}>
        <svg viewBox="0 0 200 300" style={{ width: 300, height: 560, marginTop: 0, opacity: rayoVisible, filter: `drop-shadow(0 0 30px ${C.verde})` }}>
          <path d={RAYO} fill={C.verde} fillOpacity={dibujo > 0.95 ? 1 : 0} stroke={C.verde} strokeWidth={6} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
        </svg>
      </AbsoluteFill>

      {/* fire relit → turns into the logo */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 360, height: 360, marginTop: interpolate(marca, [0, 1], [0, -150]) }}>
          <Img
            src={staticFile('fueguito-grande.svg')}
            style={{
              position: 'absolute',
              left: 180 - 110,
              top: 180 - 169,
              width: 220,
              height: 338,
              opacity: (1 - aLogo) * Math.min(1, fuego * 2),
              transform: `scale(${fuego * (1 - aLogo * 0.6)}) rotate(${aLogo * -20}deg)`,
              filter: `drop-shadow(0 0 50px ${C.fuegoOscuro})`,
            }}
          />
          <Img
            src={staticFile('simbolo.png')}
            style={{
              position: 'absolute',
              inset: 0,
              width: 360,
              height: 360,
              opacity: aLogo,
              transform: `scale(${interpolate(aLogo, [0, 1], [0.3, 1])}) rotate(${interpolate(aLogo, [0, 1], [-25, 0])}deg)`,
              filter: `drop-shadow(0 0 60px ${C.verde}88)`,
            }}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 330 }}>
        <Img
          src={staticFile('wordmark.png')}
          style={{
            height: 150,
            opacity: marca,
            transform: `translateY(${interpolate(marca, [0, 1], [60, 0])}px)`,
            clipPath: `inset(0 ${(1 - marca) * 100}% 0 0)`,
          }}
        />
        <div style={{ marginTop: 24 }}>
          <TextoCinetico texto="Tú eres tu único rival" desde={66} tamano={48} peso={700} color={C.gris} alinear="center" acentos={['rival']} />
        </div>
      </AbsoluteFill>

      {/* flash */}
      <AbsoluteFill style={{ background: `radial-gradient(circle, #ffffff 0%, ${C.verde} 40%, transparent 75%)`, opacity: destello }} />
    </AbsoluteFill>
  );
}
