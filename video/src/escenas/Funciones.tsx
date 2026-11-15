import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import { Celular } from '../componentes/Celular';
import { Fondo } from '../componentes/Fondo';
import { Etiqueta, TextoCinetico } from '../componentes/Texto';
import { C, freeman, montserrat } from '../tema';

const flotar = (f: number, amplitud = 10, vel = 30) => Math.sin(f / vel) * amplitud;
const suave = (f: number, a: number, b: number, de: number, a2: number) =>
  interpolate(f, [a, b], [de, a2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });

function Chip({ texto, color, desde, x, y, hacia }: { texto: string; color: string; desde: number; x: number; y: number; hacia: [number, number] }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - desde, fps, config: { damping: 12 } });
  const viaje = interpolate(f - desde, [0, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: 'absolute',
        left: x + hacia[0] * viaje,
        top: y + hacia[1] * viaje,
        padding: '14px 26px',
        borderRadius: 40,
        background: '#000',
        border: `2px solid ${color}`,
        boxShadow: `0 0 40px ${color}66`,
        fontFamily: freeman,
        fontSize: 42,
        color,
        opacity: p * interpolate(viaje, [0.7, 1], [1, 0.85], { extrapolateLeft: 'clamp' }),
        transform: `scale(${p})`,
      }}>
      {texto}
    </div>
  );
}

// --- 3. Daily streak --------------------------------------------------------------------------

export function EscenaRacha() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: f, fps, config: { damping: 16 } });
  const contador = Math.round(interpolate(f, [18, 55], [0, 10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }));
  return (
    <AbsoluteFill>
      <Fondo color={C.fuegoOscuro} intensidad={0.3} />
      <Celular
        pantalla="inicio.png"
        alto={900}
        x={interpolate(entrada, [0, 1], [700, 420])}
        y={60 + flotar(f)}
        rotY={-24 + f * 0.08}
        rotX={6}
        rotZ={2}
        brillo={C.fuegoOscuro}
      />
      <AbsoluteFill style={{ padding: '150px 0 0 130px' }}>
        <Etiqueta texto="Racha diaria" color={C.fuegoClaro} />
        <div style={{ height: 30 }} />
        <TextoCinetico texto="Enciende tu fueguito cada día." desde={4} tamano={88} acentos={['fueguito']} colorAcento={C.fuegoClaro} estilo={{ width: 820 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: 40 }}>
          <div style={{ fontFamily: montserrat, fontWeight: 900, fontSize: 210, lineHeight: 0.85, color: C.texto, textShadow: `0 0 50px ${C.fuegoOscuro}` }}>{contador}</div>
          <div style={{ fontFamily: montserrat, fontWeight: 800, fontSize: 52, color: C.fuegoClaro, paddingBottom: 14 }}>días de racha</div>
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 34 }}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => {
            const p = spring({ frame: f - 22 - i * 5, fps, config: { damping: 9 } });
            return (
              <div key={d} style={{ textAlign: 'center', transform: `scale(${p})`, opacity: p }}>
                <Img src={staticFile('fuego-dia.svg')} style={{ width: 54, height: 72 }} />
                <div style={{ fontFamily: freeman, fontSize: 30, color: i === 6 ? C.verde : C.texto, marginTop: 6 }}>{d}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Chip texto="+50 pts" color={C.verde} desde={40} x={1080} y={300} hacia={[-120, -90]} />
      <Chip texto="+20 pts" color={C.fuegoClaro} desde={58} x={1150} y={560} hacia={[-170, 30]} />
      <Chip texto="+10 pts" color={C.azul} desde={74} x={1100} y={760} hacia={[-140, 80]} />
    </AbsoluteFill>
  );
}

// --- 4. Routines with the real video ---------------------------------------------------------

export function EscenaRutinas() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: f, fps, config: { damping: 15 } });
  const scroll = suave(f, 85, 130, 0, 150);
  const restante = Math.max(0, 30 - Math.floor(f / 4));
  const anillo = restante / 30;
  return (
    <AbsoluteFill>
      <Fondo intensidad={0.35} />
      <Celular
        pantalla="plan.png"
        alto={920}
        x={interpolate(entrada, [0, 1], [-900, -430])}
        y={40 + flotar(f, 8, 35)}
        rotY={20 - f * 0.06}
        rotX={4}
        rotZ={-2}
        scroll={scroll}>
        {/* the exercise video plays inside the screenshot's video card */}
        <div style={{ position: 'absolute', left: 20, top: 71, width: 362, height: 196, borderRadius: 18, overflow: 'hidden' }}>
          <OffthreadVideo src={staticFile('calentamiento.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 45%, rgba(0,0,0,0.85))' }} />
          <div style={{ position: 'absolute', right: 14, top: 14, padding: '2px 10px', borderRadius: 8, background: '#000', fontFamily: freeman, fontSize: 14, color: '#fff' }}>
            3:00
          </div>
          <div style={{ position: 'absolute', left: 16, bottom: 30, fontFamily: freeman, fontSize: 14, color: C.verde }}>EJERCICIO 1 DE 5</div>
          <div style={{ position: 'absolute', left: 16, bottom: 10, fontFamily: montserrat, fontWeight: 700, fontSize: 17, color: '#fff' }}>Calentamiento</div>
        </div>
      </Celular>

      <AbsoluteFill style={{ padding: '170px 120px 0 1000px' }}>
        <Etiqueta texto="Rutinas" />
        <div style={{ height: 30 }} />
        <TextoCinetico texto="15, 30 o 45 minutos. Sin excusas." desde={6} tamano={84} acentos={['excusas']} />
        <TextoCinetico texto="Video de cada ejercicio, temporizador y tu música favorita." desde={22} tamano={38} peso={600} color={C.gris} estilo={{ marginTop: 28 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 34, marginTop: 50 }}>
          {/* timer ring */}
          <svg width={170} height={170} viewBox="0 0 170 170" style={{ opacity: spring({ frame: f - 30, fps }) }}>
            <circle cx={85} cy={85} r={72} stroke="#2a2a2a" strokeWidth={14} fill="none" />
            <circle
              cx={85}
              cy={85}
              r={72}
              stroke={C.verde}
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 72}
              strokeDashoffset={2 * Math.PI * 72 * (1 - anillo)}
              transform="rotate(-90 85 85)"
              style={{ filter: `drop-shadow(0 0 10px ${C.verde})` }}
            />
            <text x={85} y={98} textAnchor="middle" fill="#fff" style={{ fontFamily: montserrat, fontWeight: 800, fontSize: 40 }}>
              0:{String(restante).padStart(2, '0')}
            </text>
          </svg>
          {['spotify.svg', 'apple-music.svg', 'youtube-music.svg'].map((logo, i) => {
            const p = spring({ frame: f - 45 - i * 6, fps, config: { damping: 10 } });
            return (
              <div
                key={logo}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 26,
                  background: '#161616',
                  border: '2px solid #2e2e2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${p}) translateY(${flotar(f + i * 20, 6, 18)}px)`,
                }}>
                <Img src={staticFile(logo)} style={{ width: 56, height: 56 }} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// --- 5. Food & progress -----------------------------------------------------------------------

export function EscenaComida() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 15 } });
  const b = spring({ frame: f - 10, fps, config: { damping: 15 } });
  const barras = interpolate(f, [30, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const kg = interpolate(f, [55, 95], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Fondo color={C.azul} intensidad={0.28} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 70 }}>
        <TextoCinetico texto="Come mejor. Mide tu avance." desde={4} tamano={86} alinear="center" acentos={['mejor', 'avance']} />
      </AbsoluteFill>
      <Celular pantalla="comida.png" alto={760} x={-330} y={interpolate(a, [0, 1], [900, 120]) + flotar(f, 8, 28)} rotY={22} rotZ={-4} brillo={C.fuegoOscuro} />
      <Celular pantalla="progreso.png" alto={760} x={330} y={interpolate(b, [0, 1], [900, 120]) + flotar(f + 40, 8, 28)} rotY={-22} rotZ={4} brillo={C.azul}>
        {/* bars grow from the bottom: a cover over the chart that shrinks upward */}
        <div style={{ position: 'absolute', left: 30, top: 285, width: 345, height: 152 * (1 - barras), background: '#161616' }} />
      </Celular>
      {/* floating stats that pop out of the phones */}
      {[
        { t: '💧 6/8 vasos', x: 150, y: 520, d: 40, c: C.azul },
        { t: '🌙 7,5 h de sueño', x: 140, y: 640, d: 52, c: C.morado },
        { t: `⚖️ −${kg.toFixed(1).replace('.', ',')} kg`, x: 1500, y: 540, d: 60, c: C.verde },
      ].map((e) => {
        const p = spring({ frame: f - e.d, fps, config: { damping: 11 } });
        return (
          <div
            key={e.d}
            style={{
              position: 'absolute',
              left: e.x,
              top: e.y + flotar(f + e.d, 6, 20),
              padding: '16px 28px',
              borderRadius: 24,
              background: 'rgba(20,20,20,0.92)',
              border: `2px solid ${e.c}`,
              boxShadow: `0 20px 50px #000a, 0 0 40px ${e.c}44`,
              fontFamily: montserrat,
              fontWeight: 800,
              fontSize: 38,
              color: '#fff',
              transform: `scale(${p})`,
              opacity: p,
            }}>
            {e.t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// --- 6. Notifications & Premium --------------------------------------------------------------

function Notificacion({ titulo, cuerpo, desde, premium = false, y }: { titulo: string; cuerpo: string; desde: number; premium?: boolean; y: number }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - desde, fps, config: { damping: 11, mass: 0.8 } });
  const vibra = f - desde > 4 && f - desde < 16 ? Math.sin((f - desde) * 2.5) * 6 : 0;
  const color = premium ? C.dorado : C.verde;
  return (
    <div
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        top: y,
        padding: 14,
        borderRadius: 22,
        background: 'rgba(28,28,30,0.96)',
        border: `1.5px solid ${color}`,
        boxShadow: `0 10px 30px #000, 0 0 30px ${color}55`,
        display: 'flex',
        gap: 12,
        opacity: p,
        transform: `translate(${vibra}px, ${interpolate(p, [0, 1], [-160, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
      }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: premium ? '#3A2E0B' : C.verdeOscuro, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
        {premium ? '👑' : '🔥'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: freeman, fontSize: 11, color: C.grisOscuro, letterSpacing: 0.5 }}>{premium ? 'FITFAT PREMIUM · AHORA' : 'FITFAT · AHORA'}</div>
        <div style={{ fontFamily: montserrat, fontWeight: 700, fontSize: 15, color: '#fff', marginTop: 2 }}>{titulo}</div>
        <div style={{ fontFamily: montserrat, fontSize: 13, color: '#C4C4C4', marginTop: 2, lineHeight: 1.35 }}>{cuerpo}</div>
      </div>
    </div>
  );
}

export function EscenaAvisos() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: f, fps, config: { damping: 15 } });
  return (
    <AbsoluteFill>
      <Fondo color={C.dorado} intensidad={0.22} />
      <Celular pantalla="inicio.png" alto={940} y={interpolate(entrada, [0, 1], [1100, 20]) + flotar(f, 6, 30)} rotX={8} brillo={C.dorado}>
        {/* "lock screen": darkened app + big clock */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }} />
        <div style={{ position: 'absolute', top: 70, width: '100%', textAlign: 'center', fontFamily: montserrat, color: '#fff' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.gris }}>sábado, 15 de noviembre</div>
          <div style={{ fontSize: 86, fontWeight: 800, letterSpacing: -2 }}>7:00</div>
        </div>
        <Notificacion titulo="¡Hora de entrenar, Daniel! 🔥" cuerpo="Llevas 10 días de racha. Una rutina de 15 minutos y tu fueguito sigue encendido." desde={22} y={240} />
        <Notificacion titulo="Hora de tomar agua 💧" cuerpo="Un vaso ahora te acerca a tu meta de 8." desde={46} y={372} />
        <Notificacion titulo="Daniel, tu fueguito cuenta contigo 🔥" cuerpo="Estás a 140 puntos del nivel 3. ¿La hacemos ahora?" desde={74} y={486} premium />
      </Celular>
      <AbsoluteFill style={{ padding: '210px 0 0 110px' }}>
        <Etiqueta texto="Recordatorios" />
        <TextoCinetico texto="Llegan justo a tu hora." desde={10} tamano={70} estilo={{ width: 560, marginTop: 26 }} acentos={['hora']} />
      </AbsoluteFill>
      <AbsoluteFill style={{ padding: '560px 110px 0 0', alignItems: 'flex-end' }}>
        <Etiqueta texto="Premium" color={C.dorado} desde={66} lado="flex-end" />
        <TextoCinetico texto="Motivación con tu nombre." desde={72} tamano={70} alinear="right" estilo={{ width: 560, marginTop: 26 }} acentos={['nombre']} colorAcento={C.dorado} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// --- 7. Achievements ---------------------------------------------------------------------------

export function EscenaLogros() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: f, fps, config: { damping: 14 } });
  const medallas = [
    { img: 'lg-fueguito.svg', w: 56, h: 81, c: C.fuegoOscuro, x: -640, y: -250 },
    { img: 'lg-pesa.svg', w: 80, h: 48, c: C.verde, x: 620, y: -230 },
    { img: 'lg-gota.svg', w: 50, h: 68, c: C.azul, x: -600, y: 230 },
    { img: 'medalla-estrella.svg', w: 70, h: 70, c: C.dorado, x: 640, y: 250 },
  ];
  return (
    <AbsoluteFill>
      <Fondo intensidad={0.32} />
      <Celular pantalla="logros.png" alto={860} y={40} rotY={interpolate(f, [0, 90], [-30, 30])} escala={interpolate(entrada, [0, 1], [0.7, 1])} />
      {medallas.map((m, i) => {
        const p = spring({ frame: f - 14 - i * 6, fps, config: { damping: 10 } });
        return (
          <div
            key={m.img}
            style={{
              position: 'absolute',
              left: 960 - 75,
              top: 540 - 75,
              width: 150,
              height: 150,
              borderRadius: 75,
              background: `${m.c}22`,
              border: `4px solid ${m.c}`,
              boxShadow: `0 0 60px ${m.c}88`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: p,
              transform: `translate(${m.x * p}px, ${m.y * p + flotar(f + i * 10, 10, 16)}px) scale(${0.4 + p * 0.6}) rotate(${(1 - p) * 90}deg)`,
            }}>
            <Img src={staticFile(m.img)} style={{ width: m.w, height: m.h }} />
          </div>
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 }}>
        <TextoCinetico texto="12 logros por desbloquear" desde={20} tamano={72} alinear="center" acentos={['12', 'logros']} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
